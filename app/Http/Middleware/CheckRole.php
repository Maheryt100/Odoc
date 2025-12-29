<?php
// app/Http/Middleware/CheckRole.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Vérifie que l'utilisateur a l'un des rôles autorisés
     * 
     * Usage dans routes:
     * Route::middleware('role:admin_district,user_district')->group(...)
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return redirect()->route('login')
                ->with('error', 'Vous devez être connecté');
        }
        
        // Vérifier si l'utilisateur a l'un des rôles autorisés
        if (!in_array($user->role, $roles)) {
            abort(403, 'Accès refusé : permissions insuffisantes');
        }
        
        return $next($request);
    }
}

