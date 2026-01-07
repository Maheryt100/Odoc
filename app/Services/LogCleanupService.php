<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\SystemSettings;
use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class LogCleanupService
{
    private ActivityLogsExportService $exportService;
    
    // Seuil unique simplifié (configurable via SystemSettings)
    private const DEFAULT_MAX_LOGS = 500000; // 500k logs par défaut
    
    // ctions de faible priorité (supprimables en premier en cas de surcharge)
    private const LOW_PRIORITY_ACTIONS = [
        ActivityLog::ACTION_LOGIN,
        ActivityLog::ACTION_LOGOUT,
        ActivityLog::ACTION_VIEW,
    ];

    public function __construct(ActivityLogsExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    /**
     *  Vérifier l'état de surcharge du système (seuil unique simplifié)
     */
    public function checkOverloadStatus(): array
    {
        $totalLogs = ActivityLog::count();
        $maxLogs = SystemSettings::get('logs_max_count', self::DEFAULT_MAX_LOGS);
        $percentage = ($totalLogs / $maxLogs) * 100;
        
        $status = [
            'total_logs' => $totalLogs,
            'max_logs' => $maxLogs,
            'percentage' => round($percentage, 1),
            'is_overloaded' => false,
            'severity' => 'normal', // normal, warning, critical
            'recommended_action' => null,
            'can_cleanup' => false,
        ];

        // Critique : > 100% du seuil
        if ($totalLogs >= $maxLogs) {
            $status['is_overloaded'] = true;
            $status['severity'] = 'critical';
            $status['recommended_action'] = 'emergency_cleanup';
            $status['can_cleanup'] = true;
        }
        // Avertissement : 80-100% du seuil
        elseif ($totalLogs >= $maxLogs * 0.8) {
            $status['severity'] = 'warning';
            $status['recommended_action'] = 'standard_cleanup';
            $status['can_cleanup'] = true;
        }
        // Normal : vérifier si logs à archiver
        else {
            $retentionDays = SystemSettings::getRetentionDays();
            $logsToArchive = ActivityLog::where('created_at', '<', now()->subDays($retentionDays))
                ->count();
            
            if ($logsToArchive > 0) {
                $status['recommended_action'] = 'archive_old';
                $status['can_cleanup'] = true;
            }
        }

        return $status;
    }

    /**
     * Nettoyage d'urgence simplifié : supprime les logs basse priorité + anciens
     */
    public function emergencyCleanup(): array
    {
        try {
            DB::beginTransaction();
            
            $deleted = 0;
            $exported = 0;
            $retentionDays = SystemSettings::getRetentionDays();

            // 1. Supprimer les actions de faible priorité (login/logout/view)
            $lowPriorityLogs = ActivityLog::whereIn('action', self::LOW_PRIORITY_ACTIONS)
                ->where('created_at', '<', now()->subDays($retentionDays))
                ->limit(100000)
                ->get();
            
            if ($lowPriorityLogs->isNotEmpty()) {
                // Export avant suppression
                $exportResult = $this->exportService->export(
                    isAutoExport: true,
                    logs: $lowPriorityLogs
                );
                
                if ($exportResult['success']) {
                    $exported++;
                    
                    // Suppression par chunks
                    foreach (array_chunk($lowPriorityLogs->pluck('id')->toArray(), 100) as $chunk) {
                        ActivityLog::whereIn('id', $chunk)->delete();
                        $deleted += count($chunk);
                    }
                }
            }

            // 2. Si toujours surchargé, supprimer les logs les plus anciens
            $totalLogs = ActivityLog::count();
            $maxLogs = SystemSettings::get('logs_max_count', self::DEFAULT_MAX_LOGS);
            
            if ($totalLogs >= $maxLogs) {
                $toDeleteCount = $totalLogs - ($maxLogs * 0.8); // Ramener à 80% du seuil
                
                $oldLogs = ActivityLog::orderBy('created_at', 'asc')
                    ->limit($toDeleteCount)
                    ->get();
                
                if ($oldLogs->isNotEmpty()) {
                    // Export avant suppression
                    $exportResult = $this->exportService->export(
                        isAutoExport: true,
                        logs: $oldLogs
                    );
                    
                    if ($exportResult['success']) {
                        $exported++;
                        
                        // Suppression par chunks
                        foreach (array_chunk($oldLogs->pluck('id')->toArray(), 100) as $chunk) {
                            ActivityLog::whereIn('id', $chunk)->delete();
                            $deleted += count($chunk);
                        }
                    }
                }
            }

            // 3. Optimiser la table
            DB::statement('VACUUM ANALYZE activity_logs');
            
            SystemSettings::updateLastCleanup();
            
            DB::commit();

            return [
                'success' => true,
                'deleted' => $deleted,
                'exported' => $exported,
                'message' => "Nettoyage d'urgence : {$deleted} logs supprimés et archivés en {$exported} fichier(s).",
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     *  Nettoyage standard : supprime les logs au-delà de la période de rétention
     */
    public function standardCleanup(): array
    {
        try {
            DB::beginTransaction();
            
            $retentionDays = SystemSettings::getRetentionDays();
            
            // Logs à archiver (au-delà de la rétention)
            $logsToArchive = ActivityLog::where('created_at', '<', now()->subDays($retentionDays))
                ->get();
            
            $count = $logsToArchive->count();

            if ($count === 0) {
                DB::rollBack();
                return [
                    'success' => true,
                    'deleted' => 0,
                    'message' => 'Aucun log à archiver.',
                ];
            }

            // Export automatique
            $exportResult = $this->exportService->export(
                isAutoExport: true,
                logs: $logsToArchive
            );

            if (!$exportResult['success']) {
                DB::rollBack();
                return [
                    'success' => false,
                    'error' => "Erreur lors de l'archivage : " . ($exportResult['error'] ?? 'Erreur inconnue'),
                ];
            }

            // Suppression par chunks
            $logsIds = $logsToArchive->pluck('id')->toArray();
            foreach (array_chunk($logsIds, 100) as $chunk) {
                ActivityLog::whereIn('id', $chunk)->delete();
            }

            // Nettoyer les anciens exports automatiques (garder 12)
            $this->exportService->cleanOldAutoExports();

            // Optimiser la table
            DB::statement('VACUUM ANALYZE activity_logs');

            SystemSettings::updateLastCleanup();

            DB::commit();

            return [
                'success' => true,
                'deleted' => $count,
                'exported_filename' => $exportResult['filename'],
                'message' => "{$count} logs archivés avec succès.",
            ];

        } catch (\Exception $e) {
            DB::rollBack();

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Suppression manuelle de logs spécifiques (avec export optionnel)
     */
    public function deleteManually(array $logIds, bool $exportBeforeDelete = true): array
    {
        try {
            $logs = ActivityLog::whereIn('id', $logIds)->get();
            
            if ($logs->isEmpty()) {
                return [
                    'success' => false,
                    'error' => 'Aucun log trouvé avec ces IDs.',
                ];
            }

            $count = $logs->count();
            
            // Export optionnel avant suppression
            $exportFilename = null;
            if ($exportBeforeDelete) {
                $exportResult = $this->exportService->export(
                    isAutoExport: false,
                    logs: $logs
                );
                
                if (!$exportResult['success']) {
                    return [
                        'success' => false,
                        'error' => "Erreur lors de l'export : " . ($exportResult['error'] ?? 'Erreur inconnue'),
                    ];
                }
                
                $exportFilename = $exportResult['filename'];
            }

            // Suppression
            ActivityLog::whereIn('id', $logIds)->delete();

            return [
                'success' => true,
                'deleted' => $count,
                'exported' => $exportBeforeDelete,
                'export_filename' => $exportFilename,
                'message' => $exportBeforeDelete 
                    ? "{$count} logs supprimés et exportés vers {$exportFilename}"
                    : "{$count} logs supprimés (sans export)",
            ];

        } catch (\Exception $e) {

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Suppression manuelle par critères (date, action, utilisateur, etc.)
     */
    public function deleteByFilters(array $filters, bool $exportBeforeDelete = true): array
    {
        try {
            $query = ActivityLog::query();

            // Appliquer les filtres
            if (!empty($filters['date_from'])) {
                $query->where('created_at', '>=', $filters['date_from']);
            }
            
            if (!empty($filters['date_to'])) {
                $query->where('created_at', '<=', $filters['date_to']);
            }
            
            if (!empty($filters['actions'])) {
                $query->whereIn('action', $filters['actions']);
            }
            
            if (!empty($filters['user_id'])) {
                $query->where('id_user', $filters['user_id']);
            }
            
            if (!empty($filters['district_id'])) {
                $query->where('id_district', $filters['district_id']);
            }
            
            if (!empty($filters['entity_type'])) {
                $query->where('entity_type', $filters['entity_type']);
            }

            $logs = $query->get();
            $count = $logs->count();

            if ($count === 0) {
                return [
                    'success' => false,
                    'error' => 'Aucun log trouvé avec ces critères.',
                ];
            }

            // Confirmation sécurité : si > 10k logs, on refuse
            if ($count > 10000) {
                return [
                    'success' => false,
                    'error' => "Trop de logs à supprimer ({$count}). Veuillez affiner vos critères (max 10 000).",
                ];
            }

            // Export optionnel
            $exportFilename = null;
            if ($exportBeforeDelete) {
                $exportResult = $this->exportService->export(
                    isAutoExport: false,
                    logs: $logs
                );
                
                if (!$exportResult['success']) {
                    return [
                        'success' => false,
                        'error' => "Erreur lors de l'export : " . ($exportResult['error'] ?? 'Erreur inconnue'),
                    ];
                }
                
                $exportFilename = $exportResult['filename'];
            }

            // Suppression par chunks
            foreach (array_chunk($logs->pluck('id')->toArray(), 100) as $chunk) {
                ActivityLog::whereIn('id', $chunk)->delete();
            }

            return [
                'success' => true,
                'deleted' => $count,
                'exported' => $exportBeforeDelete,
                'export_filename' => $exportFilename,
                'message' => $exportBeforeDelete 
                    ? "{$count} logs supprimés et exportés vers {$exportFilename}"
                    : "{$count} logs supprimés (sans export)",
            ];

        } catch (\Exception $e) {
 
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Obtenir des statistiques détaillées (simplifié)
     */
    public function getDetailedStats(): array
    {
        $retentionDays = SystemSettings::getRetentionDays();
        $maxLogs = SystemSettings::get('logs_max_count', self::DEFAULT_MAX_LOGS);
        
        $dbSizeMb = DB::selectOne("
            SELECT pg_total_relation_size('activity_logs') / 1024.0 / 1024.0 as size_mb
        ")->size_mb ?? 0;

        return [
            'total_logs' => ActivityLog::count(),
            'max_logs' => $maxLogs,
            'retention_days' => $retentionDays,
            'active_logs' => ActivityLog::where('created_at', '>=', now()->subDays($retentionDays))->count(),
            'archivable_logs' => ActivityLog::where('created_at', '<', now()->subDays($retentionDays))->count(),
            'low_priority_logs' => ActivityLog::whereIn('action', self::LOW_PRIORITY_ACTIONS)->count(),
            'oldest_log' => ActivityLog::oldest()->first()?->created_at?->format('Y-m-d H:i'),
            'newest_log' => ActivityLog::latest()->first()?->created_at?->format('Y-m-d H:i'),
            'by_action' => ActivityLog::selectRaw('action, COUNT(*) as count')
                ->groupBy('action')
                ->pluck('count', 'action')
                ->toArray(),
            'db_size_mb' => round($dbSizeMb, 2),
        ];
    }
}