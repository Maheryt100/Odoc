<?php
// ============================================
// app/Services/TopoFluxService.php
// ✅ VERSION FINALE - ADAPTÉE À FASTAPI V2.0
// ============================================

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Services\JwtService;
use Exception;
use Illuminate\Support\Facades\Auth;

class TopoFluxService
{
    private string $baseUrl;
    private int $timeout;
    
    public function __construct()
    {
        $this->baseUrl = config('services.fastapi.url', 'http://localhost:8000');
        $this->timeout = config('services.fastapi.timeout', 30);
    }
    
    // ========================================
    // AUTHENTIFICATION
    // ========================================
    
    private function getAuthHeaders(): array
    {
        try {
            /** @var \App\Models\User|null $user */
            $user = Auth::user();
            
            if (!$user) {
                // Log::error('TopoFlux: Utilisateur non authentifié');
                return [];
            }
            
            $token = JwtService::generateToken($user);
            
            return [
                'Authorization' => "Bearer {$token}",
                'Accept' => 'application/json',
            ];
            
        } catch (Exception $e) {
            // Log::error('TopoFlux: Erreur génération token', [
            //     'error' => $e->getMessage()
            // ]);
            return [];
        }
    }
    
    // ========================================
    // RÉCUPÉRATION DES IMPORTS
    // ========================================
    
    /**
     * Récupérer la liste des imports avec filtres
     */
    public function getImports(array $filters = []): array
    {
        try {
            // Convertir le status en uppercase pour FastAPI
            if (isset($filters['status'])) {
                $filters['status'] = strtoupper($filters['status']);
            }
            
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getAuthHeaders())
                ->get("{$this->baseUrl}/api/imports", $filters);
            
            if (!$response->successful()) {

                return ['data' => [], 'stats' => $this->getEmptyStats()];
            }
            
            $data = $response->json();

            return $data;
            
        } catch (Exception $e) {

            return ['data' => [], 'stats' => $this->getEmptyStats()];
        }
    }
    
    /**
     * Récupérer un import spécifique avec ses fichiers
     */
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
    // ACTIONS SUR LES IMPORTS
    // ========================================
    
    /**
     * Méthode générique pour changer le statut d'un import
     */
    private function updateStatus(int $importId, string $action, array $data = []): bool
    {
        try {
            /** @var \App\Models\User|null $user */
            $user = Auth::user();
            
            $payload = array_merge([
                'action' => $action,
                'user_email' => $user->email,
                'user_name' => $user->name
            ], $data);

            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getAuthHeaders())
                ->put("{$this->baseUrl}/api/imports/{$importId}/status", $payload);
            
            if ($response->successful()) {

                return true;
            }

            return false;
            
        } catch (Exception $e) {

            return false;
        }
    }
    
    /**
     * Archiver un import
     */
    public function archive(int $importId, ?string $note = null): bool
    {
        $data = [];
        if ($note) {
            $data['archived_note'] = $note;
        }
        
        return $this->updateStatus($importId, 'archive', $data);
    }
    
    /**
     * Désarchiver un import
     */
    public function unarchive(int $importId): bool
    {
        return $this->updateStatus($importId, 'unarchive');
    }
    
    /**
     * Rejeter un import
     */
    public function reject(int $importId, string $reason): bool
    {
        if (strlen($reason) < 10) {

            return false;
        }
        
        return $this->updateStatus($importId, 'reject', [
            'rejection_reason' => $reason
        ]);
    }
    
    /**
     * Marquer comme validé (après import dans Laravel)
     */
    public function markAsValidated(int $importId): bool
    {
        return $this->updateStatus($importId, 'validate');
    }
    
    // ========================================
    // GESTION DES FICHIERS
    // ========================================
    
    /**
     * Télécharger un fichier
     */
    public function downloadFile(int $fileId): ?array
    {
        try {
            $response = Http::timeout(60)
                ->withHeaders($this->getAuthHeaders())
                ->get("{$this->baseUrl}/api/v1/files/{$fileId}");
            
            if (!$response->successful()) {
   
                return null;
            }
            
            return [
                'content' => $response->body(),
                'filename' => $this->extractFilename($response),
                'mime_type' => $response->header('Content-Type')
            ];
            
        } catch (Exception $e) {

            return null;
        }
    }
    
    /**
     * Extraire le nom de fichier depuis les headers
     */
    private function extractFilename($response): string
    {
        $disposition = $response->header('Content-Disposition');
        
        if (!$disposition) {
            return 'download';
        }
        
        if (preg_match('/filename="(.+)"/', $disposition, $matches)) {
            return $matches[1];
        }
        
        if (preg_match('/filename=([^;]+)/', $disposition, $matches)) {
            return trim($matches[1]);
        }
        
        return 'download';
    }
    
    // ========================================
    // HELPERS
    // ========================================
    
    /**
     * Stats vides par défaut
     */
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
    
    /**
     * Vérifier la connexion à FastAPI
     */
    public function healthCheck(): bool
    {
        try {
            $response = Http::timeout(5)
                ->get("{$this->baseUrl}/health");
            
            return $response->successful();
            
        } catch (Exception $e) {

            return false;
        }
    }
    
    /**
     * Obtenir les statistiques globales
     */
    public function getGlobalStats(): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getAuthHeaders())
                ->get("{$this->baseUrl}/api/stats");
            
            if (!$response->successful()) {
                return $this->getEmptyStats();
            }
            
            return $response->json();
            
        } catch (Exception $e) {
 
            return $this->getEmptyStats();
        }
    }
}