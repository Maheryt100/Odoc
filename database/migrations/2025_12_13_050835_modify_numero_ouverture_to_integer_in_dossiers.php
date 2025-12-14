<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Étape 1: Créer une nouvelle colonne temporaire de type integer
        Schema::table('dossiers', function (Blueprint $table) {
            $table->unsignedInteger('numero_ouverture_new')->nullable()->after('numero_ouverture');
        });

        // Étape 2: Migrer les données existantes
        // Convertir les anciens numéros (DST1-2025-0001) en numéros séquentiels
        $dossiers = DB::table('dossiers')
            ->orderBy('created_at')
            ->get();

        $counter = 1;
        foreach ($dossiers as $dossier) {
            DB::table('dossiers')
                ->where('id', $dossier->id)
                ->update(['numero_ouverture_new' => $counter++]);
        }

        // Étape 3: Supprimer l'ancienne colonne
        Schema::table('dossiers', function (Blueprint $table) {
            $table->dropColumn('numero_ouverture');
        });

        // Étape 4: Renommer la nouvelle colonne
        Schema::table('dossiers', function (Blueprint $table) {
            $table->renameColumn('numero_ouverture_new', 'numero_ouverture');
        });

        // Étape 5: Ajouter l'index unique
        Schema::table('dossiers', function (Blueprint $table) {
            $table->unique('numero_ouverture');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Supprimer l'index unique
        Schema::table('dossiers', function (Blueprint $table) {
            $table->dropUnique(['numero_ouverture']);
        });

        // Recréer l'ancienne colonne string
        Schema::table('dossiers', function (Blueprint $table) {
            $table->string('numero_ouverture_old', 50)->nullable()->after('numero_ouverture');
        });

        // Restaurer le format ancien (optionnel - peut ne pas être nécessaire)
        $dossiers = DB::table('dossiers')->get();
        foreach ($dossiers as $dossier) {
            if ($dossier->numero_ouverture) {
                $oldFormat = sprintf(
                    "DST%d-%d-%04d",
                    $dossier->id_district,
                    now()->year,
                    $dossier->numero_ouverture
                );
                DB::table('dossiers')
                    ->where('id', $dossier->id)
                    ->update(['numero_ouverture_old' => $oldFormat]);
            }
        }

        // Supprimer la colonne integer
        Schema::table('dossiers', function (Blueprint $table) {
            $table->dropColumn('numero_ouverture');
        });

        // Renommer l'ancienne colonne
        Schema::table('dossiers', function (Blueprint $table) {
            $table->renameColumn('numero_ouverture_old', 'numero_ouverture');
        });
    }
};