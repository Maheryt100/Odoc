<?php

namespace App\Http\Controllers\Dashboard\Services\Statistics;


/**
 * Service principal de statistiques avec cache intégré
 * Responsabilité : Orchestrer les services et gérer le cache
 */
class StatisticsService
{
    public function __construct(
        private PeriodService $periodService,
        private StatisticsCalculator $calculator,
        private ChartsGenerator $chartsGenerator,
        private StatisticsCacheService $cache
    ) {}
    
    /**
     * Obtenir toutes les statistiques pour la période donnée (avec cache)
     */
    public function getAllStats(array $dates): array
    {
        return $this->cache->remember(
            'all_stats',
            ['dates' => $dates],
            fn() => [
                'overview' => $this->calculator->getOverviewStats($dates),
                'dossiers' => $this->calculator->getDossiersStats($dates),
                'proprietes' => $this->calculator->getProprietesStats($dates),
                'demandeurs' => $this->calculator->getDemandeursStats($dates),
                'demographics' => $this->calculator->getDemographicsStats($dates),
                'financials' => $this->calculator->getFinancialsStats($dates),
                'geographic' => $this->calculator->getGeographicStats($dates),
                'performance' => $this->calculator->getPerformanceStats($dates),
            ]
        );
    }
    
    /**
     * Obtenir tous les graphiques (avec cache)
     */
    public function getAllCharts(array $dates): array
    {
        return $this->cache->remember(
            'all_charts',
            ['dates' => $dates],
            fn() => $this->chartsGenerator->getAllCharts($dates)
        );
    }
    
    /**
     * Obtenir les dates de période
     */
    public function getPeriodDates(string $period, $customFrom = null, $customTo = null): array
    {
        return $this->periodService->getPeriodDates($period, $customFrom, $customTo);
    }
    
    /**
     * Invalider le cache après modification de données
     */
    public function invalidateCache(?string $type = null): void
    {
        if ($type) {
            $this->cache->forget($type);
        } else {
            $this->cache->forgetUserCache();
        }
    }
    
    /**
     * Invalider tout le cache d'un district
     */
    public function invalidateDistrictCache(int $districtId): void
    {
        $this->cache->forgetDistrictCache($districtId);
    }
    
    /**
     * Obtenir les statistiques du cache
     */
    public function getCacheStats(): array
    {
        return $this->cache->getCacheStats();
    }
    
    /**
     * Préchauffer le cache
     */
    public function warmUpCache(): void
    {
        $this->cache->warmUp();
    }
}