<?php

namespace App\Models;

use App\Traits\HasPiecesJointes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'date_depot_1',
        'date_depot_2',           
        'date_approbation_acte',  
        
        // Dep/Vol
        'dep_vol_inscription',
        'numero_dep_vol_inscription',
        'dep_vol_requisition',
        'numero_dep_vol_requisition',
        
        'id_dossier',
        'id_user',
    ];

    protected $casts = [
        'contenance' => 'decimal:2',
        'date_requisition' => 'date',
        'date_depot_1' => 'date',
        'date_depot_2' => 'date',
        'date_approbation_acte' => 'date',
    ];

    protected $appends = [
        'dep_vol_inscription_complet',
        'dep_vol_requisition_complet',
        'titre_complet',
        'is_incomplete',
        'is_archived',
        'is_empty',
        'has_active_demandes',
        'status_label',
        'can_generate_document',
    ];

    // ============================================
    // RELATIONS (inchangées)
    // ============================================

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(Dossier::class, 'id_dossier');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function demandeurs(): BelongsToMany
    {
        return $this->belongsToMany(Demandeur::class, 'demander', 'id_propriete', 'id_demandeur')
            ->withPivot(['id', 'total_prix', 'status', 'status_consort', 'ordre', 'motif_archive', 'id_user', 'created_at', 'updated_at'])
            ->withTimestamps()
            ->orderBy('demander.ordre', 'asc');
    }

    public function demandes(): HasMany
    {
        return $this->hasMany(Demander::class, 'id_propriete')
            ->orderBy('ordre', 'asc');
    }

    public function demandesActives(): HasMany
    {
        return $this->hasMany(Demander::class, 'id_propriete')
            ->where('status', Demander::STATUS_ACTIVE)
            ->orderBy('ordre');
    }

    public function demandesArchivees(): HasMany
    {
        return $this->hasMany(Demander::class, 'id_propriete')
            ->where('status', Demander::STATUS_ARCHIVE)
            ->orderBy('ordre');
    }

    // ============================================
    // ACCESSORS - DEP/VOL (inchangés)
    // ============================================

    public function getDepVolInscriptionCompletAttribute(): ?string
    {
        if (!$this->dep_vol_inscription) {
            return null;
        }

        $depVol = trim($this->dep_vol_inscription);
        
        if ($this->numero_dep_vol_inscription) {
            $numero = trim($this->numero_dep_vol_inscription);
            return "{$depVol} n°{$numero}";
        }

        return $depVol;
    }

    public function getDepVolRequisitionCompletAttribute(): ?string
    {
        if (!$this->dep_vol_requisition) {
            return null;
        }

        $depVol = trim($this->dep_vol_requisition);
        
        if ($this->numero_dep_vol_requisition) {
            $numero = trim($this->numero_dep_vol_requisition);
            return "{$depVol} n°{$numero}";
        }

        return $depVol;
    }

    // ============================================
    // ✅ NOUVEAUX ACCESSORS
    // ============================================

    /**
     * Vérifier si la propriété peut générer un document
     * RÈGLE : date_approbation_acte est OBLIGATOIRE
     */
    public function getCanGenerateDocumentAttribute(): bool
    {
        return $this->date_approbation_acte !== null;
    }

    /**
     * Message d'erreur si génération impossible
     */
    public function getDocumentBlockReasonAttribute(): ?string
    {
        if (!$this->date_approbation_acte) {
            return "La date d'approbation de l'acte est obligatoire pour générer le document.";
        }

        if ($this->is_archived) {
            return "Impossible de générer : propriété déjà acquise.";
        }

        if (!$this->has_active_demandes) {
            return "Aucun demandeur actif pour cette propriété.";
        }

        return null;
    }

    // ============================================
    // AUTRES ACCESSORS (inchangés)
    // ============================================

    public function getTitreCompletAttribute(): ?string
    {
        return $this->titre ? "TNº{$this->titre}" : null;
    }

    public function getIsIncompleteAttribute(): bool
    {
        return !$this->titre 
            || !$this->contenance 
            || !$this->proprietaire 
            || !$this->nature 
            || !$this->vocation 
            || !$this->situation;
    }

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
    // MÉTHODES HELPER (inchangées)
    // ============================================

    public function getDemandesStats(): array
    {
        static $cache = [];
        
        $cacheKey = "propriete_{$this->id}_stats";
        
        if (isset($cache[$cacheKey])) {
            return $cache[$cacheKey];
        }

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

    public function canBeLinked(): bool
    {
        if ($this->dossier && $this->dossier->is_closed) {
            return false;
        }

        if ($this->is_archived) {
            return false;
        }

        return true;
    }

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

    // ============================================
    // SCOPES (inchangés)
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
}