<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\SystemSettings;
use App\Services\ActivityLogsExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\User;

class LogsSettingsController extends Controller
{
    private ActivityLogsExportService $exportService;

    public function __construct(ActivityLogsExportService $exportService)
    {
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
    }

    /**
     * Afficher les paramètres des logs
     */
    public function index()
    {
        $settings = [
            'auto_delete_enabled' => SystemSettings::isAutoDeleteEnabled(),
            'retention_days' => SystemSettings::getRetentionDays(),
            'cleanup_frequency' => SystemSettings::getCleanupFrequency(),
            'auto_export_before_delete' => SystemSettings::isAutoExportEnabled(),
            'last_cleanup' => SystemSettings::getLastCleanup(),
            'last_export' => SystemSettings::getLastExport(),
            'last_auto_check' => SystemSettings::getLastAutoCheck(),
            'next_cleanup_date' => SystemSettings::getNextCleanupDate()?->format('Y-m-d H:i:s'),
        ];

        // Statistiques des logs
        $cutoffDate = now()->subDays($settings['retention_days']);
        $logsToDelete = ActivityLog::where('created_at', '<', $cutoffDate)->count();
        $totalLogs = ActivityLog::count();

        // Exports disponibles
        $exports = $this->exportService->getAvailableExports();

        return Inertia::render('admin/activity-logs/Settings', [
            'settings' => $settings,
            'statistics' => [
                'total_logs' => $totalLogs,
                'logs_to_delete' => $logsToDelete,
                'oldest_log' => ActivityLog::oldest()->first()?->created_at?->format('d/m/Y H:i'),
                'newest_log' => ActivityLog::latest()->first()?->created_at?->format('d/m/Y H:i'),
            ],
            'exports' => $exports,
        ]);
    }

    /**
     * Mettre à jour les paramètres
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'auto_delete_enabled' => 'required|boolean',
            'retention_days' => 'required|integer|min:30|max:365',
            'cleanup_frequency' => 'required|in:daily,weekly,monthly',
            'auto_export_before_delete' => 'required|boolean',
        ]);

        SystemSettings::set('logs_auto_delete_enabled', $validated['auto_delete_enabled'], 'boolean');
        SystemSettings::set('logs_retention_days', $validated['retention_days'], 'integer');
        SystemSettings::set('logs_cleanup_frequency', $validated['cleanup_frequency']);
        SystemSettings::set('logs_auto_export_before_delete', $validated['auto_export_before_delete'], 'boolean');

        return back()->with('success', 'Paramètres mis à jour avec succès.');
    }

    /**
     * Exporter manuellement tous les logs
     */
    public function export(Request $request)
    {
        try {
            // Récupérer tous les logs avec relations
            $logs = ActivityLog::with(['user', 'district'])
                ->orderBy('created_at', 'desc')
                ->get();

            if ($logs->isEmpty()) {
                return back()->with('error', 'Aucun log à exporter.');
            }

            // Effectuer l'export
            $result = $this->exportService->export($logs, null, false);

            if ($result['success']) {
                // Télécharger directement le fichier
                $filePath = storage_path('app/' . $result['path']);
                
                if (file_exists($filePath)) {
                    return response()->download(
                        $filePath,
                        $result['filename'],
                        [
                            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        ]
                    )->deleteFileAfterSend(false); // Ne pas supprimer, on garde l'export
                }

                return back()->with('error', 'Fichier exporté mais introuvable.');
            }

            return back()->with('error', "Erreur lors de l'export : " . ($result['error'] ?? 'Erreur inconnue'));

        } catch (\Exception $e) {

            return back()->with('error', "Erreur lors de l'export : " . $e->getMessage());
        }
    }

    /**
     * Télécharger un export existant
     */
    public function download(string $filename)
    {
        try {
            // Sécurité : vérifier que le nom de fichier est valide
            if (!preg_match('/^activity_logs_[a-z]+_\d{4}-\d{2}-\d{2}_\d{6}\.xlsx$/', $filename)) {
                return back()->with('error', 'Nom de fichier invalide.');
            }

            $path = storage_path('app/pieces_jointes/logs/' . $filename);

            if (!file_exists($path)) {
                return back()->with('error', 'Fichier introuvable.');
            }

            return response()->download(
                $path,
                $filename,
                [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ]
            );

        } catch (\Exception $e) {
           

            return back()->with('error', 'Erreur lors du téléchargement.');
        }
    }

    /**
     * Supprimer un export
     */
    public function deleteExport(string $filename)
    {
        try {
            if ($this->exportService->deleteExport($filename)) {
                return back()->with('success', 'Export supprimé avec succès.');
            }

            return back()->with('error', 'Impossible de supprimer l\'export.');

        } catch (\Exception $e) {
        

            return back()->with('error', 'Erreur lors de la suppression.');
        }
    }

    /**
     * Nettoyer manuellement les logs
     */
    public function cleanup(Request $request)
    {
        try {
            $validated = $request->validate([
                'force' => 'nullable|boolean',
                'export_before' => 'nullable|boolean',
            ]);

            $days = SystemSettings::getRetentionDays();
            $cutoffDate = now()->subDays($days);
            
            $logsToDelete = ActivityLog::where('created_at', '<', $cutoffDate)->get();
            $count = $logsToDelete->count();

            if ($count === 0) {
                return back()->with('info', 'Aucun log à supprimer.');
            }

            // Export avant suppression si demandé
            if ($validated['export_before'] ?? true) {
                $result = $this->exportService->export(
                    logs: $logsToDelete,
                    autoExport: true
                );

                if (!$result['success']) {
                    return back()->with('error', "Erreur lors de l'export : " . ($result['error'] ?? 'Erreur inconnue'));
                }
            }

            // Suppression par chunks
            foreach ($logsToDelete->chunk(100) as $chunk) {
                ActivityLog::whereIn('id', $chunk->pluck('id'))->delete();
            }

            SystemSettings::updateLastCleanup();

            return back()->with('success', "{$count} logs supprimés avec succès.");

        } catch (\Exception $e) {
           

            return back()->with('error', 'Erreur lors du nettoyage : ' . $e->getMessage());
        }
    }

    /**
     * Prévisualiser les logs à supprimer
     */
    public function previewCleanup()
    {
        try {
            $days = SystemSettings::getRetentionDays();
            $cutoffDate = now()->subDays($days);
            
            $logs = ActivityLog::where('created_at', '<', $cutoffDate)
                ->with(['user', 'district'])
                ->orderBy('created_at', 'desc')
                ->limit(100)
                ->get();

            $statistics = [
                'total' => ActivityLog::where('created_at', '<', $cutoffDate)->count(),
                'by_action' => ActivityLog::where('created_at', '<', $cutoffDate)
                    ->selectRaw('action, COUNT(*) as count')
                    ->groupBy('action')
                    ->pluck('count', 'action')
                    ->toArray(),
                'by_entity' => ActivityLog::where('created_at', '<', $cutoffDate)
                    ->selectRaw('entity_type, COUNT(*) as count')
                    ->groupBy('entity_type')
                    ->pluck('count', 'entity_type')
                    ->toArray(),
            ];

            return response()->json([
                'logs' => $logs,
                'statistics' => $statistics,
                'cutoff_date' => $cutoffDate->format('d/m/Y H:i:s'),
            ]);

        } catch (\Exception $e) {
           

            return response()->json([
                'error' => 'Erreur lors de la prévisualisation'
            ], 500);
        }
    }
}