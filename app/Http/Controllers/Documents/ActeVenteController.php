<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\Demander;
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

class ActeVenteController extends Controller
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

            // ✅ MODIFICATION : Récupérer le document reçu
            $documentRecu = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
                ->where('id_propriete', $request->id_propriete)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            if (!$documentRecu) {
                return back()->withErrors([
                    'error' => 'Vous devez d\'abord générer le reçu de paiement.'
                ]);
            }

            $documentExistant = DocumentGenere::where('type_document', DocumentGenere::TYPE_ADV)
                ->where('id_propriete', $request->id_propriete)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->first();

            if ($documentExistant && $documentExistant->fileExists()) {
                return $this->downloadExisting($documentExistant, 'acte de vente');
            }

            // ✅ MODIFICATION : Passer le reçu à la méthode
            return $this->createNewActeVente($propriete, $request->id_demandeur, $documentRecu);

        } catch (\Exception $e) {
            Log::error('❌ Erreur génération ADV', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function download($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);

            if ($document->type_document !== DocumentGenere::TYPE_ADV) {
                return back()->withErrors(['error' => 'Ce document n\'est pas un acte de vente']);
            }

            return $this->downloadExisting($document, 'acte de vente');

        } catch (\Exception $e) {
            Log::error('❌ Erreur téléchargement ADV', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            return back()->withErrors(['error' => 'Impossible de télécharger: ' . $e->getMessage()]);
        }
    }

    // ✅ MODIFICATION : Ajouter paramètre $documentRecu
    private function createNewActeVente(Propriete $propriete, int $idDemandeur, DocumentGenere $documentRecu)
    {
        DB::beginTransaction();

        try {
            $existingDoc = DocumentGenere::where('type_document', DocumentGenere::TYPE_ADV)
                ->where('id_propriete', $propriete->id)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->lockForUpdate()
                ->first();

            if ($existingDoc) {
                DB::rollBack();
                return $this->downloadExisting($existingDoc, 'acte de vente');
            }

            $tousLesDemandeurs = $propriete->demandesActives()
                ->with('demandeur')
                ->orderBy('ordre', 'asc')
                ->get();

            if ($tousLesDemandeurs->isEmpty()) {
                throw new \Exception("Aucun demandeur actif trouvé pour cette propriété");
            }

            $hasConsorts = $tousLesDemandeurs->count() > 1;
            $demandeurPrincipal = $tousLesDemandeurs->firstWhere('id_demandeur', $idDemandeur);

            if (!$demandeurPrincipal) {
                throw new \Exception("Demandeur principal introuvable");
            }

            if ($hasConsorts) {
                $errors = $this->validateConsortsData($tousLesDemandeurs);
            } else {
                $errors = $this->validateActeVenteData($propriete, $demandeurPrincipal->demandeur);
            }

            $this->validateOrThrow($errors);

            // ✅ MODIFICATION : Passer le reçu au template
            $tempFilePath = $this->createActeVenteDocument($propriete, $tousLesDemandeurs, $hasConsorts, $documentRecu);

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
                'generated_by' => Auth::id(),
                'generated_at' => now(),
                'status' => DocumentGenere::STATUS_ACTIVE,
            ]);

            DB::commit();

            ActivityLogger::logDocumentGeneration(ActivityLog::DOC_ACTE_VENTE, $document->id, [
                'lot' => $propriete->lot,
                'has_consorts' => $hasConsorts,
                'nb_demandeurs' => $tousLesDemandeurs->count(),
            ]);

            return response()->download($tempFilePath, $nomFichier)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur création ADV', [
                'error' => $e->getMessage(),
                'propriete_id' => $propriete->id,
            ]);
            throw $e;
        }
    }

    // ✅ MODIFICATION : Ajouter paramètre $documentRecu
    private function createActeVenteDocument(
        Propriete $propriete, 
        $tousLesDemandeurs, 
        bool $hasConsorts,
        DocumentGenere $documentRecu
    ): string {
        Carbon::setLocale('fr');
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);

        $dossier = $propriete->dossier;
        $type_operation = $propriete->type_operation;

        $prix = $this->getPrixFromDistrict($propriete);
        $prixLettre = $this->formatMontantEnLettres($prix);
        $prixTotal = $prix * $propriete->contenance;
        $totalLettre = $this->formatMontantEnLettres($prixTotal);

        $contenanceData = $this->formatContenance((int) $propriete->contenance);

        $locationData = $this->getLocationData($propriete);
        $articles = $this->getArticles($locationData['district'], $dossier->commune);

        $dateDescente = $this->formatPeriodeDates(
            Carbon::parse($dossier->date_descente_debut),
            Carbon::parse($dossier->date_descente_fin)
        );
        $dateRequisition = $this->formatDateDocument($propriete->date_requisition ? Carbon::parse($propriete->date_requisition) : null);
        $dateInscription = $this->formatDateDocument($propriete->date_inscription ? Carbon::parse($propriete->date_inscription) : null);

        // ✅ AJOUT : Données du reçu
        $numeroQuittance = $documentRecu->numero_document ?? 'N/A';
        $dateQuittance = $documentRecu->date_document 
            ? $this->formatDateDocument(Carbon::parse($documentRecu->date_document))
            : 'N/A';

        if (!$hasConsorts) {
            // SANS CONSORT
            $demandeur = $tousLesDemandeurs->first()->demandeur;

            $templatePath = $type_operation == 'morcellement'
                ? storage_path('app/public/modele_odoc/sans_consort/morcellement.docx')
                : storage_path('app/public/modele_odoc/sans_consort/immatriculation.docx');

            if (!file_exists($templatePath)) {
                throw new \Exception("Template ADV sans consort introuvable");
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
                'Requisition' => $dateRequisition ?: 'Non renseignée',
                'Inscription' => $dateInscription ?: 'Non renseignée',
                'Dep_vol' => $this->formatDepVol($propriete->dep_vol, $propriete->numero_dep_vol),
                'Proprietaire' => Str::upper($propriete->proprietaire),
                'Province' => $locationData['province'],
                'Region' => $locationData['region'],
                'District' => $locationData['district'],
                'DISTRICT' => $locationData['DISTRICT'],
                // ✅ AJOUT : Variables quittance
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
                throw new \Exception("Template ADV avec consorts introuvable");
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
                'Requisition' => $dateRequisition ?: 'Non renseignée',
                'Inscription' => $dateInscription ?: 'Non renseignée',
                'Dep_vol' => $this->formatDepVol($propriete->dep_vol, $propriete->numero_dep_vol),
                'Proprietaire' => Str::upper($propriete->proprietaire),
                'Province' => $locationData['province'],
                'Region' => $locationData['region'],
                'District' => $locationData['district'],
                'DISTRICT' => $locationData['DISTRICT'],
                // ✅ AJOUT : Variables quittance
                'NumeroQuittance' => $numeroQuittance,
                'DateQuittance' => $dateQuittance,
            ], $articles));

            $premierDemandeur = $tousLesDemandeurs->first()->demandeur;
            $fileName = 'ADV_CONSORTS_' . uniqid() . '_' . Str::slug($premierDemandeur->nom_demandeur) . '.docx';
        }

        $filePath = sys_get_temp_dir() . '/' . $fileName;
        $modele->saveAs($filePath);

        return $filePath;
    }

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
            'Date_mariage' => $demandeur->date_mariage ? 'le ' . $this->formatDateDocument(Carbon::parse($demandeur->date_mariage)) : '',
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

    public function regenerate($id)
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

            return response()->json([
                'success' => false,
                'error' => 'regeneration_not_supported',
                'message' => 'Les Actes de Vente nécessitent une validation manuelle en raison des consorts',
                'details' => 'Veuillez générer un nouvel acte depuis l\'interface principale',
            ], 400);

        } catch (\Exception $e) {
            Log::error('❌ Erreur régénération ADV', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'regeneration_error',
                'message' => 'Erreur lors de la tentative de régénération',
            ], 500);
        }
    }
}