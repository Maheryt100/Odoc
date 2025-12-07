<?php

namespace App\Observers;

use App\Models\Dossier;
use App\Http\Controllers\Dashboard\Services\StatisticsCacheService;
use Illuminate\Support\Facades\Log;


/**
 * Observer Dossier : Invalider le cache à chaque modification
 */
class DossierObserver
{
    public function __construct(
        private StatisticsCacheService $cache
    ) {}
    
    /**
     * Handle the Dossier "created" event.
     */
    public function created(Dossier $dossier): void
    {
        $this->invalidateCache($dossier);
    }

    /**
     * Handle the Dossier "updated" event.
     */
    public function updated(Dossier $dossier): void
    {
        $this->invalidateCache($dossier);
    }

    /**
     * Handle the Dossier "deleted" event.
     */
    public function deleted(Dossier $dossier): void
    {
        $this->invalidateCache($dossier);
    }
    
    /**
     * Invalider le cache pour ce dossier
     */
    private function invalidateCache(Dossier $dossier): void
    {
        // Invalider le cache du district concerné
        $this->cache->forgetDistrictCache($dossier->id_district);
        
        Log::info("Cache invalidé suite à modification Dossier", [
            'dossier_id' => $dossier->id,
            'district_id' => $dossier->id_district,
        ]);
    }
}