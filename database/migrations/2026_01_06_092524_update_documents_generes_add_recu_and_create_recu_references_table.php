<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Supprimer la table recu_paiements
        Schema::dropIfExists('recu_paiements');
        
        // 2. Ajouter colonne numero_recu dans documents_generes
        Schema::table('documents_generes', function (Blueprint $table) {
            // Modifier numero_document pour le rendre obligatoire
            $table->string('numero_recu_externe', 50)->nullable()->after('numero_document');
            $table->timestamp('numero_recu_saisi_at')->nullable()->after('numero_recu_externe');
            $table->foreignId('numero_recu_saisi_by')->nullable()->constrained('users')->after('numero_recu_saisi_at');
            
            // Index pour recherches rapides
            $table->index('numero_recu_externe');
            $table->index(['id_dossier', 'numero_recu_externe']);
        });
        
        // 3. Ajouter une table de référence pour les numéros de reçu (audit trail)
        Schema::create('recu_references', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_propriete')->constrained('proprietes')->onDelete('cascade');
            $table->foreignId('id_demandeur')->constrained('demandeurs')->onDelete('cascade');
            $table->foreignId('id_dossier')->constrained('dossiers')->onDelete('cascade');
            $table->string('numero_recu', 50);
            $table->bigInteger('montant')->nullable();
            $table->date('date_recu')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
            
            // Contraintes
            $table->unique(['id_dossier', 'numero_recu'], 'unique_recu_par_dossier');
            $table->index(['id_propriete', 'id_demandeur']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recu_references');
        
        Schema::table('documents_generes', function (Blueprint $table) {
            $table->dropIndex(['numero_recu_externe']);
            $table->dropIndex(['id_dossier', 'numero_recu_externe']);
            $table->dropForeign(['numero_recu_saisi_by']);
            $table->dropColumn(['numero_recu_externe', 'numero_recu_saisi_at', 'numero_recu_saisi_by']);
        });
        
        // Recréer la table recu_paiements si rollback
        Schema::create('recu_paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_propriete')->constrained('proprietes')->onDelete('cascade');
            $table->foreignId('id_demandeur')->constrained('demandeurs')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->string('numero_recu');
            $table->bigInteger('montant');
            $table->date('date_recu');
            $table->string('file_path')->nullable();
            $table->enum('status', ['draft', 'confirmed'])->default('draft');
            $table->timestamps();
        });
    }
};