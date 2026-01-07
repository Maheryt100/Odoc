<?php

namespace App\Http\Controllers\Dashboard\Services\Statistics;

use Carbon\Carbon;
use App\Models\Dossier;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Dashboard\Services\Shared\Traits\QueryFilterTrait;

/**
 * Service de gestion des périodes pour les statistiques
 * Responsabilité unique : Calculer les plages de dates
 */
class PeriodService
{
    use QueryFilterTrait;
    
    /**
     * Obtenir les dates de début et fin selon la période sélectionnée
     */
    public function getPeriodDates(string $period, $customFrom = null, $customTo = null): array
    {
        $now = now();
        
        return match($period) {
            'today' => [
                'from' => $now->copy()->startOfDay(),
                'to' => $now->copy()->endOfDay()
            ],
            'week' => [
                'from' => $now->copy()->startOfWeek(),
                'to' => $now->copy()->endOfWeek()
            ],
            'month' => [
                'from' => $now->copy()->startOfMonth(),
                'to' => $now->copy()->endOfMonth()
            ],
            'year' => [
                'from' => $now->copy()->startOfYear(),
                'to' => $now->copy()->endOfYear()
            ],
            'all' => [
                'from' => $this->getFirstDossierDate(),
                'to' => $now
            ],
            'custom' => [
                'from' => $customFrom ? Carbon::parse($customFrom) : $now->copy()->subMonth(),
                'to' => $customTo ? Carbon::parse($customTo) : $now
            ],
            default => [
                'from' => $now->copy()->startOfMonth(),
                'to' => $now->copy()->endOfMonth()
            ]
        };
    }
    
    /**
     * Obtenir la date du premier dossier créé
     */
    private function getFirstDossierDate(): Carbon
    {
        $firstDossier = $this->baseQuery()
            ->oldest('date_ouverture')
            ->first();
        
        return $firstDossier 
            ? Carbon::parse($firstDossier->date_ouverture)
            : now()->subYears(10); // Fallback 10 ans en arrière
    }
    
    /**
     * Calculer le taux de croissance entre deux périodes
     * 
     * @param array $dates ['from' => Carbon|string, 'to' => Carbon|string]
     * @param array $geoFilters ['province_id' => ?int, 'region_id' => ?int, 'district_id' => ?int]
     * @return float Taux de croissance en pourcentage
     */
    public function calculateGrowthRate(array $dates, array $geoFilters = []): float
    {
        // Obtenir les IDs de districts filtrés
        $districtIds = $this->getFilteredDistrictIds($geoFilters);
        
        // PÉRIODE ACTUELLE
        $currentPeriod = Dossier::query()
            ->whereIn('id_district', $districtIds)
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
            ->count();
        
        // PÉRIODE PRÉCÉDENTE (même durée)
        $periodLength = Carbon::parse($dates['from'])->diffInDays(Carbon::parse($dates['to']));
        $previousFrom = Carbon::parse($dates['from'])->subDays($periodLength + 1);
        $previousTo = Carbon::parse($dates['from'])->subDay();
        
        $previousPeriod = Dossier::query()
            ->whereIn('id_district', $districtIds)
            ->whereBetween('date_ouverture', [$previousFrom, $previousTo])
            ->count();
        
        // CALCUL
        if ($previousPeriod === 0) {
            return $currentPeriod > 0 ? 100.0 : 0.0;
        }
        
        return round((($currentPeriod - $previousPeriod) / $previousPeriod) * 100, 1);
    }
    
    /**
     * Obtenir les IDs de districts selon les filtres géographiques
     */
    private function getFilteredDistrictIds(array $geoFilters): array
    {
        // Si district spécifique
        if (!empty($geoFilters['district_id'])) {
            return [(int) $geoFilters['district_id']];
        }

        // Si région spécifique
        if (!empty($geoFilters['region_id'])) {
            return \App\Models\District::where('id_region', $geoFilters['region_id'])
                ->pluck('id')
                ->toArray();
        }

        // Si province spécifique
        if (!empty($geoFilters['province_id'])) {
            return \App\Models\District::query()
                ->whereHas('region', fn($q) => $q->where('id_province', $geoFilters['province_id']))
                ->pluck('id')
                ->toArray();
        }

        // Tous les districts (ou ceux accessibles via baseQuery)
        return \App\Models\District::pluck('id')->toArray();
    }
    
    /**
     * Générer une liste de mois pour les graphiques (12 derniers mois)
     */
    public function getMonthsForChart(int $count = 12): array
    {
        $months = collect();
        
        for ($i = $count - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $months->push([
                'month' => $date->format('M Y'),
                'date' => $date->format('Y-m'),
                'start' => $date->copy()->startOfMonth(),
                'end' => $date->copy()->endOfMonth(),
            ]);
        }
        
        return $months->toArray();
    }
    
    /**
     * Générer une liste de trimestres (4 derniers trimestres)
     */
    public function getQuartersForChart(int $count = 4): array
    {
        $quarters = collect();
        
        for ($i = $count - 1; $i >= 0; $i--) {
            $date = now()->subQuarters($i);
            $quarters->push([
                'quarter' => 'Q' . $date->quarter . ' ' . $date->year,
                'start' => $date->copy()->startOfQuarter(),
                'end' => $date->copy()->endOfQuarter(),
            ]);
        }
        
        return $quarters->toArray();
    }
    
    /**
     * Obtenir les statistiques de comparaison de période
     */
    public function getComparisonStats(array $dates, array $geoFilters = []): array
    {
        $districtIds = $this->getFilteredDistrictIds($geoFilters);
        
        // Période actuelle
        $current = Dossier::query()
            ->whereIn('id_district', $districtIds)
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
            ->count();

        // Période précédente
        $from = Carbon::parse($dates['from']);
        $to = Carbon::parse($dates['to']);
        $duration = $from->diffInDays($to);
        
        $previousFrom = $from->copy()->subDays($duration + 1);
        $previousTo = $from->copy()->subDay();
        
        $previous = Dossier::query()
            ->whereIn('id_district', $districtIds)
            ->whereBetween('date_ouverture', [$previousFrom, $previousTo])
            ->count();

        $growth = $previous > 0 
            ? round((($current - $previous) / $previous) * 100, 1)
            : ($current > 0 ? 100.0 : 0.0);

        return [
            'current_count' => $current,
            'previous_count' => $previous,
            'growth_rate' => $growth,
            'difference' => $current - $previous,
            'trend' => $growth > 0 ? 'up' : ($growth < 0 ? 'down' : 'stable'),
        ];
    }
}