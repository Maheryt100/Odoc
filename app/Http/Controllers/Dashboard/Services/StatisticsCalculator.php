<?php

namespace App\Http\Controllers\Dashboard\Services;

use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\Demander;
use App\Models\Dossier;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Service de calcul des statistiques numériques
 * Responsabilité : Calculer toutes les métriques et KPIs
 */
class StatisticsCalculator
{
    use Traits\QueryFilterTrait;
    
    public function __construct(
        private PeriodService $periodService
    ) {}
    
    /**
     * Vue d'ensemble générale
     */
    public function getOverviewStats(array $dates): array
    {
        $query = $this->baseQuery();
        
        $total = (clone $query)
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
            ->count();
        
        $ouverts = (clone $query)->whereNull('date_fermeture')->count();
        $fermes = (clone $query)->whereNotNull('date_fermeture')->count();
        
        return [
            'total_dossiers' => $total,
            'dossiers_ouverts' => $ouverts,
            'dossiers_fermes' => $fermes,
            'taux_croissance' => $this->periodService->calculateGrowthRate($dates),
        ];
    }
    
    /**
     * Statistiques des dossiers
     */
    public function getDossiersStats(array $dates): array
    {
        $query = $this->baseQuery();
        $dossiers = (clone $query)
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
            ->get();
        
        $dossiersFermes = $dossiers->whereNotNull('date_fermeture');
        
        $dureeMoyenne = $dossiersFermes->isEmpty() ? 0 : $dossiersFermes->avg(function($d) {
            return Carbon::parse($d->date_ouverture)->diffInDays($d->date_fermeture);
        });
        
        return [
            'total' => $dossiers->count(),
            'ouverts' => $dossiers->whereNull('date_fermeture')->count(),
            'fermes' => $dossiersFermes->count(),
            'duree_moyenne' => round($dureeMoyenne, 1),
            'en_retard' => (clone $query)
                ->whereNull('date_fermeture')
                ->where('date_ouverture', '<', now()->subDays(90))
                ->count(),
        ];
    }
    
