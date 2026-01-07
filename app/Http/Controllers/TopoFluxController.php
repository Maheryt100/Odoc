<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Services\{TopoFluxService, TopoValidationService};
use App\Models\{Dossier, District};

class TopoFluxController extends Controller
{
    public function __construct(
        private TopoFluxService $topoService,
        private TopoValidationService $validationService
    ) {}
    
    // ========================================
    // INDEX - LISTE DES IMPORTS
    // ========================================
    
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Construire les filtres
        $filters = [
            'status' => $request->get('status', 'pending'),
            'entity_type' => $request->get('entity_type'),
            'district_id' => $user->id_district
        ];
        
        // Supprimer les filtres vides
        $filters = array_filter($filters, fn($value) => !is_null($value));
        
        // Récupérer depuis FastAPI
        $data = $this->topoService->getImports($filters);
        
        // ENRICHIR LES IMPORTS AVEC DONNÉES GEODOC
        $enrichedImports = $this->enrichImportsData($data['data'] ?? []);
        
        // Déterminer si FastAPI est disponible
        $fastapiAvailable = !empty($data['data']) || !empty($data['stats']['total']);
        
        return Inertia::render('TopoFlux/Index', [
            'imports' => $enrichedImports,
            'stats' => $data['stats'] ?? $this->getEmptyStats(),
            'filters' => $filters,
            'canValidate' => true,
            'fastapiAvailable' => $fastapiAvailable
        ]);
    }
    
    // ========================================
    // SHOW - DÉTAILS D'UN IMPORT
    // ========================================
    
    public function show(Request $request, int $id)
    {
        $import = $this->topoService->getImport($id);
        
        if (!$import) {
            return back()->with('error', 'Import introuvable. Le service TopoFlux est peut-être indisponible.');
        }
        
        // ENRICHIR AVEC DONNÉES GEODOC
        $enrichedImport = $this->enrichSingleImport($import['import'] ?? []);
        
        return Inertia::render('TopoFlux/Show', [
            'import' => $enrichedImport,
            'files' => $import['files'] ?? [],
            'canValidate' => true
        ]);
    }
    
    // ========================================
    // IMPORT - CRÉER/METTRE À JOUR DANS GEODOC
    // ========================================
    
    public function import(Request $request, int $id)
    {
        $user = $request->user();
        
        // Récupérer l'import depuis FastAPI
        $importData = $this->topoService->getImport($id);
        
        if (!$importData || !isset($importData['import'])) {
            // Essayer le cache de session en cas d'échec
            if (session()->has("cached_import_{$id}")) {
                $importData = session()->get("cached_import_{$id}");
            } else {
                return back()->with('error', 'Impossible de récupérer les données de cet import.');
            }
        }
        
        $import = $importData['import'];
        
        // Trouver le dossier correspondant
        $dossier = Dossier::where('numero_ouverture', $import['numero_ouverture'])
            ->where('id_district', $import['district_id'])
            ->first();
        
        if (!$dossier) {
            return back()->with('error', "Dossier {$import['numero_ouverture']} introuvable dans le district #{$import['district_id']}.");
        }
        
        // Vérifier que le dossier n'est pas fermé
        if ($dossier->is_closed) {
            return back()->with('error', "Le dossier '{$dossier->nom_dossier}' est fermé.");
        }
        
        // Valider avec TopoValidationService
        $validation = $this->validationService->validateImport([
            'id' => $import['id'],
            'entity_type' => $import['entity_type'],
            'raw_data' => $import['raw_data'],
            'dossier_id' => $dossier->id,
            'district_id' => $import['district_id']
        ], $user);
        
        if (!$validation['success'] || !$validation['can_proceed']) {
            
            return back()->with('error', 'Validation échouée : ' . implode(', ', $validation['errors'] ?? []));
        }
 
        $isDuplicate = $validation['duplicate_info']['is_duplicate'] ?? false;
        
        // Préparer les données selon le type d'entité
        if ($import['entity_type'] === 'demandeur') {
            $formData = $this->prepareDemandeurData($import['raw_data']);
            
            if ($isDuplicate) {
                $existingId = $validation['duplicate_info']['existing_entity']['id'] ?? null;
                
                return redirect()
                    ->route('dossiers.show', $dossier->id)
                    ->with('openEditDemandeur', [
                        'demandeur_id' => $existingId,
                        'import_data' => $formData,
                        'import_id' => $id
                    ]);
            } else {
                return redirect()
                    ->route('nouveau-lot.create', $dossier->id)
                    ->with('preloadDemandeur', array_merge($formData, [
                        'import_id' => $id
                    ]));
            }
            
        } else {
            $formData = $this->prepareProprieteData($import['raw_data']);
            
            if ($isDuplicate) {
                $existingId = $validation['duplicate_info']['existing_entity']['id'] ?? null;
                
                return redirect()
                    ->route('dossiers.show', $dossier->id)
                    ->with('openEditPropriete', [
                        'propriete_id' => $existingId,
                        'import_data' => $formData,
                        'import_id' => $id
                    ]);
            } else {
                return redirect()
                    ->route('nouveau-lot.create', $dossier->id)
                    ->with('preloadPropriete', array_merge($formData, [
                        'import_id' => $id
                    ]));
            }
        }
    }
    
    // ========================================
    // ARCHIVER
    // ========================================
    
    public function archive(Request $request, int $id)
    {
        $user = $request->user();
        $note = $request->input('note');
        
        $success = $this->topoService->archive($id, $note);
        
        if ($success) {

            return back()->with('success', 'Import archivé avec succès');
        }
        
        return back()->with('warning', 'Impossible d\'archiver. Le service TopoFlux est temporairement indisponible.');
    }
    
    // ========================================
    // DÉSARCHIVER
    // ========================================
    
    public function unarchive(Request $request, int $id)
    {
        $user = $request->user();
        
        $success = $this->topoService->unarchive($id);
        
        if ($success) {

            return back()->with('success', 'Import restauré avec succès');
        }
        
        return back()->with('warning', 'Impossible de restaurer. Le service TopoFlux est temporairement indisponible.');
    }
    
    // ========================================
    // REJETER
    // ========================================
    
    public function reject(Request $request, int $id)
    {
        $user = $request->user();
        
        $request->validate([
            'rejection_reason' => 'required|string|min:10|max:500'
        ], [
            'rejection_reason.required' => 'Le motif de rejet est obligatoire',
            'rejection_reason.min' => 'Le motif doit contenir au moins 10 caractères',
            'rejection_reason.max' => 'Le motif ne peut pas dépasser 500 caractères'
        ]);
        
        $success = $this->topoService->reject($id, $request->rejection_reason);
        
        if ($success) {
    
            return back()->with('success', 'Import rejeté avec succès');
        }
        
        return back()->with('warning', 'Impossible de rejeter. Le service TopoFlux est temporairement indisponible.');
    }
    
    // ========================================
    // TÉLÉCHARGER UN FICHIER
    // ========================================
    
    public function downloadFile(int $fileId)
    {
        $file = $this->topoService->downloadFile($fileId);
        
        if (!$file) {
            return back()->with('error', 'Fichier introuvable.');
        }
        
        return response($file['content'])
            ->header('Content-Type', $file['mime_type'])
            ->header('Content-Disposition', 'attachment; filename="' . $file['filename'] . '"');
    }
    
    // ========================================
    // MÉTHODES PRIVÉES - ENRICHISSEMENT
    // ========================================
    
    /**
     * Enrichir une liste d'imports avec les données GeODOC
     */
    private function enrichImportsData(array $imports): array
    {
        return array_map(function ($import) {
            return $this->enrichSingleImport($import);
        }, $imports);
    }
    
    /**
     * Enrichir un import avec les données GeODOC
     */
    private function enrichSingleImport(array $import): array
    {
        // Trouver le dossier
        $dossier = Dossier::where('numero_ouverture', $import['numero_ouverture'] ?? null)
            ->where('id_district', $import['district_id'] ?? null)
            ->first();
        
        // Trouver le district
        $district = District::find($import['district_id'] ?? null);
        
        // Ajouter les informations enrichies
        $import['dossier_id'] = $dossier?->id;
        $import['dossier_nom'] = $dossier?->nom_dossier ?? "Dossier {$import['numero_ouverture']}";
        $import['dossier_numero_ouverture'] = $import['numero_ouverture'];
        $import['district_nom'] = $district?->nom_district ?? "District #{$import['district_id']}";
        
        return $import;
    }
    
    /**
     * Préparer les données demandeur pour le formulaire
     */
    private function prepareDemandeurData(array $rawData): array
    {
        return [
            'titre_demandeur' => $rawData['titre_demandeur'] ?? '',
            'nom_demandeur' => $rawData['nom_demandeur'] ?? '',
            'prenom_demandeur' => $rawData['prenom_demandeur'] ?? '',
            'date_naissance' => $rawData['date_naissance'] ?? '',
            'lieu_naissance' => $rawData['lieu_naissance'] ?? '',
            'sexe' => $rawData['sexe'] ?? '',
            'occupation' => $rawData['occupation'] ?? '',
            'nom_pere' => $rawData['nom_pere'] ?? '',
            'nom_mere' => $rawData['nom_mere'] ?? '',
            'cin' => $rawData['cin'] ?? '',
            'date_delivrance' => $rawData['date_delivrance'] ?? '',
            'lieu_delivrance' => $rawData['lieu_delivrance'] ?? '',
            'date_delivrance_duplicata' => $rawData['date_delivrance_duplicata'] ?? '',
            'lieu_delivrance_duplicata' => $rawData['lieu_delivrance_duplicata'] ?? '',
            'domiciliation' => $rawData['domiciliation'] ?? '',
            'nationalite' => $rawData['nationalite'] ?? 'Malagasy',
            'situation_familiale' => $rawData['situation_familiale'] ?? 'Non spécifiée',
            'regime_matrimoniale' => $rawData['regime_matrimoniale'] ?? 'Non spécifié',
            'date_mariage' => $rawData['date_mariage'] ?? '',
            'lieu_mariage' => $rawData['lieu_mariage'] ?? '',
            'marie_a' => $rawData['marie_a'] ?? '',
            'telephone' => $rawData['telephone'] ?? ''
        ];
    }
    
    /**
     * Préparer les données propriété pour le formulaire
     */
    private function prepareProprieteData(array $rawData): array
    {
        return [
            'lot' => $rawData['lot'] ?? '',
            'type_operation' => $rawData['type_operation'] ?? 'immatriculation',
            'nature' => $rawData['nature'] ?? '',
            'vocation' => $rawData['vocation'] ?? '',
            'proprietaire' => $rawData['proprietaire'] ?? '',
            'situation' => $rawData['situation'] ?? '',
            'propriete_mere' => $rawData['propriete_mere'] ?? '',
            'titre_mere' => $rawData['titre_mere'] ?? '',
            'titre' => $rawData['titre'] ?? '',
            'contenance' => $rawData['contenance'] ?? '',
            'charge' => $rawData['charge'] ?? '',
            'numero_FN' => $rawData['numero_FN'] ?? '',
            'numero_requisition' => $rawData['numero_requisition'] ?? '',
            'date_requisition' => $rawData['date_requisition'] ?? '',
            'date_depot_1' => $rawData['date_depot_1'] ?? '',
            'date_depot_2' => $rawData['date_depot_2'] ?? '',
            'date_approbation_acte' => $rawData['date_approbation_acte'] ?? '',
            'dep_vol_inscription' => $rawData['dep_vol_inscription'] ?? '',
            'numero_dep_vol_inscription' => $rawData['numero_dep_vol_inscription'] ?? '',
            'dep_vol_requisition' => $rawData['dep_vol_requisition'] ?? '',
            'numero_dep_vol_requisition' => $rawData['numero_dep_vol_requisition'] ?? ''
        ];
    }
    
    private function getEmptyStats(): array
    {
        return [
            'total' => 0,
            'pending' => 0,
            'archived' => 0,
            'validated' => 0,
            'rejected' => 0
        ];
    }
}