<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Renommer date_inscription en date_depot_1
     * Ajouter date_depot_2 et date_approbation_acte
     */
    public function up(): void
    {
        Schema::table('proprietes', function (Blueprint $table) {
            // 1. Renommer date_inscription en date_depot_1
            $table->renameColumn('date_inscription', 'date_depot_1');
        });

        Schema::table('proprietes', function (Blueprint $table) {
            // 2. Ajouter date_depot_2 (date de dépôt réquisition)
            $table->date('date_depot_2')->nullable()->after('date_depot_1');
            
            // 3. Ajouter date_approbation_acte (obligatoire pour génération doc)
            $table->date('date_approbation_acte')->nullable()->after('date_requisition');
            
            // 4. Index pour optimiser les recherches
            $table->index('date_approbation_acte', 'idx_date_approbation');
            $table->index('date_depot_1', 'idx_date_depot_1');
            $table->index('date_depot_2', 'idx_date_depot_2');
        });
    }

    public function down(): void
    {
        Schema::table('proprietes', function (Blueprint $table) {
            // Supprimer les nouveaux champs
            $table->dropIndex('idx_date_approbation');
            $table->dropIndex('idx_date_depot_1');
            $table->dropIndex('idx_date_depot_2');
            $table->dropColumn(['date_depot_2', 'date_approbation_acte']);
        });

        Schema::table('proprietes', function (Blueprint $table) {
            // Restaurer l'ancien nom
            $table->renameColumn('date_depot_1', 'date_inscription');
        });
    }
};