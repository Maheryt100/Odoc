<?php

namespace App\Http\Controllers\Documents;

use App\Models\Propriete;
use App\Models\Dossier;
use App\Models\Demandeur;
use App\Models\Demander;
use App\Models\RecuPaiement;
use App\Models\ActivityLog;
use App\Models\DocumentGenere;
use App\Services\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use NumberFormatter;
use PhpOffice\PhpWord\TemplateProcessor;
use App\Helpers\DownloadDebugHelper;
use App\Http\Controllers\Controller;



class DocumentGenerationController extends Controller
{
    /**
     * Page principale avec chargement des documents existants
     */
    public function index($id_dossier)
    {
        $dossier = Dossier::with(['district'])->findOrFail($id_dossier);

        // ✅ CORRECTION : Utiliser demandesActives() au lieu de demandeurs avec filtre pivot
        $proprietes = Propriete::where('id_dossier', $id_dossier)
            ->with([
                'demandesActives.demandeur' // ✅ Utiliser la relation hasMany
            ])
            ->get()
            ->map(function ($propriete) use ($dossier) {
                // ✅ Mapper les demandes vers le format demandeurs_lies
                $propriete->demandeurs_lies = $propriete->demandesActives->map(function ($demande) {
                    return [
                        'id' => $demande->id_demandeur,
                        'id_demande' => $demande->id,
                        'nom' => $demande->demandeur->nom_demandeur,
                        'prenom' => $demande->demandeur->prenom_demandeur ?? '',
                        'cin' => $demande->demandeur->cin,
                        'ordre' => $demande->ordre,
                        'status_consort' => $demande->status_consort,
                        'is_archived' => false,
                    ];
                });

                // Charger les documents générés
                $propriete->document_recu = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
                    ->where('id_propriete', $propriete->id)
                    ->where('id_district', $dossier->id_district)
                    ->where('status', DocumentGenere::STATUS_ACTIVE)
                    ->first();

                $propriete->document_adv = DocumentGenere::where('type_document', DocumentGenere::TYPE_ADV)
                    ->where('id_propriete', $propriete->id)
                    ->where('id_district', $dossier->id_district)
                    ->where('status', DocumentGenere::STATUS_ACTIVE)
                    ->first();

                $propriete->document_requisition = DocumentGenere::where('type_document', DocumentGenere::TYPE_REQ)
                    ->where('id_propriete', $propriete->id)
                    ->where('id_district', $dossier->id_district)
                    ->where('status', DocumentGenere::STATUS_ACTIVE)
                    ->first();

                // Compatibilité avec ancien système
                $propriete->has_recu = !!$propriete->document_recu;
                if ($propriete->document_recu) {
                    $propriete->dernier_recu = [
                        'id' => $propriete->document_recu->id,
                        'numero_recu' => $propriete->document_recu->numero_document,
                        'montant' => $propriete->document_recu->montant,
                        'date_recu' => $propriete->document_recu->date_document->format('d/m/Y'),
                        'generated_by' => $propriete->document_recu->generatedBy->name ?? 'Inconnu',
                        'generated_at' => $propriete->document_recu->generated_at->format('d/m/Y H:i'),
                        'download_count' => $propriete->document_recu->download_count,
                        'source' => 'documents_generes',
                    ];
                }

                // Statistiques
                $propriete->has_active_demandeurs = $propriete->demandesActives->count() > 0;
                $propriete->has_archived_demandeurs = $propriete->demandesArchivees()->count() > 0;

                return $propriete;
            })
            ->filter(function($propriete) {
                return $propriete->has_active_demandeurs;
            })
            ->values();

        // ✅ CORRIGÉ : Charger les demandeurs avec leurs CSF
        $demandeurs = $dossier->demandeurs()
            ->whereHas('demandesActives') // Uniquement ceux avec des demandes actives
            ->get()
            ->map(function($demandeur) use ($dossier) {
                $demandeur->document_csf = DocumentGenere::where('type_document', DocumentGenere::TYPE_CSF)
                    ->where('id_demandeur', $demandeur->id)
                    ->where('id_district', $dossier->id_district)
                    ->where('status', DocumentGenere::STATUS_ACTIVE)
                    ->first();

                return $demandeur;
            });

        return Inertia::render('documents/Generate', [
            'dossier' => $dossier,
            'proprietes' => $proprietes,
            'demandeurs' => $demandeurs,
        ]);
    }

