<?php

namespace App\Http\Middleware;

use App\Models\Propriete;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * ✅ MIDDLEWARE : Valider les actions sur une propriété
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
            
            // ✅ VÉRIFICATION 1 : Dossier fermé
            if ($propriete->dossier && $propriete->dossier->is_closed) {
                Log::warning('Action bloquée : dossier fermé', [
                    'propriete_id' => $proprieteId,
                    'action' => $action,
                    'dossier_id' => $propriete->dossier->id
                ]);
                
                return back()->with('error', 
                    "❌ Action interdite : le dossier est fermé."
                );
            }

            // ✅ VÉRIFICATION 2 : Propriété archivée (selon action)
            if ($action === 'modify' || $action === 'delete') {
                if ($propriete->is_archived) {
                    Log::warning('Action bloquée : propriété archivée', [
                        'propriete_id' => $proprieteId,
                        'lot' => $propriete->lot,
                        'action' => $action
                    ]);
                    
                    $message = $action === 'delete'
                        ? "❌ Impossible de supprimer la propriété Lot {$propriete->lot} : elle est archivée (acquise)."
                        : "❌ Impossible de modifier la propriété Lot {$propriete->lot} : elle est archivée (acquise).";
                    
                    return back()->with('error', $message);
                }
            }

            // ✅ VÉRIFICATION 3 : Suppression avec demandeurs actifs
            if ($action === 'delete') {
                $stats = $propriete->getDemandesStats();
                
                if ($stats['actives'] > 0) {
                    Log::warning('Suppression bloquée : demandeurs actifs', [
                        'propriete_id' => $proprieteId,
                        'lot' => $propriete->lot,
                        'demandeurs_actifs' => $stats['actives']
                    ]);
                    
                    return back()->with('error', 
                        "❌ Impossible de supprimer la propriété Lot {$propriete->lot} : " .
                        "{$stats['actives']} demandeur(s) actif(s) associé(s). " .
                        "Dissociez-les d'abord."
                    );
                }
                
                if ($stats['archivees'] > 0) {
                    Log::warning('Suppression bloquée : historique présent', [
                        'propriete_id' => $proprieteId,
                        'lot' => $propriete->lot,
                        'demandeurs_archives' => $stats['archivees']
                    ]);
                    
                    return back()->with('error', 
                        "❌ Impossible de supprimer la propriété Lot {$propriete->lot} : " .
                        "elle contient un historique de {$stats['archivees']} acquisition(s). " .
                        "Les données historiques doivent être conservées."
                    );
                }
            }

            return $next($request);
            
        } catch (\Exception $e) {
            Log::error('Erreur middleware ValidateProprieteAction', [
                'propriete_id' => $proprieteId,
                'error' => $e->getMessage()
            ]);
            
            return back()->with('error', 'Erreur de validation : ' . $e->getMessage());
        }
    }
}