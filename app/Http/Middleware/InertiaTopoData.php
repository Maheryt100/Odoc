<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\JwtService;
use Inertia\Inertia;
// use Illuminate\Support\Facades\Log;

class InertiaTopoData
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $token = null;
        
        // ========================================
        // GÉNÉRATION TOKEN JWT
        // ========================================
        if ($user) {
            try {
                $token = JwtService::generateToken($user);
                session(['geodoc_jwt' => $token]);
                
                // Log::debug('JWT généré pour TopoFlux', [
                //     'user_id' => $user->id,
                //     'token_preview' => substr($token, 0, 20) . '...'
                // ]);
                
            } catch (\Exception $e) {
                // Log::error('Erreur génération JWT', [
                //     'user_id' => $user->id,
                //     'error' => $e->getMessage()
                // ]);
            }
        }
        
        // ========================================
        // PARTAGE AVEC REACT (GLOBAL)
        // ========================================
        Inertia::share([
            'fastapi' => fn () => [
                'url' => config('services.fastapi.url'),
                'token' => $token,  // Token disponible partout
                'connected' => !is_null($token)
            ]
        ]);
        
        return $next($request);
    }
}