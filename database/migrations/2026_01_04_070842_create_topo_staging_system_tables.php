<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * MIGRATION COMPLÈTE TOPOFLUX
     */
    public function up(): void
    {
        // =====================================================
        // 1. UTILISATEURS TOPOMANAGER
        // =====================================================
        
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

        // =====================================================
        // 2. STAGING DEMANDEURS
        // =====================================================
        
        Schema::create('topo_staging_demandeurs', function (Blueprint $table) {
            $table->bigIncrements('id');
            
            // Métadonnées import
            $table->string('source', 50)->default('topo');
            $table->uuid('batch_id')->default(DB::raw('gen_random_uuid()'));
            $table->string('checksum', 64)->nullable();

            // Utilisateur terrain
            $table->foreignId('topo_user_id')
                ->constrained('topo_users')
                ->onDelete('cascade');
            $table->string('topo_user_name', 100)->nullable();

            // Cible GeODOC (numero_ouverture + district)
            $table->string('numero_ouverture', 50);
            $table->integer('target_district_id');

            // Données brutes JSON
            $table->jsonb('payload');

            // Statut et erreurs
            $table->string('status', 20)->default('PENDING');
            $table->text('error_reason')->nullable();

            // Validation
            $table->timestampTz('validated_at')->nullable();
            $table->bigInteger('validated_by')->nullable();

            //  Archivage
            $table->timestampTz('archived_at')->nullable();
            $table->string('archived_by_email', 100)->nullable();
            $table->text('archived_note')->nullable();

            // Rejet détaillé
            $table->timestampTz('rejected_at')->nullable();
            $table->string('rejected_by_email', 100)->nullable();
            $table->text('rejection_reason')->nullable();

            $table->timestampTz('created_at')->useCurrent();

            // Index
            $table->index(['numero_ouverture', 'target_district_id'], 'idx_demandeurs_numero_district');
            $table->index('status');
            $table->index('batch_id');
            $table->index(['created_at'], 'idx_demandeurs_created_at');
        });

        // Contrainte CHECK pour statuts
        DB::statement("
            ALTER TABLE topo_staging_demandeurs
            ADD CONSTRAINT topo_staging_demandeurs_status_check
            CHECK (status IN ('PENDING', 'ARCHIVED', 'REJECTED', 'VALIDATED'))
        ");

        // =====================================================
        // 3. STAGING PROPRIÉTÉS
        // =====================================================
        
        Schema::create('topo_staging_proprietes', function (Blueprint $table) {
            $table->bigIncrements('id');
            
            $table->string('source', 50)->default('topo');
            $table->uuid('batch_id')->default(DB::raw('gen_random_uuid()'));
            $table->string('checksum', 64)->nullable();

            $table->foreignId('topo_user_id')
                ->constrained('topo_users')
                ->onDelete('cascade');
            $table->string('topo_user_name', 100)->nullable();

            // Cible GeODOC
            $table->string('numero_ouverture', 50);
            $table->integer('target_district_id');

            $table->jsonb('payload');

            $table->string('status', 20)->default('PENDING');
            $table->text('error_reason')->nullable();

            $table->timestampTz('validated_at')->nullable();
            $table->bigInteger('validated_by')->nullable();

            // Archivage
            $table->timestampTz('archived_at')->nullable();
            $table->string('archived_by_email', 100)->nullable();
            $table->text('archived_note')->nullable();

            // Rejet détaillé
            $table->timestampTz('rejected_at')->nullable();
            $table->string('rejected_by_email', 100)->nullable();
            $table->text('rejection_reason')->nullable();

            $table->timestampTz('created_at')->useCurrent();

            $table->index(['numero_ouverture', 'target_district_id'], 'idx_proprietes_numero_district');
            $table->index('status');
            $table->index('batch_id');
            $table->index(['created_at'], 'idx_proprietes_created_at');
        });

        DB::statement("
            ALTER TABLE topo_staging_proprietes
            ADD CONSTRAINT topo_staging_proprietes_status_check
            CHECK (status IN ('PENDING', 'ARCHIVED', 'REJECTED', 'VALIDATED'))
        ");

        // =====================================================
        // 4. FICHIERS STAGING
        // =====================================================
        
        Schema::create('topo_staging_files', function (Blueprint $table) {
            $table->id();

            // Relations optionnelles
            $table->unsignedBigInteger('demandeur_id')->nullable();
            $table->unsignedBigInteger('propriete_id')->nullable();

            // Dénormalisation pour recherche rapide
            $table->string('numero_ouverture', 50);
            $table->integer('target_district_id');

            // Identifiants métier
            $table->string('cin', 50)->nullable();
            $table->string('lot', 50)->nullable();
            $table->string('category', 50)->nullable();

            // Informations fichier
            $table->string('original_name', 255);
            $table->string('stored_name', 255);
            $table->integer('file_size');
            $table->string('mime_type', 100)->nullable();
            $table->timestampTz('uploaded_at')->useCurrent();

            // Foreign keys
            $table->foreign('demandeur_id')
                ->references('id')
                ->on('topo_staging_demandeurs')
                ->onDelete('cascade');
            
            $table->foreign('propriete_id')
                ->references('id')
                ->on('topo_staging_proprietes')
                ->onDelete('cascade');

            // Index
            $table->index(['numero_ouverture', 'target_district_id'], 'idx_files_numero_district');
            $table->index('demandeur_id');
            $table->index('propriete_id');
            $table->index('cin');
            $table->index('lot');
        });

        // Contrainte: fichier lié à demandeur OU propriété (ou aucun)
        DB::statement("
            ALTER TABLE topo_staging_files
            ADD CONSTRAINT check_file_owner
            CHECK (
                (demandeur_id IS NOT NULL AND propriete_id IS NULL) OR
                (demandeur_id IS NULL AND propriete_id IS NOT NULL) OR
                (demandeur_id IS NULL AND propriete_id IS NULL)
            )
        ");

        // =====================================================
        // 5. VUE UNIFIÉE POUR GEODOC
        // =====================================================
        
        DB::statement("
            CREATE OR REPLACE VIEW v_topo_imports_all AS
            SELECT
                'demandeur' AS entity_type,
                d.id,
                d.batch_id,
                d.status,
                d.topo_user_id,
                d.topo_user_name,
                d.numero_ouverture,
                d.target_district_id AS district_id,
                d.payload AS raw_data,
                d.created_at AS import_date,
                d.archived_at,
                d.archived_by_email,
                d.archived_note,
                d.rejected_at,
                d.rejected_by_email,
                d.rejection_reason,
                d.validated_at AS processed_at,
                CONCAT(
                    COALESCE(d.payload->>'titre_demandeur', ''),
                    ' ',
                    COALESCE(d.payload->>'nom_demandeur', ''),
                    ' ',
                    COALESCE(d.payload->>'prenom_demandeur', '')
                ) AS display_name,
                (SELECT COUNT(*) FROM topo_staging_files WHERE demandeur_id = d.id) AS files_count,
                dos.nom_dossier AS dossier_nom,
                dos.numero_ouverture AS dossier_numero_ouverture,
                dis.nom_district AS district_nom
            FROM topo_staging_demandeurs d
            LEFT JOIN dossiers dos ON dos.numero_ouverture::TEXT = d.numero_ouverture
                AND dos.id_district = d.target_district_id
            LEFT JOIN districts dis ON dis.id = d.target_district_id

            UNION ALL

            SELECT
                'propriete' AS entity_type,
                p.id,
                p.batch_id,
                p.status,
                p.topo_user_id,
                p.topo_user_name,
                p.numero_ouverture,
                p.target_district_id AS district_id,
                p.payload AS raw_data,
                p.created_at AS import_date,
                p.archived_at,
                p.archived_by_email,
                p.archived_note,
                p.rejected_at,
                p.rejected_by_email,
                p.rejection_reason,
                p.validated_at AS processed_at,
                CONCAT(
                    'Lot ',
                    COALESCE(p.payload->>'lot', ''),
                    ' - ',
                    COALESCE(p.payload->>'nature', '')
                ) AS display_name,
                (SELECT COUNT(*) FROM topo_staging_files WHERE propriete_id = p.id) AS files_count,
                dos.nom_dossier AS dossier_nom,
                dos.numero_ouverture AS dossier_numero_ouverture,
                dis.nom_district AS district_nom
            FROM topo_staging_proprietes p
            LEFT JOIN dossiers dos ON dos.numero_ouverture::TEXT = p.numero_ouverture
                AND dos.id_district = p.target_district_id
            LEFT JOIN districts dis ON dis.id = p.target_district_id
        ");

        // =====================================================
        // 6. FONCTION HELPER POUR ENRICHISSEMENT
        // =====================================================
        
        DB::statement("
            CREATE OR REPLACE FUNCTION get_import_enriched_data(
                p_entity_type VARCHAR,
                p_id BIGINT
            ) RETURNS TABLE (
                id BIGINT,
                entity_type VARCHAR,
                batch_id UUID,
                status VARCHAR,
                numero_ouverture VARCHAR,
                district_id INTEGER,
                raw_data JSONB,
                topo_user_name VARCHAR,
                import_date TIMESTAMPTZ,
                files_count BIGINT,
                dossier_id INTEGER,
                dossier_nom VARCHAR,
                dossier_numero_ouverture INTEGER,
                district_nom VARCHAR,
                can_import BOOLEAN,
                is_archived BOOLEAN,
                has_errors BOOLEAN,
                error_summary TEXT,
                is_duplicate BOOLEAN,
                duplicate_action VARCHAR,
                rejection_reason TEXT,
                processed_at TIMESTAMPTZ
            ) AS \$\$
            BEGIN
                IF p_entity_type = 'demandeur' THEN
                    RETURN QUERY
                    SELECT
                        d.id,
                        'demandeur'::VARCHAR AS entity_type,
                        d.batch_id,
                        d.status,
                        d.numero_ouverture,
                        d.target_district_id AS district_id,
                        d.payload AS raw_data,
                        d.topo_user_name,
                        d.created_at AS import_date,
                        (SELECT COUNT(*) FROM topo_staging_files WHERE demandeur_id = d.id) AS files_count,
                        dos.id AS dossier_id,
                        COALESCE(dos.nom_dossier, 'Dossier ' || d.numero_ouverture) AS dossier_nom,
                        dos.numero_ouverture AS dossier_numero_ouverture,
                        COALESCE(dis.nom_district, 'District #' || d.target_district_id::TEXT) AS district_nom,
                        (d.status = 'PENDING' OR d.status = 'ARCHIVED')::BOOLEAN AS can_import,
                        (d.status = 'ARCHIVED')::BOOLEAN AS is_archived,
                        (d.error_reason IS NOT NULL)::BOOLEAN AS has_errors,
                        d.error_reason AS error_summary,
                        false::BOOLEAN AS is_duplicate,
                        'create'::VARCHAR AS duplicate_action,
                        d.rejection_reason,
                        d.validated_at AS processed_at
                    FROM topo_staging_demandeurs d
                    LEFT JOIN dossiers dos ON dos.numero_ouverture::TEXT = d.numero_ouverture
                        AND dos.id_district = d.target_district_id
                    LEFT JOIN districts dis ON dis.id = d.target_district_id
                    WHERE d.id = p_id;
                ELSE
                    RETURN QUERY
                    SELECT
                        p.id,
                        'propriete'::VARCHAR AS entity_type,
                        p.batch_id,
                        p.status,
                        p.numero_ouverture,
                        p.target_district_id AS district_id,
                        p.payload AS raw_data,
                        p.topo_user_name,
                        p.created_at AS import_date,
                        (SELECT COUNT(*) FROM topo_staging_files WHERE propriete_id = p.id) AS files_count,
                        dos.id AS dossier_id,
                        COALESCE(dos.nom_dossier, 'Dossier ' || p.numero_ouverture) AS dossier_nom,
                        dos.numero_ouverture AS dossier_numero_ouverture,
                        COALESCE(dis.nom_district, 'District #' || p.target_district_id::TEXT) AS district_nom,
                        (p.status = 'PENDING' OR p.status = 'ARCHIVED')::BOOLEAN AS can_import,
                        (p.status = 'ARCHIVED')::BOOLEAN AS is_archived,
                        (p.error_reason IS NOT NULL)::BOOLEAN AS has_errors,
                        p.error_reason AS error_summary,
                        false::BOOLEAN AS is_duplicate,
                        'create'::VARCHAR AS duplicate_action,
                        p.rejection_reason,
                        p.validated_at AS processed_at
                    FROM topo_staging_proprietes p
                    LEFT JOIN dossiers dos ON dos.numero_ouverture::TEXT = p.numero_ouverture
                        AND dos.id_district = p.target_district_id
                    LEFT JOIN districts dis ON dis.id = p.target_district_id
                    WHERE p.id = p_id;
                END IF;
            END;
            \$\$ LANGUAGE plpgsql
        ");

        // =====================================================
        // 7. DONNÉES DE TEST (OPTIONNEL)
        // =====================================================
        
        // Créer un utilisateur de test
        DB::table('topo_users')->insert([
            'username' => 'test.user',
            'email' => 'test@topomanager.mg',
            'full_name' => 'Test User',
            'hashed_password' => '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWui7W0I/n2', // password: "test123"
            'role' => 'operator',
            'is_active' => true
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Supprimer dans l'ordre inverse
        DB::statement('DROP VIEW IF EXISTS v_topo_imports_all');
        DB::statement('DROP FUNCTION IF EXISTS get_import_enriched_data');
        
        Schema::dropIfExists('topo_staging_files');
        Schema::dropIfExists('topo_staging_proprietes');
        Schema::dropIfExists('topo_staging_demandeurs');
        Schema::dropIfExists('topo_users');
    }
};