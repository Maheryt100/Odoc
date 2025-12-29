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
