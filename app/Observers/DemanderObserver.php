<?php

namespace App\Observers;

use App\Models\Demander;
use App\Services\PrixCalculatorService;
use App\Http\Controllers\Dashboard\Services\Statistics\StatisticsCacheService;
// use Illuminate\Support\Facades\Log;

class DemanderObserver
{
    public function __construct(
        private StatisticsCacheService $cache
    ) {}

    public function creating(Demander $demander): void
    {
        try {
            // Charger relation si pas chargée
            if (!$demander->relationLoaded('propriete')) {
                $demander->load('propriete.dossier');
            }

            $propriete = $demander->propriete;

            if (!$propriete) {
    
                return;
            }

            $prix = PrixCalculatorService::calculerPrixTotal($propriete);
            $demander->total_prix = $prix;

        } catch (\Exception $e) {
            
            $demander->total_prix = 0;
        }
    }

    public function created(Demander $demander): void
    {
        $this->invalidateCache($demander);

    }

    public function updating(Demander $demander): void
    {
        if ($demander->isDirty('id_propriete')) {
            try {
                $demander->load('propriete.dossier');
                $propriete = $demander->propriete;

                if ($propriete) {
                    $prix = PrixCalculatorService::calculerPrixTotal($propriete);
                    $demander->total_prix = $prix;

                }
            } catch (\Exception $e) {

            }
        }
    }

    public function updated(Demander $demander): void
    {
        $this->invalidateCache($demander);

    }

    public function deleted(Demander $demander): void
    {
        $this->invalidateCache($demander);

    }

    /**
     * Invalidation du cache du district
     */
    private function invalidateCache(Demander $demander): void
    {
        try {
            if ($demander->propriete && $demander->propriete->dossier) {
                $district = $demander->propriete->dossier->id_district;
                $this->cache->forgetDistrictCache($district);

            }
        } catch (\Exception $e) {

        }
    }
}