<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use App\Models\SystemSettings;
use App\Services\ActivityLogsExportService;
use App\Services\LogCleanupService; // ✅ NOUVEAU
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class LogsSettingsController extends Controller
{
    private ActivityLogsExportService $exportService;
    private LogCleanupService $cleanupService; // ✅ NOUVEAU

    public function __construct(
        ActivityLogsExportService $exportService,
        LogCleanupService $cleanupService // ✅ NOUVEAU
    ) {
        $this->middleware('auth');
        $this->middleware(function ($request, $next) {
            /** @var User $user */
            $user = Auth::user();
            if (!$user->isSuperAdmin()) {
                abort(403, 'Seuls les Super Admins peuvent accéder aux paramètres des logs.');
            }
            return $next($request);
        });

        $this->exportService = $exportService;
        $this->cleanupService = $cleanupService; // ✅ NOUVEAU
    }

    /**
     * Afficher les paramètres des logs avec détection de surcharge
     */
    public function index()
    {
        $retentionDays = SystemSettings::getRetentionDays();
        
        $settings = [
            'auto_delete_enabled' => SystemSettings::isAutoDeleteEnabled(),
            'retention_days' => $retentionDays,
            'cleanup_frequency' => SystemSettings::getCleanupFrequency(),
            'auto_export_before_delete' => SystemSettings::isAutoExportEnabled(),
            'last_cleanup' => SystemSettings::getLastCleanup(),
            'last_export' => SystemSettings::getLastExport(),
            'last_auto_check' => SystemSettings::getLastAutoCheck(),
            'next_cleanup_date' => SystemSettings::getNextCleanupDate()?->format('Y-m-d H:i:s'),
        ];

        // ✅ Statistiques détaillées avec détection de surcharge simplifiée
        $detailedStats = $this->cleanupService->getDetailedStats();
        $overloadStatus = $this->cleanupService->checkOverloadStatus();
        
        $statistics = [
            // Logs actifs (0-retention)
            'active_logs' => $detailedStats['active_logs'],
            
            // Logs archivables (> retention)
            'logs_to_archive' => $detailedStats['archivable_logs'],
            
            // Logs basse priorité
            'low_priority_logs' => $detailedStats['low_priority_logs'],
            
            // Total en BDD
            'total_logs' => $detailedStats['total_logs'],
            
            // Seuil configuré
            'max_logs' => $detailedStats['max_logs'],
            
            // Dates
            'oldest_log' => $detailedStats['oldest_log'],
            'newest_log' => $detailedStats['newest_log'],
            
            // Période de rétention
            'retention_days' => $detailedStats['retention_days'],
            
            // Par action
            'by_action' => $detailedStats['by_action'],
            
            // ✅ Statut de surcharge simplifié
            'overload_status' => $overloadStatus,
        ];

        // Exports disponibles avec distinction auto/manuel
        $exports = $this->exportService->getAvailableExports();

        return Inertia::render('admin/activity-logs/Settings', [
            'settings' => $settings,
            'statistics' => $statistics,
            'exports' => $exports,
        ]);
    }

    /**
     * Mettre à jour les paramètres (avec seuil max_logs configurable)
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'auto_delete_enabled' => 'required|boolean',
            'retention_days' => 'required|integer|min:30|max:365',
            'cleanup_frequency' => 'required|in:daily,weekly,monthly',
            'auto_export_before_delete' => 'required|boolean',
            'max_logs' => 'nullable|integer|min:100000|max:2000000', // ✅ NOUVEAU
        ]);

        SystemSettings::set('logs_auto_delete_enabled', $validated['auto_delete_enabled'], 'boolean');
        SystemSettings::set('logs_retention_days', $validated['retention_days'], 'integer');
        SystemSettings::set('logs_cleanup_frequency', $validated['cleanup_frequency']);
        SystemSettings::set('logs_auto_export_before_delete', $validated['auto_export_before_delete'], 'boolean');
        
        // ✅ NOUVEAU : Seuil max configurable
        if (isset($validated['max_logs'])) {
            SystemSettings::set('logs_max_count', $validated['max_logs'], 'integer');
        }

        return back()->with('success', 'Paramètres mis à jour avec succès.');
    }

    /**
     * Exporter manuellement avec période personnalisée
     */
    public function export(Request $request)
    {
        try {
            $validated = $request->validate([
                'date_from' => 'required|date',
                'date_to' => 'required|date|after_or_equal:date_from',
            ]);

            $dateFrom = Carbon::parse($validated['date_from']);
            $dateTo = Carbon::parse($validated['date_to']);

            // Export manuel sans suppression
            $result = $this->exportService->export(
                isAutoExport: false,
                dateFrom: $dateFrom,
                dateTo: $dateTo
            );

            if (!$result['success']) {
                return back()->with('error', "Erreur lors de l'export : " . ($result['error'] ?? 'Erreur inconnue'));
            }

            // ✅ CORRECTION : Vérifier le chemin complet
            $filePath = storage_path('app/' . $result['path']);
            
            if (!file_exists($filePath)) {
                Log::error('Fichier export introuvable', [
                    'path' => $result['path'],
                    'full_path' => $filePath,
                    'storage_path' => storage_path('app/pieces_jointes/logs/'),
                ]);
                
                return back()->with('error', 'Export créé mais fichier introuvable : ' . $result['path']);
            }

            Log::info('Export manuel des logs', [
                'count' => $result['count'],
                'filename' => $result['filename'],
                'period' => $dateFrom->format('Y-m-d') . ' to ' . $dateTo->format('Y-m-d'),
                'user_id' => Auth::id(),
                'file_path' => $filePath,
                'file_exists' => file_exists($filePath),
                'file_size' => file_exists($filePath) ? filesize($filePath) : 0,
            ]);

            // ✅ CORRECTION : Utiliser response()->download() correctement
            return response()->download(
                $filePath,
                $result['filename'],
                [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition' => 'attachment; filename="' . $result['filename'] . '"',
                    'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                    'Pragma' => 'public',
                ]
            )->deleteFileAfterSend(false);

        } catch (\Exception $e) {
            Log::error('Erreur export manuel logs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);

            return back()->with('error', "Erreur : " . $e->getMessage());
        }
    }

    /**
     * Télécharger un export existant
     */
    public function download(string $filename)
    {
        try {
            // ✅ CORRECTION : Validation stricte du nom de fichier
            if (!preg_match('/^activity_logs_(auto|manual)_.+\.xlsx$/', $filename)) {
                Log::warning('Tentative téléchargement fichier invalide', [
                    'filename' => $filename,
                    'user_id' => Auth::id(),
                ]);
                return back()->with('error', 'Nom de fichier invalide.');
            }

            // ✅ CORRECTION : Chemin absolu complet
            $path = storage_path('app/pieces_jointes/logs/' . $filename);

            if (!file_exists($path)) {
                Log::warning('Fichier export introuvable', [
                    'filename' => $filename,
                    'path' => $path,
                    'user_id' => Auth::id(),
                    'storage_exists' => is_dir(storage_path('app/pieces_jointes/logs/')),
                ]);
                return back()->with('error', 'Fichier introuvable : ' . $filename);
            }

            Log::info('Téléchargement export', [
                'filename' => $filename,
                'path' => $path,
                'size' => filesize($path),
                'user_id' => Auth::id(),
            ]);

            // ✅ CORRECTION : Headers complets pour forcer le téléchargement
            return response()->download(
                $path,
                $filename,
                [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                    'Content-Length' => filesize($path),
                    'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                    'Pragma' => 'public',
                    'Expires' => '0',
                ]
            );

        } catch (\Exception $e) {
            Log::error('Erreur téléchargement export', [
                'filename' => $filename,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Erreur lors du téléchargement : ' . $e->getMessage());
        }
    }

    /**
     * Supprimer un export (seulement si manuel)
     */
    public function deleteExport(string $filename)
    {
        try {
            if (strpos($filename, '_auto_') !== false) {
                return back()->with('error', 'Les exports automatiques ne peuvent pas être supprimés.');
            }

            if ($this->exportService->deleteExport($filename)) {
                return back()->with('success', 'Export manuel supprimé avec succès.');
            }

            return back()->with('error', 'Impossible de supprimer l\'export.');

        } catch (\Exception $e) {
            Log::error('Erreur suppression export', [
                'filename' => $filename,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Erreur lors de la suppression.');
        }
    }

    public function cleanup(Request $request)
    {
        try {
            // Vérifier l'état de surcharge
            $overloadStatus = $this->cleanupService->checkOverloadStatus();
            
            // Nettoyage d'urgence si critique
            if ($overloadStatus['severity'] === 'critical') {
                $result = $this->cleanupService->emergencyCleanup();
                
                if ($result['success']) {
                    return back()->with('warning', $result['message']);
                }
                
                return back()->with('error', $result['error']);
            }
            
            // Nettoyage standard
            $result = $this->cleanupService->standardCleanup();
            
            if ($result['success']) {
                return back()->with('success', $result['message']);
            }
            
            return back()->with('error', $result['error']);

        } catch (\Exception $e) {
            Log::error('Erreur nettoyage logs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->with('error', 'Erreur lors du nettoyage : ' . $e->getMessage());
        }
    }

    /**
     * ✅ NOUVEAU : Suppression manuelle de logs spécifiques par IDs
     */
    public function deleteManually(Request $request)
    {
        try {
            $validated = $request->validate([
                'log_ids' => 'required|array|min:1|max:10000',
                'log_ids.*' => 'required|integer|exists:activity_logs,id',
                'export_before_delete' => 'nullable|boolean',
            ]);

            $result = $this->cleanupService->deleteManually(
                $validated['log_ids'],
                $validated['export_before_delete'] ?? true
            );

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->with('error', $result['error']);

        } catch (\Exception $e) {
            Log::error('Erreur suppression manuelle', [
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Erreur lors de la suppression.');
        }
    }

    /**
     * ✅ NOUVEAU : Suppression manuelle par filtres (date, action, utilisateur...)
     */
    public function deleteByFilters(Request $request)
    {
        try {
            $validated = $request->validate([
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'actions' => 'nullable|array',
                'actions.*' => 'required|string',
                'user_id' => 'nullable|integer|exists:users,id',
                'district_id' => 'nullable|integer|exists:districts,id',
                'entity_type' => 'nullable|string',
                'export_before_delete' => 'nullable|boolean',
            ]);

            $filters = array_filter([
                'date_from' => $validated['date_from'] ?? null,
                'date_to' => $validated['date_to'] ?? null,
                'actions' => $validated['actions'] ?? null,
                'user_id' => $validated['user_id'] ?? null,
                'district_id' => $validated['district_id'] ?? null,
                'entity_type' => $validated['entity_type'] ?? null,
            ]);

            $result = $this->cleanupService->deleteByFilters(
                $filters,
                $validated['export_before_delete'] ?? true
            );

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->with('error', $result['error']);

        } catch (\Exception $e) {
            Log::error('Erreur suppression par filtres', [
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Erreur lors de la suppression.');
        }
    }

    /**
     * ✅ Nettoyage selon le niveau de surcharge (automatique/standard)
     */
    public function previewCleanup()
    {
        try {
            $retentionDays = SystemSettings::getRetentionDays();
            $dateFrom = now()->subDays($retentionDays * 2);
            $dateTo = now()->subDays($retentionDays + 1);
            
            $logs = ActivityLog::whereBetween('created_at', [$dateFrom, $dateTo])
                ->with(['user', 'district'])
                ->orderBy('created_at', 'desc')
                ->limit(100)
                ->get();

            $statistics = [
                'total' => ActivityLog::whereBetween('created_at', [$dateFrom, $dateTo])->count(),
                'active_logs' => ActivityLog::where('created_at', '>=', $dateTo)->count(),
                'period' => [
                    'from' => $dateFrom->format('d/m/Y'),
                    'to' => $dateTo->format('d/m/Y'),
                ],
                'by_action' => ActivityLog::whereBetween('created_at', [$dateFrom, $dateTo])
                    ->selectRaw('action, COUNT(*) as count')
                    ->groupBy('action')
                    ->pluck('count', 'action')
                    ->toArray(),
            ];

            return response()->json([
                'logs' => $logs,
                'statistics' => $statistics,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur preview cleanup', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Erreur lors de la prévisualisation'
            ], 500);
        }
    }
}