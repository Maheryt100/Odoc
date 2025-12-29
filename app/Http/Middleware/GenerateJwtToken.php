<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\JwtService;
use Illuminate\Support\Facades\Log;

class GenerateJwtToken
{
    /**
     * Génère automatiquement un token JWT pour FastAPI si l'utilisateur est connecté
     * Le token est stocké en session et accessible via Inertia
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        // Si utilisateur connecté et pas de token en session (ou expiré)
        if ($user) {
            $existingToken = session('geodoc_jwt');
            
            // Générer nouveau token si aucun ou expiré
            if (!$existingToken || !JwtService::isTokenValid($existingToken)) {
                try {
                    $newToken = JwtService::generateToken($user);
                    session(['geodoc_jwt' => $newToken]);
                    
                    Log::debug('JWT généré pour utilisateur', [
                        'user_id' => $user->id,
                        'role' => $user->role
                    ]);
                } catch (\Exception $e) {
                    Log::error('Erreur génération JWT', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                    
                    // Nettoyer la session en cas d'erreur
                    session()->forget('geodoc_jwt');
                }
            }
        } else {
            // Si pas d'utilisateur, nettoyer la session
            session()->forget('geodoc_jwt');
        }
        
        return $next($request);
    }
}