<?php

namespace App\Console\Commands;

use App\Http\Controllers\DocumentGenerationController;
use App\Models\DocumentGenere;
use Illuminate\Console\Command;

class MigrateRecuFormat extends Command
{
    protected $signature = 'migrate:recu-format 
                            {--dry-run : Afficher les changements sans les appliquer}
                            {--force : Forcer la migration sans confirmation}';
    
    protected $description = 'Migrer les numéros de reçu vers le nouveau format (NNN/DDD)';
    
    public function handle()
    {
        if ($this->option('dry-run')) {
            $this->info('Mode simulation activé (aucune modification)');
        }
        
        // Afficher un résumé
        $totalRecus = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
            ->where('status', DocumentGenere::STATUS_ACTIVE)
            ->count();
        
        $this->info("Reçus à migrer : {$totalRecus}");
        
        // Demander confirmation
        if (!$this->option('force') && !$this->option('dry-run')) {
            if (!$this->confirm('Voulez-vous continuer ?')) {
                $this->warn('Migration annulée');
                return 1;
            }
        }
        
        // Lancer la migration
        $controller = new DocumentGenerationController();
        
        $this->info('Démarrage de la migration...');
        $this->output->progressStart($totalRecus);
        
        $result = $controller->migrateOldRecuFormat();
        
        $this->output->progressFinish();
        
        // Afficher les résultats
        if ($result['success']) {
            $this->info('Migration terminée avec succès !');
            $this->table(
                ['Métrique', 'Valeur'],
                [
                    ['Dossiers traités', $result['dossiers_traites']],
                    ['Reçus mis à jour', $result['recus_updated']],
                    ['Erreurs', $result['errors']],
                ]
            );
            
            return 0;
        } else {
            $this->error('Échec de la migration : ' . $result['error']);
            return 1;
        }
    }
}