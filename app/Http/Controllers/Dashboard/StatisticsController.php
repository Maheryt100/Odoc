<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Dashboard\Services\StatisticsService;
use App\Models\District;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Contrôleur des statistiques
 * Responsabilité : Gérer les requêtes HTTP et retourner les vues
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
        // Validation des filtres
        $validated = $request->validate([
            'period' => 'nullable|in:today,week,month,year,all,custom',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'district_id' => 'nullable|integer|exists:districts,id',
        ]);
        
        // Récupération des filtres avec valeurs par défaut
        $period = $validated['period'] ?? 'month';
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        $districtId = $validated['district_id'] ?? null;

        // Déterminer les dates selon la période
        $dates = $this->statisticsService->getPeriodDates($period, $dateFrom, $dateTo);

        return Inertia::render('Statistics/Index', [
            'stats' => $this->statisticsService->getAllStats($dates),
            'charts' => $this->statisticsService->getAllCharts($dates),
            'filters' => [
                'period' => $period,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'district_id' => $districtId,
            ],
            'districts' => District::orderBy('nom_district')->get(['id', 'nom_district']),
        ]);
    }

    /**
     * Export PDF des statistiques
     * TODO: À implémenter avec DomPDF ou Snappy
     */
    public function exportPDF(Request $request)
    {
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
        
        $dates = $this->statisticsService->getPeriodDates($period, $dateFrom, $dateTo);
        
        // Récupérer les données
        $stats = $this->statisticsService->getAllStats($dates);
        $charts = $this->statisticsService->getAllCharts($dates);
        
        // TODO: Générer le PDF avec Snappy ou DomPDF
        // Exemple avec Snappy:
        // $pdf = \PDF::loadView('statistics.pdf', compact('stats', 'charts', 'dates'));
        // return $pdf->download('statistiques-' . now()->format('Y-m-d') . '.pdf');
        
        return response()->json([
            'message' => 'Export PDF à implémenter',
            'data' => [
                'stats' => $stats,
                'charts' => $charts,
            ]
        ], 501);
    }
}