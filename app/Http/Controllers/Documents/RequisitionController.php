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

    public function generate(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        try {
            $propriete = Propriete::with('dossier.district')->findOrFail($request->id_propriete);

            $documentExistant = DocumentGenere::where('type_document', DocumentGenere::TYPE_REQ)
                ->where('id_propriete', $request->id_propriete)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            if ($documentExistant) {
                $fileStatus = $documentExistant->checkFileStatus();
                
                if ($fileStatus['valid']) {
                    return $this->downloadExisting($documentExistant, 'réquisition');
                } else {
                    $documentExistant->markForRegeneration($fileStatus['error'] ?? 'file_missing');
                    return $this->regenerateRequisition($documentExistant, $propriete);
                }
            }

            return $this->createNewRequisition($propriete);

        } catch (\Exception $e) {
            Log::error('❌ Erreur génération réquisition', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Erreur: ' . $e->getMessage()]);
        }
    }

    public function download($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);

            if ($document->type_document !== DocumentGenere::TYPE_REQ) {
                return response()->json(['success' => false, 'error' => 'invalid_type'], 400);
            }

            $fileStatus = $document->checkFileStatus();
            
            if (!$fileStatus['valid']) {
                $document->markForRegeneration($fileStatus['error'] ?? 'file_missing');

                return response()->json([
                    'success' => false,
                    'error' => 'file_missing',
                    'message' => 'Le fichier de la réquisition est introuvable',
                    'details' => $fileStatus['error'],
                    'document' => ['id' => $document->id],
                    'can_regenerate' => true,
                ], 404);
            }

            return $this->downloadExisting($document, 'réquisition');

        } catch (\Exception $e) {
            Log::error('❌ Erreur téléchargement réquisition', ['error' => $e->getMessage()]);
            return response()->json(['success' => false], 500);
        }
    }

    public function regenerate($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);

            if ($document->type_document !== DocumentGenere::TYPE_REQ) {
                return response()->json(['success' => false, 'error' => 'invalid_type'], 400);
            }

            $propriete = $document->propriete()->with('dossier.district')->first();

            if (!$propriete) {
                throw new \Exception("Propriété introuvable");
            }

            return $this->regenerateRequisition($document, $propriete);

        } catch (\Exception $e) {
            Log::error('❌ Erreur régénération réquisition', ['error' => $e->getMessage()]);
            return response()->json(['success' => false], 500);
        }
    }

    private function createNewRequisition(Propriete $propriete)
    {
        DB::beginTransaction();

        try {
            $existingDoc = DocumentGenere::where('type_document', DocumentGenere::TYPE_REQ)
                ->where('id_propriete', $propriete->id)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->lockForUpdate()
                ->first();

            if ($existingDoc) {
                DB::rollBack();
                $fileStatus = $existingDoc->checkFileStatus();
                return $fileStatus['valid'] 
                    ? $this->downloadExisting($existingDoc, 'réquisition')
                    : $this->regenerateRequisition($existingDoc, $propriete);
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
            ]);

            return response()->download($tempFilePath, $document->nom_fichier)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    private function regenerateRequisition(DocumentGenere $document, Propriete $propriete)
    {
        DB::beginTransaction();

        try {
            $tempFilePath = $this->createRequisitionDocument($propriete);
            $savedPath = $this->saveDocument($tempFilePath, 'REQ', $propriete);

            $document->update(['file_path' => $savedPath]);
            $document->incrementRegenerationCount();

            DB::commit();

            return response()->download($tempFilePath, $document->nom_fichier)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    private function createRequisitionDocument(Propriete $propriete): string
    {
        $templatePath = $propriete->type_operation == 'morcellement'
            ? storage_path('app/public/modele_odoc/requisition_MO.docx')
            : storage_path('app/public/modele_odoc/requisition_IM.docx');

        if (!file_exists($templatePath)) {
            throw new \Exception("Template réquisition introuvable");
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

        return $filePath;
    }
}