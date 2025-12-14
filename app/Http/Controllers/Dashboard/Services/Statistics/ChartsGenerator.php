<?php

namespace App\Http\Controllers\Dashboard\Services\Statistics;

use App\Models\Propriete;
use App\Models\Dossier;
use App\Models\Demandeur;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Dashboard\Services\Shared\Traits\QueryFilterTrait;

/**
 * ✅ VERSION CORRIGÉE : Tous les graphiques respectent maintenant les dates de filtrage
 */
class ChartsGenerator
{
    use QueryFilterTrait;
    
    public function __construct(
        private PeriodService $periodService
    ) {}
    
    /**
     * ✅ Récupérer tous les graphiques (signature inchangée pour compatibilité)
     */
    public function getAllCharts(array $dates): array
    {
        return [
            'evolution_complete' => $this->getEvolutionComplete($dates),
            'ouvertures_fermetures' => $this->getOuverturesFermetures($dates),
            'repartition_nature' => $this->getRepartitionNature($dates),
            'repartition_vocation' => $this->getRepartitionVocation($dates),
            'top_communes' => $this->getTopCommunes($dates),
            'top_districts' => $this->getTopDistricts($dates),
            'age_pyramid' => $this->getAgePyramid($dates),
            'completion_rate' => $this->getCompletionRate($dates),
        ];
    }
    
