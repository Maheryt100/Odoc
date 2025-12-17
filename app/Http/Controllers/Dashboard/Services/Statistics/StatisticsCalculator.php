<?php

namespace App\Http\Controllers\Dashboard\Services\Statistics;

use App\Models\Propriete;
use App\Models\Dossier;
use App\Models\Demandeur;
use App\Models\Demander;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Http\Controllers\Dashboard\Services\Shared\Traits\QueryFilterTrait;


class StatisticsCalculator
{
    use QueryFilterTrait;
    
    public function __construct(
        private PeriodService $periodService
    ) {}
    
    // Champs utilisés pour calcul de complétion
    private const DEMANDEUR_STRING_FIELDS = [
        'titre_demandeur', 'nom_demandeur', 'prenom_demandeur', 'cin',
        'domiciliation', 'sexe', 'lieu_naissance', 'occupation',
        'situation_familiale', 'regime_matrimoniale', 'nationalite',
        'nom_pere', 'nom_mere', 'marie_a', 'telephone',
        'lieu_delivrance', 'lieu_delivrance_duplicata', 'lieu_mariage',
    ];
    
    private const DEMANDEUR_DATE_FIELDS = [
        'date_naissance', 'date_delivrance', 'date_delivrance_duplicata', 'date_mariage',
    ];
    
    private const PROPRIETE_STRING_FIELDS = [
        'lot', 'titre', 'titre_mere', 'proprietaire', 'nature', 'vocation',
        'situation', 'type_operation', 'charge', 'numero_FN', 'numero_requisition',
        'dep_vol', 'numero_dep_vol', 'propriete_mere',
    ];
    
    private const PROPRIETE_NUMERIC_FIELDS = ['contenance'];
    // private const PROPRIETE_DATE_FIELDS = ['date_requisition', 'date_inscription'];
    
    /**
     *  Extraire filtres géographiques depuis $dates
     */
    private function getGeoFilters(array $dates): array
    {
        return [
            'province_id' => $dates['province_id'] ?? null,
            'region_id' => $dates['region_id'] ?? null,
            'district_id' => $dates['district_id'] ?? null,
        ];
    }
    
    // ========================================
    // MÉTHODES PRINCIPALES
    // ========================================
    
    public function getOverviewStats(array $dates): array
    {
        $geoFilters = $this->getGeoFilters($dates);
        $query = $this->baseQuery($geoFilters);
        
        $total = (clone $query)
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
            ->count();
        
        $ouverts = (clone $query)
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
            ->whereNull('date_fermeture')
            ->count();
        
        $fermes = (clone $query)
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
            ->whereNotNull('date_fermeture')
            ->count();
        
        return [
            'total_dossiers' => $total,
            'dossiers_ouverts' => $ouverts,
            'dossiers_fermes' => $fermes,
            'taux_croissance' => $this->periodService->calculateGrowthRate($dates, $geoFilters),
        ];
    }
    
