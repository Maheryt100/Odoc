<?php

// ============================================================================
// CertificatController.php - VERSION HARMONISÉE
// ============================================================================

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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\TemplateProcessor;

class CertificatController extends Controller
{
    use HandlesDocumentGeneration, ValidatesDocumentData, FormatsDocumentData;

    /**
     * GÉNÉRATION INITIALE (GET)
     */
    public function generate(Request $request)
    {
        // ✅ Validation des données POST
        $validated = $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        try {
            $propriete = Propriete::with('dossier.district')->findOrFail($validated['id_propriete']);
            $demandeur = Demandeur::findOrFail($validated['id_demandeur']);

            // Récupérer le reçu pour les données
            $documentRecu = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
                ->where('id_propriete', $validated['id_propriete'])
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            // Vérifier si CSF existe déjà
            $documentExistant = DocumentGenere::where('type_document', DocumentGenere::TYPE_CSF)
                ->where('id_demandeur', $validated['id_demandeur'])
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            if ($documentExistant) {
                return $this->downloadExisting($documentExistant, 'CSF');
            }

            return $this->createNewCsf($propriete, $demandeur, $documentRecu);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'generation_error',
                'message' => 'Erreur : ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ TÉLÉCHARGEMENT (GET - INCHANGÉ)
     */
    public function download($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);

            if ($document->type_document !== DocumentGenere::TYPE_CSF) {
                return response()->json([
                    'success' => false,
                    'error' => 'invalid_type',
                    'message' => 'Ce document n\'est pas un CSF',
                ], 400);
            }

            return $this->downloadExisting($document, 'CSF');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'download_error',
                'message' => 'Erreur de téléchargement',
            ], 500);
        }
    }

    /**
     * ✅ RÉGÉNÉRATION (POST - INCHANGÉ)
     */
    public function regenerate($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);

            if ($document->type_document !== DocumentGenere::TYPE_CSF) {
                return response()->json([
                    'success' => false,
                    'error' => 'invalid_type',
                    'message' => 'Ce document n\'est pas un CSF',
                ], 400);
            }

            $propriete = $document->propriete()->with('dossier.district')->first();
            $demandeur = $document->demandeur;

            if (!$propriete || !$demandeur) {
                throw new \Exception("Données manquantes");
            }

            $documentRecu = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
                ->where('id_propriete', $propriete->id)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            return $this->regenerateCsf($document, $propriete, $demandeur, $documentRecu);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'regeneration_error',
                'message' => 'Erreur de régénération : ' . $e->getMessage(),
            ], 500);
        }
    }

    // Méthodes privées (INCHANGÉES - voir code original)
    private function createNewCsf(
        Propriete $propriete,
        Demandeur $demandeur,
        ?DocumentGenere $documentRecu
    ) {
        DB::beginTransaction();

        try {
            $existingDoc = DocumentGenere::where('type_document', DocumentGenere::TYPE_CSF)
                ->where('id_demandeur', $demandeur->id)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->lockForUpdate()
                ->first();

            if ($existingDoc) {
                DB::rollBack();
                return $this->downloadExisting($existingDoc, 'CSF');
            }

            $errors = $this->validateCsfData($demandeur, $propriete);
            $this->validateOrThrow($errors);

            $tempFilePath = $this->createCsfDocument($demandeur, $propriete, $documentRecu);
            $savedPath = $this->saveDocument($tempFilePath, 'CSF', $propriete, $demandeur);

            $document = DocumentGenere::create([
                'type_document' => DocumentGenere::TYPE_CSF,
                'id_propriete' => $propriete->id,
                'id_demandeur' => $demandeur->id,
                'id_dossier' => $propriete->id_dossier,
                'id_district' => $propriete->dossier->id_district,
                'file_path' => $savedPath,
                'nom_fichier' => basename($savedPath),
                'generated_by' => Auth::id(),
                'generated_at' => now(),
                'status' => DocumentGenere::STATUS_ACTIVE,
                'metadata' => [
                    'recu_id' => $documentRecu?->id,
                    'recu_numero' => $documentRecu?->numero_document,
                ],
            ]);

            DB::commit();

            ActivityLogger::logDocumentGeneration(ActivityLog::DOC_CSF, $document->id, [
                'demandeur_id' => $demandeur->id,
                'recu_linked' => !!$documentRecu,
            ]);

            return response()->download($tempFilePath, $document->nom_fichier)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    private function regenerateCsf(
        DocumentGenere $document,
        Propriete $propriete,
        Demandeur $demandeur,
        ?DocumentGenere $documentRecu
    ) {
        DB::beginTransaction();

        try {
            $tempFilePath = $this->createCsfDocument($demandeur, $propriete, $documentRecu);

            if (!file_exists($tempFilePath)) {
                throw new \Exception("Échec création fichier temporaire");
            }

            $savedPath = $this->saveDocument($tempFilePath, 'CSF', $propriete, $demandeur);

            $document->update([
                'file_path' => $savedPath,
                'metadata' => array_merge($document->metadata ?? [], [
                    'recu_id' => $documentRecu?->id,
                    'recu_numero' => $documentRecu?->numero_document,
                    'last_regenerated_at' => now()->toIso8601String(),
                ]),
            ]);
            
            $document->incrementRegenerationCount();

            DB::commit();

            ActivityLogger::logDocumentDownload(ActivityLog::DOC_CSF, $document->id, [
                'action_type' => 'regenerate',
            ]);

            return response()->download($tempFilePath, $document->nom_fichier)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    private function createCsfDocument(
        Demandeur $demandeur,
        Propriete $propriete,
        ?DocumentGenere $documentRecu
    ): string {
        $templatePath = storage_path('app/public/modele_odoc/document_CSF/Certificat_situation_financiere.docx');

        if (!file_exists($templatePath)) {
            throw new \Exception("Template CSF introuvable: {$templatePath}");
        }

        $modele = new TemplateProcessor($templatePath);
        $locationData = $this->getLocationData($propriete);
        $articles = $this->getArticles($locationData['district'], $propriete->dossier->commune);

        // PRIORITÉ 1 : Chercher dans recu_references (nouveau système)
        $recuRef = \App\Models\RecuReference::where('id_propriete', $propriete->id)
            ->where('id_demandeur', $demandeur->id)
            ->first();

        if ($recuRef) {
            // Utiliser les données de recu_references
            $numeroQuittance = $recuRef->numero_recu;
            $dateQuittance = $recuRef->date_recu 
                ? $this->formatDateDocument(\Carbon\Carbon::parse($recuRef->date_recu))
                : 'N/A';
            $montantRecu = $recuRef->montant 
                ? $this->formatMontantChiffres($recuRef->montant)
                : 'N/A';
        } elseif ($documentRecu) {
            // Fallback : Ancien système avec DocumentGenere de type RECU
            $numeroQuittance = $documentRecu->numero_document ?? 'N/A';
            $dateQuittance = $documentRecu->date_document
                ? $this->formatDateDocument(\Carbon\Carbon::parse($documentRecu->date_document))
                : 'N/A';
            $montantRecu = $documentRecu->montant
                ? $this->formatMontantChiffres($documentRecu->montant)
                : 'N/A';
        } else {
            // Aucune donnée disponible
            $numeroQuittance = 'Non renseigné';
            $dateQuittance = 'Non renseignée';
            $montantRecu = 'Non renseigné';
        }
    
        $dateActuelle = $this->formatDateDocument(\Carbon\Carbon::now());

        $modele->setValues([
            'Titre_long' => $demandeur->titre_demandeur,
            'Nom' => $demandeur->nom_demandeur,
            'Prenom' => $demandeur->prenom_demandeur ?? '',
            'D_dis' => $articles['D_dis'],
            'Numero_FN' => $this->getOrDefault($propriete->numero_FN, 'Non renseigné'),
            'DISTRICT' => $locationData['DISTRICT'],
            'Province' => $locationData['province'],
            'NumeroQuittance' => $numeroQuittance,
            'DateQuittance' => $dateQuittance,
            'MontantRecu' => $montantRecu,
            'DateActuelle' => $dateActuelle,
        ]);

        $fileName = 'CSF_' . uniqid() . '_' . Str::slug($demandeur->nom_demandeur) . '.docx';
        $filePath = sys_get_temp_dir() . '/' . $fileName;
        $modele->saveAs($filePath);

        return $filePath;
    }
}