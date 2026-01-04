<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Table des utilisateurs TopoManager
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

        // 2. Table STAGING pour les demandeurs
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
            $table->timestampTz('validated_at')->nullable();
            $table->bigInteger('validated_by')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('status');
            $table->index('target_district_id');
            $table->index('target_dossier_id');
            $table->index('created_at');
            $table->index('batch_id');
        });

        // 3. Table STAGING pour les propriétés
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
            $table->timestampTz('validated_at')->nullable();
            $table->bigInteger('validated_by')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('status');
            $table->index('target_district_id');
            $table->index('target_dossier_id');
            $table->index('created_at');
            $table->index('batch_id');
        });

        // 4. Table des fichiers STAGING
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

        // Ajout manuel de la contrainte CHECK (non supportée nativement par Blueprint de façon fluide)
        DB::statement('ALTER TABLE topo_staging_files ADD CONSTRAINT check_file_owner CHECK (
            (demandeur_id IS NOT NULL AND propriete_id IS NULL) OR
            (demandeur_id IS NULL AND propriete_id IS NOT NULL)
        )');

        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('topo_staging_files');
        Schema::dropIfExists('topo_staging_proprietes');
        Schema::dropIfExists('topo_staging_demandeurs');
        Schema::dropIfExists('topo_users');
    }
};