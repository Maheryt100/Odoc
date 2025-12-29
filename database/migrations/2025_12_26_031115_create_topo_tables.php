<?php
// database/migrations/2025_12_26_031115_create_topo_tables.php dans geodoc

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

            // Authentification alternative par API key (OPTIONNEL)
            $table->string('api_key', 64)->nullable()->unique();

            // Permissions
            $table->string('role', 20)->default('operator'); // operator, supervisor, admin
            $table->boolean('is_active')->default(true);

            // Liaison avec GeODOC
            $table->foreignId('linked_geodoc_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Restrictions géographiques
            $table->json('allowed_districts')->nullable();

            // Tokens JWT
            $table->timestamp('last_token_refresh')->nullable();

            $table->timestamps();

            // Index
            $table->index('email');
            $table->index('api_key');
            $table->index('is_active');
            $table->index(['username', 'is_active']);
        });

        // ============================================
        // 2. TABLE : IMPORTS EN ATTENTE
        // ============================================

        Schema::create('topo_imports', function (Blueprint $table) {
            $table->id();

            $table->uuid('batch_id')->nullable();
            $table->timestamp('import_date')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->string('source', 50)->default('TopoManager');

            $table->unsignedBigInteger('topo_user_id');
            $table->string('topo_user_name', 100);

            $table->enum('entity_type', ['propriete', 'demandeur']);
            $table->enum('action_suggested', ['create', 'update']);

            $table->foreignId('target_dossier_id')
                ->constrained('dossiers')
                ->cascadeOnDelete();

            $table->foreignId('target_district_id')
                ->constrained('districts')
                ->cascadeOnDelete();

            $table->jsonb('raw_data');

            $table->boolean('has_warnings')->default(false);
            $table->jsonb('warnings')->nullable();

            $table->string('matched_entity_type', 20)->nullable();
            $table->unsignedBigInteger('matched_entity_id')->nullable();
            $table->decimal('match_confidence', 3, 2)->nullable();
            $table->string('match_method', 50)->nullable();

            $table->enum('status', ['pending', 'processing', 'validated', 'rejected', 'error'])
                ->default('pending');

            $table->timestamp('processed_at')->nullable();
            $table->foreignId('processed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('rejection_reason')->nullable();
            $table->jsonb('metadata')->nullable();

            $table->timestamps();

            // Index
            $table->index('status');
            $table->index(['target_dossier_id', 'status']);
            $table->index(['target_district_id', 'status']);
            $table->index(['entity_type', 'matched_entity_id']);
            $table->index('topo_user_id');
            $table->index('import_date');
        });

        DB::statement('CREATE INDEX IF NOT EXISTS topo_imports_batch_id_index ON topo_imports (batch_id)');

        DB::statement("
            ALTER TABLE topo_imports
            ADD CONSTRAINT check_match_confidence
            CHECK (match_confidence IS NULL OR (match_confidence BETWEEN 0 AND 1))
        ");

        // ============================================
        // 3. TABLE : FICHIERS TEMPORAIRES
        // ============================================

        Schema::create('topo_files', function (Blueprint $table) {
            $table->id();

            $table->foreignId('import_id')
                ->constrained('topo_imports')
                ->cascadeOnDelete();

            $table->string('original_name', 255);
            $table->string('stored_name', 255)->unique();
            $table->string('storage_path', 500);

            $table->string('mime_type', 100);
            $table->unsignedBigInteger('file_size');
            $table->string('file_extension', 10);

            $table->enum('category', ['plan', 'photo', 'document']);
            $table->text('description')->nullable();

            $table->boolean('is_valid')->default(true);
            $table->jsonb('validation_errors')->nullable();

            $table->string('file_hash', 64);

            $table->timestamp('uploaded_at')->default(DB::raw('CURRENT_TIMESTAMP'));

            $table->index(['import_id', 'category']);
            $table->index('file_hash');
        });

        // ============================================
        // 4. LOGS D'ACTIVITÉ
        // ============================================

        Schema::create('topo_activity_logs', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('topo_user_id');
            $table->string('action', 50);
            $table->string('entity_type', 20)->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();

            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->jsonb('metadata')->nullable();

            $table->timestamp('created_at')->default(DB::raw('CURRENT_TIMESTAMP'));

            $table->index(['topo_user_id', 'created_at']);
            $table->index('action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE IF EXISTS topo_imports DROP CONSTRAINT IF EXISTS check_match_confidence');
        DB::statement('DROP INDEX IF EXISTS topo_imports_batch_id_index');

        Schema::dropIfExists('topo_activity_logs');
        Schema::dropIfExists('topo_files');
        Schema::dropIfExists('topo_imports');
        Schema::dropIfExists('topo_users');
    }
};
