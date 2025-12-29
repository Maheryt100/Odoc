<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use App\Models\SystemSettings;
use App\Services\ActivityLogsExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

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

        // Statistiques à 3 niveaux
        $now = now();
        $cutoffActive = $now->copy()->subDays($retentionDays);
        $cutoffArchive = $now->copy()->subDays($retentionDays * 2);
        
        $statistics = [
            // Niveau 1 : Logs actifs (0-90j)
            'active_logs' => ActivityLog::where('created_at', '>=', $cutoffActive)->count(),
            
            // Niveau 2 : Logs à archiver (91-180j)
            'logs_to_archive' => ActivityLog::whereBetween('created_at', [$cutoffArchive, $cutoffActive])->count(),
            
            // Total en BDD
            'total_logs' => ActivityLog::count(),
            
            // Dates
            'oldest_log' => ActivityLog::oldest()->first()?->created_at?->format('d/m/Y H:i'),
            'newest_log' => ActivityLog::latest()->first()?->created_at?->format('d/m/Y H:i'),
            
            // Périodes
            'active_period' => "0-{$retentionDays} jours",
            'archive_period' => ($retentionDays + 1) . "-" . ($retentionDays * 2) . " jours",
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
     * Exporter manuellement avec période personnalisée
     * PAS de suppression des logs après export manuel
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

            // Vérifier que le fichier existe
            $filePath = storage_path('app/' . $result['path']);
            if (!file_exists($filePath)) {
                return back()->with('error', 'Export créé mais fichier introuvable.');
            }

            Log::info('Export manuel des logs', [
                'count' => $result['count'],
                'filename' => $result['filename'],
                'period' => $dateFrom->format('Y-m-d') . ' to ' . $dateTo->format('Y-m-d'),
                'user_id' => Auth::id(),
            ]);

            // Télécharger le fichier
            return response()->download(
                $filePath,
                $result['filename'],
                ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
            )->deleteFileAfterSend(false);

        } catch (\Exception $e) {
            Log::error('Erreur export manuel logs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
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
            // Sécurité : vérifier le format du nom de fichier
            if (!preg_match('/^activity_logs_(auto|manual)_.+\.xlsx$/', $filename)) {
                return back()->with('error', 'Nom de fichier invalide.');
            }

            $path = storage_path('app/pieces_jointes/logs/' . $filename);

            if (!file_exists($path)) {
                return back()->with('error', 'Fichier introuvable.');
            }

            return response()->download(
                $path,
                $filename,
                ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
            );

        } catch (\Exception $e) {
            Log::error('Erreur téléchargement export', [
                'filename' => $filename,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Erreur lors du téléchargement.');
        }
    }

    /**
     * Supprimer un export (seulement si manuel)
     */
    public function deleteExport(string $filename)
    {
        try {
            // Vérifier si c'est un export automatique
            if (strpos($filename, '_auto_') !== false) {
                return back()->with('error', 'Les exports automatiques ne peuvent pas être supprimés. Ils sont protégés pour la sécurité.');
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

    /**
     * Nettoyer les logs obsolètes (archivage automatique)
     * Export des logs de 91j à 180j, puis suppression
     */
    public function cleanup(Request $request)
    {
        try {
            DB::beginTransaction();

            $retentionDays = SystemSettings::getRetentionDays();
            $dateFrom = now()->subDays($retentionDays * 2);
            $dateTo = now()->subDays($retentionDays + 1);
            
            // Récupérer les logs à archiver (91-180j)
            $logsToArchive = ActivityLog::whereBetween('created_at', [$dateFrom, $dateTo])->get();
            $count = $logsToArchive->count();

            if ($count === 0) {
                return back()->with('info', 'Aucun log à archiver pour le moment.');
            }

            // Export automatique
            $result = $this->exportService->export(isAutoExport: true);

            if (!$result['success']) {
                DB::rollBack();
                return back()->with('error', "Erreur lors de l'archivage : " . ($result['error'] ?? 'Erreur inconnue'));
            }

            // Suppression des logs archivés
            $logsIds = $logsToArchive->pluck('id')->toArray();
            foreach (array_chunk($logsIds, 100) as $chunk) {
                ActivityLog::whereIn('id', $chunk)->delete();
            }

            // Nettoyer les anciens exports automatiques (garder 12)
            $this->exportService->cleanOldAutoExports();

            SystemSettings::updateLastCleanup();

            Log::info('Archivage automatique des logs', [
                'archived' => $count,
                'filename' => $result['filename'],
                'retention_days' => $retentionDays,
                'user_id' => Auth::id(),
            ]);

            DB::commit();

            return back()->with('success', "{$count} logs archivés avec succès. Les logs actifs (0-{$retentionDays}j) sont conservés en BDD.");

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur archivage automatique logs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->with('error', 'Erreur lors de l\'archivage : ' . $e->getMessage());
        }
    }

    /**
     * Prévisualiser les logs à archiver
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