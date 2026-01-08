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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use NumberFormatter;
use PhpOffice\PhpWord\TemplateProcessor;

class ActeVenteController extends Controller
{
    use HandlesDocumentGeneration, ValidatesDocumentData, FormatsDocumentData;

    /**
     * GÉNÉRATION INITIALE - POST avec validation atomique
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
        'date_recu' => 'required|date',
        'notes' => 'nullable|string|max:500',
    ], [
        'numero_recu.required' => 'Le numéro de reçu est obligatoire',
        'numero_recu.regex' => 'Le numéro de reçu doit être au format XXX/XX (ex: 001/25)',
        'date_recu.required' => 'La date du reçu est obligatoire',
    ]);

    DB::beginTransaction();

    try {
        $propriete = Propriete::with('dossier.district')->findOrFail($request->id_propriete);

        // Vérifier si ADV existe déjà (double-check atomique)
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

        // Créer le document
        $result = $this->createNewActeVente(
            $propriete, 
            $request->id_demandeur, 
            $validated['numero_recu'],
            Carbon::parse($validated['date_recu']),
            $validated['notes'] ?? null
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
        
        return response()->json([
            'success' => false,
            'error' => 'generation_error',
            'message' => 'Erreur lors de la génération : ' . $e->getMessage(),
        ], 500);
    }
}

    /**
     * CRÉER UN NOUVEAU ADV (PRIVÉ)
     */
    private function createNewActeVente(
        Propriete $propriete,
        int $idDemandeur,
        string $numeroRecu,
        Carbon $dateRecu,
        ?string $notes
    ) {
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

        // Validation STRICTE
        $errors = $hasConsorts
            ? $this->validateConsortsData($tousLesDemandeurs)
            : $this->validateActeVenteData(
                $propriete,
                $demandeurPrincipal->demandeur,
                $numeroRecu
            );
        
        $this->validateOrThrow($errors);

        // Créer la référence du reçu externe AVEC DATE
        $recuRef = RecuReference::create([
            'id_propriete' => $propriete->id,
            'id_demandeur' => $idDemandeur,
            'id_dossier' => $propriete->id_dossier,
            'numero_recu' => $numeroRecu,
            'montant' => $demandeurPrincipal->total_prix,
            'date_recu' => $dateRecu, // ✅ DATE AJOUTÉE
            'notes' => $notes,
            'created_by' => Auth::id(),
        ]);

        // Créer le document avec le numéro et la date de reçu
        $tempFilePath = $this->createActeVenteDocument(
            $propriete,
            $tousLesDemandeurs,
            $hasConsorts,
            $numeroRecu,
            $dateRecu // ✅ PASSÉE AU TEMPLATE
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
                'recu_date' => $dateRecu->toDateString(), // ✅ MÉTADONNÉE
            ],
        ]);

        ActivityLogger::logDocumentGeneration(ActivityLog::DOC_ACTE_VENTE, $document->id, [
            'lot' => $propriete->lot,
            'has_consorts' => $hasConsorts,
            'nb_demandeurs' => $tousLesDemandeurs->count(),
            'numero_recu' => $numeroRecu,
            'date_recu' => $dateRecu->toDateString(),
        ]);

        return response()->download($tempFilePath, $nomFichier)->deleteFileAfterSend(true);
    }

    /**
     * CRÉER LE DOCUMENT WORD (MODIFIÉ pour date reçu)
     */
    private function createActeVenteDocument(
        Propriete $propriete,
        $tousLesDemandeurs,
        bool $hasConsorts,
        string $numeroRecu,
        Carbon $dateRecu // ✅ PARAMÈTRE AJOUTÉ
    ): string {
   
        Carbon::setLocale('fr');
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);

        $dossier = $propriete->dossier;
        $type_operation = $propriete->type_operation;

        // Calculs de prix
        $prix = $this->getPrixFromDistrict($propriete);
        $prixLettre = $this->formatMontantEnLettres($prix);
        $prixTotal = $prix * $propriete->contenance;
        $totalLettre = $this->formatMontantEnLettres($prixTotal);

        // DONNÉES DU REÇU EXTERNE
        $numeroQuittance = $numeroRecu;
        $dateQuittance = $this->formatDateDocument($dateRecu);
        
        // MONTANT : Utiliser le total_prix du demandeur principal
        $montantRecu = $hasConsorts 
            ? array_sum($tousLesDemandeurs->pluck('total_prix')->toArray())
            : $tousLesDemandeurs->first()->total_prix;
        
        $montantRecuFormate = $this->formatMontantChiffres($montantRecu);

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

        // DONNÉES DU REÇU EXTERNE
        $numeroQuittance = $numeroRecu;
        $dateQuittance = $this->formatDateDocument($dateRecu);

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
                'MontantRecu' => $montantRecuFormate,
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
                'MontantRecu' => $montantRecuFormate,
            ], $articles));

            $premierDemandeur = $tousLesDemandeurs->first()->demandeur;
            $fileName = 'ADV_CONSORTS_' . uniqid() . '_' . Str::slug($premierDemandeur->nom_demandeur) . '.docx';
        }

        $filePath = sys_get_temp_dir() . '/' . $fileName;
        $modele->saveAs($filePath);

        return $filePath;
    }

    // Téléchargement et régénération (INCHANGÉS)
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
            return response()->json([
                'success' => false,
                'error' => 'download_error',
                'message' => 'Impossible de télécharger : ' . $e->getMessage(),
            ], 500);
        }
    }

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

            // Vérifier si de nouvelles données sont fournies
            $request = request();
            
            if ($request->has('numero_recu') && $request->has('date_recu')) {
                // Validation des nouvelles données
                $validated = $request->validate([
                    'numero_recu' => [
                        'required',
                        'string',
                        'max:50',
                        'regex:/^\d{3}\/\d{2}$/',
                    ],
                    'date_recu' => 'required|date',
                    'notes' => 'nullable|string|max:500',
                ]);

                $numeroRecu = $validated['numero_recu'];
                $dateRecu = Carbon::parse($validated['date_recu']);
                $notes = $validated['notes'] ?? null;

                // Mettre à jour la référence du reçu si elle existe
                $recuRef = RecuReference::where('id_propriete', $propriete->id)
                    ->where('numero_recu', $document->numero_recu_externe)
                    ->first();

                if ($recuRef) {
                    $recuRef->update([
                        'numero_recu' => $numeroRecu,
                        'date_recu' => $dateRecu,
                        'notes' => $notes,
                        'updated_by' => Auth::id(),
                    ]);
                }
            } else {
                // Utiliser les données existantes
                $numeroRecu = $document->numero_recu_externe;
                $dateRecu = isset($document->metadata['recu_date'])
                    ? Carbon::parse($document->metadata['recu_date'])
                    : now();
            }

            if (!$numeroRecu) {
                throw new \Exception("Numéro de reçu manquant dans le document");
            }

            $result = $this->regenerateActeVente($document, $propriete, $numeroRecu, $dateRecu);
            
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
            
            return response()->json([
                'success' => false,
                'error' => 'regeneration_error',
                'message' => 'Erreur lors de la régénération : ' . $e->getMessage(),
            ], 500);
        }
    }

    private function regenerateActeVente(
        DocumentGenere $document,
        Propriete $propriete,
        string $numeroRecu,
        Carbon $dateRecu
    ) {
        $tousLesDemandeurs = $propriete->demandesActives()
            ->with('demandeur')
            ->orderBy('ordre', 'asc')
            ->get();

        if ($tousLesDemandeurs->isEmpty()) {
            throw new \Exception("Aucun demandeur actif trouvé");
        }

        $hasConsorts = $tousLesDemandeurs->count() > 1;

        $tempFilePath = $this->createActeVenteDocument(
            $propriete,
            $tousLesDemandeurs,
            $hasConsorts,
            $numeroRecu,
            $dateRecu
        );

        if (!file_exists($tempFilePath)) {
            throw new \Exception("Échec création fichier temporaire");
        }

        $savedPath = $this->saveDocument($tempFilePath, 'ADV', $propriete);

        $document->update([
            'file_path' => $savedPath,
            'metadata' => array_merge($document->metadata ?? [], [
                'recu_numero' => $numeroRecu,
                'recu_date' => $dateRecu->toDateString(),
                'last_regenerated_at' => now()->toIso8601String(),
            ]),
        ]);
        
        $document->incrementRegenerationCount();

        ActivityLogger::logDocumentDownload(ActivityLog::DOC_ACTE_VENTE, $document->id, [
            'action_type' => 'regenerate',
        ]);

        return response()->download($tempFilePath, $document->nom_fichier)->deleteFileAfterSend(true);
    }

    // Méthodes helper (INCHANGÉES)
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

    /**
     * SUPPRESSION D'UN ADV
     */
    public function delete($id)
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

            // Supprimer le fichier physique
            if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
                Storage::disk('public')->delete($document->file_path);
            }

            // Supprimer la référence du reçu
            RecuReference::where('id_propriete', $document->id_propriete)
                ->where('numero_recu', $document->numero_recu_externe)
                ->delete();

            // Logger l'activité avant suppression
            ActivityLogger::logDocumentDeletion(ActivityLog::DOC_ACTE_VENTE, $document->id, [
                'numero_recu' => $document->numero_recu_externe,
                'lot' => $document->propriete->lot ?? 'N/A',
                'deleted_by' => Auth::id(),
            ]);

            // Supprimer le document
            $document->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Document supprimé avec succès',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'error' => 'delete_error',
                'message' => 'Erreur lors de la suppression : ' . $e->getMessage(),
            ], 500);
        }
    }
}