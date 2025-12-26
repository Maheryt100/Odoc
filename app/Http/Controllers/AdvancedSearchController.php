<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use App\Models\Demandeur;
use App\Models\Propriete;
use App\Models\Province;
use App\Models\Region;
use App\Models\District;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class AdvancedSearchController extends Controller
{
    const DEFAULT_PAGE_SIZE = 50;
    const MAX_PAGE_SIZE = 100;

    /**
     * Recherche avancée avec pagination cursor-based
     */
    public function search(Request $request)
    {
        $query = trim($request->get('q', ''));
        
        if (strlen($query) < 2) {
            return response()->json([
                'dossiers' => [],
                'total' => 0,
                'loaded' => 0,
                'has_more' => false,
                'next_cursor' => null,
                'filters_available' => $this->getAvailableFilters(),
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        // ✅ SÉCURITÉ : Vérifier l'accès
        if (!$user->canAccessSearchFeature()) {
            abort(403, 'Accès à la recherche refusé');
        }

        $pageSize = min(
            (int) $request->get('per_page', self::DEFAULT_PAGE_SIZE),
            self::MAX_PAGE_SIZE
        );
        $cursor = $request->get('cursor');

        $filters = [
            'province_id' => $request->get('province_id'),
            'region_id' => $request->get('region_id'),
            'district_id' => $request->get('district_id'),
            'statut' => $request->get('statut', 'tous'),
            'date_debut' => $request->get('date_debut'),
            'date_fin' => $request->get('date_fin'),
            'fuzzy' => $request->boolean('fuzzy', true),
        ];

        // Cache uniquement pour la première page
        if (!$cursor) {
            $cacheKey = sprintf(
                'search_v3:%s:%s:%s:%d',
                $user->id,
                md5($query),
                md5(json_encode($filters)),
                $pageSize
            );

            $results = Cache::remember($cacheKey, 300, function () use ($query, $filters, $user, $pageSize, $cursor) {
                return $this->performPaginatedSearch($query, $filters, $user, $pageSize, $cursor);
            });
        } else {
            $results = $this->performPaginatedSearch($query, $filters, $user, $pageSize, $cursor);
        }

        return response()->json([
            'dossiers' => $results['dossiers'],
            'total' => $results['total'],
            'loaded' => $results['loaded'],
            'has_more' => $results['has_more'],
            'next_cursor' => $results['next_cursor'],
            'stats' => $results['stats'],
            'search_info' => $results['search_info'],
            'pagination' => [
                'per_page' => $pageSize,
                'current_page' => $cursor ? 'cursor' : 1,
            ],
            'filters_applied' => $filters,
            'filters_available' => $this->getAvailableFilters(),
        ]);
    }

    /**
     * Recherche avec pagination cursor-based
     */
    private function performPaginatedSearch(string $query, array $filters, User $user, int $pageSize, ?string $cursor): array
    {
        $startTime = microtime(true);

        $searchType = $this->detectSearchType($query);
        $dossiersQuery = $this->buildBaseQuery($query, $searchType, $filters, $user);

        if ($cursor) {
            $dossiersQuery = $this->applyCursor($dossiersQuery, $cursor);
        }

        $dossiers = $dossiersQuery->limit($pageSize + 1)->get();

        $hasMore = $dossiers->count() > $pageSize;
        if ($hasMore) {
            $dossiers = $dossiers->take($pageSize);
        }

        $nextCursor = null;
        if ($hasMore && $dossiers->isNotEmpty()) {
            $lastItem = $dossiers->last();
            $nextCursor = $this->generateCursor($lastItem);
        }

        $total = null;
        if (!$cursor) {
            $countQuery = $this->buildBaseQuery($query, $searchType, $filters, $user, true);
            $total = $countQuery->count();
        }

        $enrichedDossiers = $dossiers->map(function ($dossier) use ($query) {
            return $this->enrichDossierResult($dossier, $query);
        });

        $executionTime = round((microtime(true) - $startTime) * 1000, 2);

        $stats = [
            'loaded' => $dossiers->count(),
            'ouverts' => $dossiers->where('is_closed', false)->count(),
            'fermes' => $dossiers->where('is_closed', true)->count(),
            'execution_time_ms' => $executionTime,
        ];

        return [
            'dossiers' => $enrichedDossiers,
            'total' => $total,
            'loaded' => $dossiers->count(),
            'has_more' => $hasMore,
            'next_cursor' => $nextCursor,
            'stats' => $stats,
            'search_info' => [
                'query' => $query,
                'type' => $searchType,
                'fuzzy_used' => $filters['fuzzy'] ?? true,
                'execution_time' => "{$executionTime}ms",
            ],
        ];
    }

    /**
     * Construire la requête de base
     */
    private function buildBaseQuery(string $query, string $searchType, array $filters, User $user, bool $forCount = false)
    {
        $dossiersQuery = Dossier::query();

        if (!$forCount) {
            $dossiersQuery->with(['district.region.province', 'closedBy:id,name'])
                ->withCount(['demandeurs', 'proprietes']);
        }

        switch ($searchType) {
            case 'numero':
                $dossiersQuery->where('numero_ouverture', intval($query));
                break;
            
            case 'cin':
                $dossiersQuery->whereHas('demandeurs', function ($q) use ($query) {
                    $q->where('cin', $query);
                });
                break;
            
            case 'dep_vol':
                [$dep, $vol] = explode(':', $query);
                $dossiersQuery->whereHas('proprietes', function ($q) use ($dep, $vol) {
                    $q->where(function ($innerQ) use ($dep, $vol) {
                        $innerQ->where('dep_vol_inscription', $dep)
                               ->where('numero_dep_vol_inscription', $vol);
                    })->orWhere(function ($innerQ) use ($dep, $vol) {
                        $innerQ->where('dep_vol_requisition', $dep)
                               ->where('numero_dep_vol_requisition', $vol);
                    });
                });
                break;
            
            default:
                $this->applyFullTextSearch($dossiersQuery, $query, $filters['fuzzy']);
        }

        $this->applyUserFilter($dossiersQuery, $user);
        $this->applyGeographicFilters($dossiersQuery, $filters);
        $this->applyStatusFilter($dossiersQuery, $filters);
        $this->applyDateFilters($dossiersQuery, $filters);

        if (!$forCount) {
            $dossiersQuery->orderBy('date_ouverture', 'desc')
                ->orderBy('id', 'desc');
        }

        return $dossiersQuery;
    }

    private function applyFullTextSearch($query, string $searchTerm, bool $useFuzzy)
    {
        $searchTermLike = '%' . $searchTerm . '%';

        $query->where(function ($q) use ($searchTerm, $searchTermLike, $useFuzzy) {
            $q->where('nom_dossier', 'ILIKE', $searchTermLike)
              ->orWhere('commune', 'ILIKE', $searchTermLike)
              ->orWhere('fokontany', 'ILIKE', $searchTermLike);

            $q->orWhereHas('demandeurs', function ($demQ) use ($searchTermLike) {
                $demQ->where('nom_demandeur', 'ILIKE', $searchTermLike)
                     ->orWhere('prenom_demandeur', 'ILIKE', $searchTermLike)
                     ->orWhere('telephone', 'LIKE', $searchTermLike);
            });

            $q->orWhereHas('proprietes', function ($propQ) use ($searchTermLike) {
                $propQ->where('lot', 'ILIKE', $searchTermLike)
                     ->orWhere('titre', 'ILIKE', $searchTermLike)
                     ->orWhere('proprietaire', 'ILIKE', $searchTermLike);
            });

            if ($useFuzzy) {
                $q->orWhereRaw("similarity(nom_dossier, ?) > 0.3", [$searchTerm])
                  ->orWhereRaw("similarity(commune, ?) > 0.3", [$searchTerm]);
            }
        });
    }

    private function applyCursor($query, string $cursor)
    {
        try {
            $decoded = json_decode(base64_decode($cursor), true);
            
            if (!isset($decoded['date_ouverture'], $decoded['id'])) {
                throw new \Exception('Invalid cursor');
            }

            $query->where(function ($q) use ($decoded) {
                $q->where('date_ouverture', '<', $decoded['date_ouverture'])
                  ->orWhere(function ($q2) use ($decoded) {
                      $q2->where('date_ouverture', '=', $decoded['date_ouverture'])
                         ->where('id', '<', $decoded['id']);
                  });
            });

        } catch (\Exception $e) {
            // Cursor invalide : ignorer
        }

        return $query;
    }

    private function generateCursor(Dossier $dossier): string
    {
        return base64_encode(json_encode([
            'date_ouverture' => $dossier->date_ouverture->format('Y-m-d'),
            'id' => $dossier->id,
        ]));
    }

    private function detectSearchType(string $query): string
    {
        if (preg_match('/^\d+$/', $query)) return 'numero';
        if (preg_match('/^\d{12}$/', $query)) return 'cin';
        if (preg_match('/^\d+:\d+$/', $query)) return 'dep_vol';
        return 'fulltext';
    }

    private function applyUserFilter($query, User $user): void
    {
        if (!$user->canAccessAllDistricts()) {
            $query->where('dossiers.id_district', $user->id_district);
        }
    }

    private function applyGeographicFilters($query, array $filters): void
    {
        if (!empty($filters['district_id'])) {
            $query->where('dossiers.id_district', $filters['district_id']);
        } elseif (!empty($filters['region_id'])) {
            $query->whereHas('district', fn($q) => $q->where('id_region', $filters['region_id']));
        } elseif (!empty($filters['province_id'])) {
            $query->whereHas('district.region', fn($q) => $q->where('id_province', $filters['province_id']));
        }
    }

    private function applyStatusFilter($query, array $filters): void
    {
        if (!empty($filters['statut'])) {
            switch ($filters['statut']) {
                case 'ouverts':
                    $query->whereNull('date_fermeture');
                    break;
                case 'fermes':
                    $query->whereNotNull('date_fermeture');
                    break;
            }
        }
    }

    private function applyDateFilters($query, array $filters): void
    {
        if (!empty($filters['date_debut'])) {
            $query->where('date_ouverture', '>=', $filters['date_debut']);
        }
        if (!empty($filters['date_fin'])) {
            $query->where('date_ouverture', '<=', $filters['date_fin']);
        }
    }

    private function enrichDossierResult(Dossier $dossier, string $query): array
    {
        return [
            'id' => $dossier->id,
            'nom_dossier' => $dossier->nom_dossier,
            'numero_ouverture' => $dossier->numero_ouverture,
            'numero_ouverture_display' => $dossier->numero_ouverture_display,
            'commune' => $dossier->commune,
            'fokontany' => $dossier->fokontany,
            'circonscription' => $dossier->circonscription,
            'type_commune' => $dossier->type_commune,
            'date_ouverture' => $dossier->date_ouverture,
            'date_fermeture' => $dossier->date_fermeture,
            'is_closed' => $dossier->is_closed,
            'demandeurs_count' => $dossier->demandeurs_count ?? 0,
            'proprietes_count' => $dossier->proprietes_count ?? 0,
            
            'district' => $dossier->district ? [
                'id' => $dossier->district->id,
                'nom' => $dossier->district->nom_district,
            ] : null,
            'region' => $dossier->district?->region ? [
                'id' => $dossier->district->region->id,
                'nom' => $dossier->district->region->nom_region,
            ] : null,
            'province' => $dossier->district?->region?->province ? [
                'id' => $dossier->district->region->province->id,
                'nom' => $dossier->district->region->province->nom_province,
            ] : null,
            
            'match_context' => $this->getMatchContext($dossier, $query),
        ];
    }

    private function getMatchContext(Dossier $dossier, string $query): array
    {
        $context = [];
        $searchLower = mb_strtolower($query);

        if (mb_stripos($dossier->nom_dossier, $query) !== false) {
            $context[] = "Nom du dossier";
        }
        if (mb_stripos($dossier->commune, $query) !== false) {
            $context[] = "Commune: {$dossier->commune}";
        }

        return array_slice($context, 0, 3);
    }

    private function getAvailableFilters(): array
    {
        /** @var User $user */
        $user = Auth::user();

        $filters = [
            'statuts' => [
                ['value' => 'tous', 'label' => 'Tous'],
                ['value' => 'ouverts', 'label' => 'Ouverts'],
                ['value' => 'fermes', 'label' => 'Fermés'],
            ],
        ];

        if ($user->canAccessAllDistricts()) {
            $filters['provinces'] = Province::select('id', 'nom_province')
                ->orderBy('nom_province')
                ->get()
                ->map(fn($p) => ['value' => $p->id, 'label' => $p->nom_province]);

            $filters['regions'] = Region::select('id', 'nom_region', 'id_province')
                ->orderBy('nom_region')
                ->get()
                ->map(fn($r) => [
                    'value' => $r->id,
                    'label' => $r->nom_region,
                    'province_id' => $r->id_province,
                ]);

            $filters['districts'] = District::select('id', 'nom_district', 'id_region')
                ->orderBy('nom_district')
                ->get()
                ->map(fn($d) => [
                    'value' => $d->id,
                    'label' => $d->nom_district,
                    'region_id' => $d->id_region,
                ]);
        }

        return $filters;
    }

    /**
     * Suggestions autocomplete
     */
    public function suggestions(Request $request)
    {
        $query = trim($request->get('q', ''));
        
        if (strlen($query) < 2) {
            return response()->json(['suggestions' => []]);
        }

        /** @var User $user */
        $user = Auth::user();
        $searchTerm = '%' . $query . '%';

        $suggestions = [];

        $dossiers = Dossier::select('id', 'nom_dossier', 'numero_ouverture')
            ->where('nom_dossier', 'ILIKE', $searchTerm)
            ->when(!$user->canAccessAllDistricts(), fn($q) => $q->where('id_district', $user->id_district))
            ->limit(5)
            ->get();

        foreach ($dossiers as $d) {
            $suggestions[] = [
                'type' => 'dossier',
                'label' => $d->nom_dossier,
                'sublabel' => "N°{$d->numero_ouverture}",
                'value' => $d->nom_dossier,
                'id' => $d->id,
            ];
        }

        return response()->json(['suggestions' => $suggestions]);
    }

    /**
     * Export CSV
     */
    public function export(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        // ✅ SÉCURITÉ : Tous les utilisateurs peuvent exporter
        if (!$user->canExportData()) {
            abort(403, 'Permission refusée');
        }

        $query = trim($request->get('q', ''));
        $filters = [
            'province_id' => $request->get('province_id'),
            'region_id' => $request->get('region_id'),
            'district_id' => $request->get('district_id'),
            'statut' => $request->get('statut'),
            'date_debut' => $request->get('date_debut'),
            'date_fin' => $request->get('date_fin'),
        ];

        $searchType = $this->detectSearchType($query);
        $dossiersQuery = $this->buildBaseQuery($query, $searchType, $filters, $user);
        $dossiers = $dossiersQuery->limit(10000)->get();

        $enrichedDossiers = $dossiers->map(fn($d) => $this->enrichDossierResult($d, $query));
        
        $filename = 'recherche_' . date('Y-m-d_His') . '.csv';
        
        return response()->streamDownload(function () use ($enrichedDossiers) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            
            fputcsv($handle, [
                'N° Ouverture', 'Nom Dossier', 'Commune', 'Fokontany',
                'District', 'Région', 'Province', 'Statut',
                'Date Ouverture', 'Demandeurs', 'Propriétés',
            ], ';');
            
            foreach ($enrichedDossiers as $d) {
                fputcsv($handle, [
                    $d['numero_ouverture'] ?? '',
                    $d['nom_dossier'],
                    $d['commune'],
                    $d['fokontany'],
                    $d['district']['nom'] ?? '',
                    $d['region']['nom'] ?? '',
                    $d['province']['nom'] ?? '',
                    $d['is_closed'] ? 'Fermé' : 'Ouvert',
                    $d['date_ouverture'],
                    $d['demandeurs_count'],
                    $d['proprietes_count'],
                ], ';');
            }
            
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=utf-8',
        ]);
    }
}