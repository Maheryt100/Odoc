<?php

namespace App\Observers;

use App\Models\Propriete;
use App\Services\PrixCalculatorService;
use App\Http\Controllers\Dashboard\Services\Statistics\StatisticsCacheService;
use Illuminate\Support\Facades\Log;

/**
 * Observer pour recalculer les prix des demandes quand une propriété change
 */
class ProprieteObserver
{

    public function __construct(
        private StatisticsCacheService $cache
    ) {}
    
    // public function created(Propriete $propriete): void
    // {
    //     $this->invalidateCache($propriete);
    // }

    public function created(Propriete $propriete): void
    {
        // 1️⃣ Invalidation du cache si dossier présent
        if ($propriete->dossier) {
            $this->cache->forgetDistrictCache($propriete->dossier->id_district);
            
            Log::info("🗑️ Cache invalidé suite à création Propriete", [
                'propriete_id' => $propriete->id,
                'district_id' => $propriete->dossier->id_district,
            ]);
        }

        // 2️⃣ Calcul du prix + log
        try {
            $prix = PrixCalculatorService::calculerPrixTotal($propriete);

            Log::info("Propriété créée", [
                'propriete_id' => $propriete->id,
                'lot' => $propriete->lot,
                'vocation' => $propriete->vocation,
                'contenance' => $propriete->contenance,
                'prix_calcule' => $prix
            ]);
        } catch (\Exception $e) {
            Log::warning("Propriété créée mais prix non calculable", [
                'propriete_id' => $propriete->id,
                'error' => $e->getMessage()
            ]);
        }
    }


    public function updated(Propriete $propriete): void
    {
        $this->invalidateCache($propriete);
    }

    public function deleted(Propriete $propriete): void
    {
        $this->invalidateCache($propriete);
    }
    
    private function invalidateCache(Propriete $propriete): void
    {
        if ($propriete->dossier) {
            $this->cache->forgetDistrictCache($propriete->dossier->id_district);
            
            Log::info("Cache invalidé suite à modification Propriete", [
                'propriete_id' => $propriete->id,
                'district_id' => $propriete->dossier->id_district,
            ]);
        }
    }
    /**
     * Quand la vocation ou la contenance change, recalculer les prix de toutes les demandes liées
     */
    public function updating(Propriete $propriete): void
    {
        // Vérifier si les champs impactant le prix ont changé
        $champsCritiques = ['vocation', 'contenance'];
        $aChange = false;

        foreach ($champsCritiques as $champ) {
            if ($propriete->isDirty($champ)) {
                $aChange = true;
                Log::info("Propriété modifiée: champ '{$champ}' changé", [
                    'propriete_id' => $propriete->id,
                    'lot' => $propriete->lot,
                    'ancien' => $propriete->getOriginal($champ),
                    'nouveau' => $propriete->$champ
                ]);
            }
        }

        if (!$aChange) {
            return; // Pas besoin de recalculer
        }

        // Recalculer le nouveau prix
        try {
            $nouveauPrix = PrixCalculatorService::calculerPrixTotal($propriete);

            // Mettre à jour toutes les demandes liées à cette propriété
            $demandesAffectees = $propriete->demanders()->update([
                'total_prix' => $nouveauPrix
            ]);

            Log::info("Prix recalculés suite à modification propriété", [
                'propriete_id' => $propriete->id,
                'lot' => $propriete->lot,
                'nouveau_prix' => $nouveauPrix,
                'demandes_affectees' => $demandesAffectees
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur recalcul prix après modification propriété", [
                'propriete_id' => $propriete->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Quand une propriété est créée, loguer l'info
     */
    // public function created(Propriete $propriete): void
    // {
    //     try {
    //         $prix = PrixCalculatorService::calculerPrixTotal($propriete);
            
    //         Log::info("Propriété créée", [
    //             'propriete_id' => $propriete->id,
    //             'lot' => $propriete->lot,
    //             'vocation' => $propriete->vocation,
    //             'contenance' => $propriete->contenance,
    //             'prix_calcule' => $prix
    //         ]);
    //     } catch (\Exception $e) {
    //         Log::warning("Propriété créée mais prix non calculable", [
    //             'propriete_id' => $propriete->id,
    //             'error' => $e->getMessage()
    //         ]);
    //     }
    // }
}