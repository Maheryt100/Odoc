<?php

namespace App\Http\Controllers\Dashboard\Services;

/**
 * Service principal de statistiques
 * Responsabilité : Orchestrer les autres services et fournir une API unifiée
 * 
 * Ce service ne contient plus de logique métier, il délègue tout
 * aux services spécialisés pour respecter le principe SOLID
 */
class StatisticsService
{
    public function __construct(
        private PeriodService $periodService,
        private StatisticsCalculator $calculator,
        private ChartsGenerator $chartsGenerator
    ) {}
    
    /**
     * Obtenir toutes les statistiques pour la période donnée
     */
    public function getAllStats(array $dates): array
    {
        return [
            'overview' => $this->calculator->getOverviewStats($dates),
            'dossiers' => $this->calculator->getDossiersStats($dates),
            'proprietes' => $this->calculator->getProprietesStats($dates),
            'demandeurs' => $this->calculator->getDemandeursStats($dates),
            'demographics' => $this->calculator->getDemographicsStats($dates),
            'financials' => $this->calculator->getFinancialsStats($dates),
            'geographic' => $this->calculator->getGeographicStats($dates),
            'performance' => $this->calculator->getPerformanceStats($dates),
        ];
    }
    
    /**
     * Obtenir tous les graphiques
     */
    public function getAllCharts(array $dates): array
    {
        return $this->chartsGenerator->getAllCharts($dates);
    }
    
    /**
     * Obtenir les dates de période
     * Délégué au PeriodService
     */
    public function getPeriodDates(string $period, $customFrom = null, $customTo = null): array
    {
        return $this->periodService->getPeriodDates($period, $customFrom, $customTo);
    }
}