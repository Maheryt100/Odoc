<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Models\SystemSettings;
// use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Artisan;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // ========================================
        // NETTOYAGE AUTOMATIQUE DES LOGS
        // ========================================

        $this->scheduleLogCleanup($schedule);

        // ========================================
        // NETTOYAGE DES ANCIENS EXPORTS
        // ========================================

        $schedule->call(function () {
            try {
                $service = app(\App\Services\ActivityLogsExportService::class);
                $deleted = $service->cleanOldExports(10);

                if ($deleted > 0) {
                    // Log::info("Nettoyage des anciens exports : {$deleted} fichiers supprimés");
                }
            } catch (\Exception $e) {
                // Log::error('Erreur lors du nettoyage des exports', [
                //     'error' => $e->getMessage()
                // ]);
            }
        })
        ->weekly()
        ->sundays()
        ->at('03:00')
        ->name('clean-old-log-exports')
        ->withoutOverlapping();

        // ========================================
        // RAPPORT HEBDOMADAIRE DES LOGS 
        // ========================================

        $schedule->call(function () {
            try {
                $stats = \App\Models\ActivityLog::getStatsByPeriod('week');
                
                // Log des statistiques pour le moment
                // TODO : Implémenter l'envoi d'email au Super Admin
                // Log::info('Rapport hebdomadaire des logs', $stats);
            } catch (\Exception $e) {
                // Log::error('Erreur lors de la génération du rapport', [
                //     'error' => $e->getMessage()
                // ]);
            }
        })
        ->weekly()
        ->mondays()
        ->at('08:00')
        ->name('weekly-logs-report')
        ->withoutOverlapping();

    }

    /**
     * Planifier le nettoyage selon la fréquence configurée
     */
    private function scheduleLogCleanup(Schedule $schedule): void
    {
        // Vérifier si l'auto-delete est activé
        if (!SystemSettings::isAutoDeleteEnabled()) {
            return;
        }

        $frequency = SystemSettings::getCleanupFrequency();

        $task = $schedule->call(function () {
            try {
                // Log::info('Démarrage du nettoyage automatique des logs');
                
                $exitCode = Artisan::call('logs:clean', [
                    '--force' => true // Force sans confirmation
                ]);
                
                if ($exitCode === 0) {
                    // Log::info('Nettoyage automatique des logs terminé avec succès');
                } else {
                    // Log::warning('Le nettoyage des logs a retourné un code non-zéro', [
                    //     'exit_code' => $exitCode
                    // ]);
                }
            } catch (\Exception $e) {
                // Log::error('Erreur lors du nettoyage automatique des logs', [
                //     'error' => $e->getMessage(),
                //     'trace' => $e->getTraceAsString()
                // ]);
            }
        })
        ->name('auto-clean-activity-logs')
        ->withoutOverlapping()
        ->onSuccess(function () {
            // Log::info('Nettoyage automatique des logs : Succès');
        })
        ->onFailure(function () {
            // Log::error('Nettoyage automatique des logs : Échec');
        });

        // Appliquer la fréquence configurée
        match($frequency) {
            'daily' => $task->daily()->at('02:00'),
            'weekly' => $task->weekly()->sundays()->at('02:00'),
            'monthly' => $task->monthly()->at('02:00'),
            default => $task->monthly()->at('02:00'), // Par défaut : mensuel
        };

        // Log::info('Nettoyage automatique des logs planifié', [
        //     'frequency' => $frequency,
        //     'enabled' => true
        // ]);
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}