<?php
// database/migrations/2025_12_26_031115_create_topo_tables.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Crée les tables nécessaires pour l'interopérabilité TopoManager ↔ GeODOC
     * - topo_users: Utilisateurs TopoManager
     * - topo_imports: Imports en attente de validation
     * - topo_files: Fichiers temporaires
     * - topo_activity_logs: Logs d'activité TopoManager
     */
    public function up(): void
    {
        // ============================================
        // 1. TABLE : UTILISATEURS TOPOMANAGER
        // ============================================
        
        Schema::create('topo_users', function (Blueprint $table) {
            $table->id();
            
            // Informations de base
            $table->string('username', 50)->unique();
            $table->string('email', 100)->unique();
            $table->string('full_name', 100);
            
            // Authentification
            $table->string('password_hash', 255);
            
            // Permissions
            $table->string('role', 20)->default('operator'); // operator, supervisor, admin
            $table->boolean('is_active')->default(true);
            
            // Liaison avec GeODOC (optionnel)
            $table->foreignId('linked_geodoc_user_id')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null');
            
            // Restrictions géographiques
            $table->json('allowed_districts')->nullable(); // [1, 3, 5] ou null = tous
            
            // Tokens JWT
            $table->timestamp('last_token_refresh')->nullable();
            
            $table->timestamps();
            
            // Index
            $table->index('email');
            $table->index('is_active');
            $table->index(['username', 'is_active']);
        });
        
        // ============================================
        // 2. TABLE : IMPORTS EN ATTENTE
        // ============================================
        
        Schema::create('topo_imports', function (Blueprint $table) {
            $table->id();
            
            // Métadonnées
            $table->uuid('batch_id')->nullable(); // Sera généré par trigger
            $table->timestamp('import_date')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->string('source', 50)->default('TopoManager');
            
            // Utilisateur TopoManager (depuis JWT)
            $table->unsignedBigInteger('topo_user_id');
            $table->string('topo_user_name', 100);
            
            // Type d'entité et action
            $table->enum('entity_type', ['propriete', 'demandeur']);
            $table->enum('action_suggested', ['create', 'update']);
            
            // Dossier de destination (OBLIGATOIRE)
            $table->foreignId('target_dossier_id')
                ->constrained('dossiers')
                ->onDelete('cascade');
            
            $table->foreignId('target_district_id')
                ->constrained('districts')
                ->onDelete('cascade');
            
            // Données JSON brutes
            $table->jsonb('raw_data');
            
            // Validation et warnings
            $table->boolean('has_warnings')->default(false);
            $table->jsonb('warnings')->nullable();
            
            // Matching automatique
            $table->string('matched_entity_type', 20)->nullable(); // 'propriete' ou 'demandeur'
            $table->unsignedBigInteger('matched_entity_id')->nullable();
            $table->decimal('match_confidence', 3, 2)->nullable(); // 0.00 à 1.00
            $table->string('match_method', 50)->nullable(); // 'exact_lot', 'exact_cin', 'fuzzy_name'
            
            // Statut du traitement
            $table->enum('status', ['pending', 'processing', 'validated', 'rejected', 'error'])->default('pending');
            $table->timestamp('processed_at')->nullable();
            $table->foreignId('processed_by')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null');
            $table->text('rejection_reason')->nullable();
            
            // Métadonnées additionnelles
            $table->jsonb('metadata')->nullable();
            
            $table->timestamps();
            
            // Index de performance (SANS batch_id ici pour éviter le doublon)
            $table->index('status');
            $table->index(['target_dossier_id', 'status']);
            $table->index(['target_district_id', 'status']);
            $table->index(['entity_type', 'matched_entity_id']);
            $table->index('topo_user_id');
            $table->index('import_date');
            $table->index(['status', 'import_date']);
            $table->index(['target_district_id', 'status', 'entity_type']);
        });

        // Ajouter l'index batch_id APRÈS la création de la table
        DB::statement('CREATE INDEX IF NOT EXISTS topo_imports_batch_id_index ON topo_imports (batch_id)');

        // Ajouter la contrainte CHECK pour match_confidence
        DB::statement("
            ALTER TABLE topo_imports 
            ADD CONSTRAINT check_match_confidence 
            CHECK (match_confidence IS NULL OR (match_confidence >= 0 AND match_confidence <= 1))
        ");
        
        // ============================================
        // 3. TABLE : FICHIERS TEMPORAIRES
        // ============================================
        
        Schema::create('topo_files', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('import_id')
                ->constrained('topo_imports')
                ->onDelete('cascade');
            
            // Informations fichier
            $table->string('original_name', 255);
            $table->string('stored_name', 255)->unique();
            $table->string('storage_path', 500);
            
            // Métadonnées
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('file_size'); // En octets
            $table->string('file_extension', 10);
            
            // Catégorisation
            $table->enum('category', ['plan', 'photo', 'document']);
            $table->text('description')->nullable();
            
            // Validation
            $table->boolean('is_valid')->default(true);
            $table->jsonb('validation_errors')->nullable();
            
            // Hash pour détecter doublons
            $table->string('file_hash', 64); // SHA-256
            
            $table->timestamp('uploaded_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            
            // Index
            $table->index('import_id');
            $table->index('category');
            $table->index('file_hash');
            $table->index(['import_id', 'category']);
        });
        
        // ============================================
        // 4. TABLE : LOGS D'ACTIVITÉ TOPOMANAGER
        // ============================================
        
        Schema::create('topo_activity_logs', function (Blueprint $table) {
            $table->id();
            
            $table->unsignedBigInteger('topo_user_id');
            
            $table->string('action', 50); // 'login', 'import_create', 'import_update', 'file_upload'
            $table->string('entity_type', 20)->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            
            $table->jsonb('metadata')->nullable();
            
            $table->timestamp('created_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            
            // Index
            $table->index(['topo_user_id', 'created_at']);
            $table->index('action');
            $table->index('created_at');
        });
        
        // ============================================
        // 5. VUE : STATISTIQUES IMPORTS PAR DISTRICT
        // ============================================
        
        DB::statement("
            CREATE OR REPLACE VIEW topo_imports_stats AS
            SELECT 
                target_district_id,
                d.nom_district,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
                COUNT(*) FILTER (WHERE status = 'validated') AS validated_count,
                COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
                COUNT(*) FILTER (WHERE has_warnings = TRUE) AS warnings_count,
                MAX(import_date) AS last_import_date
            FROM topo_imports ti
            JOIN districts d ON ti.target_district_id = d.id
            GROUP BY target_district_id, d.nom_district
        ");
        
        // ============================================
        // 6. EXTENSIONS POSTGRESQL (si pas déjà activées)
        // ============================================
        
        // Extension pour UUID (si pas déjà activée)
        try {
            DB::statement('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        } catch (\Exception $e) {
            // Extension déjà activée ou pas de permissions
        }
        
        // Extension pour recherche floue (déjà activée normalement)
        try {
            DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        } catch (\Exception $e) {
            // Déjà activée
        }
        
        // ============================================
        // 7. FONCTION : GÉNÉRATION UUID AUTOMATIQUE
        // ============================================

        DB::statement("
            CREATE OR REPLACE FUNCTION generate_batch_id()
            RETURNS TRIGGER AS \$function\$
            BEGIN
                IF NEW.batch_id IS NULL THEN
                    NEW.batch_id := uuid_generate_v4();
                END IF;
                RETURN NEW;
            END;
            \$function\$ LANGUAGE plpgsql
        ");

        // Supprimer le trigger s'il existe
        DB::statement("DROP TRIGGER IF EXISTS set_batch_id_before_insert ON topo_imports");

        // Créer le trigger
        DB::statement("
            CREATE TRIGGER set_batch_id_before_insert
            BEFORE INSERT ON topo_imports
            FOR EACH ROW
            EXECUTE FUNCTION generate_batch_id()
        ");

        // ============================================
        // 8. FONCTION : NETTOYAGE AUTOMATIQUE FICHIERS
        // ============================================

        DB::statement("
            CREATE OR REPLACE FUNCTION delete_orphan_files()
            RETURNS TRIGGER AS \$function\$
            BEGIN
                DELETE FROM topo_files WHERE import_id = OLD.id;
                RETURN OLD;
            END;
            \$function\$ LANGUAGE plpgsql
        ");

        // Supprimer le trigger s'il existe
        DB::statement("DROP TRIGGER IF EXISTS cleanup_files_after_import_delete ON topo_imports");

        // Créer le trigger
        DB::statement("
            CREATE TRIGGER cleanup_files_after_import_delete
            AFTER DELETE ON topo_imports
            FOR EACH ROW
            EXECUTE FUNCTION delete_orphan_files()
        ");
        
        // ============================================
        // 9. INDEX ADDITIONNELS POUR PERFORMANCE
        // ============================================
        
        // Index GIN pour recherche full-text sur raw_data
        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_topo_imports_raw_data_gin 
            ON topo_imports 
            USING gin(raw_data jsonb_path_ops)
        ");
        
        // Index pour filtrage rapide par warnings
        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_topo_imports_warnings 
            ON topo_imports(has_warnings) 
            WHERE has_warnings = true
        ");
        
        // ============================================
        // 10. DONNÉES DE TEST (OPTIONNEL)
        // ============================================
        
        // Créer un utilisateur TopoManager de test
        DB::table('topo_users')->insert([
            'username' => 'topo_test',
            'email' => 'test@topomanager.mg',
            'full_name' => 'Utilisateur Test TopoManager',
            'password_hash' => password_hash('test123', PASSWORD_BCRYPT),
            'role' => 'operator',
            'is_active' => true,
            'allowed_districts' => null, // Accès à tous les districts
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // ============================================
        // SUPPRESSION DANS L'ORDRE INVERSE
        // ============================================
        
        // Supprimer contrainte CHECK
        DB::statement('ALTER TABLE IF EXISTS topo_imports DROP CONSTRAINT IF EXISTS check_match_confidence');
        
        // Supprimer triggers
        DB::statement('DROP TRIGGER IF EXISTS cleanup_files_after_import_delete ON topo_imports');
        DB::statement('DROP TRIGGER IF EXISTS set_batch_id_before_insert ON topo_imports');
        
        // Supprimer fonctions
        DB::statement('DROP FUNCTION IF EXISTS delete_orphan_files()');
        DB::statement('DROP FUNCTION IF EXISTS generate_batch_id()');
        
        // Supprimer vue
        DB::statement('DROP VIEW IF EXISTS topo_imports_stats');
        
        // Supprimer index manuels
        DB::statement('DROP INDEX IF EXISTS idx_topo_imports_raw_data_gin');
        DB::statement('DROP INDEX IF EXISTS idx_topo_imports_warnings');
        DB::statement('DROP INDEX IF EXISTS topo_imports_batch_id_index');
        
        // Supprimer tables
        Schema::dropIfExists('topo_activity_logs');
        Schema::dropIfExists('topo_files');
        Schema::dropIfExists('topo_imports');
        Schema::dropIfExists('topo_users');

    }
};