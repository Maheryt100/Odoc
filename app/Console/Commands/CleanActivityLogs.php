<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\SystemSettings;
use App\Services\ActivityLogsExportService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CleanActivityLogs extends Command
{
    protected $signature = 'logs:clean 
                            {--days= : Number of days to keep (overrides settings)}
                            {--force : Force deletion without confirmation}
                            {--no-export : Skip automatic export before deletion}
                            {--dry-run : Show what would be deleted without actually deleting}';

    protected $description = 'Clean old activity logs based on retention policy';

    private ActivityLogsExportService $exportService;

    public function __construct(ActivityLogsExportService $exportService)
    {
        parent::__construct();
        $this->exportService = $exportService;
    }

    public function handle(): int
    {
        $this->info('🧹 Nettoyage des logs d\'activité...');
        $this->newLine();

        // ✅ Vérifier si la suppression automatique est activée (sauf si --force)
        if (!$this->option('force') && !SystemSettings::isAutoDeleteEnabled()) {
            $this->warn('⚠️  La suppression automatique est désactivée.');
            $this->info('💡 Utilisez --force pour forcer la suppression ou activez-la dans les paramètres.');
            return self::FAILURE;
        }

        // Obtenir le nombre de jours de rétention
        $days = $this->option('days') ?? SystemSettings::getRetentionDays();
        $cutoffDate = now()->subDays($days);

        $this->info("📅 Rétention configurée : {$days} jours");
        $this->info("🗓️  Suppression des logs avant : {$cutoffDate->format('d/m/Y H:i:s')}");
        $this->newLine();

        // Récupérer les logs à supprimer
        $logsToDelete = ActivityLog::where('created_at', '<', $cutoffDate)->get();
        $count = $logsToDelete->count();

        if ($count === 0) {
            $this->info('✅ Aucun log à supprimer.');
            return self::SUCCESS;
        }

        $this->warn("⚠️  {$count} logs seront supprimés.");
        
        // Mode dry-run
        if ($this->option('dry-run')) {
            $this->showStatistics($logsToDelete);
            $this->newLine();
            $this->info('🔍 Mode dry-run : Aucune suppression effectuée.');
            return self::SUCCESS;
        }

        // ✅ Export automatique avant suppression (sauf si --no-export)
        if (!$this->option('no-export') && SystemSettings::isAutoExportEnabled()) {
            $this->info('📤 Export automatique des logs avant suppression...');
            
            $result = $this->exportService->export(
                logs: $logsToDelete,
                autoExport: true
            );

            if ($result['success']) {
                $this->info("✅ Export réussi : {$result['filename']}");
                $this->info("   📊 {$result['count']} logs exportés");
                $this->info("   💾 Taille : " . $this->formatBytes($result['size']));
            } else {
                $this->error("❌ Erreur lors de l'export : {$result['error']}");
                
                if (!$this->option('force') && !$this->confirm('Continuer sans export ?', false)) {
                    return self::FAILURE;
                }
            }
            $this->newLine();
        }

        // ✅ Confirmation finale (sauf si --force)
        if (!$this->option('force') && !$this->confirm("Confirmer la suppression de {$count} logs ?", false)) {
            $this->info('❌ Suppression annulée.');
            return self::FAILURE;
        }

        // Effectuer la suppression
        $this->info('🗑️  Suppression en cours...');
        $bar = $this->output->createProgressBar($count);
        $bar->start();

        $deleted = 0;
        
        try {
            foreach ($logsToDelete->chunk(100) as $chunk) {
                ActivityLog::whereIn('id', $chunk->pluck('id'))->delete();
                $deleted += $chunk->count();
                $bar->advance($chunk->count());
            }

            $bar->finish();
            $this->newLine(2);

            // ✅ Mettre à jour la date de nettoyage
            SystemSettings::updateLastCleanup();

            // ✅ Nettoyer les anciens exports (garder les 10 derniers)
            $cleanedExports = $this->exportService->cleanOldExports(10);
            if ($cleanedExports > 0) {
                $this->info("🧹 {$cleanedExports} anciens exports supprimés.");
            }

            $this->newLine();
            $this->info("✅ Nettoyage terminé : {$deleted} logs supprimés.");
            
            // ✅ Logger l'opération
            Log::info('Nettoyage automatique des logs effectué', [
                'deleted' => $deleted,
                'retention_days' => $days,
                'cutoff_date' => $cutoffDate->toDateTimeString(),
                'auto_export' => !$this->option('no-export') && SystemSettings::isAutoExportEnabled(),
            ]);

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ Erreur lors de la suppression : {$e->getMessage()}");
            
            Log::error('Erreur lors du nettoyage des logs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return self::FAILURE;
        }
    }

    /**
     * Afficher les statistiques des logs à supprimer
     */
    private function showStatistics($logs): void
    {
        $this->newLine();
        $this->info('📊 Statistiques des logs à supprimer :');
        $this->newLine();

        // Par action
        $byAction = $logs->groupBy('action')->map->count()->sortDesc();
        $this->table(
            ['Action', 'Nombre'],
            $byAction->map(fn($count, $action) => [$action, $count])->toArray()
        );

        $this->newLine();

        // Par entité
        $byEntity = $logs->groupBy('entity_type')->map->count()->sortDesc();
        $this->table(
            ['Type d\'entité', 'Nombre'],
            $byEntity->map(fn($count, $entity) => [$entity, $count])->toArray()
        );

        $this->newLine();

        // Par district (top 5)
        $byDistrict = $logs->filter(fn($log) => $log->district)
            ->groupBy('district.nom_district')
            ->map->count()
            ->sortDesc()
            ->take(5);
        
        if ($byDistrict->isNotEmpty()) {
            $this->table(
                ['District', 'Nombre'],
                $byDistrict->map(fn($count, $district) => [$district, $count])->toArray()
            );
        }
    }

    /**
     * Formater la taille de fichier
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['o', 'Ko', 'Mo', 'Go'];
        $i = 0;
        
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}