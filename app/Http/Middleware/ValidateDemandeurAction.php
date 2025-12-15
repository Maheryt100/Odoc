<?php

namespace App\Http\Middleware;

use App\Models\Demandeur;
use App\Models\Demander;
use App\Models\Dossier;
use Closure;
use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Log;

/**
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
        
            //  VÉRIFICATION SELON L'ACTION
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
            
            return back()->with('error', 'Erreur de validation : ' . $e->getMessage());
        }
    }

    /**
     * Valider le retrait d'un dossier
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
            
            
            $message = "Impossible de retirer {$demandeur->nom_complet} du dossier.\n\n";
            $message .= " Associé à " . count($lots) . " propriété(s) : Lot(s) " . implode(', ', $lots) . "\n";
            
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
     * Valider la suppression définitive
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
            
            $message = "Impossible de supprimer définitivement {$demandeur->nom_complet}.\n\n";
            $message .= " Utilisé dans " . count($parDossier) . " dossier(s) :\n\n";
            
            foreach ($parDossier as $nomDossier => $infos) {
                $message .= "{$nomDossier} :\n";
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
     * CORRECTION : Valider la modification (version simplifiée)
     */
    private function validateModify($demandeur, $dossierId, $request, $next)
    {
        // CAS 1 : Si on modifie depuis un dossier spécifique
        if ($dossierId) {
            $dossier = Dossier::find($dossierId);
            
            // Vérifier si le dossier est fermé
            if ($dossier && $dossier->is_closed) {

                return back()->with('error', 
                    " Impossible de modifier : le dossier est fermé."
                );
            }
        }
        
        // CAS 2 : Vérifier si le demandeur a des propriétés archivées (optionnel)
        $hasArchivedProperties = Demander::where('id_demandeur', $demandeur->id)
            ->where('status', 'archive')
            ->exists();
        
        if ($hasArchivedProperties) {
            
            //  CHOIX : Bloquer ou autoriser avec avertissement ?
            // Option A : Bloquer complètement
            // return back()->with('error', 
            //     " Ce demandeur a des propriétés acquises. Modification interdite."
            // );
            
            // Option B : Autoriser avec avertissement (RECOMMANDÉ)
            // (L'avertissement sera affiché dans le formulaire)
        }

        // Autoriser la modification
        return $next($request);
    }
}