<?php
// app/Services/FastApiService.php
// ✅ VERSION CORRIGÉE - VARIABLE $filters DÉFINIE

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Services\JwtService;
use Exception;

class FastApiService
{
    private string $baseUrl;
    private int $timeout = 30;
    
    public function __construct()
    {
        $this->baseUrl = config('services.fastapi.url', 'http://localhost:8000');
    }
    
    private function getAuthHeaders(): array
    {
        try {
            $user = \Illuminate\Support\Facades\Auth::user();
            
            if (!$user) {
                return [];
            }
            
            $token = JwtService::generateToken($user);
            
            return [
                'Authorization' => "Bearer {$token}",
                'Accept' => 'application/json',
            ];
            
        } catch (Exception $e) {
            return [];
        }
    }
    
    // ========================================
    // RÉCUPÉRATION IMPORTS
    // ========================================
    
    public function getImports(array $filters = []): array
    {
        try {
            // ✅ CORRECTION : Ne pas envoyer 'archived' à FastAPI
            $fastApiFilters = [];
            
            foreach ($filters as $key => $value) {
                // Exclure le filtre 'archived' et 'status' si = 'archived'
                if ($key === 'status' && $value === 'archived') {
                    continue;
                }
                $fastApiFilters[$key] = $value;
            }
            
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getAuthHeaders())
                ->get("{$this->baseUrl}/api/imports", $fastApiFilters);
            
            if (!$response->successful()) {

                return [];
            }
            
            return $response->json();
            
        } catch (Exception $e) {

            return [];
        }
    }
    
    public function getImport(int $importId): ?array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getAuthHeaders())
                ->get("{$this->baseUrl}/api/imports/{$importId}");
            
            if (!$response->successful()) {

                return null;
            }
            
            return $response->json();
                
        } catch (Exception $e) {
  
            return null;
        }
    }
    
    // ========================================
    // VALIDATION
    // ========================================
    
    public function validateImport(int $importId): bool
    {
        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getAuthHeaders())
                ->asForm()
                ->put("{$this->baseUrl}/api/imports/{$importId}/validate", [
                    'action' => 'validate'
                ]);
            
            return $response->successful();
            
        } catch (Exception $e) {
   
            return false;
        }
    }
    
    public function rejectImport(int $importId, string $reason): bool
    {
        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getAuthHeaders())
                ->asForm()
                ->put("{$this->baseUrl}/api/imports/{$importId}/validate", [
                    'action' => 'reject',
                    'rejection_reason' => $reason
                ]);
            
            return $response->successful();
            
        } catch (Exception $e) {
 
            return false;
        }
    }
    
    // ========================================
    // FICHIERS
    // ========================================
    
    public function downloadFile(int $fileId): ?array
    {
        try {
            $response = Http::timeout(60)
                ->withHeaders($this->getAuthHeaders())
                ->get("{$this->baseUrl}/api/files/{$fileId}");
            
            if (!$response->successful()) {
                return null;
            }
            
            $contentDisposition = $response->header('Content-Disposition');
            preg_match('/filename="(.+)"/', $contentDisposition, $matches);
            $filename = $matches[1] ?? "file_{$fileId}";
            
            return [
                'content' => $response->body(),
                'filename' => $filename,
                'mime_type' => $response->header('Content-Type')
            ];
            
        } catch (Exception $e) {
 
            return null;
        }
    }
}