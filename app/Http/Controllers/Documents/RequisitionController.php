<?php

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
     * ✅ Générer ou télécharger une réquisition existante
     */
    public function generate(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        try {
            $propriete = Propriete::with('dossier.district')->findOrFail($request->id_propriete);

            // Vérifier si la réquisition existe déjà
            $documentExistant = DocumentGenere::where('type_document', DocumentGenere::TYPE_REQ)
                ->where('id_propriete', $request->id_propriete)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            if ($documentExistant && $documentExistant->fileExists()) {
                return $this->downloadExisting($documentExistant, 'réquisition');
            }

            return $this->createNewRequisition($propriete);

        } catch (\Exception $e) {
            Log::error('❌ Erreur génération réquisition', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->withErrors(['error' => 'Erreur: ' . $e->getMessage()]);
        }
    }

    /**
     * ✅ Télécharger une réquisition par son ID
     */
    public function download($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);

            if ($document->type_document !== DocumentGenere::TYPE_REQ) {
                return back()->withErrors(['error' => 'Ce document n\'est pas une réquisition']);
            }

            return $this->downloadExisting($document, 'réquisition');

        } catch (\Exception $e) {
            Log::error('❌ Erreur téléchargement réquisition', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            return back()->withErrors(['error' => 'Impossible de télécharger: ' . $e->getMessage()]);
        }
    }

    /**
     * ✅ SÉCURISÉ : Créer une nouvelle réquisition
     */
    private function createNewRequisition(Propriete $propriete)
    {
        DB::beginTransaction();

        try {
            $district = $propriete->dossier->district;

            // ✅ Lock pour éviter les doublons
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

            // Validation des données
            $errors = $this->validateRequisitionData($propriete);
            $this->validateOrThrow($errors);

            // Créer le fichier Word
            $tempFilePath = $this->createRequisitionDocument($propriete);

            if (!file_exists($tempFilePath)) {
                throw new \Exception("Fichier Word non créé");
            }

            // Sauvegarder
            $savedPath = $this->saveDocument($tempFilePath, 'REQ', $propriete);
            $nomFichier = basename($savedPath);

            // Créer l'enregistrement
            $document = DocumentGenere::create([
                'type_document' => DocumentGenere::TYPE_REQ,
                'id_propriete' => $propriete->id,
                'id_demandeur' => null,
                'id_dossier' => $propriete->id_dossier,
                'id_district' => $propriete->dossier->id_district,
                'numero_document' => $propriete->numero_requisition,
                'file_path' => $savedPath,
                'nom_fichier' => $nomFichier,
                'has_consorts' => false,
                'generated_by' => Auth::id(),
                'generated_at' => now(),
                'status' => DocumentGenere::STATUS_ACTIVE,
            ]);

            DB::commit();

            // Log d'activité
            ActivityLogger::logDocumentGeneration(ActivityLog::DOC_REQUISITION, $document->id, [
                'propriete_id' => $propriete->id,
                'lot' => $propriete->lot,
                'titre' => $propriete->titre,
                'numero_requisition' => $propriete->numero_requisition,
                'id_district' => $propriete->dossier->id_district,
                'district_nom' => $propriete->dossier->district->nom_district,
            ]);

            return response()->download($tempFilePath, $nomFichier, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur création réquisition', [
                'error' => $e->getMessage(),
                'propriete_id' => $propriete->id,
            ]);
            throw $e;
        }
    }

    /**
     * ✅ Créer le document Word réquisition
     */
    private function createRequisitionDocument(Propriete $propriete): string
    {
        $dossier = $propriete->dossier;

        // Sélectionner le bon template selon le type d'opération
        if ($propriete->type_operation == 'morcellement') {
            $templatePath = storage_path('app/public/modele_odoc/requisition_MO.docx');
        } else {
            $templatePath = storage_path('app/public/modele_odoc/requisition_IM.docx');
        }

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
            'Commune' => $dossier->commune,
            'Fokotany' => $dossier->fokontany,
            'Numero_fn' => $this->getOrDefault($propriete->numero_FN, 'Non renseigné'),
            'Propriete_mere' => Str::upper($this->getOrDefault($propriete->propriete_mere, 'NON RENSEIGNÉE')),
            'Titre_mere' => $this->getOrDefault($propriete->titre_mere, 'N/A'),
            'ContenanceFormatLettre' => $contenanceData['lettres'],
            'ContenanceFormat' => $contenanceData['format'],
        ]);

        $fileName = 'REQUISITION_' . uniqid() . '_TN' . $propriete->titre . '.docx';
        $filePath = sys_get_temp_dir() . '/' . $fileName;

        $modele->saveAs($filePath);

        return $filePath;
    }
}