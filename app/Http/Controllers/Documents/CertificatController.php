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

    /**
     * ✅ Générer ou télécharger un CSF existant
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

            // Vérifier si le CSF existe déjà pour ce demandeur
            $documentExistant = DocumentGenere::where('type_document', DocumentGenere::TYPE_CSF)
                ->where('id_demandeur', $request->id_demandeur)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            if ($documentExistant && $documentExistant->fileExists()) {
                return $this->downloadExisting($documentExistant, 'CSF');
            }

            return $this->createNewCsf($propriete, $demandeur);

        } catch (\Exception $e) {
            Log::error('❌ Erreur génération CSF', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->withErrors(['error' => 'Erreur: ' . $e->getMessage()]);
        }
    }

    /**
     * ✅ Télécharger un CSF par son ID
     */
    public function download($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);

            if ($document->type_document !== DocumentGenere::TYPE_CSF) {
                return back()->withErrors(['error' => 'Ce document n\'est pas un CSF']);
            }

            return $this->downloadExisting($document, 'CSF');

        } catch (\Exception $e) {
            Log::error('❌ Erreur téléchargement CSF', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            return back()->withErrors(['error' => 'Impossible de télécharger: ' . $e->getMessage()]);
        }
    }

    /**
     * ✅ Historique des CSF pour un demandeur
     */
    public function history($id_demandeur)
    {
        try {
            $demandeur = Demandeur::findOrFail($id_demandeur);

            $documents = DocumentGenere::with(['propriete', 'generatedBy'])
                ->where('id_demandeur', $id_demandeur)
                ->where('type_document', DocumentGenere::TYPE_CSF)
                ->orderBy('generated_at', 'desc')
                ->get()
                ->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'propriete' => $doc->propriete ? "Lot {$doc->propriete->lot}" : 'N/A',
                        'demandeur' => $doc->demandeur->nom_complet,
                        'cree_par' => $doc->generatedBy->name ?? 'Utilisateur inconnu',
                        'cree_le' => $doc->generated_at->format('d/m/Y H:i'),
                        'status' => $doc->status,
                        'download_count' => $doc->download_count,
                        'file_exists' => $doc->fileExists(),
                    ];
                });

            return response()->json([
                'success' => true,
                'csf' => $documents
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ SÉCURISÉ : Créer un nouveau CSF
     */
    private function createNewCsf(Propriete $propriete, Demandeur $demandeur)
    {
        DB::beginTransaction();

        try {
            $district = $propriete->dossier->district;

            // ✅ Lock pour éviter les doublons
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

            // Validation des données
            $errors = $this->validateCsfData($demandeur, $propriete);
            $this->validateOrThrow($errors);

            // Créer le fichier Word
            $tempFilePath = $this->createCsfDocument($demandeur, $propriete);

            if (!file_exists($tempFilePath)) {
                throw new \Exception("Fichier Word non créé");
            }

            // Sauvegarder
            $savedPath = $this->saveDocument($tempFilePath, 'CSF', $propriete, $demandeur);
            $nomFichier = basename($savedPath);

            // Créer l'enregistrement
            $document = DocumentGenere::create([
                'type_document' => DocumentGenere::TYPE_CSF,
                'id_propriete' => $propriete->id,
                'id_demandeur' => $demandeur->id,
                'id_dossier' => $propriete->id_dossier,
                'id_district' => $propriete->dossier->id_district,
                'numero_document' => null,
                'file_path' => $savedPath,
                'nom_fichier' => $nomFichier,
                'has_consorts' => false,
                'generated_by' => Auth::id(),
                'generated_at' => now(),
                'status' => DocumentGenere::STATUS_ACTIVE,
            ]);

            DB::commit();

            // Log d'activité
            ActivityLogger::logDocumentGeneration(ActivityLog::DOC_CSF, $document->id, [
                'propriete_id' => $propriete->id,
                'demandeur_id' => $demandeur->id,
                'lot' => $propriete->lot,
                'id_district' => $propriete->dossier->id_district,
                'district_nom' => $propriete->dossier->district->nom_district,
            ]);

            return response()->download($tempFilePath, $nomFichier, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur création CSF', [
                'error' => $e->getMessage(),
                'demandeur_id' => $demandeur->id,
            ]);
            throw $e;
        }
    }

    /**
     * ✅ Créer le document Word CSF
     */
    private function createCsfDocument(Demandeur $demandeur, Propriete $propriete): string
    {
        $dossier = $propriete->dossier;

        $locationData = $this->getLocationData($propriete);
        $articles = $this->getArticles($locationData['district'], $dossier->commune);

        $templatePath = storage_path('app/public/modele_odoc/document_CSF/Certificat_situation_financiere.docx');

        if (!file_exists($templatePath)) {
            throw new \Exception("Template CSF introuvable: {$templatePath}");
        }

        $modele = new TemplateProcessor($templatePath);

        $modele->setValues([
            'Titre_long' => $demandeur->titre_demandeur,
            'Nom' => $demandeur->nom_demandeur,
            'Prenom' => $demandeur->prenom_demandeur ?? '',
            'D_dis' => $articles['D_dis'],
            'Numero_FN' => $this->getOrDefault($propriete->numero_FN, 'Non renseigné'),
            'DISTRICT' => $locationData['DISTRICT'],
            'Province' => $locationData['province'],
        ]);

        $fileName = 'CSF_' . uniqid() . '_' . Str::slug($demandeur->nom_demandeur) . '.docx';
        $filePath = sys_get_temp_dir() . '/' . $fileName;

        $modele->saveAs($filePath);

        return $filePath;
    }
}