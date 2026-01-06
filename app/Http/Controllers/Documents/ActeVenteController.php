<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Propriete;
use App\Models\DocumentGenere;
use App\Models\RecuReference;
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

class ActeVenteController extends Controller
{
    use HandlesDocumentGeneration, ValidatesDocumentData, FormatsDocumentData;

    /**
     * ✅ GÉNÉRATION INITIALE - POST avec validation atomique
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
            'id_demandeur' => 'required|exists:demandeurs,id',
            'numero_recu' => [
                'required',
                'string',
                'max:50',
                'regex:/^\d{3}\/\d{2}$/',
            ],
        ], [
            'numero_recu.required' => 'Le numéro de reçu est obligatoire',
            'numero_recu.regex' => 'Le numéro de reçu doit être au format XXX/XX (ex: 001/25)',
        ]);

        DB::beginTransaction();

        try {
            $propriete = Propriete::with('dossier.district')->findOrFail($request->id_propriete);
            
            // ✅ VÉRIFICATION ATOMIQUE de l'unicité du numéro de reçu
            $existingRecu = RecuReference::where('numero_recu', $validated['numero_recu'])
                ->where('id_dossier', $propriete->id_dossier)
                ->lockForUpdate() // ← Verrou pour éviter les doublons
                ->exists();
            
            if ($existingRecu) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'error' => 'duplicate_recu',
                    'message' => "Ce numéro de reçu ({$validated['numero_recu']}) existe déjà dans ce dossier.",
                ], 422);
            }

            // ✅ Vérifier si ADV existe déjà (double-check atomique)
            $documentExistant = DocumentGenere::where('type_document', DocumentGenere::TYPE_ADV)
                ->where('id_propriete', $request->id_propriete)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->lockForUpdate()
                ->first();

            if ($documentExistant) {
                DB::rollBack();
                return $this->downloadExisting($documentExistant, 'acte de vente');
            }

            // ✅ Créer le document
            $result = $this->createNewActeVente(
                $propriete, 
                $request->id_demandeur, 
                $validated['numero_recu']
            );

            DB::commit();
            return $result;

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'validation_error',
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur génération ADV', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'generation_error',
                'message' => 'Erreur lors de la génération : ' . $e->getMessage(),
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

            if ($document->type_document !== DocumentGenere::TYPE_ADV) {
                return response()->json([
                    'success' => false,
                    'error' => 'invalid_type',
                    'message' => 'Ce document n\'est pas un acte de vente',
                ], 400);
            }

            return $this->downloadExisting($document, 'acte de vente');

        } catch (\Exception $e) {
            Log::error('❌ Erreur téléchargement ADV', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'download_error',
                'message' => 'Impossible de télécharger : ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ RÉGÉNÉRATION (POST)
     */
    public function regenerate($id)
    {
        DB::beginTransaction();

        try {
            $document = DocumentGenere::lockForUpdate()->findOrFail($id);

            if ($document->type_document !== DocumentGenere::TYPE_ADV) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'error' => 'invalid_type',
                    'message' => 'Ce document n\'est pas un acte de vente',
                ], 400);
            }

            $propriete = $document->propriete()->with('dossier.district')->first();
            if (!$propriete) {
                throw new \Exception("Propriété introuvable");
            }

            // ✅ Récupérer le numéro de reçu depuis les métadonnées
            $numeroRecu = $document->numero_recu_externe;
            if (!$numeroRecu) {
                throw new \Exception("Numéro de reçu manquant dans le document");
            }

            $result = $this->regenerateActeVente($document, $propriete, $numeroRecu);
            
            DB::commit();
            return $result;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur régénération ADV', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'regeneration_error',
                'message' => 'Erreur lors de la régénération : ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ CRÉER UN NOUVEAU ADV (PRIVÉ - appelé depuis generate)
     */
    private function createNewActeVente(
        Propriete $propriete, 
        int $idDemandeur, 
        string $numeroRecu
    ) {
        // Note: Transaction déjà ouverte par generate()

        // Charger tous les demandeurs
        $tousLesDemandeurs = $propriete->demandesActives()
            ->with('demandeur')
            ->orderBy('ordre', 'asc')
            ->get();

        if ($tousLesDemandeurs->isEmpty()) {
            throw new \Exception("Aucun demandeur actif trouvé");
        }

        $hasConsorts = $tousLesDemandeurs->count() > 1;
        $demandeurPrincipal = $tousLesDemandeurs->firstWhere('id_demandeur', $idDemandeur);

        if (!$demandeurPrincipal) {
            throw new \Exception("Demandeur principal introuvable");
        }

        // ✅ Validation STRICTE
        $errors = $hasConsorts 
            ? $this->validateConsortsData($tousLesDemandeurs)
            : $this->validateActeVenteData(
                $propriete, 
                $demandeurPrincipal->demandeur,
                $numeroRecu
            );
        
        $this->validateOrThrow($errors);

        // ✅ Créer la référence du reçu externe
        $recuRef = RecuReference::create([
            'id_propriete' => $propriete->id,
            'id_demandeur' => $idDemandeur,
            'id_dossier' => $propriete->id_dossier,
            'numero_recu' => $numeroRecu,
            'montant' => $demandeurPrincipal->total_prix,
            'date_recu' => now(),
        ]);

        // ✅ Créer le document avec le numéro de reçu
        $tempFilePath = $this->createActeVenteDocument(
            $propriete, 
            $tousLesDemandeurs, 
            $hasConsorts, 
            $numeroRecu
        );

        $savedPath = $this->saveDocument($tempFilePath, 'ADV', $propriete, $demandeurPrincipal->demandeur);
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
            'numero_recu_externe' => $numeroRecu,
            'numero_recu_saisi_at' => now(),
            'numero_recu_saisi_by' => Auth::id(),
            'generated_by' => Auth::id(),
            'generated_at' => now(),
            'status' => DocumentGenere::STATUS_ACTIVE,
            'metadata' => [
                'recu_reference_id' => $recuRef->id,
                'recu_numero' => $numeroRecu,
            ],
        ]);

        ActivityLogger::logDocumentGeneration(ActivityLog::DOC_ACTE_VENTE, $document->id, [
            'lot' => $propriete->lot,
            'has_consorts' => $hasConsorts,
            'nb_demandeurs' => $tousLesDemandeurs->count(),
            'numero_recu' => $numeroRecu,
        ]);

        Log::info('✅ ADV créé', [
            'document_id' => $document->id,
            'propriete_id' => $propriete->id,
            'numero_recu' => $numeroRecu,
        ]);

        // ✅ Retourner le fichier pour téléchargement immédiat
        return response()->download($tempFilePath, $nomFichier)->deleteFileAfterSend(true);
    }

    /**
     * ✅ RÉGÉNÉRER UN ADV EXISTANT (PRIVÉ)
     */
    private function regenerateActeVente(
        DocumentGenere $document, 
        Propriete $propriete, 
        string $numeroRecu
    ) {
        // Note: Transaction déjà ouverte par regenerate()

        Log::info('🔄 Régénération ADV', [
            'document_id' => $document->id,
            'numero_recu' => $numeroRecu,
        ]);

        // Charger les demandeurs
        $tousLesDemandeurs = $propriete->demandesActives()
            ->with('demandeur')
            ->orderBy('ordre', 'asc')
            ->get();

        if ($tousLesDemandeurs->isEmpty()) {
            throw new \Exception("Aucun demandeur actif trouvé");
        }

        $hasConsorts = $tousLesDemandeurs->count() > 1;

        // ✅ Recréer le fichier AVEC le reçu
        $tempFilePath = $this->createActeVenteDocument(
            $propriete, 
            $tousLesDemandeurs, 
            $hasConsorts, 
            $numeroRecu
        );

        if (!file_exists($tempFilePath)) {
            throw new \Exception("Échec création fichier temporaire");
        }

        // Sauvegarder
        $savedPath = $this->saveDocument($tempFilePath, 'ADV', $propriete);

        // Mettre à jour le document
        $document->update([
            'file_path' => $savedPath,
            'metadata' => array_merge($document->metadata ?? [], [
                'recu_numero' => $numeroRecu,
                'last_regenerated_at' => now()->toIso8601String(),
            ]),
        ]);
        
        $document->incrementRegenerationCount();

        Log::info('✅ Régénération ADV réussie', [
            'document_id' => $document->id,
            'numero_recu' => $numeroRecu,
        ]);

        ActivityLogger::logDocumentDownload(ActivityLog::DOC_ACTE_VENTE, $document->id, [
            'action_type' => 'regenerate',
        ]);

        return response()->download($tempFilePath, $document->nom_fichier)->deleteFileAfterSend(true);
    }

    /**
     * ✅ CRÉER LE DOCUMENT WORD (privé, inchangé)
     */
    private function createActeVenteDocument(
        Propriete $propriete, 
        $tousLesDemandeurs, 
        bool $hasConsorts,
        string $numeroRecu
    ): string {
        // ... (code identique à la version précédente)
        // Cette méthode reste inchangée car elle fonctionne correctement
        
        Carbon::setLocale('fr');
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);

        $dossier = $propriete->dossier;
        $type_operation = $propriete->type_operation;

        // Calculs de prix
        $prix = $this->getPrixFromDistrict($propriete);
        $prixLettre = $this->formatMontantEnLettres($prix);
        $prixTotal = $prix * $propriete->contenance;
        $totalLettre = $this->formatMontantEnLettres($prixTotal);

        // Dates
        $dateRequisition = $this->formatDateDocument(Carbon::parse($propriete->date_requisition));
        $dateDepot1 = $this->formatDateDocument(Carbon::parse($propriete->date_depot_1));
        $dateDepot2 = $this->formatDateDocument(Carbon::parse($propriete->date_depot_2));
        $dateApprobation = $this->formatDateDocument(Carbon::parse($propriete->date_approbation_acte));

        // Dep/Vol
        $depVolInscription = $this->formatDepVolComplet(
            $propriete->dep_vol_inscription,
            $propriete->numero_dep_vol_inscription
        );

        $depVolRequisition = $this->formatDepVolComplet(
            $propriete->dep_vol_requisition,
            $propriete->numero_dep_vol_requisition
        );

        $contenanceData = $this->formatContenance((int) $propriete->contenance);
        $locationData = $this->getLocationData($propriete);
        $articles = $this->getArticles($locationData['district'], $dossier->commune);

        $dateDescente = $this->formatPeriodeDates(
            Carbon::parse($dossier->date_descente_debut),
            Carbon::parse($dossier->date_descente_fin)
        );

        // Données du reçu externe
        $numeroQuittance = $numeroRecu;
        $dateQuittance = now()->translatedFormat('d F Y');

        Log::info('📄 Création ADV', [
            'type_operation' => $type_operation,
            'has_consorts' => $hasConsorts,
            'nb_demandeurs' => $tousLesDemandeurs->count(),
            'recu_numero' => $numeroQuittance,
        ]);

        if (!$hasConsorts) {
            // SANS CONSORT
            $demandeur = $tousLesDemandeurs->first()->demandeur;

            $templatePath = $type_operation == 'morcellement'
                ? storage_path('app/public/modele_odoc/sans_consort/morcellement.docx')
                : storage_path('app/public/modele_odoc/sans_consort/immatriculation.docx');

            if (!file_exists($templatePath)) {
                throw new \Exception("Template ADV sans consort introuvable: {$templatePath}");
            }

            $modele = new TemplateProcessor($templatePath);
            $demandeurData = $this->buildDemandeurData($demandeur);

            $modele->setValues(array_merge([
                'ContenanceFormatLettre' => $contenanceData['lettres'],
                'ContenanceFormat' => $contenanceData['format'],
                'Prix' => $prixLettre,
                'PrixTotal' => $this->formatMontantChiffres($prixTotal),
                'TotalLettre' => $totalLettre,
                'PrixCarre' => $this->formatMontantChiffres($prix),
                'Nature' => $propriete->nature,
                'Vocation' => $propriete->vocation,
                'Situation' => $propriete->situation,
                'Fokotany' => $dossier->fokontany,
                'Commune' => $dossier->commune,
                'Tcommune' => $dossier->type_commune,
                'Propriete_mere' => Str::upper($this->getOrDefault($propriete->propriete_mere, 'NON RENSEIGNÉE')),
                'Titre_mere' => $this->getOrDefault($propriete->titre_mere, 'N/A'),
                'Titre' => $propriete->titre,
                'DateDescente' => $dateDescente,
                'Requisition' => $dateRequisition,
                'DateDepot1' => $dateDepot1,
                'DateDepot2' => $dateDepot2,
                'DateApprobation' => $dateApprobation,
                'DepVolInscription' => $depVolInscription,
                'DepVolRequisition' => $depVolRequisition,
                'Dep_vol' => $this->formatDepVol($propriete->dep_vol, $propriete->numero_dep_vol),
                'Proprietaire' => Str::upper($propriete->proprietaire),
                'Province' => $locationData['province'],
                'Region' => $locationData['region'],
                'District' => $locationData['district'],
                'DISTRICT' => $locationData['DISTRICT'],
                'NumeroQuittance' => $numeroQuittance,
                'DateQuittance' => $dateQuittance,
            ], $demandeurData, $articles));

            $fileName = 'ADV_' . uniqid() . '_' . Str::slug($demandeur->nom_demandeur) . '.docx';

        } else {
            // AVEC CONSORTS
            $templatePath = $type_operation == 'morcellement'
                ? storage_path('app/public/modele_odoc/avec_consort/morcellement.docx')
                : storage_path('app/public/modele_odoc/avec_consort/immatriculation.docx');

            if (!file_exists($templatePath)) {
                throw new \Exception("Template ADV avec consorts introuvable: {$templatePath}");
            }

            $modele = new TemplateProcessor($templatePath);

            $nombreDemandeurs = $tousLesDemandeurs->count();
            $modele->cloneBlock('consort_block_1', $nombreDemandeurs, true, true);
            $modele->cloneBlock('consort_block_2', $nombreDemandeurs, true, true);

            foreach ($tousLesDemandeurs as $key => $demande) {
                $n = $key + 1;
                $dmdr = $demande->demandeur;
                $demandeurData = $this->buildDemandeurDataWithIndex($dmdr, $n);
                $modele->setValues($demandeurData);
            }

            $modele->setValues(array_merge([
                'ContenanceFormatLettre' => $contenanceData['lettres'],
                'ContenanceFormat' => $contenanceData['format'],
                'Prix' => $prixLettre,
                'PrixTotal' => $this->formatMontantChiffres($prixTotal),
                'TotalLettre' => $totalLettre,
                'PrixCarre' => $this->formatMontantChiffres($prix),
                'Nature' => $propriete->nature,
                'Vocation' => $propriete->vocation,
                'Situation' => $propriete->situation,
                'Fokotany' => $dossier->fokontany,
                'Tcommune' => $dossier->type_commune,
                'Commune' => $dossier->commune,
                'Propriete_mere' => Str::upper($this->getOrDefault($propriete->propriete_mere, 'NON RENSEIGNÉE')),
                'Titre_mere' => $this->getOrDefault($propriete->titre_mere, 'N/A'),
                'Titre' => $propriete->titre,
                'Date_descente' => $dateDescente,
                'Requisition' => $dateRequisition,
                'DateDepot1' => $dateDepot1,
                'DateDepot2' => $dateDepot2,
                'DateApprobation' => $dateApprobation,
                'DepVolInscription' => $depVolInscription,
                'DepVolRequisition' => $depVolRequisition,
                'Dep_vol' => $this->formatDepVol($propriete->dep_vol, $propriete->numero_dep_vol),
                'Proprietaire' => Str::upper($propriete->proprietaire),
                'Province' => $locationData['province'],
                'Region' => $locationData['region'],
                'District' => $locationData['district'],
                'DISTRICT' => $locationData['DISTRICT'],
                'NumeroQuittance' => $numeroQuittance,
                'DateQuittance' => $dateQuittance,
            ], $articles));

            $premierDemandeur = $tousLesDemandeurs->first()->demandeur;
            $fileName = 'ADV_CONSORTS_' . uniqid() . '_' . Str::slug($premierDemandeur->nom_demandeur) . '.docx';
        }

        $filePath = sys_get_temp_dir() . '/' . $fileName;
        $modele->saveAs($filePath);

        Log::info('✅ Document ADV créé', [
            'path' => $filePath,
            'size' => filesize($filePath),
        ]);

        return $filePath;
    }

    // Méthodes helper identiques...
    private function buildDemandeurData($demandeur): array
    {
        return [
            'Titre_long' => $demandeur->titre_demandeur,
            'Nom' => $demandeur->nom_demandeur,
            'Prenom' => $demandeur->prenom_demandeur ?? '',
            'Occupation' => $demandeur->occupation,
            'Date_naissance' => $this->formatDateDocument(Carbon::parse($demandeur->date_naissance)),
            'Lieu_naissance' => $demandeur->lieu_naissance,
            'Cin' => $this->formatCin($demandeur->cin),
            'Date_delivrance' => $this->formatDateDocument(Carbon::parse($demandeur->date_delivrance)),
            'Lieu_delivrance' => $demandeur->lieu_delivrance,
            'Domiciliation' => $demandeur->domiciliation,
            'Nationalite' => $demandeur->nationalite,
            'Date_mariage' => $demandeur->date_mariage 
                ? 'le ' . $this->formatDateDocument(Carbon::parse($demandeur->date_mariage)) 
                : '',
            'Lieu_mariage' => $demandeur->lieu_mariage ? ' à ' . $demandeur->lieu_mariage . ', ' : '',
            'Nom_mere' => $demandeur->nom_mere,
            'Nom_pere' => $this->formatNomParents($demandeur->nom_pere, $demandeur->nom_mere),
            'EnfantDe' => $this->getEnfantDe($demandeur->sexe),
            'Demandeur' => $this->getDemandeurPreposition($demandeur->sexe),
            'Marie_a' => $this->getMarieA(
                $demandeur->marie_a,
                $demandeur->sexe,
                $demandeur->date_mariage ? Carbon::parse($demandeur->date_mariage) : null,
                $demandeur->lieu_mariage
            ),
        ];
    }

    private function buildDemandeurDataWithIndex($demandeur, int $index): array
    {
        $data = $this->buildDemandeurData($demandeur);
        $indexedData = [];

        foreach ($data as $key => $value) {
            $indexedData[$key . '#' . $index] = $value;
        }

        $indexedData['Numero#' . $index] = $index;
        $indexedData['ET#' . $index] = ($index == 1) ? 'ET - ' : '';

        return $indexedData;
    }
}