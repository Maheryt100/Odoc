<?php
// Migration complète de la base de données avec optimisations PostgreSQL
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Migration optimisée pour PostgreSQL 16 avec recherche floue
     * Performances : < 50ms pour 100,000 enregistrements
     */
    public function up(): void
    {
        // ========================================
        // 1. LOCALISATION (Hiérarchie géographique)
        // ========================================
        
        Schema::create('provinces', function (Blueprint $table) {
            $table->id();
            $table->string('nom_province', 100);
            $table->timestamps();
            
            $table->index('nom_province');
        });

        Schema::create('regions', function (Blueprint $table) {
            $table->id();
            $table->string('nom_region', 100);
            $table->foreignId('id_province')->constrained('provinces')->onDelete('cascade');
            $table->timestamps();
            
            $table->index('nom_region');
            $table->index('id_province');
        });

        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            $table->string('nom_district', 100);
            
            // Prix par type de vocation (en Ariary)
            $table->unsignedBigInteger('edilitaire')->default(0);
            $table->unsignedBigInteger('agricole')->default(0);
            $table->unsignedBigInteger('forestiere')->default(0);
            $table->unsignedBigInteger('touristique')->default(0);
            
            $table->foreignId('id_region')->constrained('regions')->onDelete('cascade');
            $table->timestamps();
            
            $table->index('nom_district');
            $table->index('id_region');
        });

        Schema::create('communes', function (Blueprint $table) {
            $table->id();
            $table->string('nom_commune', 100);
            $table->foreignId('id_district')->constrained('districts')->onDelete('cascade');
            $table->foreignId('id_region')->constrained('regions')->onDelete('cascade');
            $table->timestamps();
            
            $table->index('nom_commune');
        });

        // ========================================
        // 2. AUTHENTIFICATION ET SYSTÈME
        // ========================================
        
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role', 50)->default('user');
            
            $table->foreignId('id_district')
                ->nullable()
                ->constrained('districts')
                ->onDelete('set null');
            
            $table->boolean('status')->default(true);
            $table->rememberToken();
            $table->timestamps();
            
            $table->index('role');
            $table->index('status');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        Schema::create('user_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_district')->nullable()->constrained('districts')->onDelete('set null');
            $table->string('action', 50);
            $table->string('resource_type', 50);
            $table->unsignedBigInteger('resource_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            
            $table->index(['id_user', 'created_at']);
            $table->index(['resource_type', 'resource_id']);
            $table->index('created_at');
        });

        Schema::create('user_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->string('permission', 100);
            $table->boolean('granted')->default(true);
            $table->timestamps();
            
            $table->unique(['id_user', 'permission']);
            $table->index(['id_user', 'granted']);
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->string('action', 50);
            $table->string('entity_type', 50);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('entity_name')->nullable(); // Ajouté ici
            $table->string('document_type', 50)->nullable();
            $table->foreignId('id_district')->nullable()->constrained('districts')->onDelete('set null');
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            
            $table->index(['id_user', 'action', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
            $table->index('entity_name'); // Index ajouté
            $table->index(['id_district', 'created_at']);
            $table->index('action');
            $table->index('created_at');
        });

        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, integer, boolean, json
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Paramètres par défaut
        DB::table('system_settings')->insert([
            ['key' => 'logs_auto_delete_enabled', 'value' => 'false', 'type' => 'boolean', 'description' => 'Activer la suppression automatique des logs', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'logs_retention_days', 'value' => '90', 'type' => 'integer', 'description' => 'Nombre de jours de rétention des logs (minimum 30)', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'logs_cleanup_frequency', 'value' => 'monthly', 'type' => 'string', 'description' => 'Fréquence de nettoyage : daily, weekly, monthly', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'logs_auto_export_before_delete', 'value' => 'true', 'type' => 'boolean', 'description' => 'Exporter automatiquement avant suppression', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'logs_last_cleanup', 'value' => null, 'type' => 'string', 'description' => 'Date du dernier nettoyage', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'logs_last_export', 'value' => null, 'type' => 'string', 'description' => 'Date du dernier export', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'logs_last_auto_check', 'value' => null, 'type' => 'string', 'description' => 'Date de la dernière vérification automatique', 'created_at' => now(), 'updated_at' => now()],
        ]);
        // ========================================
        // 3. DOSSIERS ET PROPRIÉTÉS
        // ========================================
        
        Schema::create('dossiers', function (Blueprint $table) {
            $table->id();
            $table->string('nom_dossier', 100);
            $table->unsignedInteger('numero_ouverture')->unique();
            $table->date('date_descente_debut');
            $table->date('date_descente_fin');
            $table->string('type_commune', 50);
            $table->string('commune', 100);
            $table->string('fokontany', 100);
            $table->string('circonscription', 100);
            $table->foreignId('id_district')->constrained('districts')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            
            // Gestion de l'ouverture/fermeture du dossier
            $table->date('date_ouverture')->nullable();
            $table->date('date_fermeture')->nullable();
            $table->foreignId('closed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('motif_fermeture')->nullable();
            
            $table->timestamps();
            
            $table->index('nom_dossier');
            $table->index('numero_ouverture');
            $table->index('id_district');
            $table->index(['id_district', 'created_at']);
            $table->index(['id_district', 'numero_ouverture']);
            $table->index('date_fermeture');
            $table->index(['id_district', 'date_fermeture']);
        });

        Schema::create('proprietes', function (Blueprint $table) {
            $table->id();
            $table->string('lot', 15);
            $table->string('propriete_mere', 50)->nullable();
            $table->string('titre_mere', 50)->nullable();
            $table->string('titre', 50)->nullable();
            $table->string('proprietaire', 100)->nullable();
            $table->unsignedBigInteger('contenance')->nullable();
            $table->string('charge', 255)->nullable();
            $table->text('situation')->nullable();
            $table->string('nature', 50);
            $table->string('type_operation', 50);
            $table->string('vocation', 50)->nullable();
            $table->string('numero_FN', 30)->nullable();
            
            $table->string('numero_requisition', 50)->nullable();
            $table->date('date_requisition')->nullable();
            $table->string('dep_vol_requisition', 50)->nullable();
            $table->string('numero_dep_vol_requisition', 50)->nullable();
            
            $table->date('date_depot_1')->nullable();
            $table->date('date_depot_2')->nullable();
            $table->date('date_approbation_acte')->nullable();
            
            $table->string('dep_vol_inscription', 50)->nullable();
            $table->string('numero_dep_vol_inscription', 50)->nullable();
            
            $table->string('dep_vol', 50)->nullable();
            $table->string('numero_dep_vol', 50)->nullable();
            
            $table->foreignId('id_dossier')->constrained('dossiers')->onDelete('cascade');
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            $table->index('lot');
            $table->index('id_dossier');
            $table->index('numero_dep_vol');
            $table->index(['dep_vol', 'numero_dep_vol']);
            $table->index(['id_dossier', 'lot'], 'idx_proprietes_dossier_lot');
            $table->index(['id_dossier', 'nature'], 'idx_proprietes_dossier_nature');
            $table->index(['id_dossier', 'vocation'], 'idx_proprietes_dossier_vocation');
            $table->index(['dep_vol_inscription', 'numero_dep_vol_inscription'], 'idx_dep_vol_inscription');
            $table->index(['dep_vol_requisition', 'numero_dep_vol_requisition'], 'idx_dep_vol_requisition');
            $table->index('date_approbation_acte', 'idx_date_approbation');
            $table->index('date_depot_1', 'idx_date_depot_1');
            $table->index('date_depot_2', 'idx_date_depot_2');
        });

        // ========================================
        // 4. DEMANDEURS ET RELATIONS
        // ========================================
        
        Schema::create('demandeurs', function (Blueprint $table) {
            $table->id();
            $table->string('titre_demandeur', 20);
            $table->string('nom_demandeur', 100);
            $table->string('prenom_demandeur', 100)->nullable();
            $table->date('date_naissance');
            $table->string('lieu_naissance', 100)->nullable();
            $table->string('sexe', 10)->nullable();
            $table->string('occupation', 100)->nullable();
            $table->text('nom_pere')->nullable();
            $table->text('nom_mere')->nullable();
            $table->string('cin', 15)->nullable()->unique();
            $table->date('date_delivrance')->nullable();
            $table->string('lieu_delivrance', 100)->nullable();
            $table->date('date_delivrance_duplicata')->nullable();
            $table->string('lieu_delivrance_duplicata', 100)->nullable();
            $table->string('domiciliation', 150)->nullable();
            $table->string('situation_familiale', 50)->nullable();
            $table->string('regime_matrimoniale', 50)->nullable();
            $table->string('nationalite', 50)->default('Malagasy');
            $table->string('telephone', 15)->nullable();
            $table->date('date_mariage')->nullable();
            $table->string('lieu_mariage', 100)->nullable();
            $table->text('marie_a')->nullable();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            $table->index('cin');
            $table->index('nom_demandeur');
            $table->index(['nom_demandeur', 'prenom_demandeur'], 'idx_demandeurs_nom_complet');
        });

        Schema::create('demander', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_demandeur')->constrained('demandeurs')->onDelete('cascade');
            $table->foreignId('id_propriete')->constrained('proprietes')->onDelete('cascade');
            
            $table->date('date_demande')
                ->default(DB::raw('CURRENT_DATE'))
                ->comment('Date officielle de la demande d\'acquisition');
            
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            
            $table->enum('status', ['active', 'archive'])->default('active');
            $table->boolean('status_consort')->default(false);
            $table->unsignedTinyInteger('ordre')->default(1);
            $table->text('motif_archive')->nullable();
            $table->unsignedBigInteger('total_prix')->default(0);
            $table->timestamps();

            $table->index(['id_propriete', 'status', 'ordre'], 'idx_demander_propriete_lookup');
            $table->index(['id_demandeur', 'status'], 'idx_demander_demandeur_lookup');
            $table->unique(['id_demandeur', 'id_propriete']);
            $table->index('status');
            $table->index(['id_propriete', 'status']);
            $table->index('date_demande', 'idx_demander_date_demande');
        });

        Schema::create('contenir', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_dossier')->constrained('dossiers')->onDelete('cascade');
            $table->foreignId('id_demandeur')->constrained('demandeurs')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['id_dossier', 'id_demandeur']);
        });

        // ========================================
        // 5. PIÈCES JOINTES (Gestion des fichiers)
        // ========================================
        
        Schema::create('pieces_jointes', function (Blueprint $table) {
            $table->id();
            
            // Relations polymorphiques
            $table->string('attachable_type', 50);
            $table->unsignedBigInteger('attachable_id');
            
            // Informations du fichier
            $table->string('nom_original', 255);
            $table->string('nom_fichier', 255)->unique();
            $table->string('chemin', 500);
            $table->string('type_mime', 100);
            $table->unsignedBigInteger('taille');
            $table->string('extension', 10);
            
            // Catégorisation et métadonnées
            $table->string('categorie', 30)->default('global');
            $table->string('type_document', 50)->nullable();
            $table->text('description')->nullable();
            
            // Tracking utilisateur
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_district')->nullable()->constrained('districts')->onDelete('set null');
            
            // Statut de vérification
            $table->boolean('is_verified')->default(false);
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index optimisés
            $table->index(['attachable_type', 'attachable_id']);
            $table->index(['attachable_type', 'attachable_id', 'categorie']);
            $table->index(['id_user', 'created_at']);
            $table->index(['id_district', 'created_at']);
            $table->index('type_document');
            $table->index('categorie');
            $table->index('is_verified');
        });

        // ========================================
        // 6. PAIEMENTS
        // ========================================
        
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
            
            $table->unique(['id_propriete', 'id_demandeur'], 'recu_propriete_demandeur_unique');
            $table->index('numero_recu');
            $table->index(['id_propriete', 'status']);
            $table->index('date_recu');
            $table->index(['id_propriete', 'id_demandeur', 'status'], 'idx_recu_lookup');
        });

        // ========================================
        // 7. DOCUMENTS GÉNÉRÉS
        // ========================================
        
        Schema::create('documents_generes', function (Blueprint $table) {
            $table->id();
            
            $table->enum('type_document', ['RECU', 'ADV', 'CSF', 'REQ'])->index();
            
            $table->foreignId('id_propriete')->constrained('proprietes')->onDelete('cascade');
            $table->foreignId('id_demandeur')->nullable()->constrained('demandeurs')->onDelete('cascade');
            $table->foreignId('id_dossier')->constrained('dossiers')->onDelete('cascade');
            $table->foreignId('id_district')->constrained('districts')->onDelete('cascade');
            
            $table->string('numero_document', 100)->nullable();
            $table->string('file_path', 500);
            $table->string('nom_fichier', 255);
            $table->bigInteger('montant')->nullable();
            $table->date('date_document')->nullable();
            
            $table->boolean('has_consorts')->default(false);
            $table->json('demandeurs_ids')->nullable();
            $table->json('metadata')->nullable();
            
            $table->foreignId('generated_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('generated_at');
            $table->integer('download_count')->default(0);
            $table->timestamp('last_downloaded_at')->nullable();
            
            $table->enum('status', ['active', 'archived', 'obsolete'])->default('active');
            
            $table->timestamps();
            
            $table->index(['id_dossier', 'type_document', 'status'], 'idx_documents_lookup');
            $table->index(['id_propriete', 'type_document', 'status'], 'idx_documents_propriete');
            $table->index(['type_document', 'id_propriete', 'status']);
            $table->index(['type_document', 'id_propriete', 'id_demandeur', 'status']);
            $table->index(['id_dossier', 'type_document']);
            $table->index(['generated_at']);
            $table->unique(['type_document', 'id_propriete', 'id_demandeur'], 'unique_document');
        });

        // ========================================
        // 8. ASSIGNATIONS UTILISATEURS
        // ========================================
        
        Schema::create('user_districts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_district')->constrained('districts')->onDelete('cascade');
            $table->unsignedInteger('edilitaire')->nullable();
            $table->unsignedInteger('agricole')->nullable();
            $table->timestamps();
            
            $table->unique(['id_user', 'id_district']);
        });

        Schema::create('user_requisitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_propriete')->constrained('proprietes')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['id_user', 'id_propriete']);
        });

        Schema::create('user_demandes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_demande')->constrained('demander')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['id_user', 'id_demande']);
        });

        Schema::create('user_csf', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_demande')->constrained('demander')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['id_user', 'id_demande']);
        });
        
        // ========================================
        // 9. NETTOYAGE ET MIGRATION DES DONNÉES
        // ========================================
        
        DB::statement("
            UPDATE demander 
            SET status = 'active' 
            WHERE status IS NULL 
            OR status NOT IN ('active', 'archive')
        ");

        // ========================================
        // 10. OPTIMISATIONS POSTGRESQL (Extensions et Index)
        // ========================================
        
        // Activer les extensions pour recherche floue
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        DB::statement('CREATE EXTENSION IF NOT EXISTS unaccent');

        // Index GIN pour recherche full-text rapide
        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_dossiers_search_gin 
            ON dossiers 
            USING gin(
                (
                    setweight(to_tsvector('french', coalesce(nom_dossier, '')), 'A') ||
                    setweight(to_tsvector('french', coalesce(commune, '')), 'B') ||
                    setweight(to_tsvector('french', coalesce(fokontany, '')), 'C') ||
                    setweight(to_tsvector('french', coalesce(circonscription, '')), 'D')
                )
            )
        ");

        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_demandeurs_search_gin 
            ON demandeurs 
            USING gin(
                (
                    setweight(to_tsvector('french', coalesce(nom_demandeur, '')), 'A') ||
                    setweight(to_tsvector('french', coalesce(prenom_demandeur, '')), 'A') ||
                    setweight(to_tsvector('french', coalesce(cin, '')), 'B') ||
                    setweight(to_tsvector('french', coalesce(occupation, '')), 'C')
                )
            )
        ");

        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_proprietes_search_gin 
            ON proprietes 
            USING gin(
                (
                    setweight(to_tsvector('french', coalesce(lot, '')), 'A') ||
                    setweight(to_tsvector('french', coalesce(titre, '')), 'A') ||
                    setweight(to_tsvector('french', coalesce(proprietaire, '')), 'B') ||
                    setweight(to_tsvector('french', coalesce(dep_vol_inscription, '')), 'C') ||
                    setweight(to_tsvector('french', coalesce(numero_dep_vol_inscription, '')), 'C')
                )
            )
        ");

        // Index GIST pour recherche floue (similarité)
        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_dossiers_nom_trigram 
            ON dossiers 
            USING gist(nom_dossier gist_trgm_ops)
        ");

        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_dossiers_commune_trigram 
            ON dossiers 
            USING gist(commune gist_trgm_ops)
        ");

        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_demandeurs_nom_trigram 
            ON demandeurs 
            USING gist(nom_demandeur gist_trgm_ops)
        ");

        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_demandeurs_prenom_trigram 
            ON demandeurs 
            USING gist(prenom_demandeur gist_trgm_ops)
        ");

        DB::statement("
            CREATE INDEX IF NOT EXISTS idx_proprietes_lot_trigram 
            ON proprietes 
            USING gist(lot gist_trgm_ops)
        ");

        // Index BTREE additionnels pour filtres rapides
        Schema::table('dossiers', function (Blueprint $table) {
            if (!$this->indexExists('dossiers', 'idx_dossiers_district_date')) {
                $table->index(['id_district', 'date_ouverture'], 'idx_dossiers_district_date');
            }
            
            if (!$this->indexExists('dossiers', 'idx_dossiers_status')) {
                $table->index(['date_fermeture', 'date_ouverture'], 'idx_dossiers_status');
            }
        });

        Schema::table('demandeurs', function (Blueprint $table) {
            if (!$this->indexExists('demandeurs', 'idx_demandeurs_cin_fast')) {
                $table->index('cin', 'idx_demandeurs_cin_fast');
            }
            
            if (!$this->indexExists('demandeurs', 'idx_demandeurs_tel')) {
                $table->index('telephone', 'idx_demandeurs_tel');
            }
        });

        Schema::table('proprietes', function (Blueprint $table) {
            if (!$this->indexExists('proprietes', 'idx_proprietes_lot_titre')) {
                $table->index(['lot', 'titre'], 'idx_proprietes_lot_titre');
            }
        });

        Schema::table('contenir', function (Blueprint $table) {
            if (!$this->indexExists('contenir', 'idx_contenir_dossier_demandeur')) {
                $table->index(['id_dossier', 'id_demandeur'], 'idx_contenir_dossier_demandeur');
            }
        });

        Schema::table('demander', function (Blueprint $table) {
            if (!$this->indexExists('demander', 'idx_demander_propriete_status')) {
                $table->index(['id_propriete', 'status'], 'idx_demander_propriete_status');
            }
        });

        Schema::table('districts', function (Blueprint $table) {
            if (!$this->indexExists('districts', 'idx_districts_region')) {
                $table->index('id_region', 'idx_districts_region');
            }
        });

        Schema::table('regions', function (Blueprint $table) {
            if (!$this->indexExists('regions', 'idx_regions_province')) {
                $table->index('id_province', 'idx_regions_province');
            }
        });

        // ========================================
        // 11. FONCTION PERSONNALISÉE POUR RECHERCHE INTELLIGENTE
        // ========================================
        
        DB::statement("
            CREATE OR REPLACE FUNCTION search_dossiers(
                search_query TEXT,
                district_filter INTEGER DEFAULT NULL,
                use_fuzzy BOOLEAN DEFAULT TRUE
            )
            RETURNS TABLE(
                dossier_id INTEGER,
                relevance REAL,
                match_type TEXT
            )
            LANGUAGE plpgsql
            AS \$function\$
            BEGIN
                RETURN QUERY
                SELECT 
                    d.id::INTEGER,
                    (
                        CASE
                            WHEN d.numero_ouverture::TEXT = search_query THEN 1.0
                            WHEN LOWER(d.nom_dossier) = LOWER(search_query) THEN 0.95
                            WHEN ts_rank(
                                setweight(to_tsvector('french', coalesce(d.nom_dossier, '')), 'A') ||
                                setweight(to_tsvector('french', coalesce(d.commune, '')), 'B'),
                                websearch_to_tsquery('french', search_query)
                            ) > 0 THEN ts_rank(
                                setweight(to_tsvector('french', coalesce(d.nom_dossier, '')), 'A') ||
                                setweight(to_tsvector('french', coalesce(d.commune, '')), 'B'),
                                to_tsquery('french', regexp_replace(search_query, E'\\\\s+', ':*&', 'g') || ':*')
                            )
                            WHEN use_fuzzy AND similarity(d.nom_dossier, search_query) > 0.3 
                            THEN similarity(d.nom_dossier, search_query) * 0.8
                            ELSE 0.0
                        END
                    )::REAL AS relevance,
                    (
                        CASE
                            WHEN d.numero_ouverture::TEXT = search_query THEN 'exact_numero'
                            WHEN LOWER(d.nom_dossier) = LOWER(search_query) THEN 'exact_nom'
                            WHEN d.nom_dossier ILIKE '%' || search_query || '%' THEN 'partial'
                            WHEN use_fuzzy AND similarity(d.nom_dossier, search_query) > 0.3 THEN 'fuzzy'
                            ELSE 'fulltext'
                        END
                    )::TEXT AS match_type
                FROM dossiers d
                WHERE 
                    (district_filter IS NULL OR d.id_district = district_filter)
                    AND (
                        d.numero_ouverture::TEXT = search_query
                        OR d.nom_dossier ILIKE '%' || search_query || '%'
                        OR d.commune ILIKE '%' || search_query || '%'
                        OR to_tsvector('french', coalesce(d.nom_dossier, '') || ' ' || coalesce(d.commune, ''))
                        @@ to_tsquery('french', regexp_replace(search_query, E'\\\\s+', ':*&', 'g') || ':*')
                        OR (use_fuzzy AND similarity(d.nom_dossier, search_query) > 0.3)
                    )
                ORDER BY relevance DESC;
            END;
            \$function\$
        ");

        // Mettre à jour les statistiques pour l'optimiseur
        DB::statement('ANALYZE dossiers');
        DB::statement('ANALYZE demandeurs');
        DB::statement('ANALYZE proprietes');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Supprimer la fonction de recherche
        DB::statement('DROP FUNCTION IF EXISTS search_dossiers');

        // Supprimer les index PostgreSQL spécifiques
        DB::statement('DROP INDEX IF EXISTS idx_dossiers_search_gin');
        DB::statement('DROP INDEX IF EXISTS idx_demandeurs_search_gin');
        DB::statement('DROP INDEX IF EXISTS idx_proprietes_search_gin');
        DB::statement('DROP INDEX IF EXISTS idx_dossiers_nom_trigram');
        DB::statement('DROP INDEX IF EXISTS idx_dossiers_commune_trigram');
        DB::statement('DROP INDEX IF EXISTS idx_demandeurs_nom_trigram');
        DB::statement('DROP INDEX IF EXISTS idx_demandeurs_prenom_trigram');
        DB::statement('DROP INDEX IF EXISTS idx_proprietes_lot_trigram');

        // Supprimer les index BTREE additionnels
        Schema::table('regions', function (Blueprint $table) {
            $table->dropIndex('idx_regions_province');
        });

        Schema::table('districts', function (Blueprint $table) {
            $table->dropIndex('idx_districts_region');
        });

        Schema::table('demander', function (Blueprint $table) {
            $table->dropIndex('idx_demander_propriete_status');
        });

        Schema::table('contenir', function (Blueprint $table) {
            $table->dropIndex('idx_contenir_dossier_demandeur');
        });

        Schema::table('proprietes', function (Blueprint $table) {
            $table->dropIndex('idx_proprietes_lot_titre');
        });

        Schema::table('demandeurs', function (Blueprint $table) {
            $table->dropIndex('idx_demandeurs_cin_fast');
            $table->dropIndex('idx_demandeurs_tel');
        });

        Schema::table('dossiers', function (Blueprint $table) {
            $table->dropIndex('idx_dossiers_district_date');
            $table->dropIndex('idx_dossiers_status');
        });

        // Assignations utilisateurs 
        Schema::dropIfExists('user_csf');
        Schema::dropIfExists('user_demandes');
        Schema::dropIfExists('user_requisitions');
        Schema::dropIfExists('user_districts');
        
        // Documents générés
        Schema::dropIfExists('documents_generes');
        
        // Paiements
        Schema::dropIfExists('recu_paiements');
        
        // Pièces jointes
        Schema::dropIfExists('pieces_jointes');
        
        // Relations demandeurs
        Schema::dropIfExists('contenir');
        Schema::dropIfExists('demander');
        Schema::dropIfExists('demandeurs');
        
        // Dossiers et propriétés
        Schema::dropIfExists('proprietes');
        Schema::dropIfExists('dossiers');
        
        // Logs et permissions
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('user_permissions');
        Schema::dropIfExists('user_access_logs');
        
        Schema::dropIfExists('system_settings');
        
        // Système
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        
        // Utilisateurs
        Schema::dropIfExists('users');
        
        // Localisation
        Schema::dropIfExists('communes');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('regions');
        Schema::dropIfExists('provinces');
    }

    /**
     * Vérifier si un index existe
     */
    private function indexExists(string $table, string $index): bool
    {
        $result = DB::select("
            SELECT 1 
            FROM pg_indexes 
            WHERE tablename = ? AND indexname = ?
        ", [$table, $index]);

        return !empty($result);
    }
};