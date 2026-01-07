<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class VerifyTopoFluxSetup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'topo:verify
                            {--fix : Tenter de corriger automatiquement les problèmes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Vérifier la configuration complète de TopoFlux (tables, contraintes, vue, fonction)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Vérification de la configuration TopoFlux...');
        $this->newLine();
        
        $errors = 0;
        $warnings = 0;
        
        // 1. Vérifier les tables
        $errors += $this->verifyTables();
        
        // 2. Vérifier les colonnes
        $errors += $this->verifyColumns();
        
        // 3. Vérifier les contraintes
        $errors += $this->verifyConstraints();
        
        // 4. Vérifier les index
        $warnings += $this->verifyIndexes();
        
        // 5. Vérifier la vue
        $errors += $this->verifyView();
        
        // 6. Vérifier la fonction
        $errors += $this->verifyFunction();
        
        // 7. Vérifier les données de test
        $warnings += $this->verifyTestData();
        
        // Résumé
        $this->newLine();
        if ($errors === 0 && $warnings === 0) {
            $this->info('Tous les tests sont passés ! TopoFlux est correctement configuré.');
            return 0;
        } elseif ($errors === 0) {
            $this->warn("Configuration OK avec {$warnings} avertissement(s).");
            return 0;
        } else {
            $this->error("{$errors} erreur(s) critique(s) détectée(s) !");
            $this->warn("Exécutez 'php artisan migrate' pour corriger les problèmes.");
            return 1;
        }
    }
    
    private function verifyTables(): int
    {
        $this->info('1️Vérification des tables...');
        
        $tables = [
            'topo_users',
            'topo_staging_demandeurs',
            'topo_staging_proprietes',
            'topo_staging_files'
        ];
        
        $errors = 0;
        
        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                $this->line("   ✓ Table '{$table}' existe");
            } else {
                $this->error("   ✗ Table '{$table}' manquante !");
                $errors++;
            }
        }
        
        $this->newLine();
        return $errors;
    }
    
    private function verifyColumns(): int
    {
        $this->info('2️Vérification des colonnes critiques...');
        
        $columnsToCheck = [
            'topo_staging_demandeurs' => [
                'id', 'batch_id', 'status', 'numero_ouverture', 'target_district_id',
                'payload', 'archived_at', 'archived_by_email', 'archived_note',
                'rejected_at', 'rejected_by_email', 'rejection_reason'
            ],
            'topo_staging_proprietes' => [
                'id', 'batch_id', 'status', 'numero_ouverture', 'target_district_id',
                'payload', 'archived_at', 'archived_by_email', 'archived_note',
                'rejected_at', 'rejected_by_email', 'rejection_reason'
            ],
            'topo_staging_files' => [
                'id', 'numero_ouverture', 'target_district_id', 'cin', 'lot',
                'demandeur_id', 'propriete_id', 'category'
            ]
        ];
        
        $errors = 0;
        
        foreach ($columnsToCheck as $table => $columns) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            
            foreach ($columns as $column) {
                if (Schema::hasColumn($table, $column)) {
                    $this->line("   ✓ {$table}.{$column}");
                } else {
                    $this->error("   ✗ Colonne '{$table}.{$column}' manquante !");
                    $errors++;
                }
            }
        }
        
        $this->newLine();
        return $errors;
    }
    
    private function verifyConstraints(): int
    {
        $this->info('3️Vérification des contraintes CHECK...');
        
        $errors = 0;
        
        // Vérifier contrainte status demandeurs
        $constraint = DB::select("
            SELECT pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conname = 'topo_staging_demandeurs_status_check'
        ");
        
        if (!empty($constraint)) {
            $def = $constraint[0]->definition;
            if (str_contains($def, 'ARCHIVED')) {
                $this->line("   ✓ Contrainte status demandeurs inclut ARCHIVED");
            } else {
                $this->error("   ✗ Contrainte status demandeurs ne contient pas ARCHIVED !");
                $errors++;
            }
        } else {
            $this->error("   ✗ Contrainte topo_staging_demandeurs_status_check manquante !");
            $errors++;
        }
        
        // Vérifier contrainte status propriétés
        $constraint = DB::select("
            SELECT pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conname = 'topo_staging_proprietes_status_check'
        ");
        
        if (!empty($constraint)) {
            $def = $constraint[0]->definition;
            if (str_contains($def, 'ARCHIVED')) {
                $this->line("   ✓ Contrainte status propriétés inclut ARCHIVED");
            } else {
                $this->error("   ✗ Contrainte status propriétés ne contient pas ARCHIVED !");
                $errors++;
            }
        } else {
            $this->error("   ✗ Contrainte topo_staging_proprietes_status_check manquante !");
            $errors++;
        }
        
        // Vérifier contrainte fichiers
        $constraint = DB::select("
            SELECT pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conname = 'check_file_owner'
        ");
        
        if (!empty($constraint)) {
            $this->line("   ✓ Contrainte check_file_owner existe");
        } else {
            $this->error("   ✗ Contrainte check_file_owner manquante !");
            $errors++;
        }
        
        $this->newLine();
        return $errors;
    }
    
    private function verifyIndexes(): int
    {
        $this->info('4️Vérification des index...');
        
        $indexes = [
            'topo_staging_demandeurs' => ['idx_demandeurs_numero_district', 'idx_demandeurs_created_at'],
            'topo_staging_proprietes' => ['idx_proprietes_numero_district', 'idx_proprietes_created_at'],
            'topo_staging_files' => ['idx_files_numero_district']
        ];
        
        $warnings = 0;
        
        foreach ($indexes as $table => $indexList) {
            foreach ($indexList as $indexName) {
                $result = DB::select("
                    SELECT 1 FROM pg_indexes 
                    WHERE tablename = ? AND indexname = ?
                ", [$table, $indexName]);
                
                if (!empty($result)) {
                    $this->line("   ✓ Index {$indexName}");
                } else {
                    $this->warn("   ⚠ Index {$indexName} manquant (performances dégradées)");
                    $warnings++;
                }
            }
        }
        
        $this->newLine();
        return $warnings;
    }
    
    private function verifyView(): int
    {
        $this->info('5️Vérification de la vue v_topo_imports_all...');
        
        $errors = 0;
        
        $view = DB::select("
            SELECT 1 FROM information_schema.views 
            WHERE table_name = 'v_topo_imports_all'
        ");
        
        if (!empty($view)) {
            $this->line("   ✓ Vue v_topo_imports_all existe");
            
            // Tester la vue
            try {
                DB::select("SELECT * FROM v_topo_imports_all LIMIT 1");
                $this->line("   ✓ Vue est fonctionnelle");
            } catch (\Exception $e) {
                $this->error("   ✗ Erreur lors de l'exécution de la vue : " . $e->getMessage());
                $errors++;
            }
        } else {
            $this->error("   ✗ Vue v_topo_imports_all manquante !");
            $errors++;
        }
        
        $this->newLine();
        return $errors;
    }
    
    private function verifyFunction(): int
    {
        $this->info('6️Vérification de la fonction get_import_enriched_data...');
        
        $errors = 0;
        
        $function = DB::select("
            SELECT 1 FROM pg_proc 
            WHERE proname = 'get_import_enriched_data'
        ");
        
        if (!empty($function)) {
            $this->line("   ✓ Fonction get_import_enriched_data existe");
        } else {
            $this->error("   ✗ Fonction get_import_enriched_data manquante !");
            $errors++;
        }
        
        $this->newLine();
        return $errors;
    }
    
    private function verifyTestData(): int
    {
        $this->info('7️Vérification des données de test...');
        
        $warnings = 0;
        
        $testUser = DB::table('topo_users')
            ->where('email', 'test@topomanager.mg')
            ->first();
        
        if ($testUser) {
            $this->line("   ✓ Utilisateur de test existe (test@topomanager.mg)");
        } else {
            $this->warn("   ⚠ Aucun utilisateur de test trouvé");
            $this->warn("     Créez-en un pour tester : php artisan topo:create-test-user");
            $warnings++;
        }
        
        $this->newLine();
        return $warnings;
    }
}