<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Dashboard\Services\Statistics\StatisticsService;
use App\Models\User;
use App\Models\Province;
use App\Models\Region;
use App\Models\District;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * ✅ AVEC FILTRAGE GÉOGRAPHIQUE HIÉRARCHIQUE
 * Province → Région → District
 */
class StatisticsController extends Controller
{
    public function __construct(
        private StatisticsService $statisticsService
    ) {}

    public function index(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // ✅ VALIDATION DES FILTRES
        $validated = $request->validate([
            'period' => 'nullable|in:today,week,month,year,all,custom',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'province_id' => 'nullable|integer|exists:provinces,id',
            'region_id' => 'nullable|integer|exists:regions,id',
            'district_id' => 'nullable|integer|exists:districts,id',
        ]);
        
        // ✅ PÉRIODE (défaut = "all")
        $period = $validated['period'] ?? 'all';
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        
        // ✅ FILTRES GÉOGRAPHIQUES
        $provinceId = $validated['province_id'] ?? null;
        $regionId = $validated['region_id'] ?? null;
        $districtId = $validated['district_id'] ?? null;

        // ✅ SÉCURITÉ : Utilisateur district ne peut pas filtrer géographiquement
        if (!$user->canAccessAllDistricts()) {
            // Forcer sur son district
            $provinceId = null;
            $regionId = null;
            $districtId = $user->id_district;
            
            // Refuser si tentative de voir autre district
            if (isset($validated['district_id']) && $validated['district_id'] != $user->id_district) {
                return back()->with('error', 'Vous ne pouvez pas voir les statistiques d\'un autre district.');
            }
            if (isset($validated['region_id']) || isset($validated['province_id'])) {
                return back()->with('error', 'Vous ne pouvez pas appliquer de filtres géographiques.');
            }
        }

        // ✅ VALIDATION HIÉRARCHIE (si Super Admin filtre)
        if ($user->canAccessAllDistricts()) {
            // Si district choisi → vérifier qu'il appartient à la région (si fournie)
            if ($districtId && $regionId) {
                $district = District::find($districtId);
                if (!$district || $district->id_region != $regionId) {
                    return back()->with('error', 'Le district sélectionné n\'appartient pas à cette région.');
                }
            }
            
            // Si région choisie → vérifier qu'elle appartient à la province (si fournie)
            if ($regionId && $provinceId) {
                $region = Region::find($regionId);
                if (!$region || $region->id_province != $provinceId) {
                    return back()->with('error', 'La région sélectionnée n\'appartient pas à cette province.');
                }
            }
        }

        // ✅ CALCULER LES DATES
        $dates = $this->statisticsService->getPeriodDates($period, $dateFrom, $dateTo);

        // ✅ AJOUTER MÉTADONNÉES POUR CACHE ET FILTRAGE
        $dates['period'] = $period;
        $dates['province_id'] = $provinceId;
        $dates['region_id'] = $regionId;
        $dates['district_id'] = $districtId;

        // ✅ DONNÉES GÉOGRAPHIQUES POUR LES SÉLECTEURS
        $canFilterGeography = $user->canAccessAllDistricts();
        
        $provinces = $canFilterGeography 
            ? Province::orderBy('nom_province')->get(['id', 'nom_province'])
            : collect();
        
        $regions = $canFilterGeography
            ? Region::with('province:id,nom_province')
                ->orderBy('nom_region')
                ->get(['id', 'nom_region', 'id_province'])
            : collect();
        
        $districts = $canFilterGeography
            ? District::with(['region:id,nom_region,id_province', 'region.province:id,nom_province'])
                ->orderBy('nom_district')
                ->get(['id', 'nom_district', 'id_region'])
            : collect([$user->district])->filter();

        // ✅ CORRECTION : Charger explicitement le district avec ses relations
        $userDistrict = null;
        if (!$canFilterGeography && $user->id_district) {
            $userDistrict = District::with(['region:id,nom_region', 'region.province:id,nom_province'])
                ->find($user->id_district, ['id', 'nom_district', 'id_region']);
        }

        return Inertia::render('Statistics/Index', [
            'stats' => $this->statisticsService->getAllStats($dates),
            'charts' => $this->statisticsService->getAllCharts($dates),
            'filters' => [
                'period' => $period,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'province_id' => $provinceId,
                'region_id' => $regionId,
                'district_id' => $districtId,
            ],
            'provinces' => $provinces,
            'regions' => $regions,
            'districts' => $districts,
            'canFilterGeography' => $canFilterGeography,
            'userDistrict' => $userDistrict, // ✅ Chargé explicitement
        ]);
    }

