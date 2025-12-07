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
 * ✅ AMÉLIORÉ : Filtre "all" par défaut + validation renforcée
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
        
        // ✅ Validation des filtres
        $validated = $request->validate([
            'period' => 'nullable|in:today,week,month,year,all,custom',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'district_id' => 'nullable|integer|exists:districts,id',
        ]);
        
        // ✅ CHANGEMENT : Période par défaut = "all" (Tout)
        $period = $validated['period'] ?? 'all';
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        $districtId = $validated['district_id'] ?? null;

        // ✅ Validation : Utilisateur non super admin ne peut voir que son district
        if (!$user->canAccessAllDistricts() && $districtId !== null && $districtId != $user->id_district) {
            return back()->with('error', 'Vous ne pouvez pas voir les statistiques d\'un autre district.');
        }

        // ✅ Appliquer le contexte district si nécessaire
        if ($districtId && $user->canAccessAllDistricts()) {
            $this->setDistrictContext($districtId);
        }

        // Calculer les dates selon la période
        $dates = $this->statisticsService->getPeriodDates($period, $dateFrom, $dateTo);

        // ✅ Ajouter les métadonnées pour le cache
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
     * ✅ Simuler temporairement le contexte d'un district
     */
    private function setDistrictContext(int $districtId): void
    {
        $user = Auth::user();
        $originalDistrict = $user->id_district;
        $user->id_district = $districtId;
        
        // Restaurer après la requête
        app()->terminating(function() use ($user, $originalDistrict) {
            $user->id_district = $originalDistrict;
        });
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
            'district_id' => 'nullable|integer|exists:districts,id',
        ]);
        
        $period = $validated['period'] ?? 'all';
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        $districtId = $validated['district_id'] ?? null;
        
        // Validation permissions
        if (!$user->canAccessAllDistricts() && $districtId !== null && $districtId != $user->id_district) {
            return back()->with('error', 'Vous ne pouvez pas exporter les statistiques d\'un autre district.');
        }
        
        $dates = $this->statisticsService->getPeriodDates($period, $dateFrom, $dateTo);
        $dates['period'] = $period;
        $dates['district_id'] = $districtId ?? $user->id_district;
        
        if ($districtId && $user->canAccessAllDistricts()) {
            $this->setDistrictContext($districtId);
        }
        
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
            'district_id' => 'nullable|integer|exists:districts,id',
            'type' => 'nullable|in:stats,charts,all',
        ]);
        
        $period = $validated['period'];
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        $districtId = $validated['district_id'] ?? null;
        $type = $validated['type'] ?? 'all';
        
        // Validation
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