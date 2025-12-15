<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Dashboard\Services\Dashboard\DashboardKpiService;
use App\Http\Controllers\Dashboard\Services\Dashboard\DashboardChartService;
use App\Http\Controllers\Dashboard\Services\Shared\AlertService;
use App\Http\Controllers\Dashboard\Services\Shared\ActivityService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Dashboard Controller
 * 
 * Responsabilité : Vue d'ensemble rapide (12 derniers mois)
 * - KPIs en temps réel (cache 5 min)
 * - Graphiques simplifiés (cache 10 min)
 * - Alertes système (toutes données)
 * - Activité récente (10 dernières actions)
 *
 * Période fixe : 12 derniers mois
 *  Pour analyses détaillées avec filtres : voir StatisticsController
 */
class DashboardController extends Controller
{
    public function __construct(
        private DashboardKpiService $kpiService,
        private DashboardChartService $chartService,
        private AlertService $alertService,
        private ActivityService $activityService
    ) {}

    /**
     * Page d'accueil du dashboard
     * 
     * Affiche les statistiques des 12 derniers mois
     * Cache agressif pour performance optimale
     * 
     * @return \Inertia\Response
     */
    public function index()
    {
        return Inertia::render('Dashboard/Index', [
            'kpis' => $this->kpiService->getAllKpis(),
            'charts' => $this->chartService->getAllCharts(),
            'alerts' => $this->alertService->getSystemAlerts(),
            'recentActivity' => $this->activityService->getRecentActivity(10),
        ]);
    }

    /**
     * Rafraîchir les données du dashboard (AJAX)
     * 
     * Permet de rafraîchir une section spécifique ou toutes les sections
     * Utile pour les mises à jour en temps réel
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh(Request $request)
    {
        $validated = $request->validate([
            'type' => 'nullable|in:kpis,charts,alerts,activity,all',
        ]);
        
        $type = $validated['type'] ?? 'all';
        $response = [];
        
        if ($type === 'kpis' || $type === 'all') {
            $response['kpis'] = $this->kpiService->getAllKpis();
        }
        
        if ($type === 'charts' || $type === 'all') {
            $response['charts'] = $this->chartService->getAllCharts();
        }
        
        if ($type === 'alerts' || $type === 'all') {
            $response['alerts'] = $this->alertService->getSystemAlerts();
        }
        
        if ($type === 'activity' || $type === 'all') {
            $response['activity'] = $this->activityService->getRecentActivity(10);
        }
        
        return response()->json($response);
    }

    /**
     * Invalider le cache du dashboard (admin only)
     * 
     * Vide le cache des KPIs et graphiques du dashboard
     * Utile après des modifications importantes de données
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function clearCache()
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();
        
        // Seuls les admins peuvent vider le cache
        if (!$user->canAccessAllDistricts()) {
            abort(403, 'Accès non autorisé');
        }
        
        $this->kpiService->invalidateCache();
        
        return response()->json([
            'message' => 'Cache du dashboard invalidé avec succès',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Obtenir les statistiques de cache (admin only)
     * 
     * Affiche les informations sur l'utilisation du cache
     * Utile pour le monitoring et le debugging
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function cacheStats()
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        
        if (!$user->canAccessAllDistricts()) {
            abort(403, 'Accès non autorisé');
        }
        
        // Note: À implémenter dans DashboardKpiService si besoin
        return response()->json([
            'message' => 'Dashboard cache stats',
            'info' => 'Cache TTL: 5-10 minutes',
            'period' => '12 derniers mois',
        ]);
    }
}