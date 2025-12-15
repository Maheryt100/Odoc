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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\TemplateProcessor;

class CertificatController extends Controller
{
    use HandlesDocumentGeneration, ValidatesDocumentData, FormatsDocumentData;

    public function generate(Request $request)
    {
        $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        try {
            $propriete = Propriete::with('dossier.district')->findOrFail($request->id_propriete);
            $demandeur = Demandeur::findOrFail($request->id_demandeur);

            // ✅ AJOUT : Récupérer le reçu pour cette propriété
            $documentRecu = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
                ->where('id_propriete', $request->id_propriete)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            // Optionnel : Exiger le reçu pour générer le CSF
            // if (!$documentRecu) {
            //     return back()->withErrors(['error' => 'Le reçu doit être généré avant le CSF']);
            // }

            $documentExistant = DocumentGenere::where('type_document', DocumentGenere::TYPE_CSF)
                ->where('id_demandeur', $request->id_demandeur)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            if ($documentExistant) {
                $fileStatus = $documentExistant->checkFileStatus();
                
                if ($fileStatus['valid']) {
                    return $this->downloadExisting($documentExistant, 'CSF');
                } else {
                    $documentExistant->markForRegeneration($fileStatus['error'] ?? 'file_missing');
                    return $this->regenerateCsf($documentExistant, $propriete, $demandeur, $documentRecu);
                }
            }

            return $this->createNewCsf($propriete, $demandeur, $documentRecu);

        } catch (\Exception $e) {
            Log::error('❌ Erreur génération CSF', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Erreur: ' . $e->getMessage()]);
        }
    }

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

            $fileStatus = $document->checkFileStatus();
            
            if (!$fileStatus['valid']) {
                $document->markForRegeneration($fileStatus['error'] ?? 'file_missing');

                return response()->json([
                    'success' => false,
                    'error' => 'file_missing',
                    'message' => 'Le fichier du CSF est introuvable',
                    'details' => $fileStatus['error'],
                    'document' => [
                        'id' => $document->id,
                        'nom_fichier' => $document->nom_fichier,
                    ],
                    'can_regenerate' => true,
                ], 404);
            }

            return $this->downloadExisting($document, 'CSF');

        } catch (\Exception $e) {
            Log::error('❌ Erreur téléchargement CSF', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'error' => 'download_error'], 500);
        }
    }

    public function regenerate($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);

            if ($document->type_document !== DocumentGenere::TYPE_CSF) {
                return response()->json(['success' => false, 'error' => 'invalid_type'], 400);
            }

            $propriete = $document->propriete()->with('dossier.district')->first();
            $demandeur = $document->demandeur;

            if (!$propriete || !$demandeur) {
                throw new \Exception("Données manquantes");
            }

            // ✅ AJOUT : Récupérer le reçu
            $documentRecu = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
                ->where('id_propriete', $propriete->id)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            return $this->regenerateCsf($document, $propriete, $demandeur, $documentRecu);

        } catch (\Exception $e) {
            Log::error('❌ Erreur régénération CSF', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'error' => 'regeneration_error'], 500);
        }
    }

    private function createNewCsf(Propriete $propriete, Demandeur $demandeur, ?DocumentGenere $documentRecu)
    {
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
                $fileStatus = $existingDoc->checkFileStatus();
                return $fileStatus['valid'] 
                    ? $this->downloadExisting($existingDoc, 'CSF')
                    : $this->regenerateCsf($existingDoc, $propriete, $demandeur, $documentRecu);
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
            ]);

            DB::commit();

            ActivityLogger::logDocumentGeneration(ActivityLog::DOC_CSF, $document->id, [
                'demandeur_id' => $demandeur->id,
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
            $savedPath = $this->saveDocument($tempFilePath, 'CSF', $propriete, $demandeur);

            $document->update(['file_path' => $savedPath]);
            $document->incrementRegenerationCount();

            DB::commit();

            return response()->download($tempFilePath, $document->nom_fichier)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    private function createCsfDocument(Demandeur $demandeur, Propriete $propriete, ?DocumentGenere $documentRecu): string
    {
        $templatePath = storage_path('app/public/modele_odoc/document_CSF/Certificat_situation_financiere.docx');

        if (!file_exists($templatePath)) {
            throw new \Exception("Template CSF introuvable");
        }

        $modele = new TemplateProcessor($templatePath);
        $locationData = $this->getLocationData($propriete);
        $articles = $this->getArticles($locationData['district'], $propriete->dossier->commune);

        // ✅ AJOUT : Données du reçu
        $numeroQuittance = $documentRecu ? ($documentRecu->numero_document ?? 'N/A') : 'N/A';
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
            // ✅ AJOUT : Variables quittance
            'NumeroQuittance' => $numeroQuittance,
            'DateQuittance' => $dateQuittance,
        ]);

        $fileName = 'CSF_' . uniqid() . '_' . Str::slug($demandeur->nom_demandeur) . '.docx';
        $filePath = sys_get_temp_dir() . '/' . $fileName;
        $modele->saveAs($filePath);

        return $filePath;
    }
}