<?php
// app/Models/TopoImport.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TopoImport extends Model
{
    protected $table = 'topo_imports';
    
    protected $fillable = [
        'batch_id',
        'import_date',
        'source',
        'topo_user_id',
        'topo_user_name',
        'entity_type',
        'action_suggested',
        'target_dossier_id',
        'target_district_id',
        'raw_data',
        'has_warnings',
        'warnings',
        'matched_entity_type',
        'matched_entity_id',
        'match_confidence',
        'match_method',
        'status',
        'processed_at',
        'processed_by',
        'rejection_reason',
        'metadata'
    ];
    
    protected $casts = [
        'import_date' => 'datetime',
        'processed_at' => 'datetime',
        'raw_data' => 'array',
        'warnings' => 'array',
        'metadata' => 'array',
        'has_warnings' => 'boolean',
        'match_confidence' => 'float'
    ];
    
    protected $appends = [
        'status_label',
        'entity_type_label',
        'action_label'
    ];
    
    // ============================================
    // RELATIONS
    // ============================================
    
    public function dossier(): BelongsTo
    {
        return $this->belongsTo(Dossier::class, 'target_dossier_id');
    }
    
    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class, 'target_district_id');
    }
    
    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
    
    public function files(): HasMany
    {
        return $this->hasMany(TopoFile::class, 'import_id');
    }
    
    // ============================================
    // ACCESSORS
    // ============================================
    
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'pending' => 'En attente',
            'processing' => 'En cours',
            'validated' => 'Validé',
            'rejected' => 'Rejeté',
            'error' => 'Erreur',
            default => 'Inconnu'
        };
    }
    
    public function getEntityTypeLabelAttribute(): string
    {
        return match($this->entity_type) {
            'propriete' => 'Propriété',
            'demandeur' => 'Demandeur',
            default => 'Inconnu'
        };
    }
    
    public function getActionLabelAttribute(): string
    {
        return match($this->action_suggested) {
            'create' => 'Création',
            'update' => 'Mise à jour',
            default => 'Inconnu'
        };
    }
    
    // ============================================
    // SCOPES
    // ============================================
    
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
    
    public function scopeValidated($query)
    {
        return $query->where('status', 'validated');
    }
    
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }
    
    public function scopeForDistrict($query, $districtId)
    {
        return $query->where('target_district_id', $districtId);
    }
    
    public function scopeWithWarnings($query)
    {
        return $query->where('has_warnings', true);
    }
    
    public function scopeOfType($query, $entityType)
    {
        return $query->where('entity_type', $entityType);
    }
    
    // ============================================
    // MÉTHODES
    // ============================================
    
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
    
    public function isValidated(): bool
    {
        return $this->status === 'validated';
    }
    
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }
    
    public function canBeValidated(): bool
    {
        return $this->status === 'pending';
    }
    
    public function getMatchConfidencePercent(): ?int
    {
        if ($this->match_confidence === null) {
            return null;
        }
        
        return (int) round($this->match_confidence * 100);
    }
}

// ============================================
// app/Models/TopoFile.php
// ============================================

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class TopoFile extends Model
{
    protected $table = 'topo_files';
    
    public $timestamps = false;
    
    protected $fillable = [
        'import_id',
        'original_name',
        'stored_name',
        'storage_path',
        'mime_type',
        'file_size',
        'file_extension',
        'category',
        'description',
        'is_valid',
        'validation_errors',
        'file_hash',
        'uploaded_at'
    ];
    
    protected $casts = [
        'uploaded_at' => 'datetime',
        'is_valid' => 'boolean',
        'validation_errors' => 'array',
        'file_size' => 'integer'
    ];
    
    protected $appends = [
        'file_size_human',
        'category_label',
        'is_image'
    ];
    
    // ============================================
    // RELATIONS
    // ============================================
    
    public function import(): BelongsTo
    {
        return $this->belongsTo(TopoImport::class, 'import_id');
    }
    
    // ============================================
    // ACCESSORS
    // ============================================
    
    public function getFileSizeHumanAttribute(): string
    {
        $bytes = $this->file_size;
        
        if ($bytes < 1024) {
            return $bytes . ' o';
        } elseif ($bytes < 1048576) {
            return round($bytes / 1024, 2) . ' Ko';
        } else {
            return round($bytes / 1048576, 2) . ' Mo';
        }
    }
    
    public function getCategoryLabelAttribute(): string
    {
        return match($this->category) {
            'plan' => 'Plan',
            'photo' => 'Photo',
            'document' => 'Document',
            default => 'Autre'
        };
    }
    
    public function getIsImageAttribute(): bool
    {
        return in_array($this->file_extension, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
    }
    
    // ============================================
    // MÉTHODES
    // ============================================
    
    public function exists(): bool
    {
        return file_exists($this->storage_path);
    }
    
    public function delete(): bool
    {
        // Supprimer le fichier physique
        if ($this->exists()) {
            @unlink($this->storage_path);
        }
        
        // Supprimer l'enregistrement
        return parent::delete();
    }
    
    public function getUrl(): string
    {
        return route('topo-flux.files.download', $this->id);
    }
    
    public function getPreviewUrl(): ?string
    {
        if (!$this->is_image) {
            return null;
        }
        
        return route('topo-flux.files.preview', $this->id);
    }
}

// ============================================
// app/Models/TopoUser.php (Optionnel)
// ============================================

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TopoUser extends Model
{
    protected $table = 'topo_users';
    
    protected $fillable = [
        'username',
        'email',
        'full_name',
        'password_hash',
        'role',
        'is_active',
        'linked_geodoc_user_id',
        'allowed_districts',
        'last_token_refresh'
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
        'allowed_districts' => 'array',
        'last_token_refresh' => 'datetime'
    ];
    
    protected $hidden = [
        'password_hash'
    ];
    
    public function linkedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'linked_geodoc_user_id');
    }
    
    public function isActive(): bool
    {
        return $this->is_active;
    }
    
    public function hasDistrictAccess(int $districtId): bool
    {
        if ($this->allowed_districts === null) {
            return true; // Accès à tous les districts
        }
        
        return in_array($districtId, $this->allowed_districts);
    }
}