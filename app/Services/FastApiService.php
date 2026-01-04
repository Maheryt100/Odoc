<?php
// ============================================
// app/Services/FastApiService.php
// VERSION CORRIGÉE AVEC LOGS DÉTAILLÉS
// ============================================

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\{Http, Log};
use App\Services\JwtService;
use Exception;

class FastApiService
{
    private string $baseUrl;
    private int $timeout = 30;
    
    public function __construct()
    {
        $this->baseUrl = config('services.fastapi.url', 'http://localhost:8000');
        
        Log::debug('FastApiService initialisé', [
            'base_url' => $this->baseUrl
        ]);
    }
    
    // ========================================
    // MÉTHODE PRIVÉE : OBTENIR TOKEN
    // ========================================
    
    private function getAuthHeaders(): array
    {
        try {
            $user = \Illuminate\Support\Facades\Auth::user();
            
            if (!$user) {
                Log::error('❌ FastAPI: Utilisateur non authentifié');
                return [];
            }
            
            $token = JwtService::generateToken($user);
            
            Log::debug('✅ Token JWT généré', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'token_preview' => substr($token, 0, 30) . '...'
            ]);
            
            return [
                'Authorization' => "Bearer {$token}",
                'Accept' => 'application/json',
            ];
            
        } catch (Exception $e) {
            Log::error('❌ FastAPI: Erreur génération token', [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
    
    // ========================================
    // RÉCUPÉRATION IMPORTS
    // ========================================
    
    public function getImports(array $filters = []): array
    {
        try {
            Log::info('📡 FastAPI: Récupération imports', [
                'filters' => $filters,
                'url' => "{$this->baseUrl}/api/imports"
            ]);
            
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getAuthHeaders())
                ->get("{$this->baseUrl}/api/imports", $filters);
            
            Log::debug('📡 FastAPI: Réponse brute', [
                'status' => $response->status(),
                'successful' => $response->successful(),
                'body_preview' => substr($response->body(), 0, 200)
            ]);
            
            if (!$response->successful()) {
                Log::error('❌ FastAPI getImports error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return [];
            }
            
            $data = $response->json();
            
            Log::info('✅ FastAPI: Imports récupérés', [
                'total' => $data['total'] ?? count($data),
                'data_count' => isset($data['data']) ? count($data['data']) : 0
            ]);
            
            // Retourner le tableau complet (pas juste ['data'])
            return $data;
            
        } catch (Exception $e) {
            Log::error('❌ FastAPI getImports failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return [];
        }
    }
    
    public function getImport(int $importId): ?array
    {
        try {
            Log::info('📡 FastAPI: Récupération import', [
                'import_id' => $importId,
                'url' => "{$this->baseUrl}/api/imports/{$importId}"
            ]);
            
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getAuthHeaders())
                ->get("{$this->baseUrl}/api/imports/{$importId}");
            
            if (!$response->successful()) {
                Log::error('❌ FastAPI getImport error', [
                    'import_id' => $importId,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return null;
            }
            
            $data = $response->json();
            
            Log::info('✅ FastAPI: Import récupéré', [
                'import_id' => $importId,
                'entity_type' => $data['import']['entity_type'] ?? 'N/A',
                'status' => $data['import']['status'] ?? 'N/A'
            ]);
            
            return $data;
                
        } catch (Exception $e) {
            Log::error("❌ FastAPI getImport {$importId} failed", [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
    
    // ========================================
    // VALIDATION
    // ========================================
    
    public function validateImport(int $importId): bool
    {
        try {
            Log::info("📡 FastAPI: Validation import #{$importId}");
            
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getAuthHeaders())
                ->asForm()
                ->put("{$this->baseUrl}/api/imports/{$importId}/validate", [
                    'action' => 'validate'
                ]);
            
            if ($response->successful()) {
                Log::info("✅ FastAPI: Import #{$importId} validé");
                return true;
            }
            
            Log::error("❌ FastAPI validateImport error", [
                'import_id' => $importId,
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            return false;
            
        } catch (Exception $e) {
            Log::error("❌ FastAPI validateImport {$importId} failed", [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    public function rejectImport(int $importId, string $reason): bool
    {
        try {
            Log::info("📡 FastAPI: Rejet import #{$importId}", [
                'reason' => substr($reason, 0, 50)
            ]);
            
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getAuthHeaders())
                ->asForm()
                ->put("{$this->baseUrl}/api/imports/{$importId}/validate", [
                    'action' => 'reject',
                    'rejection_reason' => $reason
                ]);
            
            if ($response->successful()) {
                Log::info("✅ FastAPI: Import #{$importId} rejeté");
                return true;
            }
            
            Log::error("❌ FastAPI rejectImport error", [
                'import_id' => $importId,
                'status' => $response->status()
            ]);
            return false;
            
        } catch (Exception $e) {
            Log::error("❌ FastAPI rejectImport {$importId} failed", [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    // ========================================
    // FICHIERS
    // ========================================
    
    public function downloadFile(int $fileId): ?array
    {
        try {
            Log::info("📡 FastAPI: Téléchargement fichier #{$fileId}");
            
            $response = Http::timeout(60)
                ->withHeaders($this->getAuthHeaders())
                ->get("{$this->baseUrl}/api/files/{$fileId}");
            
            if (!$response->successful()) {
                Log::error("❌ FastAPI downloadFile error", [
                    'file_id' => $fileId,
                    'status' => $response->status()
                ]);
                return null;
            }
            
            $contentDisposition = $response->header('Content-Disposition');
            preg_match('/filename="(.+)"/', $contentDisposition, $matches);
            $filename = $matches[1] ?? "file_{$fileId}";
            
            Log::info("✅ FastAPI: Fichier téléchargé", [
                'file_id' => $fileId,
                'filename' => $filename
            ]);
            
            return [
                'content' => $response->body(),
                'filename' => $filename,
                'mime_type' => $response->header('Content-Type')
            ];
            
        } catch (Exception $e) {
            Log::error("❌ FastAPI downloadFile {$fileId} failed", [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
    
    public function cleanupFiles(int $importId): bool
    {
        try {
            Log::info("📡 FastAPI: Nettoyage fichiers import #{$importId}");
            
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getAuthHeaders())
                ->delete("{$this->baseUrl}/api/imports/{$importId}/files");
            
            if ($response->successful()) {
                Log::info("✅ FastAPI: Fichiers nettoyés pour import #{$importId}");
                return true;
            }
            
            return false;
            
        } catch (Exception $e) {
            Log::error("❌ FastAPI cleanupFiles {$importId} failed", [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    // ========================================
    // STATISTIQUES
    // ========================================
    
    public function getStats(): array
    {
        try {
            Log::info('📡 FastAPI: Récupération stats');
            
            $response = Http::timeout(10)
                ->withHeaders($this->getAuthHeaders())
                ->get("{$this->baseUrl}/api/stats");
            
            if ($response->successful()) {
                $stats = $response->json();
                Log::info('✅ FastAPI: Stats récupérées', $stats);
                return $stats;
            }
            
            Log::error('❌ FastAPI getStats error', [
                'status' => $response->status()
            ]);
            
            return [
                'total' => 0, 
                'pending' => 0, 
                'validated' => 0, 
                'rejected' => 0
            ];
                
        } catch (Exception $e) {
            Log::error('❌ FastAPI getStats failed', [
                'error' => $e->getMessage()
            ]);
            
            return [
                'total' => 0, 
                'pending' => 0, 
                'validated' => 0, 
                'rejected' => 0
            ];
        }
    }
}