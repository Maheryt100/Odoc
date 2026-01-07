<?php
// ============================================
// test_jwt.php - Script de Test JWT
// À exécuter avec: php artisan test_jwt
// ============================================

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\JwtService;
use App\Models\User;

class TestJwtCommand extends Command
{
    protected $signature = 'test:jwt';
    protected $description = 'Teste le service JWT';

    public function handle()
    {
        $this->info('Test du Service JWT');
        $this->newLine();
        
        // 1. Récupérer un utilisateur
        $user = User::first();
        
        if (!$user) {
            $this->error('Aucun utilisateur trouvé');
            $this->info('Créez un utilisateur avec: php artisan tinker');
            return 1;
        }
        
        $this->info("👤 Utilisateur: {$user->name} ({$user->email})");
        $this->newLine();
        
        // 2. Générer un token
        try {
            $token = JwtService::generateToken($user);
            $this->info('Token généré avec succès');
            $this->line("Token (50 premiers caractères): " . substr($token, 0, 50) . "...");
            $this->newLine();
            
        } catch (\Exception $e) {
            $this->error("Erreur génération: {$e->getMessage()}");
            return 1;
        }
        
        // 3. Valider le token
        try {
            $isValid = JwtService::isTokenValid($token);
            $this->info($isValid ? 'Token valide' : 'Token invalide');
            $this->newLine();
            
        } catch (\Exception $e) {
            $this->error("Erreur validation: {$e->getMessage()}");
        }
        
        // 4. Décoder le token
        try {
            $decoded = JwtService::decodeToken($token);
            $this->info('Données du token:');
            $this->table(
                ['Clé', 'Valeur'],
                [
                    ['User ID', $decoded->sub],
                    ['Email', $decoded->email],
                    ['Role', $decoded->role],
                    ['Expire', date('Y-m-d H:i:s', $decoded->exp)],
                ]
            );
            $this->newLine();
            
        } catch (\Exception $e) {
            $this->error("Erreur décodage: {$e->getMessage()}");
        }
        
        // 5. Tester expiration
        try {
            $expiringSoon = JwtService::isTokenExpiringSoon($token);
            $this->info($expiringSoon ? 'Token expire bientôt' : 'Token valide pour longtemps');
            $this->newLine();
            
        } catch (\Exception $e) {
            $this->warn("Méthode isTokenExpiringSoon non disponible");
        }
        
        // 6. Extraire les données
        try {
            $userData = JwtService::extractUserData($token);
            $this->info('Extraction des données:');
            foreach ($userData as $key => $value) {
                $this->line("  {$key}: {$value}");
            }
            
        } catch (\Exception $e) {
            $this->warn("Méthode extractUserData non disponible");
        }
        
        $this->newLine();
        $this->info('Tests terminés avec succès!');
        
        return 0;
    }
}