<?php
// app/Services/JwtService.php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Models\User;

class JwtService
{
    /**
     * Clé secrète pour signer les tokens
     * ⚠️ DOIT être identique à FastAPI (.env GEODOC_JWT_SECRET)
     */
    private static function getSecretKey(): string
    {
        // On utilise la config définie dans config/app.php
        $key = config('app.jwt_secret');

        if (!$key) {
            throw new \Exception("La clé JWT_SECRET_KEY n'est pas définie dans le fichier .env");
        }

        return $key;
    }
    
    /**
     * Génère un JWT pour un utilisateur GeODOC
     * 
     * @param User $user L'utilisateur connecté
     * @return string Le token JWT
     */
    public static function generateToken(User $user): string
    {
        $now = time();
        
        // Payload = données contenues dans le token
        $payload = [
            // Champs standard JWT
            'iss' => config('app.url'),           // Issuer (qui a créé le token)
            'iat' => $now,                        // Issued at (quand créé)
            'exp' => $now + 3600,                 // Expiration (1 heure)
            
            // Champs personnalisés GeODOC
            'sub' => $user->id,                   // Subject (ID utilisateur)
            'email' => $user->email,
            'name' => $user->name,
            'role' => $user->role,
            'id_district' => $user->id_district,
        ];
        
        // Encoder le payload avec la clé secrète
        return JWT::encode($payload, self::getSecretKey(), 'HS256');
    }
    
    /**
     * Décode et valide un JWT
     * 
     * @param string $token Le token à décoder
     * @return object Les données du token
     * @throws \Exception Si token invalide
     */
    public static function decodeToken(string $token): object
    {
        try {
            return JWT::decode($token, new Key(self::getSecretKey(), 'HS256'));
        } catch (\Exception $e) {
            throw new \Exception("Token invalide : " . $e->getMessage());
        }
    }
    
    /**
     * Vérifie si un token est encore valide
     * 
     * @param string $token
     * @return bool
     */
    public static function isTokenValid(string $token): bool
    {
        try {
            $decoded = self::decodeToken($token);
            
            // Vérifier expiration
            if (isset($decoded->exp) && $decoded->exp < time()) {
                return false;
            }
            
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
    
    /**
     * Rafraîchit un token (génère un nouveau)
     * 
     * @param string $oldToken L'ancien token
     * @return string Nouveau token
     */
    public static function refreshToken(string $oldToken): string
    {
        $decoded = self::decodeToken($oldToken);
        
        // Récupérer l'utilisateur
        $user = User::find($decoded->sub);
        
        if (!$user) {
            throw new \Exception("Utilisateur introuvable");
        }
        
        // Générer nouveau token
        return self::generateToken($user);
    }
}