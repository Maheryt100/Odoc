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
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\TemplateProcessor;

class CertificatController extends Controller
{
    use HandlesDocumentGeneration, ValidatesDocumentData, FormatsDocumentData;

    /**
     * ✅ GÉNÉRATION INITIALE (GET)
     */
    public function generate(Request $request)
    {
        $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        try {
            $propriete = Propriete::with('dossier.district')->findOrFail($request->id_propriete);
            $demandeur = Demandeur::findOrFail($request->id_demandeur);

            // ✅ Récupérer le reçu pour les données
            $documentRecu = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
                ->where('id_propriete', $request->id_propriete)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            // Vérifier si CSF existe déjà
            $documentExistant = DocumentGenere::where('type_document', DocumentGenere::TYPE_CSF)
                ->where('id_demandeur', $request->id_demandeur)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            if ($documentExistant) {
                return $this->downloadExisting($documentExistant, 'CSF');
            }

            return $this->createNewCsf($propriete, $demandeur, $documentRecu);

        } catch (\Exception $e) {
            Log::error('❌ Erreur génération CSF', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'generation_error',
                'message' => 'Erreur : ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ TÉLÉCHARGEMENT (GET)
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
            Log::error('❌ Erreur téléchargement CSF', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'download_error',
                'message' => 'Erreur de téléchargement',
            ], 500);
        }
    }

    /**
     * ✅ RÉGÉNÉRATION (POST)
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

            // ✅ Récupérer le reçu
            $documentRecu = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
                ->where('id_propriete', $propriete->id)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            return $this->regenerateCsf($document, $propriete, $demandeur, $documentRecu);

        } catch (\Exception $e) {
            Log::error('❌ Erreur régénération CSF', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'regeneration_error',
                'message' => 'Erreur de régénération : ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ Créer nouveau CSF
     */
    private function createNewCsf(
        Propriete $propriete, 
        Demandeur $demandeur, 
        ?DocumentGenere $documentRecu
    ) {
        DB::beginTransaction();

        try {
            // Double-check atomique
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

            Log::info('✅ CSF créé', [
                'document_id' => $document->id,
                'demandeur_id' => $demandeur->id,
            ]);

            return response()->download($tempFilePath, $document->nom_fichier)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur création CSF', [
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * ✅ Régénérer CSF existant
     */
    private function regenerateCsf(
        DocumentGenere $document, 
        Propriete $propriete, 
        Demandeur $demandeur,
        ?DocumentGenere $documentRecu
    ) {
        DB::beginTransaction();

        try {
            Log::info('🔄 Régénération CSF', [
                'document_id' => $document->id,
                'has_recu' => !!$documentRecu,
            ]);

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

            Log::info('✅ Régénération CSF réussie', [
                'document_id' => $document->id,
            ]);

            ActivityLogger::logDocumentDownload(ActivityLog::DOC_CSF, $document->id, [
                'action_type' => 'regenerate',
            ]);

            return response()->download($tempFilePath, $document->nom_fichier)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur régénération CSF', [
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * ✅ Créer le document Word CSF
     */
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

        // ✅ Données du reçu
        $numeroQuittance = $documentRecu?->numero_document ?? 'N/A';
        $dateQuittance = $documentRecu && $documentRecu->date_document
            ? $this->formatDateDocument(\Carbon\Carbon::parse($documentRecu->date_document))
            : 'N/A';

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
        ]);

        $fileName = 'CSF_' . uniqid() . '_' . Str::slug($demandeur->nom_demandeur) . '.docx';
        $filePath = sys_get_temp_dir() . '/' . $fileName;
        $modele->saveAs($filePath);

        Log::info('✅ Document CSF créé', [
            'path' => $filePath,
            'size' => filesize($filePath),
        ]);

        return $filePath;
    }
}

// ============================================================================
// RequisitionController.php - VERSION HARMONISÉE
// ============================================================================

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Propriete;
use App\Models\DocumentGenere;
use App\Models\ActivityLog;
use App\Services\ActivityLogger;
use App\Http\Controllers\Documents\Concerns\HandlesDocumentGeneration;
use App\Http\Controllers\Documents\Concerns\ValidatesDocumentData;
use App\Http\Controllers\Documents\Concerns\FormatsDocumentData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\TemplateProcessor;

class RequisitionController extends Controller
{
    use HandlesDocumentGeneration, ValidatesDocumentData, FormatsDocumentData;

    /**
     * ✅ GÉNÉRATION INITIALE (GET)
     */
    public function generate(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        try {
            $propriete = Propriete::with('dossier.district')->findOrFail($request->id_propriete);

            // Vérifier si réquisition existe déjà
            $documentExistant = DocumentGenere::where('type_document', DocumentGenere::TYPE_REQ)
                ->where('id_propriete', $request->id_propriete)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            if ($documentExistant) {
                return $this->downloadExisting($documentExistant, 'réquisition');
            }

            return $this->createNewRequisition($propriete);

        } catch (\Exception $e) {
            Log::error('❌ Erreur génération réquisition', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'generation_error',
                'message' => 'Erreur : ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ TÉLÉCHARGEMENT (GET)
     */
    public function download($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);

            if ($document->type_document !== DocumentGenere::TYPE_REQ) {
                return response()->json([
                    'success' => false,
                    'error' => 'invalid_type',
                    'message' => 'Ce document n\'est pas une réquisition',
                ], 400);
            }

            return $this->downloadExisting($document, 'réquisition');

        } catch (\Exception $e) {
            Log::error('❌ Erreur téléchargement réquisition', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'download_error',
                'message' => 'Erreur de téléchargement',
            ], 500);
        }
    }

