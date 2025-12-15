<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Dossier;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckDossierAccess
{
    public function handle(Request $request, Closure $next, string $paramName = 'id'): Response
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Non authentifié');
        }

        // Super admin a accès à tout
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Récupérer l'ID du dossier
        $dossierId = $request->route($paramName);

        if (!$dossierId) {
            abort(400, 'ID du dossier manquant');
        }

        // Laisser Eloquent gérer les accessors
        $dossier = Dossier::find($dossierId);

        if (!$dossier) {
            abort(404, 'Dossier introuvable');
        }

        // Vérifier l'accès au district
        if (!$user->canAccessDossier($dossier)) {
            abort(403, 'Vous n\'avez pas accès à ce dossier');
        }

        // Ajouter le dossier à la requête
        $request->merge(['_dossier' => $dossier]);

        return $next($request);
    }
}