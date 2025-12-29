<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\SystemSettings;
use App\Models\ActivityLog;
use App\Services\ActivityLogsExportService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * Middleware pour archivage automatique progressif des logs
 * 
 * Système à 3 niveaux :
 * - Niveau 1 (0-90j) : Logs actifs en BDD
 * - Niveau 2 (91-180j) : Logs à archiver
 * - Niveau 3 (180+j) : Archives Excel protégées
 */
class AutoCleanupLogsMiddleware
{
    private ActivityLogsExportService $exportService;

    public function __construct(ActivityLogsExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Exécuter la réponse normale d'abord
        $response = $next($request);

        // Vérifier l'archivage en arrière-plan (non bloquant)
        if ($this->shouldCheck()) {
            $this->checkAndArchive();
        }

        return $response;
    }

    /**
     * Vérifier si on doit faire une vérification
     * (Maximum 1 fois par heure pour éviter les vérifications inutiles)
     */
    private function shouldCheck(): bool
    {
        return SystemSettings::shouldCheckForCleanup();
    }

    /**
     * Vérifier et exécuter l'archivage si nécessaire
     */
    private function checkAndArchive(): void
    {
        try {
            // Mettre à jour la date de vérification
            SystemSettings::updateLastAutoCheck();

            // Vérifier si l'archivage est nécessaire
            if (!SystemSettings::shouldRunAutoCleanup()) {
                return;
            }

            // Exécuter l'archivage en arrière-plan (dispatch job)
            dispatch(function () {
                $this->performAutoArchive();
            })->afterResponse();

        } catch (\Exception $e) {
            Log::error('Erreur lors de la vérification automatique des logs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Effectuer l'archivage automatique progressif
     */
    private function performAutoArchive(): void
    {
        try {
            DB::beginTransaction();

            $retentionDays = SystemSettings::getRetentionDays();
            $dateFrom = now()->subDays($retentionDays * 2);
            $dateTo = now()->subDays($retentionDays + 1);
            
            // Récupérer les logs à archiver (Niveau 2 : 91-180j)
            $logsToArchive = ActivityLog::whereBetween('created_at', [$dateFrom, $dateTo])->get();
            $count = $logsToArchive->count();

            if ($count === 0) {
                Log::info('Archivage automatique : Aucun log à archiver', [
                    'retention_days' => $retentionDays,
                    'period' => $dateFrom->format('Y-m-d') . ' to ' . $dateTo->format('Y-m-d'),
                ]);
                return;
            }

            Log::info("Archivage automatique : {$count} logs à archiver", [
                'retention_days' => $retentionDays,
                'period' => $dateFrom->format('Y-m-d') . ' to ' . $dateTo->format('Y-m-d'),
            ]);

            // Export automatique (Niveau 3 : Archives Excel)
            $result = $this->exportService->export(isAutoExport: true);

            if (!$result['success']) {
                Log::error('Erreur lors de l\'export automatique', [
                    'error' => $result['error'] ?? 'Erreur inconnue'
                ]);
                DB::rollBack();
                return;
            }

            // Suppression des logs archivés (libérer Niveau 2)
            $logsIds = $logsToArchive->pluck('id')->toArray();
            foreach (array_chunk($logsIds, 100) as $chunk) {
                ActivityLog::whereIn('id', $chunk)->delete();
            }

            // Nettoyer les anciens exports automatiques (garder 12 = 1 an)
            $cleanedExports = $this->exportService->cleanOldAutoExports();

            // Mettre à jour la date de nettoyage
            SystemSettings::updateLastCleanup();

            DB::commit();

            Log::info('Archivage automatique terminé avec succès', [
                'archived_logs' => $count,
                'filename' => $result['filename'],
                'cleaned_exports' => $cleanedExports,
                'retention_days' => $retentionDays,
                'frequency' => SystemSettings::getCleanupFrequency(),
                'active_logs_remaining' => ActivityLog::where('created_at', '>=', $dateTo)->count(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur lors de l\'archivage automatique', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}