    /**
     * ✅ Évolution mensuelle complète (dossiers + propriétés + demandeurs)
     * Note: Utilise toujours les 12 derniers mois pour un graphique cohérent
     */
    public function getEvolutionComplete(array $dates): array
    {
        $user = $this->getAuthUser();
        $months = $this->periodService->getMonthsForChart(12);
        
        return collect($months)->map(function($month) use ($user) {
            $dossiers = Dossier::query()
                ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
                ->whereBetween('date_ouverture', [$month['start'], $month['end']])
                ->count();
            
            $proprietes = Propriete::query()
                ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                    $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
                })
                ->whereHas('dossier', function($q) use ($month) {
                    $q->whereBetween('date_ouverture', [$month['start'], $month['end']]);
                })
                ->count();
            
            $demandeurs = Demandeur::query()
                ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                    $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
                })
                ->whereHas('dossiers', function($q) use ($month) {
                    $q->whereBetween('date_ouverture', [$month['start'], $month['end']]);
                })
                ->count();
            
            return [
                'month' => $month['month'],
                'dossiers' => $dossiers,
                'proprietes' => $proprietes,
                'demandeurs' => $demandeurs,
            ];
        })->toArray();
    }
    
    /**
     * ✅ Ouvertures vs Fermetures
     */
    public function getOuverturesFermetures(array $dates): array
    {
        $user = $this->getAuthUser();
        $months = $this->periodService->getMonthsForChart(12);
        
        return collect($months)->map(function($month) use ($user) {
            $ouvertures = Dossier::query()
                ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
                ->whereBetween('date_ouverture', [$month['start'], $month['end']])
                ->count();
            
            $fermetures = Dossier::query()
                ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
                ->whereNotNull('date_fermeture')
                ->whereBetween('date_fermeture', [$month['start'], $month['end']])
                ->count();
            
            return [
                'month' => $month['month'],
                'ouvertures' => $ouvertures,
                'fermetures' => $fermetures,
            ];
        })->toArray();
    }
    
    /**
     * ✅ CORRIGÉ : Répartition par nature avec dates
     */
    public function getRepartitionNature(array $dates): array
    {
        $user = $this->getAuthUser();
        
        return Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('dossier', function($q) use ($dates) {
                $q->whereBetween('date_ouverture', [$dates['from'], $dates['to']]);
            })
            ->select('nature')
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('SUM(contenance) as superficie')
            ->groupBy('nature')
            ->orderByDesc('count')
            ->get()
            ->map(fn($item) => [
                'name' => ucfirst($item->nature ?? 'Non défini'),
                'value' => $item->count,
                'superficie' => $item->superficie ?? 0
            ])
            ->toArray();
    }
    
    /**
     * ✅ CORRIGÉ : Répartition par vocation avec dates
     */
    public function getRepartitionVocation(array $dates): array
    {
        $user = $this->getAuthUser();
        
        return Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('dossier', function($q) use ($dates) {
                $q->whereBetween('date_ouverture', [$dates['from'], $dates['to']]);
            })
            ->select('vocation')
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('SUM(contenance) as superficie')
            ->groupBy('vocation')
            ->orderByDesc('count')
            ->get()
            ->map(fn($item) => [
                'name' => ucfirst($item->vocation ?? 'Non défini'),
                'value' => $item->count,
                'superficie' => $item->superficie ?? 0
            ])
            ->toArray();
    }
    
    /**
     * ✅ CORRIGÉ : Top 10 communes avec dates
     */
    public function getTopCommunes(array $dates): array
    {
        $user = $this->getAuthUser();
        
        return Dossier::query()
            ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
            ->select('commune')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('commune')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn($item) => [
                'commune' => $item->commune,
                'count' => $item->count
            ])
            ->toArray();
    }
    
    /**
     * ✅ CORRIGÉ : Top 10 districts avec dates (uniquement pour super admin)
     */
    public function getTopDistricts(array $dates): array
    {
        $user = $this->getAuthUser();
        
        if (!$user->canAccessAllDistricts()) {
            return [];
        }
        
        return Dossier::query()
            ->join('districts', 'dossiers.id_district', '=', 'districts.id')
            ->whereBetween('dossiers.date_ouverture', [$dates['from'], $dates['to']])
            ->select('districts.nom_district')
            ->selectRaw('COUNT(dossiers.id) as count')
            ->groupBy('districts.nom_district')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn($item) => [
                'nom_district' => $item->nom_district,
                'count' => $item->count
            ])
            ->toArray();
    }
    
    /**
     * ✅ CORRIGÉ : Pyramide des âges par genre avec dates
     */
    public function getAgePyramid(array $dates): array
    {
        $user = $this->getAuthUser();
        $tranches = [];
        
        $ranges = [
            '18-30' => [18, 30],
            '31-45' => [31, 45],
            '46-60' => [46, 60],
            '61+' => [61, 999],
        ];
        
        foreach ($ranges as $label => [$min, $max]) {
            $hommes = DB::table('demandeurs')
                ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                    $q->whereExists(function($subq) use ($user) {
                        $subq->from('contenir')
                            ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                            ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                            ->where('dossiers.id_district', $user->id_district);
                    });
                })
                ->whereExists(function($subq) use ($dates) {
                    $subq->from('contenir')
                        ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                        ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                        ->whereBetween('dossiers.date_ouverture', [$dates['from'], $dates['to']]);
                })
                ->where('sexe', 'Homme')
                ->whereNotNull('date_naissance')
                ->whereRaw("DATE_PART('year', AGE(CURRENT_DATE, date_naissance)) BETWEEN ? AND ?", [$min, $max])
                ->count();
            
            $femmes = DB::table('demandeurs')
                ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                    $q->whereExists(function($subq) use ($user) {
                        $subq->from('contenir')
                            ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                            ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                            ->where('dossiers.id_district', $user->id_district);
                    });
                })
                ->whereExists(function($subq) use ($dates) {
                    $subq->from('contenir')
                        ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                        ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                        ->whereBetween('dossiers.date_ouverture', [$dates['from'], $dates['to']]);
                })
                ->where('sexe', 'Femme')
                ->whereNotNull('date_naissance')
                ->whereRaw("DATE_PART('year', AGE(CURRENT_DATE, date_naissance)) BETWEEN ? AND ?", [$min, $max])
                ->count();
            
            $tranches[$label] = [
                'hommes' => $hommes,
                'femmes' => $femmes
            ];
        }
        
        return $tranches;
    }
    
    /**
     * ✅ CORRIGÉ : Taux de complétion des dossiers avec dates
     */
    public function getCompletionRate(array $dates): array
    {
        $query = $this->baseQuery()
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']]);
        
        $total = (clone $query)->count();
        $complets = (clone $query)
            ->whereHas('demandeurs')
            ->whereHas('proprietes')
            ->count();
        
        return [
            'rate' => $total > 0 ? round(($complets / $total) * 100, 1) : 0,
            'complets' => $complets,
            'incomplets' => $total - $complets,
        ];
    }
}