<?php

/**
 * app/Services/ProprieteService.php
 * Pour centraliser la logique métier des propriétés
 */

namespace App\Services;

use App\Models\Propriete;
use App\Models\Demander;
use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Facades\Log;

class ProprieteService
{
    /**
     * Archiver une propriété (toutes ses demandes actives)
     */
    public function archivePropriete(int $proprieteId, ?string $motif = null): array
    {
        DB::beginTransaction();
        
        try {
            $propriete = Propriete::with('demandesActives.demandeur')->findOrFail($proprieteId);
            
            if (!$propriete->canBeArchived()) {
                return [
                    'success' => false,
                    'message' => 'Impossible d\'archiver : cette propriété n\'a aucune demande active.'
                ];
            }
            
            $demandesActives = $propriete->demandesActives;
            $count = 0;
            $demandeurs = [];
            
            foreach ($demandesActives as $demande) {
                $demande->update([
                    'status' => Demander::STATUS_ARCHIVE,
                    'motif_archive' => $motif
                ]);
                $count++;
                $demandeurs[] = $demande->demandeur->nom_demandeur;
            }
            
            DB::commit();
            
            return [
                'success' => true,
                'message' => "Propriété Lot {$propriete->lot} acquise : {$count} demandeur(s) archivé(s)"
            ];
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            return [
                'success' => false,
                'message' => 'Erreur lors de l\'archivage : ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Désarchiver une propriété
     */
    public function unarchivePropriete(int $proprieteId): array
    {
        DB::beginTransaction();
        
        try {
            $propriete = Propriete::with('demandesArchivees')->findOrFail($proprieteId);
            
            if (!$propriete->canBeUnarchived()) {
                return [
                    'success' => false,
                    'message' => 'Impossible de désarchiver cette propriété.'
                ];
            }
            
            $demandesArchivees = $propriete->demandesArchivees;
            $count = 0;
            
            foreach ($demandesArchivees as $demande) {
                $demande->update([
                    'status' => Demander::STATUS_ACTIVE,
                    'motif_archive' => null
                ]);
                $count++;
            }
            
            DB::commit();
            
            return [
                'success' => true,
                'message' => "Propriété Lot {$propriete->lot} désarchivée : {$count} demandeur(s) réactivé(s)"
            ];
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            return [
                'success' => false,
                'message' => 'Erreur lors de la désarchivation : ' . $e->getMessage()
            ];
        }
    }
}