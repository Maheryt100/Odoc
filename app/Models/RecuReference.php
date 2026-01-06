<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/**
 * Model pour stocker les références de reçus externes
 * (générés hors du système)
 */
class RecuReference extends Model
{
    use HasFactory;
    
    protected $table = 'recu_references';
    
    protected $fillable = [
        'id_propriete',
        'id_demandeur',
        'id_dossier',
        'numero_recu',
        'montant',
        'date_recu',
        'notes',
        'created_by',
        'updated_by',
    ];
    
    protected $casts = [
        'date_recu' => 'date',
        'montant' => 'integer',
    ];
    
    // ============================================
    // BOOT
    // ============================================
    
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            $model->created_by = $model->created_by ?? Auth::id();
        });
        
        static::updating(function ($model) {
            $model->updated_by = Auth::id();
        });
    }
    
    // ============================================
    // RELATIONS
    // ============================================
    
    public function propriete()
    {
        return $this->belongsTo(Propriete::class, 'id_propriete');
    }
    
    public function demandeur()
    {
        return $this->belongsTo(Demandeur::class, 'id_demandeur');
    }
    
    public function dossier()
    {
        return $this->belongsTo(Dossier::class, 'id_dossier');
    }
    
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
    
    // ============================================
    // SCOPES
    // ============================================
    
    public function scopeForDossier($query, int $dossierId)
    {
        return $query->where('id_dossier', $dossierId);
    }
    
    public function scopeByNumero($query, string $numero)
    {
        return $query->where('numero_recu', $numero);
    }
    
    // ============================================
    // MÉTHODES UTILITAIRES
    // ============================================
    
    /**
     * Vérifier si le numéro existe déjà dans le dossier
     */
    public static function numeroExisteDansDossier(string $numero, int $dossierId, ?int $excludeId = null): bool
    {
        $query = self::where('id_dossier', $dossierId)
            ->where('numero_recu', $numero);
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        return $query->exists();
    }
    
    /**
     * Formater le numéro de reçu
     */
    public function getNumeroFormatteAttribute(): string
    {
        return $this->numero_recu;
    }
    
    /**
     * Obtenir une référence existante ou en créer une nouvelle
     */
    public static function getOrCreate(int $idPropriete, int $idDemandeur, string $numeroRecu, ?int $montant = null): self
    {
        $propriete = Propriete::findOrFail($idPropriete);
        
        return self::updateOrCreate(
            [
                'id_propriete' => $idPropriete,
                'id_demandeur' => $idDemandeur,
            ],
            [
                'id_dossier' => $propriete->id_dossier,
                'numero_recu' => $numeroRecu,
                'montant' => $montant,
                'date_recu' => now(),
            ]
        );
    }
}