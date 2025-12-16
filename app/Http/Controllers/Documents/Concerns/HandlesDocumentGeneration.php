<?php

namespace App\Http\Controllers\Documents\Concerns;

use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\DocumentGenere;
use App\Models\ActivityLog;
use App\Services\ActivityLogger;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

trait HandlesDocumentGeneration
{
    /**
     * Téléchargement sécurisé avec vérification complète
     */
    protected function downloadExisting(DocumentGenere $document, string $typeName)
    {
        $fileStatus = $document->checkFileStatus();
        
        if (!$fileStatus['valid']) {
            Log::warning("Fichier invalide détecté", [
                'document_id' => $document->id,
                'type' => $document->type_document,
                'status' => $fileStatus,
            ]);

            $document->markForRegeneration($fileStatus['error'] ?? 'file_invalid');

            return response()->json([
                'success' => false,
                'error' => 'file_missing',
                'message' => "Le fichier {$typeName} est introuvable ou endommagé",
                'details' => $fileStatus['error'], 
                'document' => [
                    'id' => $document->id,
                    'type' => $document->type_document,
                    'numero_document' => $document->numero_document,
                    'nom_fichier' => $document->nom_fichier,
                ],
                'can_regenerate' => in_array($document->type_document, [
                    DocumentGenere::TYPE_RECU,
                    DocumentGenere::TYPE_CSF,
                    DocumentGenere::TYPE_REQ,
                    DocumentGenere::TYPE_ADV, 
                ]),
            ], 404);
        }

        $document->incrementDownloadCount();

        Log::info("Téléchargement document", [
            'document_id' => $document->id,
            'type' => $document->type_document,
            'download_count' => $document->download_count,
            'file_size' => $fileStatus['size'],
        ]);

        ActivityLogger::logDocumentDownload(
            $this->getActivityLogType($document->type_document),
            $document->id,
            [
                'numero_document' => $document->numero_document,
                'action_type' => 'download_existing',
                'download_count' => $document->download_count,
            ]
        );

        $validatedPath = $document->getValidatedPath();
        
        return response()->download($validatedPath, $document->nom_fichier, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition' => 'attachment; filename="' . $document->nom_fichier . '"',
            'Content-Length' => $fileStatus['size'],
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }

    /**
     * Sauvegarder le document
     */
    protected function saveDocument(string $tempFilePath, string $type, Propriete $propriete, ?Demandeur $demandeur = null): string
    {
        if (!file_exists($tempFilePath)) {
            throw new \Exception("Fichier temporaire introuvable: {$tempFilePath}");
        }

        $storagePath = $this->buildStoragePath($type, $propriete, $demandeur);
        $directory = dirname($storagePath);

        $fullDirectory = Storage::disk('public')->path($directory);
        if (!file_exists($fullDirectory)) {
            mkdir($fullDirectory, 0755, true);
        }

        $fileContent = file_get_contents($tempFilePath);
        if ($fileContent === false) {
            throw new \Exception("Impossible de lire: {$tempFilePath}");
        }

        $written = Storage::disk('public')->put($storagePath, $fileContent);
        if (!$written) {
            throw new \Exception("Échec écriture: {$storagePath}");
        }

        $fullPath = Storage::disk('public')->path($storagePath);
        if (file_exists($fullPath)) {
            chmod($fullPath, 0644);
        }

        Log::info("Document sauvegardé", [
            'type' => $type,
            'path' => $storagePath,
            'size' => Storage::disk('public')->size($storagePath),
        ]);

        return $storagePath;
    }

    /**
     *  Construire le chemin de stockage
     */
    protected function buildStoragePath(string $type, Propriete $propriete, ?Demandeur $demandeur = null): string
    {
        $district = $propriete->dossier->district;
        $districtSlug = Str::slug($district->nom_district);
        $date = Carbon::now()->format('Y/m');
        $timestamp = Carbon::now()->format('Ymd_His');

        $baseName = match($type) {
            'RECU' => $demandeur
                ? "{$timestamp}_RECU_" . Str::slug($demandeur->nom_demandeur) . "_LOT{$propriete->lot}.docx"
                : "{$timestamp}_RECU_LOT{$propriete->lot}.docx",
            'ADV' => $demandeur
                ? "{$timestamp}_ADV_" . Str::slug($demandeur->nom_demandeur) . "_LOT{$propriete->lot}.docx"
                : "{$timestamp}_ADV_CONSORTS_LOT{$propriete->lot}.docx",
            'CSF' => $demandeur
                ? "{$timestamp}_CSF_" . Str::slug($demandeur->nom_demandeur) . ".docx"
                : "{$timestamp}_CSF.docx",
            'REQ' => "{$timestamp}_REQ_LOT{$propriete->lot}_TN{$propriete->titre}.docx",
            default => throw new \Exception("Type inconnu: {$type}"),
        };

        return "pieces_jointes/documents/{$type}/{$districtSlug}/{$date}/{$baseName}";
    }

    protected function getPrixFromDistrict(Propriete $propriete): int
    {
        $vocationColumn = $this->normalizeVocation($propriete->vocation);
        $district = $propriete->dossier->district;
        $prix = $district->{$vocationColumn} ?? 0;

        if ($prix <= 0) {
            throw new \Exception("Prix non configuré pour '{$propriete->vocation}' dans '{$district->nom_district}'");
        }

        return (int) $prix;
    }

    protected function normalizeVocation(string $vocation): string
    {
        $mapping = [
            'Edilitaire' => 'edilitaire',
            'Agricole' => 'agricole',
            'Forestière' => 'forestiere',
            'Forestiere' => 'forestiere',
            'Touristique' => 'touristique',
        ];

        return $mapping[$vocation] ?? 'edilitaire';
    }

    protected function formatContenance(?int $contenance): array
    {
        if ($contenance === null || $contenance === 0) {
            return [
                'format' => '00Ha 00A 00Ca',
                'lettres' => 'ZÉRO HECTARE ZÉRO ARE ZÉRO CENTIARE',
            ];
        }

        $hectares = intdiv($contenance, 10000);
        $reste = $contenance % 10000;
        $ares = intdiv($reste, 100);
        $centiares = $reste % 100;

        $parts = [];
        $contenanceFormat = '';

        if ($hectares > 0) {
            $contenanceFormat .= str_pad($hectares, 2, '0', STR_PAD_LEFT) . 'Ha ';
            $parts[] = strtoupper((new \NumberFormatter('fr', \NumberFormatter::SPELLOUT))->format($hectares)) . " HECTARE" . ($hectares > 1 ? 'S' : '');
        }

        if ($ares > 0 || $hectares > 0) {
            $contenanceFormat .= str_pad($ares, 2, '0', STR_PAD_LEFT) . 'A ';
            $parts[] = strtoupper((new \NumberFormatter('fr', \NumberFormatter::SPELLOUT))->format($ares)) . " ARE" . ($ares > 1 ? 'S' : '');
        }

        $contenanceFormat .= str_pad($centiares, 2, '0', STR_PAD_LEFT) . 'Ca';
        $parts[] = strtoupper((new \NumberFormatter('fr', \NumberFormatter::SPELLOUT))->format($centiares)) . " CENTIARE" . ($centiares > 1 ? 'S' : '');

        return [
            'format' => trim($contenanceFormat),
            'lettres' => implode(' ', $parts),
        ];
    }

    protected function getLocationData(Propriete $propriete): array
    {
        $dossier = $propriete->dossier;
        $district = $dossier->district;
        $region = $district->region;
        $province = $region->province;

        return [
            'province' => $province->nom_province,
            'region' => $region->nom_region,
            'district' => $district->nom_district,
            'DISTRICT' => Str::upper($district->nom_district),
        ];
    }

    protected function getActivityLogType(string $docType): string
    {
        return match($docType) {
            DocumentGenere::TYPE_RECU => ActivityLog::DOC_RECU,
            DocumentGenere::TYPE_ADV => ActivityLog::DOC_ACTE_VENTE,
            DocumentGenere::TYPE_CSF => ActivityLog::DOC_CSF,
            DocumentGenere::TYPE_REQ => ActivityLog::DOC_REQUISITION,
            default => 'document'
        };
    }

    /**
     * Formater le Dep/Vol complet avec numéro
     */
    protected function formatDepVolComplet(?string $dep_vol, ?string $numero_dep_vol): string
    {
        if (!$dep_vol) {
            return 'Non renseigné';
        }
        
        $result = trim($dep_vol);
        
        if ($numero_dep_vol) {
            $result .= ' n°' . trim($numero_dep_vol);
        }
        
        return $result;
    }
}