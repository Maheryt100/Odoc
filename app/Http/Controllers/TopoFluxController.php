<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TopoFluxController extends Controller
{
    private function getFastApiUrl(): string
    {
        return config('services.fastapi.url', 'http://127.0.0.1:8000');
    }

    private function getJwtToken(): ?string
    {
        return session('geodoc_jwt');
    }

    /**
     * Page principale - Liste des imports
     */
    public function index(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        return Inertia::render('TopoFlux/Index', [
            'fastapi_url' => $this->getFastApiUrl(),
            'jwt_token' => $this->getJwtToken()
        ]);
    }

    /**
     * Détails d'un import spécifique
     */
    public function show($importId)
    {
        /** @var User $user */
        $user = Auth::user();
        
        try {
            $response = Http::withToken($this->getJwtToken())
                ->get("{$this->getFastApiUrl()}/api/v1/staging/{$importId}");
            
            if (!$response->successful()) {
                return back()->with('error', 'Import introuvable');
            }
            
            $import = $response->json();
            
            // Vérifier permissions district
            if (!$user->isSuperAdmin() && !$user->isCentralUser()) {
                if ($import['district_id'] != $user->id_district) {
                    abort(403, 'Accès refusé à cet import');
                }
            }
            
            return Inertia::render('TopoFlux/Show', [
                'import' => $import,
                'canValidate' => $user->isAdminDistrict() || $user->isUserDistrict()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur récupération import TopoManager', [
                'import_id' => $importId,
                'error' => $e->getMessage()
            ]);
            
            return back()->with('error', 'Erreur lors de la récupération de l\'import');
        }
    }

    /**
     * ✅ CORRECTION: Redirige vers formulaire (pas création directe)
     */
    public function validateImport(Request $request, $importId)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Vérifier permissions (UNIQUEMENT district users)
        if (!$user->isAdminDistrict() && !$user->isUserDistrict()) {
            return back()->with('error', 'Seuls les utilisateurs de district peuvent valider');
        }
        
        try {
            // Récupérer import
            $response = Http::withToken($this->getJwtToken())
                ->get("{$this->getFastApiUrl()}/api/v1/staging/{$importId}");
            
            if (!$response->successful()) {
                throw new \Exception('Import introuvable');
            }
            
            $import = $response->json();
            
            // Vérifier district
            if ($import['district_id'] != $user->id_district) {
                return back()->with('error', 'Import hors de votre district');
            }
            
            // Vérifier statut
            if ($import['status'] !== 'pending') {
                return back()->with('error', 'Import déjà traité');
            }
            
            // ✅ TRANSFERT DES FICHIERS VERS LARAVEL STORAGE (avant redirection)
            $transferredFiles = [];
            if ($import['files_count'] > 0) {
                $transferredFiles = $this->transferFilesToLaravel($importId, $import['files']);
            }
            
            // ✅ REDIRECTION VERS FORMULAIRE (avec données en session)
            $sessionData = [
                'topo_import_id' => $importId,
                'topo_data' => $import['raw_data'],
                'topo_match_info' => $import['matched_entity_details'],
                'topo_files' => $transferredFiles // Fichiers déjà transférés
            ];
            
            if ($import['entity_type'] === 'propriete') {
                $route = $import['action_suggested'] === 'update' && $import['matched_entity_id']
                    ? route('proprietes.edit', [
                        'id_dossier' => $import['dossier_id'],
                        'id_propriete' => $import['matched_entity_id']
                      ])
                    : route('nouveau-lot.create', ['id' => $import['dossier_id']]);
                
                return redirect($route)->with($sessionData);
            }
            
            if ($import['entity_type'] === 'demandeur') {
                $route = $import['action_suggested'] === 'update' && $import['matched_entity_id']
                    ? route('demandeurs.edit', [
                        'id_dossier' => $import['dossier_id'],
                        'id_demandeur' => $import['matched_entity_id']
                      ])
                    : route('demandeurs.create', ['id' => $import['dossier_id']]);
                
                return redirect($route)->with($sessionData);
            }
            
            return back()->with('error', 'Type d\'entité non supporté');
            
        } catch (\Exception $e) {
            Log::error('Erreur validation import TopoManager', [
                'import_id' => $importId,
                'error' => $e->getMessage()
            ]);
            
            return back()->with('error', 'Erreur: ' . $e->getMessage());
        }
    }

    /**
     * ✅ NOUVEAU: Transfert fichiers FastAPI → Laravel Storage
     */
    private function transferFilesToLaravel(int $importId, array $files): array
    {
        $transferredFiles = [];
        
        try {
            foreach ($files as $fileInfo) {
                // Télécharger depuis FastAPI
                $fileResponse = Http::withToken($this->getJwtToken())
                    ->get("{$this->getFastApiUrl()}/api/v1/files/{$importId}/{$fileInfo['name']}");
                
                if (!$fileResponse->successful()) {
                    Log::warning('Impossible de télécharger fichier TopoManager', [
                        'import_id' => $importId,
                        'file' => $fileInfo['name']
                    ]);
                    continue;
                }
                
                // Générer nom unique
                $extension = $fileInfo['extension'] ?? pathinfo($fileInfo['name'], PATHINFO_EXTENSION);
                $storedName = uniqid('topo_') . '.' . $extension;
                $relativePath = 'temp/topo_imports/' . date('Y/m/') . $storedName;
                
                // Sauvegarder dans Laravel storage
                Storage::disk('public')->put($relativePath, $fileResponse->body());
                
                $transferredFiles[] = [
                    'original_name' => $fileInfo['name'],
                    'stored_name' => $storedName,
                    'path' => $relativePath,
                    'size' => $fileInfo['size'],
                    'extension' => $extension,
                    'category' => $fileInfo['category'] ?? 'document'
                ];
                
                Log::info('Fichier TopoManager transféré', [
                    'import_id' => $importId,
                    'file' => $fileInfo['name'],
                    'stored_as' => $storedName
                ]);
            }
            
        } catch (\Exception $e) {
            Log::error('Erreur transfert fichiers TopoManager', [
                'import_id' => $importId,
                'error' => $e->getMessage()
            ]);
        }
        
        return $transferredFiles;
    }

    /**
     * Rejeter un import
     */
    public function rejectImport(Request $request, $importId)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $request->validate([
            'rejection_reason' => 'required|string|min:10'
        ]);
        
        if (!$user->isAdminDistrict() && !$user->isUserDistrict()) {
            return back()->with('error', 'Permissions insuffisantes');
        }
        
        try {
            $response = Http::withToken($this->getJwtToken())
                ->put("{$this->getFastApiUrl()}/api/v1/staging/{$importId}/validate", [
                    'action' => 'reject',
                    'rejection_reason' => $request->rejection_reason
                ]);
            
            if (!$response->successful()) {
                throw new \Exception('Erreur API FastAPI');
            }
            
            Log::info('Import TopoManager rejeté', [
                'import_id' => $importId,
                'user_id' => $user->id,
                'reason' => $request->rejection_reason
            ]);
            
            return back()->with('success', 'Import rejeté');
            
        } catch (\Exception $e) {
            Log::error('Erreur rejet import', [
                'import_id' => $importId,
                'error' => $e->getMessage()
            ]);
            
            return back()->with('error', 'Erreur lors du rejet');
        }
    }

    /**
     * Statistiques globales
     */
    public function getStats()
    {
        try {
            $response = Http::withToken($this->getJwtToken())
                ->get("{$this->getFastApiUrl()}/api/v1/staging/stats");
            
            return response()->json($response->json());
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur récupération stats'
            ], 500);
        }
    }
}