<?php

namespace App\Models;

use App\Traits\HasPiecesJointes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
// use Illuminate\Support\Facades\Log;

class Propriete extends Model
{
    use HasPiecesJointes;

    protected $fillable = [
        'lot',
        'titre',
        'contenance',
        'proprietaire',
        'propriete_mere',
        'titre_mere',
        'charge',
        'situation',
        'nature',
        'vocation',
        'numero_FN',
        'numero_requisition',
        'type_operation',
        'date_requisition',
        'date_inscription',
        'dep_vol',
        'numero_dep_vol',
        'id_dossier',
        'id_user',
    ];

    protected $casts = [
        'contenance' => 'decimal:2',
        'date_requisition' => 'date',
        'date_inscription' => 'date',
    ];

    protected $appends = [
        'dep_vol_complet',
        'titre_complet',
        'is_incomplete',
        'is_archived',
        'is_empty',
        'has_active_demandes',
        'status_label',
    ];

    // ============================================
    // RELATIONS
    // ============================================

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(Dossier::class, 'id_dossier');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    /*
     *  CORRECTION PRINCIPALE : Retirer ->using(Demander::class)
     * Utiliser la relation hasMany pour accéder aux demandes
     */
    public function demandeurs(): BelongsToMany
    {
        return $this->belongsToMany(Demandeur::class, 'demander', 'id_propriete', 'id_demandeur')
            ->withPivot(['id', 'total_prix', 'status', 'status_consort', 'ordre', 'motif_archive', 'id_user', 'created_at', 'updated_at'])
            ->withTimestamps()
            ->orderBy('demander.ordre', 'asc');
    }

    /**
     *  RELATION PRINCIPALE : Accès direct aux demandes (recommandé)
     */
    public function demandes(): HasMany
    {
        return $this->hasMany(Demander::class, 'id_propriete')
            ->orderBy('ordre', 'asc');
    }

    /**
     * Demandes actives uniquement
     */
    public function demandesActives(): HasMany
    {
        return $this->hasMany(Demander::class, 'id_propriete')
            ->where('status', Demander::STATUS_ACTIVE)
            ->orderBy('ordre');
    }

    /**
     * ✅ Demandes archivées
     */
    public function demandesArchivees(): HasMany
    {
        return $this->hasMany(Demander::class, 'id_propriete')
            ->where('status', Demander::STATUS_ARCHIVE)
            ->orderBy('ordre');
    }

    // ============================================
    // ACCESSORS
    // ============================================

    /**
     * ✅ Formater le Dep/Vol complet avec numéro
     */
    public function getDepVolCompletAttribute(): ?string
    {
        if (!$this->dep_vol) {
            return null;
        }

        $depVol = trim($this->dep_vol);
        
        if ($this->numero_dep_vol) {
            $numero = trim($this->numero_dep_vol);
            return "{$depVol} n°{$numero}";
        }

        return $depVol;
    }

    /**
     * Formater le titre complet
     */
    public function getTitreCompletAttribute(): ?string
    {
        return $this->titre ? "TNº{$this->titre}" : null;
    }

    /**
     * Vérifier si la propriété est incomplète
     */
    public function getIsIncompleteAttribute(): bool
    {
        return !$this->titre 
            || !$this->contenance 
            || !$this->proprietaire 
            || !$this->nature 
            || !$this->vocation 
            || !$this->situation;
    }

    /**
     * ✅ OPTIMISÉ : Cache les stats
     */
    public function getIsArchivedAttribute(): bool
    {
        $stats = $this->getDemandesStats();
        return $stats['actives'] === 0 && $stats['archivees'] > 0;
    }

    public function getIsEmptyAttribute(): bool
    {
        $stats = $this->getDemandesStats();
        return $stats['actives'] === 0 && $stats['archivees'] === 0;
    }

    public function getHasActiveDemandesAttribute(): bool
    {
        $stats = $this->getDemandesStats();
        return $stats['actives'] > 0;
    }

