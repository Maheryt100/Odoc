<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;

/**
 * Middleware pour restreindre l'accès au module TopoFlux
 * 
 * RÈGLES:
 * ✅ Admin District et User District: PEUVENT accéder
 * ❌ Super Admin et Central User: NE PEUVENT PAS (lecture seule)
 */
class EnsureTopoFluxAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login')
                ->withErrors(['error' => 'Vous devez être connecté pour accéder à cette page']);
        }

        // ✅ Vérifier si l'utilisateur peut accéder au TopoFlux
        if (!$user->canAccessTopoFlux()) {
            abort(403, 'Accès refusé. Le module TopoFlux est réservé aux administrateurs et utilisateurs de district.');
        }

        return $next($request);
    }
}