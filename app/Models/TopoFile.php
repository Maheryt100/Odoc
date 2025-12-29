<?php

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