    /**
     * ✅ RÉGÉNÉRATION (POST)
     */
    public function regenerate($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);

            if ($document->type_document !== DocumentGenere::TYPE_REQ) {
                return response()->json([
                    'success' => false,
                    'error' => 'invalid_type',
                    'message' => 'Ce document n\'est pas une réquisition',
                ], 400);
            }

            $propriete = $document->propriete()->with('dossier.district')->first();

            if (!$propriete) {
                throw new \Exception("Propriété introuvable");
            }

            return $this->regenerateRequisition($document, $propriete);

        } catch (\Exception $e) {
            Log::error('❌ Erreur régénération réquisition', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'regeneration_error',
                'message' => 'Erreur de régénération : ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ Créer nouvelle réquisition
     */
    private function createNewRequisition(Propriete $propriete)
    {
        DB::beginTransaction();

        try {
            // Double-check atomique
            $existingDoc = DocumentGenere::where('type_document', DocumentGenere::TYPE_REQ)
                ->where('id_propriete', $propriete->id)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->lockForUpdate()
                ->first();

            if ($existingDoc) {
                DB::rollBack();
                return $this->downloadExisting($existingDoc, 'réquisition');
            }

            $errors = $this->validateRequisitionData($propriete);
            $this->validateOrThrow($errors);

            $tempFilePath = $this->createRequisitionDocument($propriete);
            $savedPath = $this->saveDocument($tempFilePath, 'REQ', $propriete);

            $document = DocumentGenere::create([
                'type_document' => DocumentGenere::TYPE_REQ,
                'id_propriete' => $propriete->id,
                'id_dossier' => $propriete->id_dossier,
                'id_district' => $propriete->dossier->id_district,
                'numero_document' => $propriete->numero_requisition,
                'file_path' => $savedPath,
                'nom_fichier' => basename($savedPath),
                'generated_by' => Auth::id(),
                'generated_at' => now(),
                'status' => DocumentGenere::STATUS_ACTIVE,
            ]);

            DB::commit();

            ActivityLogger::logDocumentGeneration(ActivityLog::DOC_REQUISITION, $document->id, [
                'propriete_id' => $propriete->id,
                'type_operation' => $propriete->type_operation,
            ]);

            Log::info('✅ Réquisition créée', [
                'document_id' => $document->id,
                'propriete_id' => $propriete->id,
            ]);

            return response()->download($tempFilePath, $document->nom_fichier)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur création réquisition', [
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * ✅ Régénérer réquisition existante
     */
    private function regenerateRequisition(DocumentGenere $document, Propriete $propriete)
    {
        DB::beginTransaction();

        try {
            Log::info('🔄 Régénération réquisition', [
                'document_id' => $document->id,
            ]);

            $tempFilePath = $this->createRequisitionDocument($propriete);

            if (!file_exists($tempFilePath)) {
                throw new \Exception("Échec création fichier temporaire");
            }

            $savedPath = $this->saveDocument($tempFilePath, 'REQ', $propriete);

            $document->update([
                'file_path' => $savedPath,
                'metadata' => array_merge($document->metadata ?? [], [
                    'last_regenerated_at' => now()->toIso8601String(),
                ]),
            ]);
            
            $document->incrementRegenerationCount();

            DB::commit();

            Log::info('✅ Régénération réquisition réussie', [
                'document_id' => $document->id,
            ]);

            ActivityLogger::logDocumentDownload(ActivityLog::DOC_REQUISITION, $document->id, [
                'action_type' => 'regenerate',
            ]);

            return response()->download($tempFilePath, $document->nom_fichier)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur régénération réquisition', [
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * ✅ Créer le document Word réquisition
     */
    private function createRequisitionDocument(Propriete $propriete): string
    {
        $templatePath = $propriete->type_operation == 'morcellement'
            ? storage_path('app/public/modele_odoc/requisition_MO.docx')
            : storage_path('app/public/modele_odoc/requisition_IM.docx');

        if (!file_exists($templatePath)) {
            throw new \Exception("Template réquisition introuvable: {$templatePath}");
        }

        $modele = new TemplateProcessor($templatePath);
        $locationData = $this->getLocationData($propriete);
        $contenanceData = $this->formatContenance($propriete->contenance);

        $modele->setValues([
            'Province' => $locationData['province'],
            'Region' => $locationData['region'],
            'District' => $locationData['district'],
            'DISTRICT' => $locationData['DISTRICT'],
            'Situation' => $propriete->situation,
            'Nom_propriete' => Str::upper($propriete->proprietaire),
            'Titre' => $propriete->titre,
            'Commune' => $propriete->dossier->commune,
            'Fokotany' => $propriete->dossier->fokontany,
            'Numero_fn' => $this->getOrDefault($propriete->numero_FN, 'Non renseigné'),
            'Propriete_mere' => Str::upper($this->getOrDefault($propriete->propriete_mere, 'NON RENSEIGNÉE')),
            'Titre_mere' => $this->getOrDefault($propriete->titre_mere, 'N/A'),
            'ContenanceFormatLettre' => $contenanceData['lettres'],
            'ContenanceFormat' => $contenanceData['format'],
        ]);

        $fileName = 'REQUISITION_' . uniqid() . '_TN' . $propriete->titre . '.docx';
        $filePath = sys_get_temp_dir() . '/' . $fileName;
        $modele->saveAs($filePath);

        Log::info('✅ Document réquisition créé', [
            'path' => $filePath,
            'size' => filesize($filePath),
            'type_operation' => $propriete->type_operation,
        ]);

        return $filePath;
    }
}