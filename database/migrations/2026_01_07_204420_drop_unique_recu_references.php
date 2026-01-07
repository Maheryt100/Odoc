<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recu_references', function (Blueprint $table) {
            // Supprimer la contrainte d'unicité
            $table->dropUnique('unique_recu_par_dossier');
        });
    }

    public function down(): void
    {
        Schema::table('recu_references', function (Blueprint $table) {
            // Remettre la contrainte si rollback
            $table->unique(['id_dossier', 'numero_recu'], 'unique_recu_par_dossier');
        });
    }
};