    /**
     * Générer ou télécharger un reçu existant
     */
    public function generateRecu(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
            'id_demandeur' => 'required|exists:demandeurs,id',
        ]);

        try {
            $propriete = Propriete::with('dossier.district')->findOrFail($request->id_propriete);
            $demandeur = Demandeur::findOrFail($request->id_demandeur);

            $documentExistant = DocumentGenere::findExisting(
                DocumentGenere::TYPE_RECU,
                $request->id_propriete,
                $request->id_demandeur,
                $propriete->dossier->id_district
            );

            if ($documentExistant && $documentExistant->fileExists()) {

                return $this->downloadExistingDocument($documentExistant, 'reçu');
            }

            return $this->createNewRecu($propriete, $demandeur);

        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * NOUVELLE MÉTHODE SÉCURISÉE : Créer un reçu avec commit AVANT téléchargement
     */
    // private function createNewRecuSafe($propriete, $demandeur)
    // {
    //     DB::beginTransaction();

    //     try {
    //         $district = $propriete->dossier->district;

    //         $prix = $this->getPrixFromDistrict($propriete);
    //         $prixTotal = (int) ($prix * $propriete->contenance);

    //         $numeroRecu = $this->generateNumeroRecu($propriete->dossier->id_district);

    //         $tempFilePath = $this->createRecu($propriete, $demandeur, $numeroRecu, $prixTotal);

    //         if (!file_exists($tempFilePath)) {
    //             throw new \Exception("Échec de création du fichier Word temporaire");
    //         }

    //         $tempFileSize = filesize($tempFilePath);

    //         $savedPath = $this->saveDocumentCopy($tempFilePath, 'RECU', $propriete, $demandeur);

    //         if (!Storage::disk('public')->exists($savedPath)) {
    //             throw new \Exception("Le fichier n'a pas été sauvegardé: {$savedPath}");
    //         }

    //         $savedFileSize = Storage::disk('public')->size($savedPath);

    //         if ($tempFileSize !== $savedFileSize) {
    //             throw new \Exception("Taille fichier incohérente (temp: {$tempFileSize}, saved: {$savedFileSize})");
    //         }

    //         $nomFichier = basename($savedPath);

    //         $document = DocumentGenere::create([
    //             'type_document' => DocumentGenere::TYPE_RECU,
    //             'id_propriete' => $propriete->id,
    //             'id_demandeur' => $demandeur->id,
    //             'id_dossier' => $propriete->id_dossier,
    //             'id_district' => $propriete->dossier->id_district,
    //             'numero_document' => $numeroRecu,
    //             'file_path' => $savedPath,
    //             'nom_fichier' => $nomFichier,
    //             'montant' => $prixTotal,
    //             'date_document' => Carbon::now(),
    //             'has_consorts' => false,
    //             'generated_by' => Auth::id(),
    //             'generated_at' => now(),
    //             'status' => DocumentGenere::STATUS_ACTIVE,
    //         ]);

    //         if (!$document->id) {
    //             throw new \Exception("Échec de création de l'enregistrement DocumentGenere");
    //         }

    //         RecuPaiement::create([
    //             'id_propriete' => $propriete->id,
    //             'id_demandeur' => $demandeur->id,
    //             'id_user' => Auth::id(),
    //             'numero_recu' => $numeroRecu,
    //             'montant' => $prixTotal,
    //             'date_recu' => Carbon::now(),
    //             'file_path' => $savedPath,
    //             'status' => 'confirmed',
    //         ]);

    //         DB::commit();

    //         ActivityLogger::logDocumentGeneration(ActivityLog::DOC_RECU, $document->id, [
    //             'numero_recu' => $numeroRecu,
    //             'propriete_id' => $propriete->id,
    //             'demandeur_id' => $demandeur->id,
    //             'montant' => $prixTotal,
    //             'lot' => $propriete->lot,
    //             'id_district' => $propriete->dossier->id_district,
    //             'district_nom' => $district->nom_district,
    //         ]);

    //         $downloadPath = sys_get_temp_dir() . '/download_' . uniqid() . '_' . $nomFichier;
    //         copy($tempFilePath, $downloadPath);

    //         return response()->download($downloadPath, $nomFichier, [
    //             'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    //             'Content-Disposition' => 'attachment; filename="' . $nomFichier . '"',
    //             'Cache-Control' => 'no-cache, must-revalidate',
    //             'X-Document-ID' => $document->id,
    //         ])->deleteFileAfterSend(true);

    //     } catch (\Exception $e) {
    //         DB::rollBack();

    //         throw $e;
    //     }
    // }

    /**
     * Télécharger un document existant par son ID
     */
    public function downloadRecu($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);

            if (!$document->fileExists()) {
                Log::warning('⚠️ Fichier introuvable, régénération', [
                    'document_id' => $id,
                    'file_path' => $document->file_path,
                ]);
                return $this->regenerateDocument($document);
            }

            return $this->downloadExistingDocument($document, 'document');

        } catch (\Exception $e) {
            Log::error('❌ Erreur téléchargement document', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors(['error' => 'Impossible de télécharger: ' . $e->getMessage()]);
        }
    }

    /**
     * Obtenir l'historique des reçus
     */
    public function getRecuHistory($id_propriete)
    {
        try {
            $propriete = Propriete::with('dossier')->findOrFail($id_propriete);

            $documents = DocumentGenere::with(['demandeur', 'generatedBy'])
                ->where('id_propriete', $id_propriete)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('type_document', DocumentGenere::TYPE_RECU)
                ->orderBy('generated_at', 'desc')
                ->get()
                ->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'numero_recu' => $doc->numero_document,
                        'montant' => number_format($doc->montant, 0, ',', '.'),
                        'date_recu' => $doc->date_document->format('d/m/Y'),
                        'demandeur' => $doc->demandeur->nom_demandeur . ' ' . ($doc->demandeur->prenom_demandeur ?? ''),
                        'cree_par' => $doc->generatedBy->name ?? 'Utilisateur inconnu',
                        'cree_le' => $doc->generated_at->format('d/m/Y H:i'),
                        'status' => $doc->status,
                        'download_count' => $doc->download_count,
                        'file_exists' => $doc->fileExists(),
                    ];
                });

            return response()->json([
                'success' => true,
                'recus' => $documents
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Générer ou télécharger un acte de vente existant
     */
    public function generateActeVente(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
            'id_demandeur' => 'required|exists:demandeurs,id',
        ]);

        try {
            $propriete = Propriete::with('dossier.district')->findOrFail($request->id_propriete);

            // Vérifier qu'un reçu existe
            $recuExists = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
                ->where('id_propriete', $request->id_propriete)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->exists();

            if (!$recuExists) {
                return back()->withErrors([
                    'error' => 'Vous devez d\'abord générer le reçu de paiement.'
                ]);
            }

            // Vérifier si l'ADV existe déjà
            $documentExistant = DocumentGenere::where('type_document', DocumentGenere::TYPE_ADV)
                ->where('id_propriete', $request->id_propriete)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            if ($documentExistant && $documentExistant->fileExists()) {
                return $this->downloadExistingDocument($documentExistant, 'acte de vente');
            }

            return $this->createNewActeVente($propriete, $request->id_demandeur);

        } catch (\Exception $e) {

            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     *  Générer ou télécharger un CSF existant
     */
    public function generateCsf(Request $request)
    {
        $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        try {
            $propriete = Propriete::with('dossier.district')->findOrFail($request->id_propriete);
            $demandeur = Demandeur::findOrFail($request->id_demandeur);

            $documentExistant = DocumentGenere::where('type_document', DocumentGenere::TYPE_CSF)
                ->where('id_demandeur', $request->id_demandeur)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            if ($documentExistant && $documentExistant->fileExists()) {
                return $this->downloadExistingDocument($documentExistant, 'CSF');
            }

            return $this->createNewCsf($propriete, $demandeur);

        } catch (\Exception $e) {

            return back()->withErrors(['error' => 'Erreur: ' . $e->getMessage()]);
        }
    }

    /**
     *  Générer ou télécharger une réquisition existante
     */
    public function generateRequisition(Request $request)
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

            if ($documentExistant && $documentExistant->fileExists()) {
                return $this->downloadExistingDocument($documentExistant, 'réquisition');
            }

            return $this->createNewRequisition($propriete);

        } catch (\Exception $e) {

            return back()->withErrors(['error' => 'Erreur: ' . $e->getMessage()]);
        }
    }

    // ==================== MÉTHODES PRIVÉES ====================

    /**
     * Construire le chemin de stockage organisé
     */
    private function buildStoragePath(string $type, Propriete $propriete, ?Demandeur $demandeur = null): string
    {
        $district = $propriete->dossier->district;
        $districtSlug = Str::slug($district->nom_district);
        $date = Carbon::now()->format('Y/m');

        $timestamp = Carbon::now()->format('Ymd_His');

        $baseName = match($type) {
            'RECU' => $demandeur
                ? "{$timestamp}_RECU_" . Str::slug($demandeur->nom_demandeur) . "_LOT{$propriete->lot}.docx"
                : "{$timestamp}_RECU_DEMANDEUR_LOT{$propriete->lot}.docx",
            'ADV' => $demandeur
                ? "{$timestamp}_ADV_" . Str::slug($demandeur->nom_demandeur) . "_LOT{$propriete->lot}.docx"
                : "{$timestamp}_ADV_CONSORTS_LOT{$propriete->lot}.docx",
            'CSF' => $demandeur
                ? "{$timestamp}_CSF_" . Str::slug($demandeur->nom_demandeur) . "_LOT{$propriete->lot}.docx"
                : "{$timestamp}_CSF_DEMANDEUR_LOT{$propriete->lot}.docx",
            'REQ' => "{$timestamp}_REQ_LOT{$propriete->lot}_TN{$propriete->titre}.docx",
            default => throw new \Exception("Type de document inconnu: {$type}"),
        };

        return "pieces_jointes/documents/{$type}/{$districtSlug}/{$date}/{$baseName}";
    }
    /**
     * Sauvegarder le document avec vérification renforcée
     */
    private function saveDocumentCopy(string $tempFilePath, string $type, Propriete $propriete, ?Demandeur $demandeur = null): string
    {
        try {
            $storagePath = $this->buildStoragePath($type, $propriete, $demandeur);
            $directory = dirname($storagePath);

            if (!Storage::disk('public')->exists($directory)) {
                Storage::disk('public')->makeDirectory($directory, 0755, true);
            }

            $fileContent = file_get_contents($tempFilePath);

            if ($fileContent === false) {
                throw new \Exception("Impossible de lire le fichier temporaire: {$tempFilePath}");
            }

            $written = Storage::disk('public')->put($storagePath, $fileContent);

            if (!$written) {
                throw new \Exception("Échec de l'écriture dans le storage: {$storagePath}");
            }

            if (!Storage::disk('public')->exists($storagePath)) {
                throw new \Exception("Le fichier n'existe pas après sauvegarde: {$storagePath}");
            }

            $fullPath = Storage::disk('public')->path($storagePath);
            if (file_exists($fullPath)) {
                chmod($fullPath, 0644);
            }  

            return $storagePath;

        } catch (\Exception $e) {

            throw $e;
        }
    }

    /**
     * Générer numéro de reçu avec ID district
     */
    private function generateNumeroRecu($idDossier, $numeroDossier): string
    {
        // Compter les reçus EXISTANTS pour ce dossier (tous districts confondus)
        $count = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
            ->where('id_dossier', $idDossier)
            ->where('status', DocumentGenere::STATUS_ACTIVE)
            ->count() + 1;
        
        // Format: {séquence sur 3 chiffres}/{numéro du dossier}
        $numero = sprintf('%03d/%s', $count, $numeroDossier);
        
        Log::info('✅ Génération numéro reçu', [
            'id_dossier' => $idDossier,
            'numero_dossier' => $numeroDossier,
            'sequence' => $count,
            'numero_genere' => $numero,
        ]);
        
        return $numero;
    }

    /**
     * Télécharger un document existant avec incrémentation du compteur
     */
    private function downloadExistingDocument(DocumentGenere $document, string $typeName)
    {
        try {

            if (!$document->fileExists()) {
                return $this->regenerateDocument($document);
            }

            $document->incrementDownloadCount();

            ActivityLogger::logDocumentDownload(
                $this->getActivityLogType($document->type_document),
                $document->id,
                [
                    'numero_document' => $document->numero_document,
                    'action_type' => 'download_existing',
                    'download_count' => $document->download_count,
                    'id_district' => $document->id_district,
                ]
            );

            return response()->download($document->full_path, $document->nom_fichier, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition' => 'attachment; filename="' . $document->nom_fichier . '"',
                'Content-Length' => filesize($document->full_path),
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur téléchargement', [
                'error' => $e->getMessage(),
                'document_id' => $document->id,
            ]);
            throw $e;
        }
    }

    /**
     *  Créer un nouveau reçu
     */
    private function createNewRecu($propriete, $demandeur)
{
    DB::beginTransaction();

    try {
        $dossier = $propriete->dossier;

        // ✅ Vérification avec lock
        $existingDoc = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
            ->where('id_propriete', $propriete->id)
            ->where('id_demandeur', $demandeur->id)
            ->where('id_district', $dossier->id_district)
            ->where('status', DocumentGenere::STATUS_ACTIVE)
            ->lockForUpdate()
            ->first();

        if ($existingDoc) {
            DB::rollBack();
            return $this->downloadExistingDocument($existingDoc, 'reçu');
        }

        $prix = $this->getPrixFromDistrict($propriete);
        $prixTotal = (int) ($prix * $propriete->contenance);
        
        // ✅ Numéro SÉCURISÉ
        $numeroRecu = $this->generateNumeroRecu($dossier->id, $dossier->numero_ouverture);

        $tempFilePath = $this->createRecu($propriete, $demandeur, $numeroRecu, $prixTotal);
        $savedPath = $this->saveDocumentCopy($tempFilePath, 'RECU', $propriete, $demandeur);
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
        ]);

        return response()->download($tempFilePath, $nomFichier)->deleteFileAfterSend(true);

    } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
    }
}

    /**
     * ✅ Vérifier l'unicité du numéro de reçu (optionnel - sécurité supplémentaire)
     */
    private function validateNumeroRecuUnique($numeroRecu, $idDossier): bool
    {
        return !DocumentGenere::where('numero_document', $numeroRecu)
            ->where('id_dossier', $idDossier)
            ->where('type_document', DocumentGenere::TYPE_RECU)
            ->where('status', DocumentGenere::STATUS_ACTIVE)
            ->exists();
    }

    /**
     * Créer un nouvel acte de vente
     */
    private function createNewActeVente($propriete, $idDemandeur)
{
    DB::beginTransaction();

    try {
        // ✅ Vérification avec lock
        $existingDoc = DocumentGenere::where('type_document', DocumentGenere::TYPE_ADV)
            ->where('id_propriete', $propriete->id)
            ->where('id_district', $propriete->dossier->id_district)
            ->where('status', DocumentGenere::STATUS_ACTIVE)
            ->lockForUpdate()
            ->first();

        if ($existingDoc) {
            DB::rollBack();
            return $this->downloadExistingDocument($existingDoc, 'acte de vente');
        }

        // ✅ Utiliser demandesActives() au lieu de Demander::with
        $tousLesDemandeurs = $propriete->demandesActives()
            ->with('demandeur')
            ->orderBy('ordre', 'asc')
            ->get();

        $hasConsorts = $tousLesDemandeurs->count() > 1;
        $demandeursPrincipal = $tousLesDemandeurs->firstWhere('id_demandeur', $idDemandeur);

        if (!$demandeursPrincipal) {
            throw new \Exception("Demandeur introuvable");
        }

        $tempFilePath = $this->createActeVente($propriete, $tousLesDemandeurs, $hasConsorts);
        $savedPath = $this->saveDocumentCopy($tempFilePath, 'ADV', $propriete, $demandeursPrincipal->demandeur);
        $nomFichier = basename($savedPath);

        $document = DocumentGenere::create([
            'type_document' => DocumentGenere::TYPE_ADV,
            'id_propriete' => $propriete->id,
            'id_demandeur' => $idDemandeur,
            'id_dossier' => $propriete->id_dossier,
            'id_district' => $propriete->dossier->id_district,
            'file_path' => $savedPath,
            'nom_fichier' => $nomFichier,
            'has_consorts' => $hasConsorts,
            'demandeurs_ids' => $tousLesDemandeurs->pluck('id_demandeur')->toArray(),
            'generated_by' => Auth::id(),
            'generated_at' => now(),
            'status' => DocumentGenere::STATUS_ACTIVE,
        ]);

        DB::commit();

        return response()->download($tempFilePath, $nomFichier)->deleteFileAfterSend(true);

    } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
    }
}

    /**
     * Créer un nouveau CSF
     */
    private function createNewCsf($propriete, $demandeur)
    {
        DB::beginTransaction();

        try {
            $district = $propriete->dossier->district;

            $existingDoc = DocumentGenere::where('type_document', DocumentGenere::TYPE_CSF)
                ->where('id_demandeur', $demandeur->id)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->lockForUpdate()
                ->first();

            if ($existingDoc) {
                DB::rollBack();
                return $this->downloadExistingDocument($existingDoc, 'CSF');
            }

            $tempFilePath = $this->createCsf($demandeur, $propriete);

            if (!file_exists($tempFilePath)) {
                throw new \Exception("Fichier Word non créé");
            }

            $savedPath = $this->saveDocumentCopy($tempFilePath, 'CSF', $propriete, $demandeur);
            $nomFichier = basename($savedPath);

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
            throw $e;
        }
    }

    /**
     * Créer une nouvelle réquisition
     */
    private function createNewRequisition($propriete)
    {
        DB::beginTransaction();

        try {
            $district = $propriete->dossier->district;

            $existingDoc = DocumentGenere::where('type_document', DocumentGenere::TYPE_REQ)
                ->where('id_propriete', $propriete->id)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->lockForUpdate()
                ->first();

            if ($existingDoc) {
                DB::rollBack();
                return $this->downloadExistingDocument($existingDoc, 'réquisition');
            }

            $tempFilePath = $this->createRequisition($propriete);

            if (!file_exists($tempFilePath)) {
                throw new \Exception("Fichier Word non créé");
            }

            $savedPath = $this->saveDocumentCopy($tempFilePath, 'REQ', $propriete);
            $nomFichier = basename($savedPath);

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
            throw $e;
        }
    }

    /**
     * Régénérer un document si le fichier est perdu
     */
    private function regenerateDocument(DocumentGenere $document)
    {
        try {
            $propriete = $document->propriete()->with('dossier.district')->first();

            $tempFilePath = match($document->type_document) {
                DocumentGenere::TYPE_RECU => $this->createRecu(
                    $propriete,
                    $document->demandeur,
                    $document->numero_document,
                    $document->montant
                ),
                DocumentGenere::TYPE_CSF => $this->createCsf(
                    $document->demandeur,
                    $propriete
                ),
                DocumentGenere::TYPE_REQ => $this->createRequisition($propriete),
                DocumentGenere::TYPE_ADV => throw new \Exception("La régénération d'ADV n'est pas supportée"),
                default => throw new \Exception("Type de document inconnu")
            };

            $savedPath = $this->saveDocumentCopy(
                $tempFilePath,
                $document->type_document,
                $propriete,
                $document->demandeur
            );

            $document->update(['file_path' => $savedPath]);

            ActivityLogger::logDocumentDownload(
                $this->getActivityLogType($document->type_document),
                $document->id,
                [
                    'action_type' => 'regenerate',
                    'id_district' => $document->id_district,
                ]
            );

            return response()->download($tempFilePath)->deleteFileAfterSend(true);

        } catch (\Exception $e) {

            throw $e;
        }
    }

    private function getActivityLogType(string $docType): string
    {
        return match($docType) {
            DocumentGenere::TYPE_RECU => ActivityLog::DOC_RECU,
            DocumentGenere::TYPE_ADV => ActivityLog::DOC_ACTE_VENTE,
            DocumentGenere::TYPE_CSF => ActivityLog::DOC_CSF,
            DocumentGenere::TYPE_REQ => ActivityLog::DOC_REQUISITION,
            default => 'document'
        };
    }

    private function normalizeVocation(string $vocation): string
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

    private function getPrixFromDistrict($propriete): int
    {
        $dossier = $propriete->dossier;
        $vocationColumn = $this->normalizeVocation($propriete->vocation);

        $prixDistrict = DB::table('districts')
            ->join('dossiers', 'districts.id', '=', 'dossiers.id_district')
            ->select("districts.$vocationColumn as prix", 'districts.nom_district')
            ->where('dossiers.id', $dossier->id)
            ->first();

        if (!$prixDistrict) {
            throw new \Exception("Configuration de prix introuvable pour ce dossier");
        }

        $prix = $prixDistrict->prix ?? 0;

        if ($prix <= 0) {
            throw new \Exception(
                "Le prix pour la vocation '{$propriete->vocation}' n'est pas configuré dans le district '{$prixDistrict->nom_district}'. " .
                "Veuillez configurer les prix dans la section 'Prix des terrains'."
            );
        }

        return (int) $prix;
    }

    /**
     * Créer le document de reçu Word
     */
    private function createRecu($propriete, $demandeur, $numeroRecu, $montantTotal)
    {
        Carbon::setLocale('fr');
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);

        $templatePath = storage_path('app/public/modele_odoc/recu_paiement.docx');

        if (!file_exists($templatePath)) {
            throw new \Exception("Template de reçu introuvable: {$templatePath}");
        }

        $modele_recu = new TemplateProcessor($templatePath);

        // Récupérer le district
        $place = DB::table('dossiers')
            ->join('districts', 'districts.id', '=', 'dossiers.id_district')
            ->where('dossiers.id', $propriete->dossier->id)
            ->select('districts.nom_district')
            ->first();

        if (!$place) {
            throw new \Exception("District introuvable pour le dossier {$propriete->dossier->id}");
        }

        // Formatter les données
        $dateRecu = Carbon::now()->translatedFormat('d/m/Y');
        $montantLettres = Str::upper(ucfirst($formatter->format((int) $montantTotal)));
        $cinFormate = implode('.', str_split($demandeur->cin, 3));
        $dateDelivrance = Carbon::parse($demandeur->date_delivrance)->translatedFormat('d/m/Y');

        $titreDemandeur = $demandeur->sexe === 'Homme' ? 'M.' : 'Mme';
        $nomComplet = $demandeur->nom_demandeur . ' ' . ($demandeur->prenom_demandeur ?? '');

        $motif = "Achat terrain Lot {$propriete->lot} TN°{$propriete->titre}";
        $details = "Propriété \"{$propriete->proprietaire}\" - Commune {$propriete->dossier->commune}";

        // Remplacer les variables
        $modele_recu->setValues([
            'District' => $place->nom_district,
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

        $modele_recu->saveAs($filePath);

        return $filePath;
    }

    /**
     * Créer l'acte de vente (avec ou sans consorts)
     */
    private function createActeVente($propriete, $tousLesDemandeurs, $hasConsorts)
    {
        Carbon::setLocale('fr');
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);

        $dossier = $propriete->dossier;
        $type_operation = $propriete->type_operation;

        // Calcul du prix
        $prix = $this->getPrixFromDistrict($propriete);
        $prixLettre = Str::upper(ucfirst($formatter->format($prix)));
        $prixTotal = $prix * $propriete->contenance;
        $superficie = $propriete->contenance;

        // Calcul contenance Ha A Ca
        $hectares = intdiv($superficie, 10000);
        $reste = $superficie % 10000;
        $ares = intdiv($reste, 100);
        $centiares = $reste % 100;

        $parts = [];
        $contenanceFormat = '';

        if ($hectares > 0) {
            $contenanceFormat .= str_pad($hectares, 2, '0', STR_PAD_LEFT) . 'Ha ';
            $label = $hectares === 1 ? 'HECTARE' : 'HECTARES';
            $parts[] = strtoupper($formatter->format($hectares)) . " $label";
        }

        if ($ares > 0 || $hectares > 0) {
            $contenanceFormat .= str_pad($ares, 2, '0', STR_PAD_LEFT) . 'A ';
            $label = $ares === 1 ? 'ARE' : 'ARES';
            $parts[] = strtoupper($formatter->format($ares)) . " $label";
        }

        $label = $centiares === 1 ? 'CENTIARE' : 'CENTIARES';
        $parts[] = strtoupper($formatter->format($centiares)) . " $label";

        $contenanceFormat .= str_pad($centiares, 2, '0', STR_PAD_LEFT) . 'Ca';
        $contenanceFormatLettre = implode(' ', $parts);
        $totalLettre = Str::upper(ucfirst($formatter->format($prixTotal)));

        // Localisation
        $place = DB::table('dossiers')
            ->join('districts', 'districts.id', '=', 'dossiers.id_district')
            ->join('regions', 'regions.id', '=', 'districts.id_region')
            ->join('provinces', 'provinces.id', '=', 'regions.id_province')
            ->where('dossiers.id', $dossier->id)
            ->select('provinces.nom_province', 'regions.nom_region', 'districts.nom_district')
            ->first();

        $firstLetterDistrict = strtolower(mb_substr($place->nom_district, 0, 1));
        $firstLetterCommune = strtolower(mb_substr($dossier->commune, 0, 1));

        // Dates communes
        $dateDescenteDebut = Carbon::parse($dossier->date_descente_debut)->translatedFormat('d');
        $dateDescenteFin = Carbon::parse($dossier->date_descente_fin)->translatedFormat('d F Y');
        $dateDescente = $dateDescenteDebut . ' au ' . $dateDescenteFin;

        $dateRequisition = $propriete->date_requisition ? Carbon::parse($propriete->date_requisition)->translatedFormat('d F Y') : '';
        $dateInscription = $propriete->date_inscription ? Carbon::parse($propriete->date_inscription)->translatedFormat('d F Y') : '';

        if (!$hasConsorts) {
            // ===== SANS CONSORT =====
            $demandeur = $tousLesDemandeurs->first()->demandeur;

            $templatePath = $type_operation == 'morcellement'
                ? 'app/public/modele_odoc/sans_consort/morcellement.docx'
                : 'app/public/modele_odoc/sans_consort/immatriculation.docx';

            $modele_odoc = new TemplateProcessor(storage_path($templatePath));

            $dateNaissance = Carbon::parse($demandeur->date_naissance)->translatedFormat('d F Y');
            $dateMariage = $demandeur->date_mariage ? Carbon::parse($demandeur->date_mariage)->translatedFormat('d F Y') : '';
            $dateDelivrance = Carbon::parse($demandeur->date_delivrance)->translatedFormat('d F Y');

            $modele_odoc->setValues([
                'Titre_long' => $demandeur->titre_demandeur,
                'Nom' => $demandeur->nom_demandeur,
                'Prenom' => $demandeur->prenom_demandeur ?? '',
                'Occupation' => $demandeur->occupation,
                'Date_naissance' => $dateNaissance,
                'Lieu_naissance' => $demandeur->lieu_naissance,
                'Cin' => implode('.', str_split($demandeur->cin, 3)),
                'Date_delivrance' => $dateDelivrance,
                'Lieu_delivrance' => $demandeur->lieu_delivrance,
                'Domiciliation' => $demandeur->domiciliation,
                'Nationalite' => $demandeur->nationalite,
                'Date_mariage' => $demandeur->date_mariage ? 'le ' . $dateMariage : '',
                'Lieu_mariage' => $demandeur->lieu_mariage ? ' à ' . $demandeur->lieu_mariage . ', ' : '',
                'Nom_mere' => $demandeur->nom_mere,
                'Nom_pere' => $demandeur->nom_pere ? $demandeur->nom_pere . ' et de ' : '',

                'ContenanceFormatLettre' => $contenanceFormatLettre,
                'ContenanceFormat' => $contenanceFormat,
                'Prix' => $prixLettre,
                'PrixTotal' => number_format($prixTotal, 0, ',', '.'),
                'TotalLettre' => $totalLettre,
                'PrixCarre' => number_format($prix, 0, ',', '.'),

                'Nature' => $propriete->nature,
                'Vocation' => $propriete->vocation,
                'Situation' => $propriete->situation,
                'Fokotany' => $dossier->fokontany,
                'Commune' => $dossier->commune,
                'Tcommune' => $dossier->type_commune,
                'Propriete_mere' => Str::upper($propriete->propriete_mere ?? ''),
                'Titre_mere' => $propriete->titre_mere ?? '',
                'Titre' => $propriete->titre ?? '',
                'DateDescente' => $dateDescente,
                'Requisition' => $dateRequisition,
                'Inscription' => $dateInscription,
                'Dep_vol' => $propriete->dep_vol ?? '',

                'Proprietaire' => Str::upper($propriete->proprietaire),
                'Province' => $place->nom_province,
                'Region' => $place->nom_region,
                'District' => $place->nom_district,
                'DISTRICT' => Str::upper($place->nom_district),
                'D_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'D' : 'DE',
                'd_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'd' : 'de',
                'd_com' => in_array($firstLetterCommune, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'd' : 'de',
            ]);

            if ($demandeur->sexe == 'Homme') {
                $modele_odoc->setValues([
                    'EnfantDe' => 'fils',
                    'Demandeur' => 'au demandeur',
                    'Marie_a' => $demandeur->marie_a ? 'marié à la dame ' . $demandeur->marie_a . ',' : '',
                ]);
            } else {
                $modele_odoc->setValues([
                    'EnfantDe' => 'fille',
                    'Demandeur' => 'à la demanderesse',
                    'Marie_a' => $demandeur->marie_a ? 'mariée à monsieur ' . $demandeur->marie_a . ',' : '',
                ]);
            }

            $fileName = 'ACTE_VENTE_' . uniqid() . '_' . $demandeur->nom_demandeur . '.docx';
            $filePath = sys_get_temp_dir() . '/' . $fileName;

            $modele_odoc->saveAs($filePath);
            return $filePath;

        } else {
            // ===== AVEC CONSORTS =====
            $templatePath = $type_operation == 'morcellement'
                ? 'app/public/modele_odoc/avec_consort/morcellement.docx'
                : 'app/public/modele_odoc/avec_consort/immatriculation.docx';

            $modele_odoc = new TemplateProcessor(storage_path($templatePath));

            $nombreDemandeurs = $tousLesDemandeurs->count();
            $modele_odoc->cloneBlock('consort_block_1', $nombreDemandeurs, true, true);
            $modele_odoc->cloneBlock('consort_block_2', $nombreDemandeurs, true, true);

            foreach ($tousLesDemandeurs as $key => $demande) {
                $n = $key + 1;
                $dmdr = $demande->demandeur;

                $dateNaissance = Carbon::parse($dmdr->date_naissance)->translatedFormat('d F Y');
                $dateMariage = $dmdr->date_mariage ? Carbon::parse($dmdr->date_mariage)->translatedFormat('d F Y') : '';
                $dateDelivrance = Carbon::parse($dmdr->date_delivrance)->translatedFormat('d F Y');

                $modele_odoc->setValues([
                    'Numero#' . $n => $n,
                    'Titre_long#' . $n => $dmdr->titre_demandeur,
                    'Nom#' . $n => $dmdr->nom_demandeur,
                    'Prenom#' . $n => $dmdr->prenom_demandeur ?? '',
                    'Occupation#' . $n => $dmdr->occupation,
                    'Date_naissance#' . $n => $dateNaissance,
                    'Lieu_naissance#' . $n => $dmdr->lieu_naissance,
                    'Cin#' . $n => implode('.', str_split($dmdr->cin, 3)),
                    'Date_delivrance#' . $n => $dateDelivrance,
                    'Lieu_delivrance#' . $n => $dmdr->lieu_delivrance,
                    'Domiciliation#' . $n => $dmdr->domiciliation,
                    'Nationalite#' . $n => $dmdr->nationalite,
                    'Date_mariage#' . $n => $dmdr->date_mariage ? 'le ' . $dateMariage : '',
                    'Lieu_mariage#' . $n => $dmdr->lieu_mariage ? ' à ' . $dmdr->lieu_mariage . ', ' : '',
                    'Nom_mere#' . $n => $dmdr->nom_mere,
                    'Nom_pere#' . $n => $dmdr->nom_pere ? $dmdr->nom_pere . ' et de ' : '',
                    'ET#' . $n => ($n == 1) ? 'ET - ' : '',
                ]);

                if ($dmdr->sexe == 'Homme') {
                    $modele_odoc->setValues([
                        'EnfantDe#' . $n => 'fils',
                        'Demandeur#' . $n => 'au demandeur',
                        'Marie_a#' . $n => $dmdr->marie_a ? 'marié à la dame ' . $dmdr->marie_a . ',' : '',
                    ]);
                } else {
                    $modele_odoc->setValues([
                        'EnfantDe#' . $n => 'fille',
                        'Demandeur#' . $n => 'à la demanderesse',
                        'Marie_a#' . $n => $dmdr->marie_a ? 'mariée à monsieur ' . $dmdr->marie_a . ',' : '',
                    ]);
                }
            }

            $modele_odoc->setValues([
                'ContenanceFormatLettre' => $contenanceFormatLettre,
                'ContenanceFormat' => $contenanceFormat,
                'Prix' => $prixLettre,
                'PrixTotal' => number_format($prixTotal, 0, ',', '.'),
                'TotalLettre' => $totalLettre,
                'PrixCarre' => number_format($prix, 0, ',', '.'),
                'Nature' => $propriete->nature,
                'Vocation' => $propriete->vocation,
                'Situation' => $propriete->situation,
                'Fokotany' => $dossier->fokontany,
                'Tcommune' => $dossier->type_commune,
                'Commune' => $dossier->commune,
                'Propriete_mere' => Str::upper($propriete->propriete_mere ?? ''),
                'Titre_mere' => $propriete->titre_mere ?? '',
                'Titre' => $propriete->titre ?? '',
                'Date_descente' => $dateDescente,
                'Requisition' => $dateRequisition,
                'Inscription' => $dateInscription,
                'Dep_vol' => $propriete->dep_vol ?? '',

                'Proprietaire' => Str::upper($propriete->proprietaire),
                'Province' => $place->nom_province,
                'Region' => $place->nom_region,
                'District' => $place->nom_district,
                'DISTRICT' => Str::upper($place->nom_district),
                'D_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'D' : 'DE',
                'd_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'd' : 'de',
                'd_com' => in_array($firstLetterCommune, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'd' : 'de',
            ]);

            $premierDemandeur = $tousLesDemandeurs->first()->demandeur;
            $fileName = 'ACTE_VENTE_CONSORTS_' . uniqid() . '_' . $premierDemandeur->nom_demandeur . '.docx';
            $filePath = sys_get_temp_dir() . '/' . $fileName;

            $modele_odoc->saveAs($filePath);
            return $filePath;
        }
    }

    private function createCsf($demandeur, $propriete)
    {
        $dossier = $propriete->dossier;

        $place = DB::table('dossiers')
            ->join('districts', 'districts.id', '=', 'dossiers.id_district')
            ->join('regions', 'regions.id', '=', 'districts.id_region')
            ->join('provinces', 'provinces.id', '=', 'regions.id_province')
            ->where('dossiers.id', $dossier->id)
            ->select('provinces.nom_province', 'regions.nom_region', 'districts.nom_district')
            ->first();

        $firstLetterDistrict = strtolower(mb_substr($place->nom_district, 0, 1));

        $modele_csf = new TemplateProcessor(
            storage_path('app/public/modele_odoc/document_CSF/Certificat_situation_financiere.docx')
        );

        $modele_csf->setValues([
            'Titre_long' => $demandeur->titre_demandeur,
            'Nom' => $demandeur->nom_demandeur,
            'Prenom' => $demandeur->prenom_demandeur ?? '',
            'D_dis' => in_array($firstLetterDistrict, ['a', 'e', 'i', 'o', 'u', 'y']) ? 'D' : 'DE',
            'Numero_FN' => $propriete->numero_FN ?? '',
            'DISTRICT' => Str::upper($place->nom_district),
            'Province' => $place->nom_province,
        ]);

        $fileName = 'CSF_' . uniqid() . '_' . $demandeur->nom_demandeur . '.docx';
        $filePath = sys_get_temp_dir() . '/' . $fileName;

        $modele_csf->saveAs($filePath);

        return $filePath;
    }

    private function createRequisition($propriete)
    {
        $dossier = $propriete->dossier;

        if ($propriete->type_operation == 'morcellement') {
            $requisition_model = new TemplateProcessor(
                storage_path('app/public/modele_odoc/requisition_MO.docx')
            );
        } else {
            $requisition_model = new TemplateProcessor(
                storage_path('app/public/modele_odoc/requisition_IM.docx')
            );
        }

        $place = DB::table('dossiers')
            ->join('districts', 'districts.id', '=', 'dossiers.id_district')
            ->join('regions', 'regions.id', '=', 'districts.id_region')
            ->join('provinces', 'provinces.id', '=', 'regions.id_province')
            ->where('dossiers.id', $dossier->id)
            ->select('provinces.nom_province', 'regions.nom_region', 'districts.nom_district')
            ->first();

        $requisition_model->setValues([
            'Province' => $place->nom_province,
            'Region' => $place->nom_region,
            'District' => $place->nom_district,
            'DISTRICT' => Str::upper($place->nom_district),
            'Situation' => $propriete->situation,
            'Nom_propriete' => Str::upper($propriete->proprietaire),
            'Titre' => $propriete->titre,
            'Commune' => $dossier->commune,
            'Fokotany' => $dossier->fokontany,
            'Numero_fn' => $propriete->numero_FN,
            'Propriete_mere' => Str::upper($propriete->propriete_mere ?? ''),
            'Titre_mere' => $propriete->titre_mere ?? '',
        ]);

        $fileName = 'REQUISITION_' . uniqid() . '_' . $propriete->titre . '.docx';
        $filePath = sys_get_temp_dir() . '/' . $fileName;

        $requisition_model->saveAs($filePath);

        return $filePath;
    }

    /**
     * ✅ Migration pour convertir TOUS les anciens formats
     */
    public function migrateOldRecuFormat()
    {
        Log::info('🔄 Début migration format numéro reçu');
        
        DB::beginTransaction();
        
        try {
            $updated = 0;
            $errors = 0;
            
            // Récupérer tous les dossiers avec leurs reçus
            $dossiers = Dossier::with(['documentsGeneres' => function($query) {
                $query->where('type_document', DocumentGenere::TYPE_RECU)
                    ->where('status', DocumentGenere::STATUS_ACTIVE)
                    ->orderBy('generated_at', 'asc');
            }])->get();
            
            foreach ($dossiers as $dossier) {
                $sequence = 1;
                
                foreach ($dossier->documentsGeneres as $recu) {
                    try {
                        $ancienNumero = $recu->numero_document;
                        
                        $nouveauNumero = sprintf(
                            '%03d/%s', 
                            $sequence, 
                            $dossier->numero_ouverture
                        );
                        
                        // Vérifier l'unicité
                        $exists = DocumentGenere::where('numero_document', $nouveauNumero)
                            ->where('id_dossier', $dossier->id)
                            ->where('id', '!=', $recu->id)
                            ->exists();
                        
                        if ($exists) {
                            Log::error('❌ Conflit de numéro', [
                                'recu_id' => $recu->id,
                                'numero_tente' => $nouveauNumero,
                            ]);
                            $errors++;
                            continue;
                        }
                        
                        // Mettre à jour
                        $recu->update([
                            'numero_document' => $nouveauNumero,
                            'metadata' => array_merge($recu->metadata ?? [], [
                                'ancien_numero' => $ancienNumero,
                                'migrated_at' => now()->toIso8601String(),
                                'sequence_recalculee' => true,
                            ])
                        ]);
                        
                        // Mettre à jour aussi l'ancienne table
                        RecuPaiement::where('numero_recu', $ancienNumero)
                            ->update(['numero_recu' => $nouveauNumero]);
                        
                        $updated++;
                        $sequence++;
                        
                        Log::info('✅ Reçu migré', [
                            'recu_id' => $recu->id,
                            'dossier_id' => $dossier->id,
                            'numero_dossier' => $dossier->numero_ouverture,
                            'ancien' => $ancienNumero,
                            'nouveau' => $nouveauNumero,
                            'sequence' => $sequence - 1,
                        ]);
                        
                    } catch (\Exception $e) {
                        Log::error('❌ Erreur migration reçu', [
                            'recu_id' => $recu->id,
                            'error' => $e->getMessage(),
                        ]);
                        $errors++;
                    }
                }
            }
            
            DB::commit();
            
            Log::info('✅ Migration terminée', [
                'dossiers_traites' => $dossiers->count(),
                'recus_updated' => $updated,
                'errors' => $errors,
            ]);
            
            return [
                'success' => true,
                'dossiers_traites' => $dossiers->count(),
                'recus_updated' => $updated,
                'errors' => $errors,
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('❌ Erreur critique migration', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}