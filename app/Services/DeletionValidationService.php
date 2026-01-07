<?php

namespace App\Services;

use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\Demander;
use App\Models\Contenir;
use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Facades\Log;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SERVICE DE VALIDATION ET SUPPRESSION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * RÈGLES DE SUPPRESSION CONFIRMÉES :
 * 
 * PROPRIÉTÉ SUPPRIMABLE SI :
 *    - Aucune demande (ni active, ni archivée)
 * 
 * PROPRIÉTÉ NON SUPPRIMABLE SI :
 *    - Au moins une demande active OU archivée
 * 
 * DEMANDEUR SUPPRIMABLE SI :
 *    - Aucune propriété liée (ni active, ni archivée)
 * 
 * DEMANDEUR NON SUPPRIMABLE SI :
 *    - Au moins une demande active OU archivée
 */
class DeletionValidationService
{
    /**
     * ═══════════════════════════════════════════════════════════════════════
     * VALIDATION SUPPRESSION PROPRIÉTÉ
     * ═══════════════════════════════════════════════════════════════════════
     */
    
    /**
     * Vérifier si une propriété peut être supprimée
     */
    public function canDeletePropriete(int $proprieteId): array
    {
        try {
            $propriete = Propriete::withCount([
                'demandes as total_demandes' // Compte TOUTES les demandes (actives + archivées)
            ])->findOrFail($proprieteId);
            
            //  RÈGLE : Supprimable UNIQUEMENT si AUCUNE demande
            if ($propriete->total_demandes > 0) {
                $demandesActives = $propriete->demandes()
                    ->where('status', Demander::STATUS_ACTIVE)
                    ->count();
                    
                $demandesArchivees = $propriete->demandes()
                    ->where('status', Demander::STATUS_ARCHIVE)
                    ->count();
                
                $messages = [];
                if ($demandesActives > 0) {
                    $messages[] = "{$demandesActives} demande(s) active(s)";
                }
                if ($demandesArchivees > 0) {
                    $messages[] = "{$demandesArchivees} demande(s) archivée(s) (acquise)";
                }
                
                return [
                    'can_delete' => false,
                    'reason' => 'blocked_by_demandes',
                    'message' => "❌Impossible de supprimer la propriété Lot {$propriete->lot} : " . implode(' et ', $messages) . ".",
                    'details' => [
                        'demandes_actives' => $demandesActives,
                        'demandes_archivees' => $demandesArchivees,
                        'total_demandes' => $propriete->total_demandes,
                    ]
                ];
            }
            
            //  Peut être supprimée
            return [
                'can_delete' => true,
                'reason' => 'no_demandes',
                'message' => " La propriété Lot {$propriete->lot} peut être supprimée (aucune demande).",
            ];
            
        } catch (\Exception $e) {
            
            return [
                'can_delete' => false,
                'reason' => 'error',
                'message' => 'Erreur lors de la vérification : ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Supprimer une propriété (avec validation stricte)
     */
    public function deletePropriete(int $proprieteId): array
    {
        // ÉTAPE 1 : Validation
        $validation = $this->canDeletePropriete($proprieteId);
        
        if (!$validation['can_delete']) {
            return [
                'success' => false,
                'message' => $validation['message'],
                'details' => $validation['details'] ?? null
            ];
        }
        
        // ÉTAPE 2 : Suppression
        DB::beginTransaction();
        
        try {
            $propriete = Propriete::findOrFail($proprieteId);
            $lot = $propriete->lot;
            
            // Supprimer les pièces jointes associées
            if (method_exists($propriete, 'piecesJointes')) {
                foreach ($propriete->piecesJointes as $piece) {
                    // Supprimer le fichier physique si nécessaire
                    $piece->delete();
                }
            }
            
            // Suppression de la propriété
            $propriete->delete();
            
            DB::commit();
            
            return [
                'success' => true,
                'message' => "Propriété Lot {$lot} supprimée avec succès"
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();

            return [
                'success' => false,
                'message' => 'Erreur lors de la suppression : ' . $e->getMessage()
            ];
        }
    }
    
    
    /**
     * ═══════════════════════════════════════════════════════════════════════
     * 👤 VALIDATION SUPPRESSION DEMANDEUR
     * ═══════════════════════════════════════════════════════════════════════
     */
    
    /**
     * Vérifier si un demandeur peut être supprimé DÉFINITIVEMENT
     */
    public function canDeleteDemandeurDefinitive(int $demandeurId): array
    {
        try {
            $demandeur = Demandeur::withCount([
                'demandes as total_demandes' // Compte TOUTES les demandes
            ])->findOrFail($demandeurId);
            
            //  RÈGLE : Supprimable UNIQUEMENT si AUCUNE demande
            if ($demandeur->total_demandes > 0) {
                $demandesActives = $demandeur->demandes()
                    ->where('status', Demander::STATUS_ACTIVE)
                    ->count();
                    
                $demandesArchivees = $demandeur->demandes()
                    ->where('status', Demander::STATUS_ARCHIVE)
                    ->count();
                
                $messages = [];
                if ($demandesActives > 0) {
                    $messages[] = "{$demandesActives} propriété(s) active(s)";
                }
                if ($demandesArchivees > 0) {
                    $messages[] = "{$demandesArchivees} propriété(s) acquise(s)";
                }
                
                return [
                    'can_delete' => false,
                    'reason' => 'blocked_by_proprietes',
                    'message' => "❌ Impossible de supprimer définitivement {$demandeur->nom_complet} : " . implode(' et ', $messages) . ".",
                    'details' => [
                        'proprietes_actives' => $demandesActives,
                        'proprietes_acquises' => $demandesArchivees,
                        'total_proprietes' => $demandeur->total_demandes,
                    ],
                    'suggestion' => "Vous pouvez uniquement retirer ce demandeur d'un dossier spécifique, mais pas le supprimer définitivement."
                ];
            }
            
            // Peut être supprimé
            return [
                'can_delete' => true,
                'reason' => 'no_proprietes',
                'message' => "{$demandeur->nom_complet} peut être supprimé définitivement (aucune propriété liée).",
            ];
            
        } catch (\Exception $e) {
            
            return [
                'can_delete' => false,
                'reason' => 'error',
                'message' => 'Erreur lors de la vérification : ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Supprimer un demandeur DÉFINITIVEMENT (avec validation stricte)
     */
    public function deleteDemandeurDefinitive(int $demandeurId): array
    {
        // ÉTAPE 1 : Validation
        $validation = $this->canDeleteDemandeurDefinitive($demandeurId);
        
        if (!$validation['can_delete']) {
            return [
                'success' => false,
                'message' => $validation['message'],
                'details' => $validation['details'] ?? null,
                'suggestion' => $validation['suggestion'] ?? null
            ];
        }
        
        // ÉTAPE 2 : Suppression
        DB::beginTransaction();
        
        try {
            $demandeur = Demandeur::findOrFail($demandeurId);
            $nomComplet = $demandeur->nom_complet;
            $cin = $demandeur->cin;
            
            // Supprimer les relations dans contenir (tous les dossiers)
            Contenir::where('id_demandeur', $demandeurId)->delete();
            
            // Supprimer les pièces jointes associées
            if (method_exists($demandeur, 'piecesJointes')) {
                foreach ($demandeur->piecesJointes as $piece) {
                    $piece->delete();
                }
            }
            
            // Suppression du demandeur
            $demandeur->delete();
            
            DB::commit();
            
            return [
                'success' => true,
                'message' => " {$nomComplet} (CIN: {$cin}) supprimé définitivement avec succès"
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return [
                'success' => false,
                'message' => 'Erreur lors de la suppression : ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Retirer un demandeur d'un dossier spécifique (SANS suppression définitive)
     */
    public function removeDemandeurFromDossier(int $demandeurId, int $dossierId): array
    {
        DB::beginTransaction();
        
        try {
            $demandeur = Demandeur::findOrFail($demandeurId);
            $nomComplet = $demandeur->nom_complet;
            
            // Vérifier si le demandeur a des demandes dans CE dossier
            $demandesInDossier = Demander::where('id_demandeur', $demandeurId)
                ->whereHas('propriete', function($q) use ($dossierId) {
                    $q->where('id_dossier', $dossierId);
                })
                ->count();
            
            if ($demandesInDossier > 0) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => "Impossible de retirer {$nomComplet} : il a {$demandesInDossier} demande(s) active(s) ou archivée(s) dans ce dossier.",
                    'suggestion' => "Dissociez d'abord le demandeur de toutes ses propriétés avant de le retirer du dossier."
                ];
            }
            
            // Retirer la relation du dossier (table contenir)
            $deleted = Contenir::where('id_demandeur', $demandeurId)
                ->where('id_dossier', $dossierId)
                ->delete();
            
            if (!$deleted) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => "Le demandeur n'est pas dans ce dossier."
                ];
            }
            
            // Vérifier si le demandeur a encore des relations avec d'autres dossiers
            $autresDossiers = Contenir::where('id_demandeur', $demandeurId)->count();
            
            if ($autresDossiers === 0) {
                //  Plus aucune relation → Supprimer définitivement
                $demandeur->delete();
                
                DB::commit();
                
                return [
                    'success' => true,
                    'message' => " {$nomComplet} retiré du dossier et supprimé définitivement (aucune autre relation)."
                ];
            } else {
                // Le demandeur reste dans d'autres dossiers
                DB::commit();
                
                
                return [
                    'success' => true,
                    'message' => "{$nomComplet} retiré du dossier (reste dans {$autresDossiers} autre(s) dossier(s))."
                ];
            }
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return [
                'success' => false,
                'message' => 'Erreur : ' . $e->getMessage()
            ];
        }
    }
    
    
    /**
     * ═══════════════════════════════════════════════════════════════════════
     *  VALIDATION DISSOCIATION
     * ═══════════════════════════════════════════════════════════════════════
     */
    
    /**
     * Vérifier si une dissociation est possible
     */
    public function canDissociate(int $demandeurId, int $proprieteId): array
    {
        try {
            $demande = Demander::where('id_demandeur', $demandeurId)
                ->where('id_propriete', $proprieteId)
                ->with(['demandeur', 'propriete'])
                ->first();
            
            if (!$demande) {
                return [
                    'can_dissociate' => false,
                    'reason' => 'not_found',
                    'message' => 'Liaison introuvable entre ce demandeur et cette propriété.'
                ];
            }
            
            //  Vérifier si la demande est archivée
            if ($demande->status === Demander::STATUS_ARCHIVE) {
                return [
                    'can_dissociate' => false,
                    'reason' => 'archived',
                    'message' => "Impossible de dissocier : la propriété Lot {$demande->propriete->lot} a été acquise par {$demande->demandeur->nom_complet}.",
                    'suggestion' => "Vous pouvez désarchiver la propriété d'abord si nécessaire."
                ];
            }
            
            // Vérifier si le dossier est fermé
            $dossier = $demande->propriete->dossier;
            if ($dossier && $dossier->is_closed) {
                return [
                    'can_dissociate' => false,
                    'reason' => 'dossier_closed',
                    'message' => "Impossible de dissocier : le dossier '{$dossier->nom_dossier}' est fermé."
                ];
            }
            
            // Peut être dissociée
            return [
                'can_dissociate' => true,
                'reason' => 'active',
                'message' => "La dissociation est possible."
            ];
            
        } catch (\Exception $e) {
            
            return [
                'can_dissociate' => false,
                'reason' => 'error',
                'message' => 'Erreur lors de la vérification : ' . $e->getMessage()
            ];
        }
    }
    
    
    /**
     * ═══════════════════════════════════════════════════════════════════════
     *  MÉTHODES D'INFORMATION
     * ═══════════════════════════════════════════════════════════════════════
     */
    
    /**
     * Obtenir les détails de suppression d'une propriété
     */
    public function getProprieteDeleteInfo(int $proprieteId): array
    {
        try {
            $propriete = Propriete::with([
                'demandes.demandeur'
            ])->findOrFail($proprieteId);
            
            $demandesActives = $propriete->demandes()
                ->where('status', Demander::STATUS_ACTIVE)
                ->with('demandeur:id,nom_demandeur,prenom_demandeur,cin')
                ->get();
                
            $demandesArchivees = $propriete->demandes()
                ->where('status', Demander::STATUS_ARCHIVE)
                ->with('demandeur:id,nom_demandeur,prenom_demandeur,cin')
                ->get();
            
            return [
                'propriete' => [
                    'id' => $propriete->id,
                    'lot' => $propriete->lot,
                    'titre' => $propriete->titre,
                ],
                'can_delete' => ($demandesActives->count() + $demandesArchivees->count()) === 0,
                'demandes_actives' => $demandesActives->map(fn($d) => [
                    'id' => $d->id,
                    'demandeur' => $d->demandeur->nom_complet,
                    'cin' => $d->demandeur->cin,
                ]),
                'demandes_archivees' => $demandesArchivees->map(fn($d) => [
                    'id' => $d->id,
                    'demandeur' => $d->demandeur->nom_complet,
                    'cin' => $d->demandeur->cin,
                    'date_archive' => $d->updated_at,
                ]),
                'total_blockers' => $demandesActives->count() + $demandesArchivees->count(),
            ];
            
        } catch (\Exception $e) {
            return [
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Obtenir les détails de suppression d'un demandeur
     */
    public function getDemandeurDeleteInfo(int $demandeurId): array
    {
        try {
            $demandeur = Demandeur::with([
                'demandes.propriete'
            ])->findOrFail($demandeurId);
            
            $demandesActives = $demandeur->demandes()
                ->where('status', Demander::STATUS_ACTIVE)
                ->with('propriete:id,lot,titre,id_dossier')
                ->get();
                
            $demandesArchivees = $demandeur->demandes()
                ->where('status', Demander::STATUS_ARCHIVE)
                ->with('propriete:id,lot,titre,id_dossier')
                ->get();
            
            return [
                'demandeur' => [
                    'id' => $demandeur->id,
                    'nom_complet' => $demandeur->nom_complet,
                    'cin' => $demandeur->cin,
                ],
                'can_delete' => ($demandesActives->count() + $demandesArchivees->count()) === 0,
                'proprietes_actives' => $demandesActives->map(fn($d) => [
                    'id' => $d->id,
                    'lot' => $d->propriete->lot,
                    'titre' => $d->propriete->titre,
                ]),
                'proprietes_acquises' => $demandesArchivees->map(fn($d) => [
                    'id' => $d->id,
                    'lot' => $d->propriete->lot,
                    'titre' => $d->propriete->titre,
                    'date_acquisition' => $d->updated_at,
                ]),
                'total_blockers' => $demandesActives->count() + $demandesArchivees->count(),
            ];
            
        } catch (\Exception $e) {
            return [
                'error' => $e->getMessage()
            ];
        }
    }
}