<?php 
// ============================================
// app/Models/TopoImportCache.php
// SIMPLE CACHE MODEL
// ============================================

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TopoImportCache extends Model
{
    protected $table = 'topo_imports_cache';
    
    public $timestamps = false;
    
    protected $fillable = [
        'fastapi_import_id',
        'batch_id',
        'entity_type',
        'target_dossier_id',
        'status'
    ];
    
    public function dossier()
    {
        return $this->belongsTo(Dossier::class, 'target_dossier_id');
    }
}