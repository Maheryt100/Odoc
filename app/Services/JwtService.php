<?php
// ============================================
// app/Services/JwtService.php
// VERSION CORRIGÉE
// ============================================

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Models\User;
// use Illuminate\Support\Facades\Log;

class JwtService
{
    private static function getTokenLifetime(): int
    {
        return config('jwt.lifetime', 28800);
    }
    
    private static function getSecretKey(): string
    {
        $key = config('app.jwt_secret');

        if (!$key) {
            throw new \Exception("JWT_SECRET_KEY non definie dans .env");
        }

        return $key;
    }
    
    /**
     * Genere un JWT compatible avec FastAPI
     */
    public static function generateToken(User $user): string
    {
        $now = time();
        $lifetime = self::getTokenLifetime();
        
        // PAYLOAD COMPATIBLE AVEC FASTAPI
        $payload = [
            'sub' => $user->email,  // FastAPI utilise l'email
            'role' => $user->role,
            'exp' => $now + $lifetime,
            'iat' => $now,
            'iss' => config('app.url'),
            
            // Donnees supplementaires
            'user_id' => $user->id,
            'name' => $user->name,
            'id_district' => $user->id_district,
        ];
        
        $token = JWT::encode($payload, self::getSecretKey(), 'HS256');
        
        if (config('app.debug')) {

        }
        
        return $token;
    }
    
    /**
     * Decode et valide un JWT
     */
    public static function decodeToken(string $token): object
    {
        try {
            $decoded = JWT::decode($token, new Key(self::getSecretKey(), 'HS256'));
            
            if (isset($decoded->exp) && $decoded->exp < time()) {
                throw new \Exception("Token expire");
            }
            
            return $decoded;
            
        } catch (\Firebase\JWT\ExpiredException $e) {
            throw new \Exception("Token expire");
        } catch (\Firebase\JWT\SignatureInvalidException $e) {
            throw new \Exception("Signature invalide");
        } catch (\Exception $e) {
            throw new \Exception("Token invalide : " . $e->getMessage());
        }
    }
    
    /**
     * Verifie si un token est valide
     */
    public static function isTokenValid(string $token): bool
    {
        try {
            self::decodeToken($token);
            return true;
        } catch (\Exception $e) {

            return false;
        }
    }
    
    /**
     * Verifie si le token expire bientot (< 30 min)
     */
    public static function isTokenExpiringSoon(string $token): bool
    {
        try {
            $decoded = self::decodeToken($token);
            
            if (!isset($decoded->exp)) {
                return true;
            }
            
            $timeRemaining = $decoded->exp - time();
            return $timeRemaining < 1800;
            
        } catch (\Exception $e) {
            return true;
        }
    }
    
    /**
     * Rafraichit un token
     */
    public static function refreshToken(string $oldToken): string
    {
        $decoded = self::decodeToken($oldToken);
        
        $user = User::where('email', $decoded->sub)->first();
        
        if (!$user) {
            throw new \Exception("Utilisateur introuvable");
        }
        
        if (!$user->status) {
            throw new \Exception("Utilisateur desactive");
        }
        
        return self::generateToken($user);
    }
    
    /**
     * Extrait les donnees utilisateur d'un token
     */
    public static function extractUserData(string $token): ?array
    {
        try {
            $decoded = self::decodeToken($token);
            
            return [
                'email' => $decoded->sub ?? null,
                'user_id' => $decoded->user_id ?? null,
                'name' => $decoded->name ?? null,
                'role' => $decoded->role ?? null,
                'expires_at' => isset($decoded->exp) 
                    ? date('Y-m-d H:i:s', $decoded->exp) 
                    : null
            ];
            
        } catch (\Exception $e) {
            return null;
        }
    }
}