    /**
     * Statistiques des propriétés avec superficies détaillées
     */
    public function getProprietesStats(array $dates): array
    {
        $user = $this->getAuthUser();
        
        $baseQuery = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            });
        
        $proprietes = (clone $baseQuery)->get();
        
        $disponiblesQuery = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'active'));
        
        $disponiblesCount = (clone $disponiblesQuery)->count();
        $disponiblesSuperficie = (clone $disponiblesQuery)->sum('contenance') ?? 0;
        
        $acquisesQuery = Propriete::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'archive'))
            ->whereDoesntHave('demandes', fn($q) => $q->where('status', 'active'));
        
        $acquisesCount = (clone $acquisesQuery)->count();
        $acquisesSuperficie = (clone $acquisesQuery)->sum('contenance') ?? 0;
        
        $sansDemande = (clone $baseQuery)->doesntHave('demandes')->count();
        
        $superficieTotale = $proprietes->sum('contenance') ?? 0;
        $total = $proprietes->count();
        
        return [
            'total' => $total,
            'disponibles' => $disponiblesCount,
            'disponibles_superficie' => $disponiblesSuperficie,
            'acquises' => $acquisesCount,
            'acquises_superficie' => $acquisesSuperficie,
            'sans_demande' => $sansDemande,
            'superficie_totale' => $superficieTotale,
            'superficie_moyenne' => $total > 0 ? round($proprietes->avg('contenance'), 2) : 0,
            'pourcentage_disponibles' => $total > 0 ? round(($disponiblesCount / $total) * 100, 1) : 0,
            'pourcentage_disponibles_superficie' => $superficieTotale > 0 ? round(($disponiblesSuperficie / $superficieTotale) * 100, 1) : 0,
            'pourcentage_acquises' => $total > 0 ? round(($acquisesCount / $total) * 100, 1) : 0,
            'pourcentage_acquises_superficie' => $superficieTotale > 0 ? round(($acquisesSuperficie / $superficieTotale) * 100, 1) : 0,
        ];
    }
    
    /**
     * Statistiques des demandeurs
     */
    public function getDemandeursStats(array $dates): array
    {
        $user = $this->getAuthUser();
        
        $query = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            });
        
        $demandeurs = (clone $query)->get();
        $total = $demandeurs->count();
        
        $avecPropriete = $demandeurs->filter(fn($d) => $d->proprietes()->exists())->count();
        
        $actifs = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->whereHas('proprietes', function($q) {
                $q->whereHas('demandes', fn($q2) => $q2->where('status', 'active'));
            })
            ->count();
        
        // ✅ FIX: Calcul correct de l'âge moyen
        $ageMoyen = $this->calculateAverageAge();
        
        return [
            'total' => $total,
            'avec_propriete' => $avecPropriete,
            'sans_propriete' => $total - $avecPropriete,
            'actifs' => $actifs,
            'age_moyen' => round($ageMoyen, 1),
        ];
    }
    
    /**
     * Statistiques démographiques détaillées
     */
    public function getDemographicsStats(array $dates): array
    {
        $user = $this->getAuthUser();
        
        $baseQuery = Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            });
        
        $totalHommes = (clone $baseQuery)->where('sexe', 'Homme')->count();
        $totalFemmes = (clone $baseQuery)->where('sexe', 'Femme')->count();
        $total = $totalHommes + $totalFemmes;
        
        $hommesAvecPropriete = (clone $baseQuery)
            ->where('sexe', 'Homme')
            ->whereHas('proprietes')
            ->count();
        
        $femmesAvecPropriete = (clone $baseQuery)
            ->where('sexe', 'Femme')
            ->whereHas('proprietes')
            ->count();
        
        $hommesActifs = $this->countActiveByGender('Homme');
        $femmesActifs = $this->countActiveByGender('Femme');
        
        $hommesAcquis = $this->countAcquisByGender('Homme');
        $femmesAcquis = $this->countAcquisByGender('Femme');
        
        return [
            'total_hommes' => $totalHommes,
            'total_femmes' => $totalFemmes,
            'pourcentage_hommes' => $total > 0 ? round(($totalHommes / $total) * 100, 1) : 0,
            'pourcentage_femmes' => $total > 0 ? round(($totalFemmes / $total) * 100, 1) : 0,
            'hommes_avec_propriete' => $hommesAvecPropriete,
            'femmes_avec_propriete' => $femmesAvecPropriete,
            'hommes_actifs' => $hommesActifs,
            'femmes_actifs' => $femmesActifs,
            'hommes_acquis' => $hommesAcquis,
            'femmes_acquis' => $femmesAcquis,
            'age_moyen' => round($this->calculateAverageAge(), 1),
            'tranches_age' => $this->calculateAgeBrackets(),
        ];
    }
    
    /**
     * Statistiques financières séparées actifs/archivés
     */
    public function getFinancialsStats(array $dates): array
    {
        $user = $this->getAuthUser();
        
        $demandesActives = Demander::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('propriete.dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where('status', 'active')
            ->get();
        
        $demandesArchivees = Demander::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('propriete.dossier', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where('status', 'archive')
            ->get();
        
        $totalActif = $demandesActives->sum('total_prix') ?? 0;
        $totalArchive = $demandesArchivees->sum('total_prix') ?? 0;
        $totalGeneral = $totalActif + $totalArchive;
        $countTotal = $demandesActives->count() + $demandesArchivees->count();
        
        return [
            'total_revenus_potentiels' => $totalGeneral,
            'revenus_actifs' => $totalActif,
            'revenus_archives' => $totalArchive,
            'pourcentage_actif' => $totalGeneral > 0 ? round(($totalActif / $totalGeneral) * 100, 1) : 0,
            'pourcentage_archive' => $totalGeneral > 0 ? round(($totalArchive / $totalGeneral) * 100, 1) : 0,
            'revenu_moyen' => $countTotal > 0 ? round($totalGeneral / $countTotal, 2) : 0,
            'revenu_max' => max(
                $demandesActives->max('total_prix') ?? 0,
                $demandesArchivees->max('total_prix') ?? 0
            ),
            'revenu_min' => min(
                $demandesActives->where('total_prix', '>', 0)->min('total_prix') ?? PHP_INT_MAX,
                $demandesArchivees->where('total_prix', '>', 0)->min('total_prix') ?? PHP_INT_MAX
            ),
            'par_vocation_actif' => $this->getRevenueByVocation('active'),
            'par_vocation_archive' => $this->getRevenueByVocation('archive'),
        ];
    }
    
    /**
     * Statistiques géographiques
     */
    public function getGeographicStats(array $dates): array
    {
        $user = $this->getAuthUser();
        
        $topCommunes = Dossier::query()
            ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
            ->select('commune', 'fokontany', 'type_commune')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('commune', 'fokontany', 'type_commune')
            ->orderByDesc('count')
            ->limit(10)
            ->get();
        
        return [
            'top_communes' => $topCommunes->toArray(),
        ];
    }
    
    /**
     * Statistiques de performance
     */
    public function getPerformanceStats(array $dates): array
    {
        $query = $this->baseQuery();
        
        $dossiersComplets = (clone $query)
            ->whereHas('demandeurs')
            ->whereHas('proprietes')
            ->count();
        
        $total = (clone $query)->count();
        
        $dossiers = (clone $query)
            ->whereNotNull('date_fermeture')
            ->select('date_ouverture', 'date_fermeture')
            ->get();
        
        $tempsMoyen = 0;
        if ($dossiers->isNotEmpty()) {
            $totalDays = $dossiers->sum(function($dossier) {
                return Carbon::parse($dossier->date_ouverture)
                    ->diffInDays(Carbon::parse($dossier->date_fermeture));
            });
            $tempsMoyen = (int) round($totalDays / $dossiers->count());
        }
        
        $enRetard = (clone $query)
            ->whereNull('date_fermeture')
            ->where('date_ouverture', '<', now()->subDays(90))
            ->count();
        
        return [
            'taux_completion' => $total > 0 ? round(($dossiersComplets / $total) * 100, 1) : 0,
            'temps_moyen_traitement' => $tempsMoyen,
            'dossiers_en_retard' => $enRetard,
        ];
    }
    
    // ========================================
    // MÉTHODES PRIVÉES UTILITAIRES
    // ========================================
    
    /**
     * ✅ FIX: Calculer l'âge moyen correctement
     */
    private function calculateAverageAge(): float
    {
        $user = $this->getAuthUser();
        
        // Utiliser TIMESTAMPDIFF ou DATE_PART selon la base de données
        $ageMoyen = DB::table('demandeurs')
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereExists(function($subq) use ($user) {
                    $subq->from('contenir')
                        ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                        ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                        ->where('dossiers.id_district', $user->id_district);
                });
            })
            ->whereNotNull('date_naissance')
            ->selectRaw('AVG(DATE_PART(\'year\', AGE(CURRENT_DATE, date_naissance))) as age_moyen')
            ->value('age_moyen');
        
        return $ageMoyen ?? 0;
    }
    
    /**
     * Calculer les tranches d'âge
     */
    private function calculateAgeBrackets(): array
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
            $tranches[$label] = DB::table('demandeurs')
                ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                    $q->whereExists(function($subq) use ($user) {
                        $subq->from('contenir')
                            ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                            ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                            ->where('dossiers.id_district', $user->id_district);
                    });
                })
                ->whereNotNull('date_naissance')
                ->whereRaw("DATE_PART('year', AGE(CURRENT_DATE, date_naissance)) BETWEEN ? AND ?", [$min, $max])
                ->count();
        }
        
        return $tranches;
    }
    
    /**
     * Compter les demandeurs actifs par genre
     */
    private function countActiveByGender(string $gender): int
    {
        $user = $this->getAuthUser();
        
        return Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where('sexe', $gender)
            ->whereHas('proprietes', function($q) {
                $q->whereHas('demandes', fn($q2) => $q2->where('status', 'active'));
            })
            ->count();
    }
    
    /**
     * Compter les demandeurs acquis par genre
     */
    private function countAcquisByGender(string $gender): int
    {
        $user = $this->getAuthUser();
        
        return Demandeur::query()
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->whereHas('dossiers', fn($q2) => $q2->where('id_district', $user->id_district));
            })
            ->where('sexe', $gender)
            ->whereHas('proprietes', function($q) {
                $q->whereHas('demandes', fn($q2) => $q2->where('status', 'archive'));
            })
            ->whereDoesntHave('proprietes', function($q) {
                $q->whereHas('demandes', fn($q2) => $q2->where('status', 'active'));
            })
            ->count();
    }
    
    /**
     * Obtenir les revenus par vocation
     */
    private function getRevenueByVocation(string $status): array
    {
        $user = $this->getAuthUser();
        
        return Demander::query()
            ->join('proprietes', 'demander.id_propriete', '=', 'proprietes.id')
            ->when(!$user->canAccessAllDistricts(), function($q) use ($user) {
                $q->join('dossiers', 'proprietes.id_dossier', '=', 'dossiers.id')
                  ->where('dossiers.id_district', $user->id_district);
            })
            ->where('demander.status', $status)
            ->select('proprietes.vocation')
            ->selectRaw('SUM(demander.total_prix) as total')
            ->groupBy('proprietes.vocation')
            ->pluck('total', 'vocation')
            ->map(fn($val) => (int) $val)
            ->toArray();
    }
}