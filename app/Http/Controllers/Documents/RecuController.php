<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\DocumentGenere;
use App\Models\ActivityLog;
use App\Services\ActivityLogger;
use App\Http\Controllers\Documents\Concerns\HandlesDocumentGeneration;
use App\Http\Controllers\Documents\Concerns\ValidatesDocumentData;
use App\Http\Controllers\Documents\Concerns\FormatsDocumentData;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use NumberFormatter;
use PhpOffice\PhpWord\TemplateProcessor;

class RecuController extends Controller
{
    use HandlesDocumentGeneration, ValidatesDocumentData, FormatsDocumentData;

    public function generate(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
            'id_demandeur' => 'required|exists:demandeurs,id',
        ]);

        try {
            $propriete = Propriete::with('dossier.district')->findOrFail($request->id_propriete);
            $demandeur = Demandeur::findOrFail($request->id_demandeur);

            // ✅ VALIDATION STRICTE BACKEND
            $errors = $this->validateRecuData($propriete, $demandeur);
            if (!empty($errors)) {
                Log::warning('⚠️ Validation reçu échouée', [
                    'propriete_id' => $propriete->id,
                    'demandeur_id' => $demandeur->id,
                    'errors' => $errors
                ]);
                
                return back()->withErrors([
                    'error' => 'Données incomplètes pour générer le reçu',
                    'details' => implode(', ', $errors)
                ])->withInput();
            }

            $documentExistant = DocumentGenere::findExisting(
                DocumentGenere::TYPE_RECU,
                $request->id_propriete,
                $request->id_demandeur,
                $propriete->dossier->id_district
            );

            if ($documentExistant) {
                $fileStatus = $documentExistant->checkFileStatus();
                
                if ($fileStatus['valid']) {
                    return $this->downloadExisting($documentExistant, 'reçu');
                } else {
                    Log::warning('📁 Fichier reçu manquant, régénération', [
                        'document_id' => $documentExistant->id,
                        'status' => $fileStatus,
                    ]);
                    
                    $documentExistant->markForRegeneration($fileStatus['error'] ?? 'file_missing');
                    return $this->regenerateRecu($documentExistant, $propriete, $demandeur);
                }
            }

            return $this->createNewRecu($propriete, $demandeur);

        } catch (\Exception $e) {
            Log::error('❌ Erreur génération reçu', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors([
                'error' => 'Erreur lors de la génération : ' . $e->getMessage(),
            ]);
        }
    }


    public function download($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);

            if ($document->type_document !== DocumentGenere::TYPE_RECU) {
                return response()->json([
                    'success' => false,
                    'error' => 'invalid_type',
                    'message' => 'Ce document n\'est pas un reçu',
                ], 400);
            }

            $fileStatus = $document->checkFileStatus();
            
            if (!$fileStatus['valid']) {
                Log::warning('📁 Téléchargement reçu - fichier manquant', [
                    'document_id' => $document->id,
                    'status' => $fileStatus,
                ]);

                $document->markForRegeneration($fileStatus['error'] ?? 'file_missing');

                return response()->json([
                    'success' => false,
                    'error' => 'file_missing',
                    'message' => 'Le fichier du reçu est introuvable',
                    'details' => $fileStatus['error'],
                    'document' => [
                        'id' => $document->id,
                        'numero_document' => $document->numero_document,
                        'nom_fichier' => $document->nom_fichier,
                    ],
                    'can_regenerate' => true,
                ], 404);
            }

            return $this->downloadExisting($document, 'reçu');

        } catch (\Exception $e) {
            Log::error('❌ Erreur téléchargement reçu', ['id' => $id, 'error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'error' => 'download_error',
                'message' => 'Erreur lors du téléchargement',
            ], 500);
        }
    }

    public function regenerate($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);

            if ($document->type_document !== DocumentGenere::TYPE_RECU) {
                return response()->json([
                    'success' => false,
                    'error' => 'invalid_type',
                    'message' => 'Ce document n\'est pas un reçu',
                ], 400);
            }

            $propriete = $document->propriete()->with('dossier.district')->first();
            $demandeur = $document->demandeur;

            if (!$propriete || !$demandeur) {
                throw new \Exception("Données manquantes pour régénérer le reçu");
            }

            return $this->regenerateRecu($document, $propriete, $demandeur);

        } catch (\Exception $e) {
            Log::error('❌ Erreur régénération reçu', ['id' => $id, 'error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'error' => 'regeneration_error',
                'message' => 'Erreur lors de la régénération',
            ], 500);
        }
    }

    private function createNewRecu(Propriete $propriete, Demandeur $demandeur)
    {
        DB::beginTransaction();

        try {
            $dossier = $propriete->dossier;

            // ✅ Double-check atomique SANS count()
            $existingDoc = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
                ->where('id_propriete', $propriete->id)
                ->where('id_demandeur', $demandeur->id)
                ->where('id_district', $dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->lockForUpdate()
                ->first();

            if ($existingDoc) {
                DB::rollBack();
                $fileStatus = $existingDoc->checkFileStatus();
                if ($fileStatus['valid']) {
                    return $this->downloadExisting($existingDoc, 'reçu');
                } else {
                    return $this->regenerateRecu($existingDoc, $propriete, $demandeur);
                }
            }

            $prix = $this->getPrixFromDistrict($propriete);
            $prixTotal = (int) ($prix * $propriete->contenance);
            
            // ✅ CORRECTION : Générer le numéro SANS lockForUpdate sur count()
            $numeroRecu = $this->generateNumeroRecu($dossier->id, $dossier->numero_ouverture);

            $tempFilePath = $this->createRecuDocument($propriete, $demandeur, $numeroRecu, $prixTotal);
            $savedPath = $this->saveDocument($tempFilePath, 'RECU', $propriete, $demandeur);
            $nomFichier = basename($savedPath);

            $document = DocumentGenere::create([
                'type_document' => DocumentGenere::TYPE_RECU,
                'id_propriete' => $propriete->id,
                'id_demandeur' => $demandeur->id,
                'id_dossier' => $dossier->id,
                'id_district' => $dossier->id_district,
                'numero_document' => $numeroRecu,
                'file_path' => $savedPath,
                'nom_fichier' => $nomFichier,
                'montant' => $prixTotal,
                'date_document' => Carbon::now(),
                'generated_by' => Auth::id(),
                'generated_at' => now(),
                'status' => DocumentGenere::STATUS_ACTIVE,
            ]);

            DB::commit();

            ActivityLogger::logDocumentGeneration(ActivityLog::DOC_RECU, $document->id, [
                'numero_recu' => $numeroRecu,
                'montant' => $prixTotal,
                'lot' => $propriete->lot,
            ]);

            Log::info('✅ Reçu créé', [
                'document_id' => $document->id,
                'numero_recu' => $numeroRecu,
                'propriete_id' => $propriete->id,
                'demandeur_id' => $demandeur->id,
            ]);

            return response()->download($tempFilePath, $nomFichier)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur création reçu', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    private function regenerateRecu(DocumentGenere $document, Propriete $propriete, Demandeur $demandeur)
    {
        DB::beginTransaction();

        try {
            Log::info('🔄 Régénération reçu', ['document_id' => $document->id]);

            $tempFilePath = $this->createRecuDocument(
                $propriete, 
                $demandeur, 
                $document->numero_document, 
                $document->montant
            );

            if (!file_exists($tempFilePath)) {
                throw new \Exception("Échec création fichier temporaire");
            }

            $savedPath = $this->saveDocument($tempFilePath, 'RECU', $propriete, $demandeur);

            $document->update(['file_path' => $savedPath]);
            $document->incrementRegenerationCount();

            DB::commit();

            Log::info('✅ Régénération réussie', ['document_id' => $document->id]);

            ActivityLogger::logDocumentDownload(ActivityLog::DOC_RECU, $document->id, [
                'action_type' => 'regenerate',
            ]);

            return response()->download($tempFilePath, $document->nom_fichier)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur régénération', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    private function generateNumeroRecu(int $idDossier, string $numeroDossier): string
    {
        // ✅ MÉTHODE 1 : Compter SANS lock (race condition possible mais rare)
        $count = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
            ->where('id_dossier', $idDossier)
            ->where('status', DocumentGenere::STATUS_ACTIVE)
            ->count() + 1;

        // ✅ MÉTHODE 2 (RECOMMANDÉE) : Lock sur la dernière ligne puis calculer
        // $lastDoc = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
        //     ->where('id_dossier', $idDossier)
        //     ->where('status', DocumentGenere::STATUS_ACTIVE)
        //     ->orderBy('created_at', 'desc')
        //     ->lockForUpdate()
        //     ->first();
        // 
        // $count = $lastDoc ? ($lastDoc->id + 1) : 1;

        Log::debug('🔢 Génération numéro reçu', [
            'dossier_id' => $idDossier,
            'sequence' => $count,
        ]);

        return sprintf('%03d/%s', $count, $numeroDossier);
    }

    private function createRecuDocument(Propriete $propriete, Demandeur $demandeur, string $numeroRecu, int $montantTotal): string
    {
        Carbon::setLocale('fr');
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);

        $templatePath = storage_path('app/public/modele_odoc/recu_paiement.docx');
        if (!file_exists($templatePath)) {
            throw new \Exception("Template reçu introuvable : {$templatePath}");
        }

        $modele = new TemplateProcessor($templatePath);
        $locationData = $this->getLocationData($propriete);
        $dossier = $propriete->dossier;

        $dateRecu = Carbon::now()->translatedFormat('d/m/Y');
        $montantLettres = Str::upper(ucfirst($formatter->format((int) $montantTotal)));
        $cinFormate = implode('.', str_split($demandeur->cin, 3));
        $dateDelivrance = Carbon::parse($demandeur->date_delivrance)->translatedFormat('d/m/Y');
        $titreDemandeur = $demandeur->sexe === 'Homme' ? 'M.' : 'Mme';
        $nomComplet = $demandeur->nom_demandeur . ' ' . ($demandeur->prenom_demandeur ?? '');
        $motif = "Achat terrain Lot {$propriete->lot} TN°{$propriete->titre}";
        $details = "Propriété \"{$propriete->proprietaire}\" - Commune {$dossier->commune}";

        $modele->setValues([
            'District' => $locationData['district'],
            'NumeroRecu' => $numeroRecu,
            'DateRecu' => $dateRecu,
            'MontantChiffres' => number_format((int) $montantTotal, 0, ',', '.'),
            'TitreDemandeur' => $titreDemandeur,
            'NomComplet' => $nomComplet,
            'NumCIN' => $cinFormate,
            'DateDelivrance' => $dateDelivrance,
            'Domiciliation' => $demandeur->domiciliation,
            'MontantLettres' => $montantLettres,
            'Motif' => $motif,
            'Details' => $details,
        ]);

        $fileName = 'RECU_' . str_replace('/', '-', $numeroRecu) . '_' . uniqid() . '.docx';
        $filePath = sys_get_temp_dir() . '/' . $fileName;
        $modele->saveAs($filePath);

        Log::info('✅ Document reçu créé', [
            'path' => $filePath,
            'size' => filesize($filePath),
        ]);

        return $filePath;
    }
}