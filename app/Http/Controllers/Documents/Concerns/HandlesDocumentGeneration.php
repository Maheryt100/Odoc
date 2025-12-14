<?php

namespace App\Http\Controllers\Documents\Concerns;

use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\DocumentGenere;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

trait HandlesDocumentGeneration
{
    /**
     * ✅ Construire le chemin de stockage standardisé
     */
    protected function buildStoragePath(
        string $type, 
        Propriete $propriete, 
        ?Demandeur $demandeur = null
    ): string {
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

    /**
     * ✅ Sauvegarder le document avec vérifications
     */
    protected function saveDocument(
        string $tempFilePath, 
        string $type, 
        Propriete $propriete, 
        ?Demandeur $demandeur = null
    ): string {
        if (!file_exists($tempFilePath)) {
            throw new \Exception("Fichier temporaire introuvable: {$tempFilePath}");
        }

        $storagePath = $this->buildStoragePath($type, $propriete, $demandeur);
        $directory = dirname($storagePath);

        // Créer le répertoire si nécessaire
        if (!Storage::disk('public')->exists($directory)) {
            Storage::disk('public')->makeDirectory($directory, 0755, true);
        }

        // Lire et écrire le fichier
        $fileContent = file_get_contents($tempFilePath);
        if ($fileContent === false) {
            throw new \Exception("Impossible de lire: {$tempFilePath}");
        }

        $written = Storage::disk('public')->put($storagePath, $fileContent);
        if (!$written) {
            throw new \Exception("Échec écriture: {$storagePath}");
        }

        // Vérifier l'existence
        if (!Storage::disk('public')->exists($storagePath)) {
            throw new \Exception("Fichier non trouvé après sauvegarde");
        }

        // Permissions
        $fullPath = Storage::disk('public')->path($storagePath);
        if (file_exists($fullPath)) {
            chmod($fullPath, 0644);
        }

        Log::info("✅ Document sauvegardé", [
            'type' => $type,
            'path' => $storagePath,
            'size' => Storage::disk('public')->size($storagePath),
        ]);

        return $storagePath;
    }

    /**
     * ✅ Télécharger un document existant avec logs
     */
    protected function downloadExisting(DocumentGenere $document, string $typeName)
    {
        if (!$document->fileExists()) {
            Log::warning("⚠️ Fichier manquant, régénération", [
                'document_id' => $document->id,
                'path' => $document->file_path,
            ]);
            return $this->regenerateDocument($document);
        }

        $document->incrementDownloadCount();

        Log::info("📥 Téléchargement document", [
            'document_id' => $document->id,
            'type' => $document->type_document,
            'download_count' => $document->download_count,
        ]);

        return response()->download($document->full_path, $document->nom_fichier, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition' => 'attachment; filename="' . $document->nom_fichier . '"',
            'Content-Length' => filesize($document->full_path),
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'X-Document-ID' => $document->id,
        ]);
    }

    /**
     * ✅ Normaliser la vocation pour le prix
     */
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

    /**
     * ✅ Obtenir le prix depuis le district avec validation
     */
    protected function getPrixFromDistrict(Propriete $propriete): int
    {
        $vocationColumn = $this->normalizeVocation($propriete->vocation);
        
        $district = $propriete->dossier->district;
        $prix = $district->{$vocationColumn} ?? 0;

        if ($prix <= 0) {
            throw new \Exception(
                "Le prix pour '{$propriete->vocation}' n'est pas configuré dans le district '{$district->nom_district}'"
            );
        }

        return (int) $prix;
    }

    /**
     * ✅ Formater la contenance en Ha A Ca
     */
    protected function formatContenance(int $contenance): array
    {
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

    /**
     * ✅ Obtenir les données de localisation
     */
    protected function getLocationData(Propriete $propriete): array
    {
        $dossier = $propriete->dossier;
        $district = $dossier->district;
        $region = $district->region;
        $province = $region->province;

        $firstLetterDistrict = strtolower(mb_substr($district->nom_district, 0, 1));
        $firstLetterCommune = strtolower(mb_substr($dossier->commune, 0, 1));

        return [
            'province' => $province->nom_province,
            'region' => $region->nom_region,
            'district' => $district->nom_district,
            'DISTRICT' => Str::upper($district->nom_district),
            'D_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'D' : 'DE',
            'd_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'd' : 'de',
            'd_com' => in_array($firstLetterCommune, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'd' : 'de',
        ];
    }

    /**
     * ✅ Formater les dates pour les documents
     */
    protected function formatDateForDocument(?\Carbon\Carbon $date): string
    {
        if (!$date) return '';
        
        Carbon::setLocale('fr');
        return $date->translatedFormat('d F Y');
    }
}