<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Dashboard\Services\StatisticsService;
use App\Models\User;
use App\Models\District;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Contrôleur des statistiques avec filtres complets
 * ✅ CORRECTION : Gestion complète des filtres période + district
 */
class StatisticsController extends Controller
{
    public function __construct(
        private StatisticsService $statisticsService
    ) {}

    /**
     * Page principale des statistiques avec filtres
     */
    public function index(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // ✅ Validation des filtres
        $validated = $request->validate([
            'period' => 'nullable|in:today,week,month,year,all,custom',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'district_id' => 'nullable|integer|exists:districts,id',
        ]);
        
        // ✅ Récupération des filtres avec valeurs par défaut
        $period = $validated['period'] ?? 'month';
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        $districtId = $validated['district_id'] ?? null;

        // ✅ VALIDATION : Si l'utilisateur n'est pas super admin, forcer son district
        if (!$user->canAccessAllDistricts() && $districtId !== null && $districtId != $user->id_district) {
            return back()->with('error', 'Vous ne pouvez pas voir les statistiques d\'un autre district.');
        }

        // ✅ Appliquer le filtre district si nécessaire
        if ($districtId && $user->canAccessAllDistricts()) {
            // Super admin avec district sélectionné : simuler le contexte
            $this->setDistrictContext($districtId);
        }

        // Déterminer les dates selon la période
        $dates = $this->statisticsService->getPeriodDates($period, $dateFrom, $dateTo);

        // ✅ NOUVEAU : Ajouter les filtres aux dates pour le cache
        $dates['period'] = $period;
        $dates['district_id'] = $districtId ?? $user->id_district;

        // Récupérer les districts disponibles
        $districts = $user->canAccessAllDistricts()
            ? District::orderBy('nom_district')->get(['id', 'nom_district'])
            : collect([$user->district])->filter();

        return Inertia::render('Statistics/Index', [
            'stats' => $this->statisticsService->getAllStats($dates),
            'charts' => $this->statisticsService->getAllCharts($dates),
            'filters' => [
                'period' => $period,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'district_id' => $districtId,
            ],
            'districts' => $districts,
        ]);
    }

    /**
     * ✅ NOUVEAU : Simuler le contexte d'un district pour le calcul des stats
     * Utilisé quand un super admin filtre par district
     */
    private function setDistrictContext(int $districtId): void
    {
        // Injecter temporairement le district dans l'utilisateur
        // Ceci affecte les Traits\QueryFilterTrait dans les services
        $user = Auth::user();
        $originalDistrict = $user->id_district;
        $user->id_district = $districtId;
        
        // Important : restaurer après la requête
        app()->terminating(function() use ($user, $originalDistrict) {
            $user->id_district = $originalDistrict;
        });
    }

    /**
     * Export PDF des statistiques
     */
    public function exportPDF(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Validation
        $validated = $request->validate([
            'period' => 'nullable|in:today,week,month,year,all,custom',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'district_id' => 'nullable|integer|exists:districts,id',
        ]);
        
        $period = $validated['period'] ?? 'month';
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        $districtId = $validated['district_id'] ?? null;
        
        // ✅ Validation des permissions
        if (!$user->canAccessAllDistricts() && $districtId !== null && $districtId != $user->id_district) {
            return back()->with('error', 'Vous ne pouvez pas exporter les statistiques d\'un autre district.');
        }
        
        $dates = $this->statisticsService->getPeriodDates($period, $dateFrom, $dateTo);
        $dates['period'] = $period;
        $dates['district_id'] = $districtId ?? $user->id_district;
        
        if ($districtId && $user->canAccessAllDistricts()) {
            $this->setDistrictContext($districtId);
        }
        
        // Récupérer les données
        $stats = $this->statisticsService->getAllStats($dates);
        $charts = $this->statisticsService->getAllCharts($dates);
        
        // TODO: Générer le PDF avec Snappy ou DomPDF
        return response()->json([
            'message' => 'Export PDF à implémenter',
            'data' => [
                'stats' => $stats,
                'charts' => $charts,
            ]
        ], 501);
    }

    /**
     * ✅ NOUVEAU : API pour récupérer les stats via AJAX (pour refresh partiel)
     */
    public function refresh(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $validated = $request->validate([
            'period' => 'required|in:today,week,month,year,all,custom',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'district_id' => 'nullable|integer|exists:districts,id',
            'type' => 'nullable|in:stats,charts,all',
        ]);
        
        $period = $validated['period'];
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        $districtId = $validated['district_id'] ?? null;
        $type = $validated['type'] ?? 'all';
        
        // Validation permissions
        if (!$user->canAccessAllDistricts() && $districtId !== null && $districtId != $user->id_district) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $dates = $this->statisticsService->getPeriodDates($period, $dateFrom, $dateTo);
        $dates['period'] = $period;
        $dates['district_id'] = $districtId ?? $user->id_district;
        
        if ($districtId && $user->canAccessAllDistricts()) {
            $this->setDistrictContext($districtId);
        }
        
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
     * ✅ NOUVEAU : Endpoint pour les statistiques du cache
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
     * ✅ NOUVEAU : Endpoint pour préchauffer le cache
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