<?php

namespace App\Http\Controllers\Dashboard\Services\Dashboard;

use App\Models\User;
use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\Demander;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Http\Controllers\Dashboard\Services\Shared\Traits\QueryFilterTrait;

/**
 * Service KPI optimisé pour le Dashboard
 * ✅ AMÉLIORATION v2.0 : Stats détaillées par genre avec sans propriété
 */
class DashboardKpiService
{
    use QueryFilterTrait;

    private const CACHE_TTL = 300; // 5 minutes
    private const PERIOD_MONTHS = 12;

    public function getAllKpis(): array
    {
        $cacheKey = $this->getCacheKey('dashboard_kpis');
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function() {
            $dateRange = $this->get12MonthsRange();
            
            return [
                'dossiers_ouverts' => $this->getDossiersOuverts($dateRange),
                'dossiers_fermes' => $this->getDossiersFermes($dateRange),
                'nouveaux_dossiers' => $this->getNouveauxDossiers($dateRange),
                'dossiers_en_retard' => $this->getDossiersEnRetard(),
                
                'proprietes_disponibles' => $this->getProprietesDisponibles(),
                'proprietes_acquises' => $this->getProprietesAcquises(),
                'superficie_details' => $this->getSuperficieDetails(),
                
                'demandeurs_actifs' => $this->getDemandeursActifs(),
                'demandeurs_details' => $this->getDemandeurDetails(), // ✅ AMÉLIORATION
                'demandeurs_sans_propriete' => $this->getDemandeursSansPropriete(),
                
                'completion' => $this->getCompletionDetails(),
                
                'revenus_potentiels' => $this->getRevenusPotentiels(),
                
                'documents_generes_aujourdhui' => $this->getDocumentsAujourdhui(),
                'utilisateurs_actifs_24h' => $this->getUtilisateursActifs24h(),
                'temps_moyen_traitement' => $this->getTempsMoyenTraitement($dateRange),
                
                'taux_croissance' => $this->calculateGrowthRate($dateRange),
            ];
        });
    }

    private function get12MonthsRange(): array
    {
        return [
            'from' => now()->subMonths(self::PERIOD_MONTHS)->startOfMonth(),
            'to' => now()->endOfMonth(),
        ];
    }

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

    public function invalidateCache(): void
    {
        $user = $this->getAuthUser();
        $pattern = sprintf('dashboard:*:user_%d:*', $user->id);
        
        if (config('cache.default') === 'redis') {
            $redis = Cache::getRedis();
            $keys = $redis->keys($pattern);
            if (!empty($keys)) {
                $redis->del($keys);
            }
        } else {
            Cache::forget($this->getCacheKey('dashboard_kpis'));
            Cache::forget($this->getCacheKey('dashboard_charts'));
        }
    }

    // ========================================
    // MÉTHODES PRIVÉES DE CALCUL
    // ========================================

    private function getDossiersOuverts(array $range): int
    {
        return $this->baseQuery()
            ->whereNull('date_fermeture')
            ->whereBetween('date_ouverture', [$range['from'], $range['to']])
            ->count();
    }

    private function getDossiersFermes(array $range): int
    {
        return $this->baseQuery()
            ->whereNotNull('date_fermeture')
            ->whereBetween('date_ouverture', [$range['from'], $range['to']])
            ->count();
    }

    private function getNouveauxDossiers(array $range): int
    {
        return $this->baseQuery()
            ->whereBetween('date_ouverture', [
                now()->startOfMonth(),
                now()->endOfMonth()
            ])
            ->count();
    }

    private function getDossiersEnRetard(): int
    {
        return $this->baseQuery()
            ->whereNull('date_fermeture')
            ->where('date_ouverture', '<', now()->subDays(90))
            ->count();
    }

    private function getProprietesDisponibles(): int
    {
        $user = $this->getAuthUser();
        
        return Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'active'))
            ->count();
    }

    private function getProprietesAcquises(): int
    {
        $user = $this->getAuthUser();
        
        return Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'archive'))
            ->whereDoesntHave('demandes', fn($q) => $q->where('status', 'active'))
            ->count();
    }

    private function getSuperficieDetails(): array
    {
        $user = $this->getAuthUser();
        
        $query = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            });
        
        $totale = (clone $query)->sum('contenance') ?? 0;
        
        $acquise = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'archive'))
            ->whereDoesntHave('demandes', fn($q) => $q->where('status', 'active'))
            ->sum('contenance') ?? 0;
        
        $disponible = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'active'))
            ->sum('contenance') ?? 0;
        
        return [
            'totale' => $totale,
            'acquise' => $acquise,
            'disponible' => $disponible,
        ];
    }

    private function getDemandeursActifs(): int
    {
        $user = $this->getAuthUser();
        
        return Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('proprietes', function($q) {
                $q->whereHas('demandes', fn($q2) => $q2->where('status', 'active'));
            })
            ->count();
    }

    /**
     * ✅ AMÉLIORATION MAJEURE : Stats complètes par genre avec sans propriété
     */
    private function getDemandeurDetails(): array
    {
        $user = $this->getAuthUser();
        
        // Base query avec filtres genre
        $baseQuery = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            });
        
        $total = (clone $baseQuery)->count();
        
        // Compter par genre
        $hommes = (clone $baseQuery)->where('sexe', 'Homme')->count();
        $femmes = (clone $baseQuery)->where('sexe', 'Femme')->count();
        
        // ✅ REQUÊTE OPTIMISÉE : Tous les stats en une seule requête
        $statsParGenre = DB::table('demandeurs')
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereExists(function($subq) use ($user) {
                    $subq->from('contenir')
                        ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                        ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                        ->where('dossiers.id_district', $user->id_district);
                });
            })
            ->whereNotNull('sexe')
            ->where('sexe', '!=', '')
            ->whereIn('sexe', ['Homme', 'Femme'])
            ->select('sexe')
            ->selectRaw('
                COUNT(DISTINCT CASE 
                    WHEN EXISTS(
                        SELECT 1 FROM demander d 
                        WHERE d.id_demandeur = demandeurs.id 
                        AND d.status = ?
                    ) THEN demandeurs.id 
                END) as actifs,
                COUNT(DISTINCT CASE 
                    WHEN EXISTS(
                        SELECT 1 FROM demander d1 
                        WHERE d1.id_demandeur = demandeurs.id 
                        AND d1.status = ?
                    ) AND NOT EXISTS(
                        SELECT 1 FROM demander d2 
                        WHERE d2.id_demandeur = demandeurs.id 
                        AND d2.status = ?
                    ) THEN demandeurs.id 
                END) as acquis,
                COUNT(DISTINCT CASE 
                    WHEN NOT EXISTS(
                        SELECT 1 FROM demander d 
                        WHERE d.id_demandeur = demandeurs.id
                    ) THEN demandeurs.id 
                END) as sans_propriete
            ', [
                Demander::STATUS_ACTIVE,
                Demander::STATUS_ARCHIVE,
                Demander::STATUS_ACTIVE
            ])
            ->groupBy('sexe')
            ->get()
            ->keyBy('sexe');
        
        $hommesStats = $statsParGenre->get('Homme');
        $femmesStats = $statsParGenre->get('Femme');
        
        $totalActifs = ($hommesStats->actifs ?? 0) + ($femmesStats->actifs ?? 0);
        $totalAcquis = ($hommesStats->acquis ?? 0) + ($femmesStats->acquis ?? 0);
        $totalSansPropriete = ($hommesStats->sans_propriete ?? 0) + ($femmesStats->sans_propriete ?? 0);
        
        return [
            'total' => $total,
            'actifs' => $totalActifs,
            'acquis' => $totalAcquis,
            'sans_propriete' => $totalSansPropriete,
            'hommes' => $hommes,
            'femmes' => $femmes,
            'hommes_actifs' => $hommesStats->actifs ?? 0,
            'femmes_actifs' => $femmesStats->actifs ?? 0,
            'hommes_acquis' => $hommesStats->acquis ?? 0,
            'femmes_acquis' => $femmesStats->acquis ?? 0,
            'hommes_sans_propriete' => $hommesStats->sans_propriete ?? 0,
            'femmes_sans_propriete' => $femmesStats->sans_propriete ?? 0,
        ];
    }

    private function getDemandeursSansPropriete(): int
    {
        $user = $this->getAuthUser();
        
        return Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->doesntHave('proprietes')
            ->count();
    }

    private function getCompletionDetails(): array
    {
        $user = $this->getAuthUser();
        $query = $this->baseQuery();
        
        $totalDossiers = $query->count();
        
        $dossiersComplets = (clone $query)
            ->whereHas('demandeurs')
            ->whereHas('proprietes')
            ->count();
        
        $dossiersIncomplets = $totalDossiers - $dossiersComplets;
        
        $proprietesIncompletes = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where(function($q) {
                $q->whereNull('lot')
                  ->orWhereNull('contenance')
                  ->orWhereNull('nature')
                  ->orWhereNull('vocation');
            })
            ->count();
        
        $demandeursIncomplets = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where(function($q) {
                $q->whereNull('nom_demandeur')
                  ->orWhereNull('date_naissance')
                  ->orWhereNull('cin')
                  ->orWhereNull('domiciliation');
            })
            ->count();
        
        $tauxCompletion = $totalDossiers > 0 
            ? round(($dossiersComplets / $totalDossiers) * 100, 1) 
            : 0;
        
        return [
            'taux' => $tauxCompletion,
            'dossiers_complets' => $dossiersComplets,
            'dossiers_incomplets' => $dossiersIncomplets,
            'total_dossiers' => $totalDossiers,
            'proprietes_incompletes' => $proprietesIncompletes,
            'demandeurs_incomplets' => $demandeursIncomplets,
        ];
    }

    private function getRevenusPotentiels(): int
    {
        $user = $this->getAuthUser();
        
        return Demander::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('propriete.dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where('status', 'active')
            ->sum('total_prix') ?? 0;
    }

    private function getDocumentsAujourdhui(): int
    {
        $user = $this->getAuthUser();
        
        return ActivityLog::query()
            ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
            ->where('action', ActivityLog::ACTION_GENERATE)
            ->whereDate('created_at', today())
            ->count();
    }

    private function getUtilisateursActifs24h(): int
    {
        $user = $this->getAuthUser();
        
        return ActivityLog::query()
            ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
            ->where('created_at', '>=', now()->subDay())
            ->distinct('id_user')
            ->count('id_user');
    }

    private function getTempsMoyenTraitement(array $range): int
    {
        $dossiers = $this->baseQuery()
            ->whereNotNull('date_fermeture')
            ->whereBetween('date_ouverture', [$range['from'], $range['to']])
            ->select('date_ouverture', 'date_fermeture')
            ->get();
        
        if ($dossiers->isEmpty()) {
            return 0;
        }
        
        $totalDays = $dossiers->sum(function($d) {
            return Carbon::parse($d->date_ouverture)->diffInDays($d->date_fermeture);
        });
        
        return (int) round($totalDays / $dossiers->count());
    }

    private function calculateGrowthRate(array $range): float
    {
        $currentMonth = $this->baseQuery()
            ->whereBetween('date_ouverture', [
                now()->startOfMonth(), 
                now()->endOfMonth()
            ])
            ->count();
        
        $previousMonth = $this->baseQuery()
            ->whereBetween('date_ouverture', [
                now()->subMonth()->startOfMonth(), 
                now()->subMonth()->endOfMonth()
            ])
            ->count();
        
        if ($previousMonth == 0) {
            return $currentMonth > 0 ? 100 : 0;
        }
        
        return round((($currentMonth - $previousMonth) / $previousMonth) * 100, 1);
    }
}