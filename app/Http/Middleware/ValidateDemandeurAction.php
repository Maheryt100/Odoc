<?php

namespace App\Http\Middleware;

use App\Models\Demandeur;
use App\Models\Demander;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * ✅ MIDDLEWARE : Valider les actions sur un demandeur
 * Empêche la modification/suppression de demandeurs liés à des propriétés
 */
class ValidateDemandeurAction
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $action  (modify|delete|remove_from_dossier)
     * @return mixed
     */
    public function handle(Request $request, Closure $next, string $action = 'modify')
    {
        // Récupérer l'ID depuis la route (peut être id_demandeur ou id)
        $demandeurId = $request->route('id_demandeur') ?? $request->route('id');
        $dossierId = $request->route('id_dossier');
        
        if (!$demandeurId) {
            return $next($request);
        }

        try {
            $demandeur = Demandeur::with(['demandes.propriete.dossier'])->findOrFail($demandeurId);
            
            // ✅ VÉRIFICATION SELON L'ACTION
            switch ($action) {
                case 'remove_from_dossier':
                    return $this->validateRemoveFromDossier($demandeur, $dossierId, $request, $next);
                    
                case 'delete':
                    return $this->validateDefinitiveDelete($demandeur, $request, $next);
                    
                case 'modify':
                    return $this->validateModify($demandeur, $dossierId, $request, $next);
                    
                default:
                    return $next($request);
            }
            
        } catch (\Exception $e) {
            Log::error('Erreur middleware ValidateDemandeurAction', [
                'demandeur_id' => $demandeurId,
                'action' => $action,
                'error' => $e->getMessage()
            ]);
            
            return back()->with('error', 'Erreur de validation : ' . $e->getMessage());
        }
    }

    /**
     * ✅ Valider le retrait d'un dossier
     */
    private function validateRemoveFromDossier($demandeur, $dossierId, $request, $next)
    {
        if (!$dossierId) {
            return back()->with('error', 'ID dossier manquant');
        }

        // Vérifier les propriétés liées dans ce dossier
        $proprietesLiees = Demander::where('id_demandeur', $demandeur->id)
            ->whereHas('propriete', function($q) use ($dossierId) {
                $q->where('id_dossier', $dossierId);
            })
            ->with('propriete')
            ->get();

        if ($proprietesLiees->count() > 0) {
            $lots = $proprietesLiees->pluck('propriete.lot')->toArray();
            $actives = $proprietesLiees->where('status', 'active')->count();
            $archivees = $proprietesLiees->where('status', 'archive')->count();
            
            Log::warning('Retrait bloqué : propriétés liées', [
                'demandeur_id' => $demandeur->id,
                'dossier_id' => $dossierId,
                'proprietes_count' => $proprietesLiees->count(),
                'actives' => $actives,
                'archivees' => $archivees
            ]);
            
            $message = "❌ Impossible de retirer {$demandeur->nom_complet} du dossier.\n\n";
            $message .= "📊 Associé à " . count($lots) . " propriété(s) : Lot(s) " . implode(', ', $lots) . "\n";
            
            if ($actives > 0) {
                $message .= "• {$actives} association(s) active(s)\n";
            }
            if ($archivees > 0) {
                $message .= "• {$archivees} acquisition(s) archivée(s)\n";
            }
            
            $message .= "\n💡 Dissociez d'abord le demandeur des propriétés.";
            
            return back()->with('error', $message);
        }

        return $next($request);
    }

    /**
     * ✅ Valider la suppression définitive
     */
    private function validateDefinitiveDelete($demandeur, $request, $next)
    {
        // Vérifier TOUTES les propriétés dans TOUS les dossiers
        $toutesLesProprietes = Demander::where('id_demandeur', $demandeur->id)
            ->with(['propriete.dossier'])
            ->get();

        if ($toutesLesProprietes->count() > 0) {
            // Grouper par dossier
            $parDossier = [];
            foreach ($toutesLesProprietes as $demande) {
                $dossierNom = $demande->propriete->dossier->nom_dossier ?? 'Inconnu';
                if (!isset($parDossier[$dossierNom])) {
                    $parDossier[$dossierNom] = ['actives' => [], 'archivees' => []];
                }
                
                if ($demande->status === 'active') {
                    $parDossier[$dossierNom]['actives'][] = $demande->propriete->lot;
                } else {
                    $parDossier[$dossierNom]['archivees'][] = $demande->propriete->lot;
                }
            }
            
            Log::warning('Suppression bloquée : propriétés dans plusieurs dossiers', [
                'demandeur_id' => $demandeur->id,
                'dossiers_count' => count($parDossier),
                'proprietes_count' => $toutesLesProprietes->count()
            ]);
            
            $message = "❌ Impossible de supprimer définitivement {$demandeur->nom_complet}.\n\n";
            $message .= "📊 Utilisé dans " . count($parDossier) . " dossier(s) :\n\n";
            
            foreach ($parDossier as $nomDossier => $infos) {
                $message .= "📁 {$nomDossier} :\n";
                if (!empty($infos['actives'])) {
                    $message .= "  • " . count($infos['actives']) . " association(s) active(s)\n";
                }
                if (!empty($infos['archivees'])) {
                    $message .= "  • " . count($infos['archivees']) . " acquisition(s) archivée(s)\n";
                }
            }
            
            $message .= "\n💡 Dissociez d'abord le demandeur de TOUTES les propriétés.";
            
            return back()->with('error', $message);
        }

        return $next($request);
    }

    /**
     * ✅ Valider la modification
     */
    private function validateModify($demandeur, $dossierId, $request, $next)
    {
        // Vérifier si le dossier est fermé (si applicable)
        if ($dossierId) {
            $propriete = $demandeur->demandes()
                ->whereHas('propriete', function($q) use ($dossierId) {
                    $q->where('id_dossier', $dossierId)
                      ->whereHas('dossier', function($sub) {
                          $sub->where('is_closed', true);
                      });
                })
                ->first();

            if ($propriete) {
                Log::warning('Modification bloquée : dossier fermé', [
                    'demandeur_id' => $demandeur->id,
                    'dossier_id' => $dossierId
                ]);
                
                return back()->with('error', 
                    "❌ Impossible de modifier : le dossier est fermé."
                );
            }
        }

        return $next($request);
    }
}