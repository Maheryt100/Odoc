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
        // ========================================
        // 1. Table des utilisateurs TopoManager
        // ========================================
        Schema::create('topo_users', function (Blueprint $table) {
            $table->id();
            $table->string('username', 50)->unique();
            $table->string('email', 100)->unique();
            $table->string('full_name', 100);
            $table->string('hashed_password', 255);
            $table->string('role', 20)->default('operator');
            $table->boolean('is_active')->default(true);
            $table->timestampTz('created_at')->useCurrent();
            
            $table->index('username');
            $table->index('email');
        });

        // ========================================
        // 2. Table STAGING pour les demandeurs
        // ========================================
        Schema::create('topo_staging_demandeurs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('source', 50)->default('topo');
            $table->uuid('batch_id')->default(DB::raw('gen_random_uuid()'));
            $table->string('checksum', 64)->nullable();
            
            $table->foreignId('topo_user_id')->constrained('topo_users')->onDelete('cascade');
            $table->string('topo_user_name', 100)->nullable();
            
            $table->integer('target_dossier_id');
            $table->integer('target_district_id');
            
            $table->jsonb('payload');
            
            $table->string('status', 20)->default('PENDING');
            $table->text('error_reason')->nullable();
            
            // Colonnes de validation
            $table->timestampTz('validated_at')->nullable();
            $table->bigInteger('validated_by')->nullable();
            
            // Colonnes d'archivage
            $table->timestampTz('archived_at')->nullable();
            $table->string('archived_by_email', 100)->nullable();
            $table->text('archived_note')->nullable();
            
            // Colonnes de rejet
            $table->timestampTz('rejected_at')->nullable();
            $table->string('rejected_by_email', 100)->nullable();
            $table->text('rejection_reason')->nullable();
            
            $table->timestampTz('created_at')->useCurrent();

            // Index standards
            $table->index('status');
            $table->index('target_district_id');
            $table->index('target_dossier_id');
            $table->index('created_at');
            $table->index('batch_id');
        });

        // ========================================
        // 3. Table STAGING pour les propriétés
        // ========================================
        Schema::create('topo_staging_proprietes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('source', 50)->default('topo');
            $table->uuid('batch_id')->default(DB::raw('gen_random_uuid()'));
            $table->string('checksum', 64)->nullable();
            
            $table->foreignId('topo_user_id')->constrained('topo_users')->onDelete('cascade');
            $table->string('topo_user_name', 100)->nullable();
            
            $table->integer('target_dossier_id');
            $table->integer('target_district_id');
            
            $table->jsonb('payload');
            
            $table->string('status', 20)->default('PENDING');
            $table->text('error_reason')->nullable();
            
            // Colonnes de validation
            $table->timestampTz('validated_at')->nullable();
            $table->bigInteger('validated_by')->nullable();
            
            // Colonnes d'archivage
            $table->timestampTz('archived_at')->nullable();
            $table->string('archived_by_email', 100)->nullable();
            $table->text('archived_note')->nullable();
            
            // Colonnes de rejet
            $table->timestampTz('rejected_at')->nullable();
            $table->string('rejected_by_email', 100)->nullable();
            $table->text('rejection_reason')->nullable();
            
            $table->timestampTz('created_at')->useCurrent();

            // Index standards
            $table->index('status');
            $table->index('target_district_id');
            $table->index('target_dossier_id');
            $table->index('created_at');
            $table->index('batch_id');
        });

        // ========================================
        // 4. Table des fichiers STAGING
        // ========================================
        Schema::create('topo_staging_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('demandeur_id')->nullable()->constrained('topo_staging_demandeurs')->onDelete('cascade');
            $table->foreignId('propriete_id')->nullable()->constrained('topo_staging_proprietes')->onDelete('cascade');
            
            $table->string('original_name', 255);
            $table->string('stored_name', 255);
            $table->integer('file_size');
            $table->string('mime_type', 100)->nullable();
            $table->timestampTz('uploaded_at')->useCurrent();
        });

        // Contrainte CHECK pour garantir qu'un fichier appartient soit à un demandeur, soit à une propriété
        DB::statement('ALTER TABLE topo_staging_files ADD CONSTRAINT check_file_owner CHECK (
            (demandeur_id IS NOT NULL AND propriete_id IS NULL) OR
            (demandeur_id IS NULL AND propriete_id IS NOT NULL)
        )');

        // ========================================
        // 5. Contraintes CHECK sur les status
        // ========================================
        DB::statement("
            ALTER TABLE topo_staging_demandeurs
            ADD CONSTRAINT topo_staging_demandeurs_status_check
            CHECK (status IN ('PENDING', 'ARCHIVED', 'REJECTED', 'VALIDATED'))
        ");

        DB::statement("
            ALTER TABLE topo_staging_proprietes
            ADD CONSTRAINT topo_staging_proprietes_status_check
            CHECK (status IN ('PENDING', 'ARCHIVED', 'REJECTED', 'VALIDATED'))
        ");

        // ========================================
        // 6. Index partiels PostgreSQL
        // ========================================
        DB::statement("
            CREATE INDEX idx_demandeurs_archived
            ON topo_staging_demandeurs (archived_at)
            WHERE archived_at IS NOT NULL
        ");

        DB::statement("
            CREATE INDEX idx_demandeurs_rejected
            ON topo_staging_demandeurs (rejected_at)
            WHERE rejected_at IS NOT NULL
        ");

        DB::statement("
            CREATE INDEX idx_proprietes_archived
            ON topo_staging_proprietes (archived_at)
            WHERE archived_at IS NOT NULL
        ");

        DB::statement("
            CREATE INDEX idx_proprietes_rejected
            ON topo_staging_proprietes (rejected_at)
            WHERE rejected_at IS NOT NULL
        ");

        // ========================================
        // 7. Fonction PostgreSQL helper
        // ========================================
        DB::statement("
            CREATE OR REPLACE FUNCTION get_import_display_name(
                p_entity_type VARCHAR,
                p_payload JSONB
            ) RETURNS TEXT AS $$
            BEGIN
                IF p_entity_type = 'demandeur' THEN
                    RETURN CONCAT(
                        COALESCE(p_payload->>'titre_demandeur', ''),
                        ' ',
                        COALESCE(p_payload->>'nom_demandeur', ''),
                        ' ',
                        COALESCE(p_payload->>'prenom_demandeur', '')
                    );
                ELSE
                    RETURN CONCAT(
                        'Lot ',
                        COALESCE(p_payload->>'lot', ''),
                        ' - ',
                        COALESCE(p_payload->>'nature', '')
                    );
                END IF;
            END;
            $$ LANGUAGE plpgsql IMMUTABLE
        ");

        // ========================================
        // 8. Vue unifiée pour tous les imports
        // ========================================
        DB::statement("
            CREATE OR REPLACE VIEW v_topo_imports_all AS
            SELECT
                'demandeur' AS entity_type,
                id,
                batch_id,
                status,
                topo_user_id,
                topo_user_name,
                target_dossier_id AS dossier_id,
                target_district_id AS district_id,
                payload,
                created_at,
                archived_at,
                archived_by_email,
                archived_note,
                rejected_at,
                rejected_by_email,
                rejection_reason,
                validated_at,
                get_import_display_name('demandeur', payload) AS display_name
            FROM topo_staging_demandeurs

            UNION ALL

            SELECT
                'propriete' AS entity_type,
                id,
                batch_id,
                status,
                topo_user_id,
                topo_user_name,
                target_dossier_id AS dossier_id,
                target_district_id AS district_id,
                payload,
                created_at,
                archived_at,
                archived_by_email,
                archived_note,
                rejected_at,
                rejected_by_email,
                rejection_reason,
                validated_at,
                get_import_display_name('propriete', payload) AS display_name
            FROM topo_staging_proprietes
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Supprimer la vue
        DB::statement("DROP VIEW IF EXISTS v_topo_imports_all");
        
        // Supprimer la fonction
        DB::statement("DROP FUNCTION IF EXISTS get_import_display_name");
        
        // Supprimer les tables dans l'ordre inverse (à cause des foreign keys)
        Schema::dropIfExists('topo_staging_files');
        Schema::dropIfExists('topo_staging_proprietes');
        Schema::dropIfExists('topo_staging_demandeurs');
        Schema::dropIfExists('topo_users');
    }
};