    /**
     * Export PDF
     */
    public function exportPDF(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $validated = $request->validate([
            'period' => 'nullable|in:today,week,month,year,all,custom',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'province_id' => 'nullable|integer|exists:provinces,id',
            'region_id' => 'nullable|integer|exists:regions,id',
            'district_id' => 'nullable|integer|exists:districts,id',
        ]);
        
        $period = $validated['period'] ?? 'all';
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        $provinceId = $validated['province_id'] ?? null;
        $regionId = $validated['region_id'] ?? null;
        $districtId = $validated['district_id'] ?? null;
        
        // Validation permissions
        if (!$user->canAccessAllDistricts()) {
            $provinceId = null;
            $regionId = null;
            $districtId = $user->id_district;
        }
        
        $dates = $this->statisticsService->getPeriodDates($period, $dateFrom, $dateTo);
        $dates['period'] = $period;
        $dates['province_id'] = $provinceId;
        $dates['region_id'] = $regionId;
        $dates['district_id'] = $districtId;
        
        $stats = $this->statisticsService->getAllStats($dates);
        $charts = $this->statisticsService->getAllCharts($dates);
        
        // TODO: Implémenter génération PDF
        return response()->json([
            'message' => 'Export PDF à implémenter',
            'data' => [
                'stats' => $stats,
                'charts' => $charts,
            ]
        ], 501);
    }

    /**
     * ✅ API pour refresh partiel (AJAX)
     */
    public function refresh(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $validated = $request->validate([
            'period' => 'required|in:today,week,month,year,all,custom',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'province_id' => 'nullable|integer|exists:provinces,id',
            'region_id' => 'nullable|integer|exists:regions,id',
            'district_id' => 'nullable|integer|exists:districts,id',
            'type' => 'nullable|in:stats,charts,all',
        ]);
        
        $period = $validated['period'];
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        $provinceId = $validated['province_id'] ?? null;
        $regionId = $validated['region_id'] ?? null;
        $districtId = $validated['district_id'] ?? null;
        $type = $validated['type'] ?? 'all';
        
        // Validation
        if (!$user->canAccessAllDistricts()) {
            $provinceId = null;
            $regionId = null;
            $districtId = $user->id_district;
        }
        
        $dates = $this->statisticsService->getPeriodDates($period, $dateFrom, $dateTo);
        $dates['period'] = $period;
        $dates['province_id'] = $provinceId;
        $dates['region_id'] = $regionId;
        $dates['district_id'] = $districtId;
        
        $response = [];
        
        if ($type === 'stats' || $type === 'all') {
            $response['stats'] = $this->statisticsService->getAllStats($dates);
        }
        
        if ($type === 'charts' || $type === 'all') {
            $response['charts'] = $this->statisticsService->getAllCharts($dates);
        }
        
        return response()->json($response);
    }

    /**
     * Stats du cache (admin only)
     */
    public function cacheStats()
    {
        /** @var User $user */
        $user = Auth::user();
        
        if (!$user->canAccessAllDistricts()) {
            abort(403, 'Accès non autorisé');
        }
        
        return response()->json(
            $this->statisticsService->getCacheStats()
        );
    }

    /**
     * Préchauffer le cache (admin only)
     */
    public function warmUpCache()
    {
        /** @var User $user */
        $user = Auth::user();
        
        if (!$user->canAccessAllDistricts()) {
            abort(403, 'Accès non autorisé');
        }
        
        $this->statisticsService->warmUpCache();
        
        return response()->json([
            'message' => 'Cache préchauffé avec succès'
        ]);
    }
}