    public function getStatusLabelAttribute(): string
    {
        if ($this->is_archived) {
            return 'Acquise';
        }

        if ($this->has_active_demandes) {
            return 'Active';
        }

        if ($this->is_empty) {
            return 'Vide';
        }

        return 'Inconnu';
    }

    // ============================================
    // MÉTHODES HELPER
    // ============================================

    /**
     * ✅ OPTIMISÉ : Obtenir les statistiques avec cache
     */
    public function getDemandesStats(): array
    {
        static $cache = [];
        
        $cacheKey = "propriete_{$this->id}_stats";
        
        if (isset($cache[$cacheKey])) {
            return $cache[$cacheKey];
        }

        // Utiliser la relation demandes qui est plus performante
        $demandes = $this->demandes ?? [];
        
        $actives = 0;
        $archivees = 0;

        foreach ($demandes as $demande) {
            if ($demande->status === Demander::STATUS_ACTIVE) {
                $actives++;
            } elseif ($demande->status === Demander::STATUS_ARCHIVE) {
                $archivees++;
            }
        }

        $stats = [
            'actives' => $actives,
            'archivees' => $archivees,
            'total' => $actives + $archivees
        ];

        $cache[$cacheKey] = $stats;

        return $stats;
    }

    public function canBeArchived(): bool
    {
        $stats = $this->getDemandesStats();
        return $stats['actives'] > 0;
    }

    public function canBeUnarchived(): bool
    {
        $stats = $this->getDemandesStats();
        return $stats['actives'] === 0 && $stats['archivees'] > 0;
    }

    public function canBeModified(): bool
    {
        if ($this->dossier && $this->dossier->is_closed) {
            return false;
        }

        return !$this->is_archived;
    }

    public function canBeDeleted(): bool
    {
        if ($this->dossier && $this->dossier->is_closed) {
            return false;
        }

        $stats = $this->getDemandesStats();
        return $stats['actives'] === 0 && $stats['archivees'] === 0;
    }

    // ============================================
    // SCOPES
    // ============================================

    public function scopeWithDossier($query)
    {
        return $query->with('dossier');
    }

    public function scopeWithDemandesAndDemandeurs($query)
    {
        return $query->with(['demandes.demandeur']);
    }

    public function scopeActives($query)
    {
        return $query->whereHas('demandes', function ($q) {
            $q->where('status', Demander::STATUS_ACTIVE);
        });
    }

    public function scopeArchivees($query)
    {
        return $query->whereDoesntHave('demandes', function ($q) {
            $q->where('status', Demander::STATUS_ACTIVE);
        })->whereHas('demandes', function ($q) {
            $q->where('status', Demander::STATUS_ARCHIVE);
        });
    }

    public function scopeSansDemandeur($query)
    {
        return $query->doesntHave('demandes');
    }

    public function scopeIncomplets($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('titre')
              ->orWhereNull('contenance')
              ->orWhereNull('proprietaire')
              ->orWhereNull('nature')
              ->orWhereNull('vocation')
              ->orWhereNull('situation');
        });
    }

    // ============================================
    // BOOT
    // ============================================

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($propriete) {

            $propriete->demandes()->delete();
            $propriete->piecesJointes()->delete();
        });
    }

    /**
     *  Vérifier si la propriété peut être liée à un nouveau demandeur
     */
    public function canBeLinked(): bool
    {
        // Dossier fermé
        if ($this->dossier && $this->dossier->is_closed) {
            return false;
        }

        // Propriété archivée (acquise)
        if ($this->is_archived) {
            return false;
        }

        return true;
    }

    /**
     * Obtenir la raison du blocage de liaison
     */
    public function getLinkBlockReason(): string
    {
        if ($this->dossier && $this->dossier->is_closed) {
            return "Impossible de lier : le dossier est fermé.";
        }

        if ($this->is_archived) {
            return "Impossible de lier : la propriété Lot {$this->lot} est archivée (acquise).";
        }

        return "Liaison impossible.";
    }
}