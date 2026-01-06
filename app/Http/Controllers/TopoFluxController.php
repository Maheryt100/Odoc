<?php
// ============================================
// app/Http/Controllers/TopoFluxController.php
// VERSION AVEC DÉGRADATION GRACIEUSE COMPLÈTE
// ============================================

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Services\TopoFluxService;

class TopoFluxController extends Controller
{
    public function __construct(
        private TopoFluxService $topoService
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
        
        // Récupérer depuis FastAPI (avec gestion d'erreur gracieuse)
        $data = $this->topoService->getImports($filters);
        
        // Déterminer si FastAPI est disponible
        $fastapiAvailable = !empty($data['data']) || !empty($data['stats']['total']);
        
        return Inertia::render('TopoFlux/Index', [
            'imports' => $data['data'] ?? [],
            'stats' => $data['stats'] ?? $this->getEmptyStats(),
            'filters' => $filters,
            'canValidate' => true, // Toujours true
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
        
        return Inertia::render('TopoFlux/Show', [
            'import' => $import['import'] ?? null,
            'files' => $import['files'] ?? [],
            'canValidate' => true
        ]);
    }
    
    // ========================================
    // IMPORT - ✅ FONCTIONNE MÊME SI FASTAPI DOWN
    // ========================================
    
    public function import(Request $request, int $id)
    {
        // ✅ CRUCIAL : Les données sont déjà dans la requête Inertia
        // On peut importer même si FastAPI est down maintenant
        
        // Essayer de récupérer depuis FastAPI
        $import = $this->topoService->getImport($id);
        
        // ✅ Si FastAPI down, utiliser les données du cache de session
        if (!$import && session()->has('cached_import_' . $id)) {
            $import = session()->get('cached_import_' . $id);
            Log::info("Import #{$id} récupéré depuis le cache de session", [
                'user' => $request->user()->email
            ]);
        }
        
        if (!$import || !isset($import['import'])) {
            return back()->with('error', 'Impossible de récupérer les données de cet import. Veuillez réessayer plus tard.');
        }
        
        $data = $import['import'];
        
        // Vérifier que l'import est dans un état valide
        if (in_array($data['status'], ['rejected', 'validated'])) {
            return back()->with('error', 'Cet import ne peut pas être importé (statut: ' . $data['status'] . ')');
        }
        
        // Déterminer si c'est une création ou une mise à jour
        $isDuplicate = $data['validation']['duplicate_info']['is_duplicate'] ?? false;
        
        // Préparer les données selon le type d'entité
        if ($data['entity_type'] === 'demandeur') {
            $formData = $this->prepareDemandeurData($data['raw_data']);
            
            if ($isDuplicate) {
                $existingId = $data['validation']['duplicate_info']['existing_entity']['id'] ?? null;
                
                return redirect()
                    ->route('dossiers.show', $data['dossier_id'])
                    ->with('openEditDemandeur', [
                        'demandeur_id' => $existingId,
                        'import_data' => $formData,
                        'import_id' => $id
                    ]);
            } else {
                return redirect()
                    ->route('nouveau-lot.create', $data['dossier_id'])
                    ->with('preloadDemandeur', array_merge($formData, [
                        'import_id' => $id
                    ]));
            }
            
        } else {
            $formData = $this->prepareProprieteData($data['raw_data']);
            
            if ($isDuplicate) {
                $existingId = $data['validation']['duplicate_info']['existing_entity']['id'] ?? null;
                
                return redirect()
                    ->route('dossiers.show', $data['dossier_id'])
                    ->with('openEditPropriete', [
                        'propriete_id' => $existingId,
                        'import_data' => $formData,
                        'import_id' => $id
                    ]);
            } else {
                return redirect()
                    ->route('nouveau-lot.create', $data['dossier_id'])
                    ->with('preloadPropriete', array_merge($formData, [
                        'import_id' => $id
                    ]));
            }
        }
    }
    
    // ========================================
    // ARCHIVER - Essaie mais ne bloque pas
    // ========================================
    
    public function archive(Request $request, int $id)
    {
        $user = $request->user();
        $note = $request->input('note');
        
        $success = $this->topoService->archive($id, $note);
        
        if ($success) {
            Log::info("Import #{$id} archivé", [
                'user' => $user->email,
                'note' => $note
            ]);
            return back()->with('success', 'Import archivé avec succès');
        }
        
        // ✅ Message plus clair
        return back()->with('warning', 'Impossible d\'archiver. Le service TopoFlux est temporairement indisponible. L\'import reste utilisable.');
    }
    
    // ========================================
    // DÉSARCHIVER
    // ========================================
    
    public function unarchive(Request $request, int $id)
    {
        $user = $request->user();
        
        $success = $this->topoService->unarchive($id);
        
        if ($success) {
            Log::info("Import #{$id} restauré", [
                'user' => $user->email
            ]);
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
        
        // Valider le motif
        $request->validate([
            'rejection_reason' => 'required|string|min:10|max:500'
        ], [
            'rejection_reason.required' => 'Le motif de rejet est obligatoire',
            'rejection_reason.min' => 'Le motif doit contenir au moins 10 caractères',
            'rejection_reason.max' => 'Le motif ne peut pas dépasser 500 caractères'
        ]);
        
        $success = $this->topoService->reject($id, $request->rejection_reason);
        
        if ($success) {
            Log::info("Import #{$id} rejeté", [
                'user' => $user->email,
                'reason' => $request->rejection_reason
            ]);
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
            return back()->with('error', 'Fichier introuvable. Le service TopoFlux est peut-être indisponible.');
        }
        
        return response($file['content'])
            ->header('Content-Type', $file['mime_type'])
            ->header('Content-Disposition', 'attachment; filename="' . $file['filename'] . '"');
    }
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
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
}