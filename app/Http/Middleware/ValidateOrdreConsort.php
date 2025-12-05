<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Demander;
use Illuminate\Support\Facades\Log;

class ValidateOrdreConsort
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->has('id_propriete') && $request->has('id_demandeur')) {
            // Auto-calculer l'ordre si non fourni
            if (!$request->has('ordre') || !$request->ordre) {
                $maxOrdre = Demander::where('id_propriete', $request->id_propriete)
                    ->where('status', 'active')
                    ->max('ordre') ?? 0;
                
                $request->merge(['ordre' => $maxOrdre + 1]);
                
                Log::info('🔢 Ordre auto-calculé par middleware', [
                    'propriete_id' => $request->id_propriete,
                    'ordre' => $maxOrdre + 1
                ]);
            }
        }

        return $next($request);
    }
}