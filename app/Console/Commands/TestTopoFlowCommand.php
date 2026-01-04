<?php
// ============================================
// Artisan Command: php artisan test:topo-flow
// ============================================

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\{JwtService, FastApiService, TopoImportProcessor};
use App\Models\{User, Dossier, TopoImportCache};
use Illuminate\Support\Facades\DB;

class TestTopoFlowCommand extends Command
{
    protected $signature = 'test:topo-flow';
    protected $description = 'Teste le flux complet TopoManager';

    public function handle()
    {
        $this->info('==============================================');
        $this->info('TEST COMPLET DU FLUX TOPOMANAGER');
        $this->info('==============================================');
        $this->newLine();
        
        // ÉTAPE 1: Vérifier la configuration
        $this->info('[1/7] Vérification configuration...');
        if (!$this->checkConfig()) {
            return 1;
        }
        
        // ÉTAPE 2: Tester la génération JWT
        $this->info('[2/7] Test génération JWT...');
        $token = $this->testJwt();
        if (!$token) {
            return 1;
        }
        
        // ÉTAPE 3: Tester la connexion FastAPI
        $this->info('[3/7] Test connexion FastAPI...');
        if (!$this->testFastApiConnection($token)) {
            return 1;
        }
        
        // ÉTAPE 4: Vérifier la base de données
        $this->info('[4/7] Vérification base de données...');
        if (!$this->checkDatabase()) {
            return 1;
        }
        
        // ÉTAPE 5: Lister les imports FastAPI
        $this->info('[5/7] Récupération imports FastAPI...');
        $imports = $this->listImports();
        
        // ÉTAPE 6: Tester le traitement d'un import
        if (!empty($imports)) {
            $this->info('[6/7] Test traitement import...');
            $this->testProcessImport($imports[0]['id']);
        } else {
            $this->warn('[6/7] Aucun import à traiter');
        }
        
        // ÉTAPE 7: Afficher les statistiques
        $this->info('[7/7] Statistiques finales...');
        $this->showStats();
        
        $this->newLine();
        $this->info('Test terminé avec succès !');
        
        return 0;
    }
    
    // ========================================
    // TESTS INDIVIDUELS
    // ========================================
    
    private function checkConfig(): bool
    {
        $checks = [
            'JWT_SECRET_KEY' => config('app.jwt_secret'),
            'FASTAPI_URL' => config('services.fastapi.url'),
            'DB_CONNECTION' => config('database.default'),
        ];
        
        foreach ($checks as $key => $value) {
            if (empty($value)) {
                $this->error("  {$key} non configuré");
                return false;
            }
            $this->line("  {$key}: " . (strlen($value) > 50 ? substr($value, 0, 50) . '...' : $value));
        }
        
        $this->info('  Configuration OK');
        $this->newLine();
        return true;
    }
    
    private function testJwt(): ?string
    {
        try {
            $user = User::first();
            
            if (!$user) {
                $this->error('  Aucun utilisateur trouvé');
                return null;
            }
            
            $token = JwtService::generateToken($user);
            
            $this->line("  User: {$user->email}");
            $this->line("  Token: " . substr($token, 0, 30) . "...");
            
            if (JwtService::isTokenValid($token)) {
                $this->info('  Token valide');
                $this->newLine();
                return $token;
            }
            
            $this->error('  Token invalide');
            return null;
            
        } catch (\Exception $e) {
            $this->error("  Erreur: {$e->getMessage()}");
            return null;
        }
    }
    
    private function testFastApiConnection(string $token): bool
    {
        try {
            $fastApi = app(FastApiService::class);
            $stats = $fastApi->getStats();
            
            if (empty($stats)) {
                $this->error('  Connexion échouée');
                return false;
            }
            
            $this->line("  Total imports: {$stats['total']}");
            $this->line("  En attente: {$stats['pending']}");
            $this->info('  Connexion OK');
            $this->newLine();
            return true;
            
        } catch (\Exception $e) {
            $this->error("  Erreur: {$e->getMessage()}");
            return false;
        }
    }
    
    private function checkDatabase(): bool
    {
        try {
            $tables = [
                'demandeurs' => DB::table('demandeurs')->count(),
                'proprietes' => DB::table('proprietes')->count(),
                'dossiers' => DB::table('dossiers')->count(),
                'topo_imports_cache' => DB::table('topo_imports_cache')->count(),
            ];
            
            foreach ($tables as $table => $count) {
                $this->line("  {$table}: {$count} enregistrements");
            }
            
            $this->info('  Base de données OK');
            $this->newLine();
            return true;
            
        } catch (\Exception $e) {
            $this->error("  Erreur: {$e->getMessage()}");
            return false;
        }
    }
    
    private function listImports(): array
    {
        try {
            $fastApi = app(FastApiService::class);
            $imports = $fastApi->getImports(['status' => 'pending']);
            
            if (empty($imports)) {
                $this->warn('  Aucun import en attente');
                $this->newLine();
                return [];
            }
            
            $this->line("  {$imports['total']} import(s) trouvé(s)");
            
            foreach (array_slice($imports['data'] ?? [], 0, 5) as $import) {
                $this->line("    - #{$import['id']} | {$import['entity_type']} | {$import['status']}");
            }
            
            $this->newLine();
            return $imports['data'] ?? [];
            
        } catch (\Exception $e) {
            $this->error("  Erreur: {$e->getMessage()}");
            return [];
        }
    }
    
    private function testProcessImport(int $importId): void
    {
        try {
            $processor = app(TopoImportProcessor::class);
            $user = User::first();
            
            $this->line("  Traitement import #{$importId}...");
            
            $result = $processor->processImport($importId, $user->id);
            
            if ($result['success']) {
                $this->info("  Import traité avec succès");
                $this->line("    Entité ID: {$result['entity']->id}");
                $this->line("    Fichiers: {$result['files_count']}");
            } else {
                $this->error("  Échec: {$result['error']}");
            }
            
        } catch (\Exception $e) {
            $this->error("  Erreur: {$e->getMessage()}");
        }
        
        $this->newLine();
    }
    
    private function showStats(): void
    {
        $cache = TopoImportCache::selectRaw('
            status,
            COUNT(*) as total
        ')
        ->groupBy('status')
        ->get();
        
        $this->table(
            ['Statut', 'Total'],
            $cache->map(fn($c) => [$c->status, $c->total])
        );
    }
}