    public function getDossiersStats(array $dates): array
    {
        $geoFilters = $this->getGeoFilters($dates);
        $query = $this->baseQuery($geoFilters);
        
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
                ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
                ->whereNull('date_fermeture')
                ->where('date_ouverture', '<', now()->subDays(90))
                ->count(),
        ];
    }
    
    public function getProprietesStats(array $dates): array
    {
        $geoFilters = $this->getGeoFilters($dates);
        $districtIds = $this->getFilteredDistrictIds($geoFilters);
        
        // Requête de base avec filtrage géographique via les dossiers
        $baseQuery = Propriete::query()
            ->whereHas('dossier', function($q) use ($districtIds, $dates) {
                $q->whereIn('id_district', $districtIds)
                  ->whereBetween('date_ouverture', [$dates['from'], $dates['to']]);
            });
        
        $proprietes = (clone $baseQuery)->get();
        
        // Propriétés disponibles (demandes actives)
        $disponiblesQuery = Propriete::query()
            ->whereHas('dossier', function($q) use ($districtIds, $dates) {
                $q->whereIn('id_district', $districtIds)
                  ->whereBetween('date_ouverture', [$dates['from'], $dates['to']]);
            })
            ->whereHas('demandes', fn($q) => $q->where('status', 'active'));
        
        $disponiblesCount = (clone $disponiblesQuery)->count();
        $disponiblesSuperficie = (clone $disponiblesQuery)->sum('contenance') ?? 0;
        
        // Propriétés acquises (demandes archivées uniquement)
        $acquisesQuery = Propriete::query()
            ->whereHas('dossier', function($q) use ($districtIds, $dates) {
                $q->whereIn('id_district', $districtIds)
                  ->whereBetween('date_ouverture', [$dates['from'], $dates['to']]);
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
    
    public function getDemandeursStats(array $dates): array
    {
        $geoFilters = $this->getGeoFilters($dates);
        $districtIds = $this->getFilteredDistrictIds($geoFilters);
        
        $query = Demandeur::query()
            ->whereHas('dossiers', function($q) use ($districtIds, $dates) {
                $q->whereIn('id_district', $districtIds)
                  ->whereBetween('date_ouverture', [$dates['from'], $dates['to']]);
            });
        
        $demandeurs = (clone $query)->get();
        $total = $demandeurs->count();
        
        $avecPropriete = $demandeurs->filter(fn($d) => $d->proprietes()->exists())->count();
        
        $actifs = Demandeur::query()
            ->whereHas('dossiers', function($q) use ($districtIds, $dates) {
                $q->whereIn('id_district', $districtIds)
                  ->whereBetween('date_ouverture', [$dates['from'], $dates['to']]);
            })
            ->whereHas('proprietes', function($q) {
                $q->whereHas('demandes', fn($q2) => $q2->where('status', 'active'));
            })
            ->count();
        
        $ageMoyen = $this->calculateAverageAge($dates, $geoFilters);
        
        return [
            'total' => $total,
            'avec_propriete' => $avecPropriete,
            'sans_propriete' => $total - $avecPropriete,
            'actifs' => $actifs,
            'age_moyen' => round($ageMoyen, 1),
        ];
    }
    
    public function getDemographicsStats(array $dates): array
    {
        $geoFilters = $this->getGeoFilters($dates);
        $districtIds = $this->getFilteredDistrictIds($geoFilters);
        
        $baseQuery = Demandeur::query()
            ->whereHas('dossiers', function($q) use ($districtIds, $dates) {
                $q->whereIn('id_district', $districtIds)
                  ->whereBetween('date_ouverture', [$dates['from'], $dates['to']]);
            })
            ->whereNotNull('sexe')
            ->where('sexe', '!=', '')
            ->whereIn('sexe', ['Homme', 'Femme']);
        
        $totalHommes = (clone $baseQuery)->where('sexe', 'Homme')->count();
        $totalFemmes = (clone $baseQuery)->where('sexe', 'Femme')->count();
        $total = $totalHommes + $totalFemmes;
        
        $statsParGenre = $this->getGenderStatsOptimized($dates, $geoFilters);
        
        return [
            'total_hommes' => $totalHommes,
            'total_femmes' => $totalFemmes,
            'pourcentage_hommes' => $total > 0 ? round(($totalHommes / $total) * 100, 1) : 0,
            'pourcentage_femmes' => $total > 0 ? round(($totalFemmes / $total) * 100, 1) : 0,
            'hommes_avec_propriete' => (clone $baseQuery)->where('sexe', 'Homme')->whereHas('proprietes')->count(),
            'femmes_avec_propriete' => (clone $baseQuery)->where('sexe', 'Femme')->whereHas('proprietes')->count(),
            'hommes_actifs' => $statsParGenre['Homme']['actifs'] ?? 0,
            'femmes_actifs' => $statsParGenre['Femme']['actifs'] ?? 0,
            'hommes_acquis' => $statsParGenre['Homme']['acquis'] ?? 0,
            'femmes_acquis' => $statsParGenre['Femme']['acquis'] ?? 0,
            'hommes_sans_propriete' => $statsParGenre['Homme']['sans_propriete'] ?? 0,
            'femmes_sans_propriete' => $statsParGenre['Femme']['sans_propriete'] ?? 0,
            'age_moyen' => round($this->calculateAverageAge($dates, $geoFilters), 1),
            'tranches_age' => $this->calculateAgeBrackets($dates, $geoFilters),
        ];
    }
    
    public function getFinancialsStats(array $dates): array
    {
        $geoFilters = $this->getGeoFilters($dates);
        $districtIds = $this->getFilteredDistrictIds($geoFilters);
        
        $demandesActives = Demander::query()
            ->whereHas('propriete.dossier', function($q) use ($districtIds, $dates) {
                $q->whereIn('id_district', $districtIds)
                  ->whereBetween('date_ouverture', [$dates['from'], $dates['to']]);
            })
            ->where('status', 'active')
            ->get();
        
        $demandesArchivees = Demander::query()
            ->whereHas('propriete.dossier', function($q) use ($districtIds, $dates) {
                $q->whereIn('id_district', $districtIds)
                  ->whereBetween('date_ouverture', [$dates['from'], $dates['to']]);
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
            'par_vocation_actif' => $this->getRevenueByVocation('active', $dates, $geoFilters),
            'par_vocation_archive' => $this->getRevenueByVocation('archive', $dates, $geoFilters),
        ];
    }
    
    public function getGeographicStats(array $dates): array
    {
        $geoFilters = $this->getGeoFilters($dates);
        $districtIds = $this->getFilteredDistrictIds($geoFilters);
        
        $topCommunes = Dossier::query()
            ->whereIn('id_district', $districtIds)
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
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
    
    public function getPerformanceStats(array $dates): array
    {
        $geoFilters = $this->getGeoFilters($dates);
        $query = $this->baseQuery($geoFilters);
        
        $completionData = $this->calculateFieldCompletion($dates, $geoFilters);
        
        $dossiers = (clone $query)
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
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
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
            ->whereNull('date_fermeture')
            ->where('date_ouverture', '<', now()->subDays(90))
            ->count();
        
        return [
            'taux_completion' => $completionData['taux'],
            'dossiers_complets' => $completionData['complets'],
            'dossiers_incomplets' => $completionData['incomplets'],
            'proprietes_incompletes' => $completionData['proprietes_incompletes'],
            'demandeurs_incomplets' => $completionData['demandeurs_incomplets'],
            'details_incomplets' => $completionData['details'],
            'temps_moyen_traitement' => $tempsMoyen,
            'dossiers_en_retard' => $enRetard,
        ];
    }
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    private function calculateAverageAge(array $dates, array $geoFilters): float
    {
        $districtIds = $this->getFilteredDistrictIds($geoFilters);
        
        $result = DB::table('demandeurs')
            ->whereExists(function($subq) use ($districtIds, $dates) {
                $subq->from('contenir')
                    ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                    ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                    ->whereIn('dossiers.id_district', $districtIds)
                    ->whereBetween('dossiers.date_ouverture', [$dates['from'], $dates['to']]);
            })
            ->whereNotNull('date_naissance')
            ->whereNotNull('sexe')
            ->where('sexe', '!=', '')
            ->whereIn('sexe', ['Homme', 'Femme'])
            ->selectRaw('AVG(DATE_PART(\'year\', AGE(CURRENT_DATE, date_naissance))) as age_moyen')
            ->first();
        
        return $result ? (float) $result->age_moyen : 0.0;
    }
    
    private function calculateAgeBrackets(array $dates, array $geoFilters): array
    {
        $districtIds = $this->getFilteredDistrictIds($geoFilters);
        $tranches = [];
        
        $ranges = [
            '18-30' => [18, 30],
            '31-45' => [31, 45],
            '46-60' => [46, 60],
            '61+' => [61, 999],
        ];
        
        foreach ($ranges as $label => [$min, $max]) {
            $tranches[$label] = DB::table('demandeurs')
                ->whereExists(function($subq) use ($districtIds, $dates) {
                    $subq->from('contenir')
                        ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                        ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                        ->whereIn('dossiers.id_district', $districtIds)
                        ->whereBetween('dossiers.date_ouverture', [$dates['from'], $dates['to']]);
                })
                ->whereNotNull('date_naissance')
                ->whereIn('sexe', ['Homme', 'Femme'])
                ->whereRaw("DATE_PART('year', AGE(CURRENT_DATE, date_naissance)) BETWEEN ? AND ?", [$min, $max])
                ->count();
        }
        
        return $tranches;
    }
    
    private function getGenderStatsOptimized(array $dates, array $geoFilters): array
    {
        $districtIds = $this->getFilteredDistrictIds($geoFilters);
        
        $results = DB::table('demandeurs')
            ->whereExists(function($subq) use ($districtIds, $dates) {
                $subq->from('contenir')
                    ->join('dossiers', 'contenir.id_dossier', '=', 'dossiers.id')
                    ->whereColumn('contenir.id_demandeur', 'demandeurs.id')
                    ->whereIn('dossiers.id_district', $districtIds)
                    ->whereBetween('dossiers.date_ouverture', [$dates['from'], $dates['to']]);
            })
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
        
        return [
            'Homme' => [
                'actifs' => $results->get('Homme')->actifs ?? 0,
                'acquis' => $results->get('Homme')->acquis ?? 0,
                'sans_propriete' => $results->get('Homme')->sans_propriete ?? 0,
            ],
            'Femme' => [
                'actifs' => $results->get('Femme')->actifs ?? 0,
                'acquis' => $results->get('Femme')->acquis ?? 0,
                'sans_propriete' => $results->get('Femme')->sans_propriete ?? 0,
            ],
        ];
    }
    
    private function getRevenueByVocation(string $status, array $dates, array $geoFilters): array
    {
        $districtIds = $this->getFilteredDistrictIds($geoFilters);
        
        return Demander::query()
            ->join('proprietes', 'demander.id_propriete', '=', 'proprietes.id')
            ->join('dossiers as d', 'proprietes.id_dossier', '=', 'd.id')
            ->whereIn('d.id_district', $districtIds)
            ->whereBetween('d.date_ouverture', [$dates['from'], $dates['to']])
            ->where('demander.status', $status)
            ->select('proprietes.vocation')
            ->selectRaw('SUM(demander.total_prix) as total')
            ->groupBy('proprietes.vocation')
            ->pluck('total', 'vocation')
            ->map(fn($val) => (int) $val)
            ->toArray();
    }
    
    private function calculateFieldCompletion(array $dates, array $geoFilters): array
    {
        $districtIds = $this->getFilteredDistrictIds($geoFilters);
        $query = $this->baseQuery($geoFilters)
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']]);
        
        $totalDossiers = $query->count();
        
        if ($totalDossiers === 0) {
            return [
                'taux' => 0,
                'complets' => 0,
                'incomplets' => 0,
                'proprietes_incompletes' => 0,
                'demandeurs_incomplets' => 0,
                'details' => [
                    'dossiers_vides' => 0,
                    'dossiers_avec_demandeurs_incomplets' => 0,
                    'dossiers_avec_proprietes_incompletes' => 0,
                ]
            ];
        }
        
        $demandeursIncomplets = $this->countIncompleteDemandeurs($dates, $geoFilters);
        $proprietesIncompletes = $this->countIncompleteProprietes($dates, $geoFilters);
        
        $dossiersVides = (clone $query)
            ->where(function($q) {
                $q->doesntHave('demandeurs')->orDoesntHave('proprietes');
            })
            ->count();
        
        $dossiersIncomplets = Dossier::query()
            ->whereIn('id_district', $districtIds)
            ->whereBetween('date_ouverture', [$dates['from'], $dates['to']])
            ->where(function($q) {
                $q->whereHas('demandeurs', function($q2) {
                    $q2->where(function($subq) {
                        $this->addIncompleteConditions($subq, 'demandeurs');
                    });
                })
                ->orWhereHas('proprietes', function($q2) {
                    $q2->where(function($subq) {
                        $this->addIncompleteConditions($subq, 'proprietes');
                    });
                });
            })
            ->count();
        
        $dossiersIncomplets += $dossiersVides;
        $dossiersComplets = $totalDossiers - $dossiersIncomplets;
        
        $taux = $totalDossiers > 0 
            ? round(($dossiersComplets / $totalDossiers) * 100, 1) 
            : 0;
        
        return [
            'taux' => $taux,
            'complets' => max(0, $dossiersComplets),
            'incomplets' => $dossiersIncomplets,
            'proprietes_incompletes' => $proprietesIncompletes,
            'demandeurs_incomplets' => $demandeursIncomplets,
            'details' => [
                'dossiers_vides' => $dossiersVides,
                'dossiers_avec_demandeurs_incomplets' => 0,
                'dossiers_avec_proprietes_incompletes' => 0, 
            ]
        ];
    }
    
    private function addIncompleteConditions($query, string $table): void
    {
        if ($table === 'demandeurs') {
            foreach (self::DEMANDEUR_STRING_FIELDS as $field) {
                $query->orWhereNull($field)->orWhere($field, '=', '');
            }
            foreach (self::DEMANDEUR_DATE_FIELDS as $field) {
                $query->orWhereNull($field);
            }
        } else {
            foreach (self::PROPRIETE_STRING_FIELDS as $field) {
                $query->orWhereNull($field)->orWhere($field, '=', '');
            }
            // foreach (self::PROPRIETE_DATE_FIELDS as $field) {
            //     $query->orWhereNull($field);
            // }
            foreach (self::PROPRIETE_NUMERIC_FIELDS as $field) {
                $query->orWhereNull($field)->orWhere($field, '<=', 0);
            }
        }
    }
    
    private function countIncompleteDemandeurs(array $dates, array $geoFilters): int
    {
        $districtIds = $this->getFilteredDistrictIds($geoFilters);
        
        return Demandeur::query()
            ->whereHas('dossiers', function($q) use ($districtIds, $dates) {
                $q->whereIn('id_district', $districtIds)
                  ->whereBetween('date_ouverture', [$dates['from'], $dates['to']]);
            })
            ->where(function($q) {
                $this->addIncompleteConditions($q, 'demandeurs');
            })
            ->count();
    }
    
    private function countIncompleteProprietes(array $dates, array $geoFilters): int
    {
        $districtIds = $this->getFilteredDistrictIds($geoFilters);
        
        return Propriete::query()
            ->whereHas('dossier', function($q) use ($districtIds, $dates) {
                $q->whereIn('id_district', $districtIds)
                  ->whereBetween('date_ouverture', [$dates['from'], $dates['to']]);
            })
            ->where(function($q) {
                $this->addIncompleteConditions($q, 'proprietes');
            })
            ->count();
    }
        
}