<?php


namespace App\Observers;
use Illuminate\Support\Facades\Log;
use App\Models\Demandeur;
use App\Http\Controllers\Dashboard\Services\StatisticsCacheService;

/**
 * Observer Demandeur : Invalider le cache à chaque modification
 */
class DemandeurObserver
{
    public function __construct(
        private StatisticsCacheService $cache
    ) {}
    
    public function created(Demandeur $demandeur): void
    {
        $this->invalidateCache($demandeur);
    }

    public function updated(Demandeur $demandeur): void
    {
        $this->invalidateCache($demandeur);
    }

    public function deleted(Demandeur $demandeur): void
    {
        $this->invalidateCache($demandeur);
    }
    
    private function invalidateCache(Demandeur $demandeur): void
    {
        // Invalider tous les districts liés aux dossiers de ce demandeur
        $districtIds = $demandeur->dossiers()->pluck('id_district')->unique();
        
        foreach ($districtIds as $districtId) {
            $this->cache->forgetDistrictCache($districtId);
        }
        
        Log::info("🗑️ Cache invalidé suite à modification Demandeur", [
            'demandeur_id' => $demandeur->id,
            'districts_affected' => $districtIds->toArray(),
        ]);
    }
}