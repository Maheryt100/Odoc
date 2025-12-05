<?php

namespace App\Http\Controllers\Dashboard\Services;

use Carbon\Carbon;
use App\Models\Dossier;
use Illuminate\Support\Facades\Auth;

/**
 * Service de gestion des périodes pour les statistiques
 * Responsabilité unique : Calculer les plages de dates
 */
class PeriodService
{
    use Traits\QueryFilterTrait;
    
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
     */
    public function calculateGrowthRate(array $dates): float
    {
        $currentPeriod = $this->baseQuery()
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
            ->count();
        
        $periodLength = Carbon::parse($dates['from'])->diffInDays(Carbon::parse($dates['to']));
        $previousFrom = Carbon::parse($dates['from'])->subDays($periodLength);
        $previousTo = Carbon::parse($dates['to'])->subDays($periodLength);
        
        $previousPeriod = $this->baseQuery()
            ->whereBetween('date_ouverture', [$previousFrom, $previousTo])
            ->count();
        
        if ($previousPeriod === 0) {
            return $currentPeriod > 0 ? 100.0 : 0.0;
        }
        
        return round((($currentPeriod - $previousPeriod) / $previousPeriod) * 100, 1);
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
}