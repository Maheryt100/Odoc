<?php

namespace App\Http\Middleware;

use App\Models\Propriete;
use Closure;
use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Log;

/**
 * Empêche la modification/suppression de propriétés archivées ou dans dossier fermé
 */
class ValidateProprieteAction
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $action  (modify|delete|archive)
     * @return mixed
     */
    public function handle(Request $request, Closure $next, string $action = 'modify')
    {
        $proprieteId = $request->route('id');
        
        if (!$proprieteId) {
            return $next($request);
        }

        try {
            $propriete = Propriete::with(['dossier', 'demandes'])->findOrFail($proprieteId);
 
            if ($propriete->dossier && $propriete->dossier->is_closed) {
                
                return back()->with('error', 
                    "Action interdite : le dossier est fermé."
                );
            }

            //  VÉRIFICATION 2 : Propriété archivée (selon action)
            if ($action === 'modify' || $action === 'delete') {
                if ($propriete->is_archived) {
                    
                    $message = $action === 'delete'
                        ? "Impossible de supprimer la propriété Lot {$propriete->lot} : elle est archivée (acquise)."
                        : "Impossible de modifier la propriété Lot {$propriete->lot} : elle est archivée (acquise).";
                    
                    return back()->with('error', $message);
                }
            }

            // VÉRIFICATION 3 : Suppression avec demandeurs actifs
            if ($action === 'delete') {
                $stats = $propriete->getDemandesStats();
                
                if ($stats['actives'] > 0) {
                    
                    return back()->with('error', 
                        "Impossible de supprimer la propriété Lot {$propriete->lot} : " .
                        "{$stats['actives']} demandeur(s) actif(s) associé(s). " .
                        "Dissociez-les d'abord."
                    );
                }
                
                if ($stats['archivees'] > 0) {
                    
                    return back()->with('error', 
                        "Impossible de supprimer la propriété Lot {$propriete->lot} : " .
                        "elle contient un historique de {$stats['archivees']} acquisition(s). " .
                        "Les données historiques doivent être conservées."
                    );
                }
            }

            return $next($request);
            
        } catch (\Exception $e) {

            return back()->with('error', 'Erreur de validation : ' . $e->getMessage());
        }
    }
}