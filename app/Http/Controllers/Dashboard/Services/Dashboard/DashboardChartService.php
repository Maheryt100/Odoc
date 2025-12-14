<?php

namespace App\Http\Controllers\Dashboard\Services\Dashboard;

use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\Demander;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use App\Http\Controllers\Dashboard\Services\Shared\Traits\QueryFilterTrait;

/**
 * ✅ VERSION HARMONISÉE avec Statistics
 * 
 * Changement majeur : Tous les comptages sont maintenant basés sur date_ouverture des dossiers
 * pour assurer la cohérence avec le module Statistics
 */
class DashboardChartService
{
    use QueryFilterTrait;

    private const CACHE_TTL = 600; // 10 minutes
    private const PERIOD_MONTHS = 12;

    /**
     * 📊 Récupérer tous les graphiques du dashboard
     */
    public function getAllCharts(): array
    {
        $cacheKey = $this->getCacheKey('dashboard_charts');
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function() {
            return [
                'dossiers_timeline' => $this->getDossiersTimeline(),
                'proprietes_status' => $this->getProprietesStatus(),
                'top_communes' => $this->getTopCommunes(5),
                'evolution_mensuelle' => $this->getDossiersTimeline(), // Compatibilité
                'evolution_complete' => $this->getEvolutionComplete(), // ✅ HARMONISÉ
                'revenus_par_vocation' => $this->getRevenuParVocation(),
                'performance_trimestrielle' => $this->getPerformanceQuarterly(),
            ];
        });
    }

    /**
     * 🔑 Clé de cache
     */
    private function getCacheKey(string $type): string
    {
        $user = $this->getAuthUser();
        return sprintf(
            'dashboard:%s:user_%d:district_%s',
            $type,
            $user->id,
            $user->id_district ?? 'all'
        );
    }

    /**
     * 📈 Timeline des dossiers (12 derniers mois)
     */
    private function getDossiersTimeline(): array
    {
        $user = $this->getAuthUser();
        $months = $this->getLast12Months();
        
        return collect($months)->map(function($month) use ($user) {
            $count = Dossier::query()
                ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
                ->whereBetween('date_ouverture', [$month['start'], $month['end']])
                ->count();
            
            return [
                'month' => $month['label'],
                'count' => $count
            ];
        })->toArray();
    }

    /**
     * ✅ HARMONISÉ : Évolution complète avec MÊME LOGIQUE que Statistics
     * 
     * Règle unifiée : On compte par date_ouverture des dossiers associés
     */
    private function getEvolutionComplete(): array
    {
        $user = $this->getAuthUser();
        $months = $this->getLast12Months();
        
        return collect($months)->map(function($month) use ($user) {
            // ✅ Dossiers ouverts dans le mois
            $dossiers = Dossier::query()
                ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
                ->whereBetween('date_ouverture', [$month['start'], $month['end']])
                ->count();
            
            // ✅ Propriétés liées aux dossiers ouverts ce mois
            $proprietes = Propriete::query()
                ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                    $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
                })
                ->whereHas('dossier', function($q) use ($month) {
                    $q->whereBetween('date_ouverture', [$month['start'], $month['end']]);
                })
                ->count();
            
            // ✅ CORRIGÉ : Demandeurs liés aux dossiers ouverts ce mois
            // On utilise la même logique que Statistics
            $demandeurs = Demandeur::query()
                ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                    $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
                })
                ->whereHas('dossiers', function($q) use ($month) {
                    $q->whereBetween('date_ouverture', [$month['start'], $month['end']]);
                })
                ->count();
            
            return [
                'month' => $month['label'],
                'dossiers' => $dossiers,
                'proprietes' => $proprietes,
                'demandeurs' => $demandeurs,
            ];
        })->toArray();
    }

    /**
     * Statut des propriétés
     */
    private function getProprietesStatus(): array
    {
        $user = $this->getAuthUser();
        
        $disponibles = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'active'))
            ->count();
        
        $acquises = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'archive'))
            ->whereDoesntHave('demandes', fn($q) => $q->where('status', 'active'))
            ->count();
        
        return [
            'disponibles' => $disponibles,
            'acquises' => $acquises,
        ];
    }

    /**
     * 🗺️ Top 5 communes
     */
    private function getTopCommunes(int $limit = 5): array
    {
        $user = $this->getAuthUser();
        
        return Dossier::query()
            ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
            ->select('commune', 'fokontany', 'type_commune')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('commune', 'fokontany', 'type_commune')
            ->orderByDesc('count')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * 💰 Revenus par vocation (actifs uniquement)
     */
    private function getRevenuParVocation(): array
    {
        $user = $this->getAuthUser();
        
        $data = Demander::query()
            ->join('proprietes', 'demander.id_propriete', '=', 'proprietes.id')
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->join('dossiers', 'proprietes.id_dossier', '=', 'dossiers.id')
                  ->where('dossiers.id_district', $user->id_district);
            })
            ->where('demander.status', 'active')
            ->select('proprietes.vocation')
            ->selectRaw('SUM(demander.total_prix) as montant')
            ->groupBy('proprietes.vocation')
            ->get();

        return $data->map(fn($item) => [
            'vocation' => ucfirst($item->vocation ?? 'Non défini'),
            'montant' => (int) ($item->montant ?? 0)
        ])->toArray();
    }

    /**
     * 📉 Performance trimestrielle (4 derniers trimestres)
     */
    private function getPerformanceQuarterly(): array
    {
        $user = $this->getAuthUser();
        $quarters = $this->getLast4Quarters();
        
        return collect($quarters)->map(function($quarter) use ($user) {
            $query = Dossier::query()
                ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
                ->whereBetween('date_ouverture', [$quarter['start'], $quarter['end']]);

            $ouverts = (clone $query)->whereNull('date_fermeture')->count();
            $fermes = (clone $query)->whereNotNull('date_fermeture')->count();
            $total = $ouverts + $fermes;

            return [
                'quarter' => $quarter['label'],
                'ouverts' => $ouverts,
                'fermes' => $fermes,
                'total' => $total,
            ];
        })->toArray();
    }

    // ========================================
    // HELPERS PRIVÉS
    // ========================================

    /**
     * 📅 Générer les 12 derniers mois
     */
    private function getLast12Months(): array
    {
        $months = [];
        
        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $months[] = [
                'label' => $date->format('M Y'),
                'start' => $date->copy()->startOfMonth(),
                'end' => $date->copy()->endOfMonth(),
            ];
        }
        
        return $months;
    }

    /**
     * 📅 Générer les 4 derniers trimestres
     */
    private function getLast4Quarters(): array
    {
        $quarters = [];
        
        for ($i = 3; $i >= 0; $i--) {
            $date = now()->subQuarters($i);
            $quarters[] = [
                'label' => 'Q' . $date->quarter . ' ' . $date->year,
                'start' => $date->copy()->startOfQuarter(),
                'end' => $date->copy()->endOfQuarter(),
            ];
        }
        
        return $quarters;
    }
}