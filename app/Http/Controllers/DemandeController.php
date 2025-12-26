<?php

namespace App\Http\Controllers;

use App\Models\Consort;
use App\Models\DemandeConsort;
use App\Models\Demander;
use App\Models\Demandeur;
use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\UserCSF;
use App\Models\UserDemande;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use NumberFormatter;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpWord\TemplateProcessor;
use App\Services\PrixCalculatorService;
use App\Services\ActivityLogger;
use App\Models\ActivityLog;



class DemandeController extends Controller
{
    public function index(Request $request, $dossierId)
    {
        $dossier = Dossier::findOrFail($dossierId);

        // Récupérer toutes les demandes actives du dossier
        $query = Demander::with([
            'demandeur', 
            'propriete' => function($q) {
                $q->select('id', 'lot', 'titre', 'contenance', 'nature', 'vocation', 'id_dossier')
                ->with('dossier:id,nom_dossier,is_closed');
            }
        ])
        ->where('status', 'active')
        ->whereHas('propriete', fn($q) => $q->where('id_dossier', $dossier->id))
        ->orderBy('id_propriete')
        ->orderBy('ordre');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('propriete', fn($sub) =>
                    $sub->where('lot', 'ilike', "%{$search}%")
                        ->orWhere('titre', 'ilike', "%{$search}%")
                )
                ->orWhereHas('demandeur', fn($sub) =>
                    $sub->where('nom_demandeur', 'ilike', "%{$search}%")
                        ->orWhere('prenom_demandeur', 'ilike', "%{$search}%")
                        ->orWhere('cin', 'like', "%{$search}%")
                );
            });
        }

        $demandes = $query->get();

        // Grouper par propriété
        $documentsGroupes = $demandes->groupBy('id_propriete')->map(function ($groupe) {
            $premiere = $groupe->first();
            
            return [
                'id' => $premiere->id,
                'id_propriete' => $premiere->id_propriete,
                'propriete' => $premiere->propriete,
                'demandeurs' => $groupe->map(function ($demande) {
                    return [
                        'id' => $demande->id,
                        'id_demandeur' => $demande->id_demandeur,
                        'demandeur' => $demande->demandeur,
                        'total_prix' => $demande->total_prix,
                        'status_consort' => $demande->status_consort,
                        'status' => $demande->status,
                    ];
                })->values(),
                'demandeur' => $premiere->demandeur,
                'total_prix' => $premiere->total_prix,
                'status_consort' => $groupe->count() > 1,
                'status' => $premiere->status,
                'nombre_demandeurs' => $groupe->count(),
            ];
        })->values();

        // Pagination manuelle
        $page = $request->get('page', 1);
        $perPage = 20;
        $total = $documentsGroupes->count();
        $lastPage = ceil($total / $perPage);
        
        $paginatedData = $documentsGroupes->slice(($page - 1) * $perPage, $perPage)->values();

        $documents = [
            'data' => $paginatedData,
            'current_page' => $page,
            'last_page' => $lastPage,
            'per_page' => $perPage,
            'total' => $total,
            'from' => ($page - 1) * $perPage + 1,
            'to' => min($page * $perPage, $total),
        ];
        
        return Inertia::render('documents/index', [
            'dossier' => $dossier,
            'documents' => $documents,
        ]);
    }

    public function create($id)
    {
        $dossier = Dossier::find($id);
        $demandeurs = $dossier->demandeurs->toArray();
        
        // propriétés disponibles = sans demandes actives
        return Inertia::render('documents/create',[
            'proprietes' => Propriete::where('id_dossier', $dossier->id)
                ->whereDoesntHave('demandesActives')
                ->get(),
            'demandeurs' => $demandeurs,
            'dossier' => $dossier,
        ]);
    }

    public function exportList($id)
    {
        $dossier = Dossier::find($id);
        $demandes = Demander::with(['demandeur', 'propriete'])
            ->whereHas('propriete', function ($q) use ($dossier) {
                $q->where('id_dossier', $dossier->id);
            })
            ->where('status', 'active')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->setCellValue('A1', 'Lot');
        $sheet->setCellValue('B1', 'Demandeur');
        $sheet->setCellValue('C1', 'lieu Dite');
        $sheet->setCellValue('D1', 'fokontany');
        $sheet->setCellValue('E1', 'Nom Propriete');
        $sheet->setCellValue('F1', 'Nature');
        $sheet->setCellValue('G1', 'Superficie');
        $sheet->setCellValue('H1', 'PT');

        $row = 2;
        foreach ($demandes as $demande) {
            $sheet->setCellValue("A{$row}", $demande->propriete->lot);
            $sheet->setCellValue("B{$row}", $demande->demandeur->nom_demandeur . " " . $demande->demandeur->prenom_demandeur);
            $sheet->setCellValue("C{$row}", $demande->propriete->situation);
            $sheet->setCellValue("D{$row}", $dossier->fokontany);
            $sheet->setCellValue("E{$row}", $demande->propriete->proprietaire);
            $sheet->setCellValue("F{$row}", $demande->propriete->nature);
            $sheet->setCellValue("G{$row}",$demande->propriete->contenance);
            $sheet->setCellValue("H{$row}",$demande->total_prix);
            $row++;
        }
        $writer = new Xlsx($spreadsheet);
        $fileName = 'listes.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $fileName);
    }

    /**
     * Normalise le nom de la vocation pour correspondre aux colonnes de districts
     */
    // private function normalizeVocation(string $vocation): string
    // {
    //     $mapping = [
    //         'Edilitaire' => 'edilitaire',
    //         'Agricole' => 'agricole',
    //         'Forestière' => 'forestiere',
    //         'Forestiere' => 'forestiere',
    //         'Touristique' => 'touristique',
    //     ];

    //     return $mapping[$vocation] ?? strtolower($vocation);
    // }

    /*
     * MÉTHODE STORE SIMPLIFIÉE
     */
    public function store(Request $request)
    {
        $validate = $request->validate([
            'id_dossier' => 'required|exists:dossiers,id',
            'propriete_id' => 'required|exists:proprietes,id',
            'demandeur_id' => 'required|exists:demandeurs,id',
            'consort' => 'array|nullable',
            'consort.*' => 'exists:demandeurs,id',
        ]);

        try {
            DB::beginTransaction();

            $dossier = Dossier::findOrFail($validate['id_dossier']);
            $propriete = Propriete::findOrFail($validate['propriete_id']);

            // Vérifier que le prix peut être calculé AVANT de créer
            try {
                PrixCalculatorService::calculerPrixTotal($propriete);
            } catch (\Exception $e) {
                DB::rollBack();
                return back()->withErrors([
                    'error' => "Impossible de créer la demande : {$e->getMessage()}"
                ]);
            }

            $document = Demander::create([
                'id_demandeur' => $validate['demandeur_id'],
                'id_propriete' => $validate['propriete_id'],
                'id_user' => Auth::id(),
                'status' => 'active',
                'status_consort' => !empty($validate['consort']),
            ]);


            // Gestion des consorts
            if (!empty($validate['consort'])) {
                foreach ($validate['consort'] as $id_consort) {
                    $consort = Consort::firstOrCreate([
                        'id_demandeur' => $validate['demandeur_id'],
                        'id_consort' => $id_consort,
                    ]);

                    DemandeConsort::create([
                        'id_consort' => $consort->id,
                        'id_demande' => $document->id,
                    ]);
                }
            }

            DB::commit();

            ActivityLogger::logCreation(
                ActivityLog::ENTITY_DOCUMENT,
                $document->id,
                [
                    'propriete_id' => $document->id_propriete,
                    'demandeur_id' => $document->id_demandeur,
                    'lot' => $propriete->lot,
                    'titre' => $propriete->titre,
                    'total_prix' => $document->total_prix,
                    'has_consorts' => !empty($validated['consort']),
                    'id_district' => $propriete->dossier->id_district,
                ]
            );

            // Log::info('Demande créée avec succès', [
            //     'demande_id' => $document->id,
            //     'prix_final' => $document->total_prix
            // ]);

            return redirect()->route('dossiers.list', $dossier->id)
                ->with('message', 'Document créé avec succès!');

        } catch (\Exception $exception) {
            DB::rollBack();
            
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    /**
     * ✅ VÉRIFICATION : date_approbation_acte OBLIGATOIRE avant génération
     */
    public function download($id)
    {
        Carbon::setLocale('fr');
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);

        try {
            $demande = Demander::with(['demandeur', 'propriete.dossier'])->findOrFail($id);
            
            $demandeur = $demande->demandeur;
            $propriete = $demande->propriete;
            $dossier = $propriete->dossier;

            // ✅ VALIDATION : date_approbation_acte OBLIGATOIRE
            if (!$propriete->date_approbation_acte) {
                return back()->withErrors([
                    'error' => "Impossible de générer le document : la date d'approbation de l'acte est obligatoire pour la propriété Lot {$propriete->lot}."
                ]);
            }

            // ✅ VALIDATION : date_approbation_acte >= date_requisition
            if ($propriete->date_requisition && $propriete->date_approbation_acte < $propriete->date_requisition) {
                return back()->withErrors([
                    'error' => "Erreur de cohérence : la date d'approbation ({$propriete->date_approbation_acte->format('d/m/Y')}) est antérieure à la date de réquisition ({$propriete->date_requisition->format('d/m/Y')})."
                ]);
            }

            // Calcul du prix
            try {
                $prix = PrixCalculatorService::getPrixUnitaire($propriete);
            } catch (\Exception $e) {
                return back()->withErrors([
                    'error' => "Prix introuvable : {$e->getMessage()}"
                ]);
            }

            $prixLettre = Str::upper(ucfirst($formatter->format($prix)));
            $prixTotal = $demande->total_prix;
            $superficie = $propriete->contenance;

            // Calcul contenance en Ha A Ca
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

            // Récupération des informations géographiques
            $place = DB::table('dossiers')
                ->join('districts', 'districts.id', '=', 'dossiers.id_district')
                ->join('regions', 'regions.id', '=', 'districts.id_region')
                ->join('provinces', 'provinces.id', '=', 'regions.id_province')
                ->where('dossiers.id', $dossier->id)
                ->select('provinces.nom_province', 'regions.nom_region', 'districts.nom_district')
                ->first();

            $firstLetterDistrict = strtolower(mb_substr($place->nom_district, 0, 1));
            $firstLetterCommune = strtolower(mb_substr($dossier->commune, 0, 1));

            // Enregistrer l'action
            UserDemande::create([
                'id_user' => Auth::id(),
                'id_demande' => $demande->id,
            ]);

            $type_operation = $propriete->type_operation;

            // ✅ FORMATAGE DES DATES POUR LE DOCUMENT
            $dateRequisition = $propriete->date_requisition 
                ? Carbon::parse($propriete->date_requisition)->translatedFormat('d F Y') 
                : '';
            
            $dateDepot1 = $propriete->date_depot_1 
                ? Carbon::parse($propriete->date_depot_1)->translatedFormat('d F Y') 
                : '';
            
            $dateDepot2 = $propriete->date_depot_2 
                ? Carbon::parse($propriete->date_depot_2)->translatedFormat('d F Y') 
                : '';
            
            $dateApprobation = Carbon::parse($propriete->date_approbation_acte)->translatedFormat('d F Y');

            // GÉNÉRATION DU DOCUMENT
            if ($demande->status_consort == false) {
                // SANS CONSORT
                $templatePath = $type_operation == 'morcellement' 
                    ? 'app/public/modele_odoc/sans_consort/morcellement.docx'
                    : 'app/public/modele_odoc/sans_consort/immatriculation.docx';
                    
                $modele_odoc = new TemplateProcessor(storage_path($templatePath));

                $dateNaissance = Carbon::parse($demandeur->date_naissance)->translatedFormat('d F Y');
                $dateMariage = $demandeur->date_mariage ? Carbon::parse($demandeur->date_mariage)->translatedFormat('d F Y') : '';
                $dateDelivrance = Carbon::parse($demandeur->date_delivrance)->translatedFormat('d F Y');
                $dateDescenteDebut = Carbon::parse($dossier->date_descente_debut)->translatedFormat('d');
                $dateDescenteFin = Carbon::parse($dossier->date_descente_fin)->translatedFormat('d F Y');
                $dateDescente = $dateDescenteDebut . ' au ' . $dateDescenteFin;

                $modele_odoc->setValues([
                    // Demandeur
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
                    
                    // Prix
                    'ContenanceFormatLettre' => $contenanceFormatLettre,
                    'ContenanceFormat' => $contenanceFormat,
                    'Prix' => $prixLettre,
                    'PrixTotal' => number_format($prixTotal, 0, ',', '.'),
                    'TotalLettre' => $totalLettre,
                    'PrixCarre' => number_format($prix, 0, ',', '.'),
                    
                    // Propriété
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
                    
                    // ✅ DATES MISES À JOUR
                    'DateRequisition' => $dateRequisition,
                    'DateDepot1' => $dateDepot1,
                    'DateDepot2' => $dateDepot2,
                    'DateApprobation' => $dateApprobation,
                    
                    // Dep/Vol
                    'DepVolInscription' => $propriete->dep_vol_inscription_complet ?? '',
                    'DepVolRequisition' => $propriete->dep_vol_requisition_complet ?? '',
                    
                    // Localisation
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

                $fileName = 'ACTE_DE_VENTE_' . uniqid() . '_' . $demandeur->nom_demandeur . '.docx';
                $filePath = sys_get_temp_dir() . '/' . $fileName;
                
                $modele_odoc->saveAs($filePath);
                return response()->download($filePath)->deleteFileAfterSend(true);
                
            } else {
                // AVEC CONSORT
                $templatePath = $type_operation == 'morcellement' 
                    ? 'app/public/modele_odoc/avec_consort/morcellement.docx'
                    : 'app/public/modele_odoc/avec_consort/immatriculation.docx';
                    
                $modele_odoc = new TemplateProcessor(storage_path($templatePath));

                // Récupération des consorts
                $consorts = $demande->consorts()->pluck('consorts.id_consort')->toArray();
                array_unshift($consorts, $demande->id_demandeur);

                $modele_odoc->cloneBlock('consort_block_1', count($consorts), true, true);
                $modele_odoc->cloneBlock('consort_block_2', count($consorts), true, true);

                foreach ($consorts as $key => $consort_id) {
                    $n = $key + 1;
                    $dmdr = Demandeur::findOrFail($consort_id);

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

                // Valeurs communes
                $dateDescenteDebut = Carbon::parse($dossier->date_descente_debut)->translatedFormat('d');
                $dateDescenteFin = Carbon::parse($dossier->date_descente_fin)->translatedFormat('d F Y');
                $dateDescente = $dateDescenteDebut . ' au ' . $dateDescenteFin;
                
                $dateRequisition = $propriete->date_requisition ? Carbon::parse($propriete->date_requisition)->translatedFormat('d F Y') : '';
                $dateInscription = $propriete->date_inscription ? Carbon::parse($propriete->date_inscription)->translatedFormat('d F Y') : '';

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

                $fileName = 'ACTE_DE_VENTE_CONSORTS_' . uniqid() . '_' . $demandeur->nom_demandeur . '.docx';
                $filePath = sys_get_temp_dir() . '/' . $fileName;
                
                $modele_odoc->saveAs($filePath);
                return response()->download($filePath)->deleteFileAfterSend(true);
            }
            
        } catch (\Exception $e) {
            Log::error('Erreur génération document', [
                'demande_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['error' => 'Erreur lors de la génération: ' . $e->getMessage()]);
        }
    }

    public function archive(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|exists:demander,id',
            'id_dossier' => 'required|exists:dossiers,id',
        ]);

        try {
            DB::beginTransaction();

            $demande = Demander::findOrFail($validated['id']);
            
            $demande->status = 'archive';
            $demande->save();

            DB::commit();

            ActivityLogger::logArchive(
                ActivityLog::ENTITY_DOCUMENT,
                $demande->id,
                [
                    'propriete_id' => $demande->id_propriete,
                    'lot' => $demande->propriete->lot,
                    'id_district' => $demande->propriete->dossier->id_district,
                ]
            );

            // Log::info('Document archivé', [
            //     'demande_id' => $demande->id,
            //     'propriete_id' => $demande->id_propriete,
            // ]);

            return redirect()
                ->route('dossiers.list', $validated['id_dossier'])
                ->with('success', 'Document archivé avec succès');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Erreur lors de l\'archivage : ' . $e->getMessage());
        }
    }

    public function downloadCSF($id)
    {
        $demande = Demander::with(['demandeur', 'propriete.dossier'])->findOrFail($id);
        
        $demandeur = $demande->demandeur;
        $propriete = $demande->propriete;
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
        
        UserCSF::create([
            'id_user' => Auth::id(),
            'id_demande' => $demande->id,
        ]);

        return response()->download($filePath)->deleteFileAfterSend(true);
    }

    

    public function unarchive(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|exists:demander,id',
            'id_dossier' => 'required|exists:dossiers,id',
        ]);

        try {
            DB::beginTransaction();

            $demande = Demander::findOrFail($validated['id']);
            
            // Réactiver la demande
            $demande->status = 'active';
            $demande->save();

            DB::commit();

            ActivityLogger::logUnarchive(
                ActivityLog::ENTITY_DOCUMENT,
                $demande->id,
                [
                    'propriete_id' => $demande->id_propriete,
                    'lot' => $demande->propriete->lot,
                    'id_district' => $demande->propriete->dossier->id_district,
                ]
            );

            // Log::info('Document désarchivé', [
            //     'demande_id' => $demande->id,
            //     'propriete_id' => $demande->id_propriete
            // ]);

            return redirect()
                ->route('dossiers.list', $validated['id_dossier'])
                ->with('success', 'Document désarchivé avec succès');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Erreur lors de la désarchivation : ' . $e->getMessage());
        }
    }



    /**
     * ✅ CORRECTION 2 : Inclure date_demande dans le groupement
     */
    private function groupeDemandes($demandes)
    {
        return $demandes->groupBy('id_propriete')->map(function ($groupe) {
            // Trier par ordre
            $groupeTrie = $groupe->sortBy(function($demande) {
                return $demande->ordre ?? 999;
            })->values();
            
            $premiere = $groupeTrie->first();
            
            // VALIDATION : S'assurer que la propriété existe
            if (!$premiere || !$premiere->propriete) {
                return null;
            }
            
            // MAPPER tous les demandeurs avec validation
            $tousLesDemandeurs = $groupeTrie->map(function ($demande, $index) {
                if (!$demande->demandeur) {
                    return null;
                }
                
                $demandeur = $demande->demandeur;
                $isIncomplete = !$demandeur->date_naissance ||
                            !$demandeur->lieu_naissance ||
                            !$demandeur->date_delivrance ||
                            !$demandeur->lieu_delivrance ||
                            !$demandeur->domiciliation ||
                            !$demandeur->occupation ||
                            !$demandeur->nom_mere;
                
                return [
                    'id' => $demande->id,
                    'id_demandeur' => $demande->id_demandeur,
                    'demandeur' => $demandeur,
                    'total_prix' => $demande->total_prix,
                    'status_consort' => $demande->status_consort,
                    'status' => $demande->status,
                    'ordre' => $demande->ordre ?? ($index + 1),
                    'is_principal' => ($demande->ordre ?? ($index + 1)) === 1,
                    'is_incomplete' => $isIncomplete,
                ];
            })->filter()->values();
            
            if ($tousLesDemandeurs->isEmpty()) {
                return null;
            }
            
            return [
                'id' => $premiere->id,
                'id_propriete' => $premiere->id_propriete,
                'propriete' => $premiere->propriete,
                'demandeurs' => $tousLesDemandeurs,
                'demandeur' => $tousLesDemandeurs->first()['demandeur'] ?? null,
                'date_demande' => $premiere->date_demande, // ✅ AJOUTÉ
                'total_prix' => $premiere->total_prix,
                'status_consort' => $groupe->count() > 1,
                'status' => $premiere->status,
                'nombre_demandeurs' => $tousLesDemandeurs->count(),
                'created_at' => $premiere->created_at, // ✅ AJOUTÉ pour tri
            ];
        })
        ->filter()
        ->values();
    }

    /**
     * ✅ CORRECTION 3 : Méthode list() aussi
     */
    public function list(Request $request, $dossierId)
    {
        $dossier = Dossier::findOrFail($dossierId);

        $query = Demander::with([
            'demandeur',
            'propriete.demandes.demandeur'
        ])
        ->select('id', 'id_demandeur', 'id_propriete', 'date_demande', 'total_prix', 'status', 'status_consort', 'ordre', 'created_at')
        ->whereHas('propriete', fn($q) => $q->where('id_dossier', $dossier->id));

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('propriete', fn($sub) =>
                    $sub->where('lot', 'ilike', "%{$search}%")
                        ->orWhere('titre', 'ilike', "%{$search}%")
                )
                ->orWhereHas('demandeur', fn($sub) =>
                    $sub->where('nom_demandeur', 'ilike', "%{$search}%")
                        ->orWhere('prenom_demandeur', 'ilike', "%{$search}%")
                        ->orWhere('cin', 'like', "%{$search}%")
                );
            });
        }

        $demandes = $query->get();
        $documentsGroupes = $this->groupeDemandes($demandes);

        // Pagination
        $page = $request->get('page', 1);
        $perPage = 20;
        $total = $documentsGroupes->count();
        $lastPage = ceil($total / $perPage);
        
        $paginatedData = $documentsGroupes->slice(($page - 1) * $perPage, $perPage)->values();

        $documents = [
            'data' => $paginatedData,
            'current_page' => (int) $page,
            'last_page' => (int) $lastPage,
            'per_page' => $perPage,
            'total' => $total,
            'from' => ($page - 1) * $perPage + 1,
            'to' => min($page * $perPage, $total),
        ];

        return Inertia::render('documents/index', [
            'dossier' => $dossier,
            'documents' => $documents,
        ]);
    }

    /**
     * ✅ CORRECTION PRINCIPALE : Charger les demandeurs complets dans propriete.demandes
     */
    public function resume(Request $request, $dossierId)
    {
        // ✅ CORRECTION : Préfixer TOUTES les colonnes avec le nom de la table
        $dossier = Dossier::with([
            'proprietes' => function($q) {
                $q->select(
                    'proprietes.id',           // ✅ Préfixe ajouté
                    'proprietes.lot', 
                    'proprietes.titre', 
                    'proprietes.contenance', 
                    'proprietes.nature', 
                    'proprietes.vocation', 
                    'proprietes.situation', 
                    'proprietes.proprietaire', 
                    'proprietes.id_dossier', 
                    'proprietes.date_requisition', 
                    'proprietes.date_depot_1', 
                    'proprietes.date_depot_2', 
                    'proprietes.date_approbation_acte',
                    'proprietes.dep_vol_inscription', 
                    'proprietes.numero_dep_vol_inscription',
                    'proprietes.dep_vol_requisition', 
                    'proprietes.numero_dep_vol_requisition',
                    'proprietes.numero_FN', 
                    'proprietes.numero_requisition'
                )
                ->with([
                    'demandes' => function($subq) {
                        $subq->select(
                            'demander.id',          // ✅ Préfixe ajouté
                            'demander.id_propriete', 
                            'demander.id_demandeur', 
                            'demander.date_demande', 
                            'demander.status', 
                            'demander.ordre', 
                            'demander.total_prix', 
                            'demander.status_consort',
                            'demander.created_at'
                        )
                        ->with([
                            'demandeur' => function($demQ) {
                                $demQ->select(
                                    'demandeurs.id',           // ✅ Préfixe ajouté
                                    'demandeurs.titre_demandeur', 
                                    'demandeurs.nom_demandeur', 
                                    'demandeurs.prenom_demandeur', 
                                    'demandeurs.cin', 
                                    'demandeurs.domiciliation', 
                                    'demandeurs.telephone', 
                                    'demandeurs.date_naissance', 
                                    'demandeurs.lieu_naissance',
                                    'demandeurs.sexe', 
                                    'demandeurs.occupation', 
                                    'demandeurs.nationalite', 
                                    'demandeurs.situation_familiale', 
                                    'demandeurs.nom_pere', 
                                    'demandeurs.nom_mere'
                                );
                            }
                        ])
                        ->orderBy('demander.ordre');  // ✅ Préfixe ajouté
                    }
                ]);
            },
            
            // ✅ CORRECTION CRITIQUE : Préfixer TOUTES les colonnes dans demandeurs
            'demandeurs' => function($q) {
                $q->select(
                    'demandeurs.id',                    // ✅ FIX PRINCIPAL
                    'demandeurs.titre_demandeur', 
                    'demandeurs.nom_demandeur', 
                    'demandeurs.prenom_demandeur', 
                    'demandeurs.cin', 
                    'demandeurs.date_naissance', 
                    'demandeurs.lieu_naissance', 
                    'demandeurs.date_delivrance', 
                    'demandeurs.lieu_delivrance',
                    'demandeurs.domiciliation', 
                    'demandeurs.occupation', 
                    'demandeurs.nom_mere', 
                    'demandeurs.telephone',
                    'demandeurs.sexe', 
                    'demandeurs.nationalite', 
                    'demandeurs.situation_familiale', 
                    'demandeurs.regime_matrimoniale', 
                    'demandeurs.marie_a', 
                    'demandeurs.date_mariage',
                    'demandeurs.lieu_mariage', 
                    'demandeurs.nom_pere'
                );
            }
        ])->findOrFail($dossierId);

        // ✅ CORRECTION : Query principale avec préfixes
        $query = Demander::with([
            'demandeur' => function($q) {
                $q->select(
                    'demandeurs.id',                // ✅ Préfixe ajouté
                    'demandeurs.titre_demandeur', 
                    'demandeurs.nom_demandeur', 
                    'demandeurs.prenom_demandeur', 
                    'demandeurs.cin', 
                    'demandeurs.date_naissance', 
                    'demandeurs.lieu_naissance', 
                    'demandeurs.date_delivrance', 
                    'demandeurs.lieu_delivrance',
                    'demandeurs.domiciliation', 
                    'demandeurs.occupation', 
                    'demandeurs.nom_mere', 
                    'demandeurs.telephone',
                    'demandeurs.sexe', 
                    'demandeurs.nationalite', 
                    'demandeurs.situation_familiale'
                );
            },
            'propriete' => function($q) {
                $q->select(
                    'proprietes.id',                // ✅ Préfixe ajouté
                    'proprietes.lot', 
                    'proprietes.titre', 
                    'proprietes.contenance', 
                    'proprietes.nature', 
                    'proprietes.vocation', 
                    'proprietes.situation', 
                    'proprietes.proprietaire', 
                    'proprietes.id_dossier', 
                    'proprietes.date_requisition', 
                    'proprietes.date_depot_1', 
                    'proprietes.date_depot_2', 
                    'proprietes.date_approbation_acte',
                    'proprietes.dep_vol_inscription',
                    'proprietes.numero_dep_vol_inscription',
                    'proprietes.dep_vol_requisition',
                    'proprietes.numero_dep_vol_requisition',
                    'proprietes.numero_FN', 
                    'proprietes.numero_requisition'
                )
                ->with([
                    'demandes' => function($subq) {
                        $subq->select(
                            'demander.id',          // ✅ Préfixe ajouté
                            'demander.id_propriete', 
                            'demander.id_demandeur', 
                            'demander.date_demande', 
                            'demander.status', 
                            'demander.ordre', 
                            'demander.total_prix', 
                            'demander.status_consort'
                        )
                        ->with([
                            'demandeur' => function($demQ) {
                                $demQ->select(
                                    'demandeurs.id',       // ✅ Préfixe ajouté
                                    'demandeurs.titre_demandeur', 
                                    'demandeurs.nom_demandeur', 
                                    'demandeurs.prenom_demandeur', 
                                    'demandeurs.cin', 
                                    'demandeurs.domiciliation', 
                                    'demandeurs.telephone', 
                                    'demandeurs.sexe'
                                );
                            }
                        ])
                        ->orderBy('demander.ordre');  // ✅ Préfixe ajouté
                    }
                ]);
            }
        ])
        ->select(
            'demander.id',                  // ✅ Préfixe ajouté
            'demander.id_demandeur', 
            'demander.id_propriete', 
            'demander.date_demande', 
            'demander.total_prix', 
            'demander.status', 
            'demander.status_consort', 
            'demander.ordre', 
            'demander.created_at', 
            'demander.updated_at'
        )
        ->whereHas('propriete', fn($q) => $q->where('proprietes.id_dossier', $dossier->id))
        ->orderBy('demander.id_propriete')
        ->orderBy('demander.ordre', 'asc');

        // Filtres (inchangés)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('propriete', fn($sub) =>
                    $sub->where('proprietes.lot', 'ilike', "%{$search}%")
                        ->orWhere('proprietes.titre', 'ilike', "%{$search}%")
                )
                ->orWhereHas('demandeur', fn($sub) =>
                    $sub->where('demandeurs.nom_demandeur', 'ilike', "%{$search}%")
                        ->orWhere('demandeurs.prenom_demandeur', 'ilike', "%{$search}%")
                        ->orWhere('demandeurs.cin', 'like', "%{$search}%")
                );
            });
        }

        if ($request->filled('status')) {
            $query->where('demander.status', $request->status);
        }

        $demandes = $query->get();
        $documentsGroupes = $this->groupeDemandes($demandes);

        // Pagination
        $page = $request->get('page', 1);
        $perPage = 20;
        $total = $documentsGroupes->count();
        $lastPage = ceil($total / $perPage);
        
        $paginatedData = $documentsGroupes->slice(($page - 1) * $perPage, $perPage)->values();

        $documents = [
            'data' => $paginatedData,
            'current_page' => (int) $page,
            'last_page' => (int) $lastPage,
            'per_page' => $perPage,
            'total' => $total,
            'from' => ($page - 1) * $perPage + 1,
            'to' => min($page * $perPage, $total),
        ];

        return Inertia::render('demandes/ResumeDossier', [
            'dossier' => $dossier,
            'documents' => $documents,
        ]);
    }

}