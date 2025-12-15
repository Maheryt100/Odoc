<?php

namespace App\Models;

use App\Collection\DossierCollection;
use App\Traits\HasPiecesJointes;
use App\Traits\HasDistrictScope;
use Illuminate\Database\Eloquent\Attributes\CollectedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[CollectedBy(DossierCollection::class)]
class Dossier extends Model
{
    use HasPiecesJointes, HasDistrictScope;

    protected $fillable = [
        'nom_dossier',
        'numero_ouverture', 
        'date_descente_debut',
        'date_descente_fin',
        'date_ouverture',
        'date_fermeture',
        'closed_by',
        'motif_fermeture',
        'type_commune',
        'commune',
        'fokontany',
        'circonscription',
        'id_district',
        'id_user',
    ];

    protected $appends = [
        'demandeurs_count', 
        'proprietes_count',
        'is_closed',
        'is_open',
        'status_label',
        'can_be_modified',
        'numero_ouverture_display'
    ];

    protected $casts = [
        'date_descente_debut' => 'date',
        'date_descente_fin' => 'date',
        'date_ouverture' => 'date',
        'date_fermeture' => 'date',
        'numero_ouverture' => 'integer',
    ];

    protected $with = ['closedBy'];

    // ============ RELATIONS ============
    
    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class, 'id_district');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function demandeurs()
    {
        return $this->belongsToMany(Demandeur::class, 'contenir', 'id_dossier', 'id_demandeur');
    }

    public function proprietes()
    {
        return $this->hasMany(Propriete::class, 'id_dossier', 'id');
    }

    public function demandes(): HasManyThrough
    {
        return $this->hasManyThrough(
            Demander::class,
            Propriete::class,
            'id_dossier',
            'id_propriete',
            'id',
            'id'
        )->where('demander.status', 'active');
    }

    public function proprietesActives(): HasMany
    {
        return $this->hasMany(Propriete::class, 'id_dossier')
            ->where('is_archived', false);
    }

    public function proprietesArchivees(): HasMany
    {
        return $this->hasMany(Propriete::class, 'id_dossier')
            ->where('is_archived', true);
    }

    // ============ ACCESSORS ============
    
    public function getDemandeursCountAttribute()
    {
        return $this->demandeurs()->count();
    }

    public function getProprietesCountAttribute()
    {
        return $this->proprietes()->count();
    }

    public function getIsClosedAttribute(): bool
    {
        return $this->date_fermeture !== null;
    }

    public function getIsOpenAttribute(): bool
    {
        return $this->date_fermeture === null;
    }

    /**
     * Affichage simple du numéro
     */
    public function getNumeroOuvertureDisplayAttribute(): string
    {
        if (!$this->numero_ouverture) {
            return 'Non assigné';
        }
        return "N° {$this->numero_ouverture}";
    }

    public function getStatusLabelAttribute(): string
    {
        if ($this->is_closed) {
            return 'Fermé';
        }

        $proprietes = $this->proprietes()->count();
        $demandeurs = $this->demandeurs()->count();

        if ($proprietes === 0 && $demandeurs === 0) {
            return 'Vide';
        }

        if ($proprietes > 0 && $demandeurs > 0) {
            return 'En cours';
        }

        return 'Incomplet';
    }

    public function getCanBeModifiedAttribute(): bool
    {
        return $this->is_open;
    }

    // ============ SCOPES ============
    
    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereNull('date_fermeture');
    }

    public function scopeClosed(Builder $query): Builder
    {
        return $query->whereNotNull('date_fermeture');
    }

    public function scopeRecent(Builder $query, int $days = 30): Builder
    {
        return $query->where('date_descente_debut', '>=', now()->subDays($days));
    }

    public function scopeByCommune(Builder $query, string $commune): Builder
    {
        return $query->where('commune', 'ilike', "%{$commune}%");
    }

    public function scopeWithStats(Builder $query): Builder
    {
        return $query->withCount(['demandeurs', 'proprietes', 'demandes']);
    }

    public function scopeRecentlyClosed(Builder $query, int $days = 30): Builder
    {
        return $query->whereNotNull('date_fermeture')
            ->where('date_fermeture', '>=', now()->subDays($days));
    }

    /**
     *  Recherche par numéro d'ouverture (integer)
     */
    public function scopeByNumeroOuverture(Builder $query, int $numero): Builder
    {
        return $query->where('numero_ouverture', $numero);
    }

    // ============ MÉTHODES DE GESTION DE FERMETURE ============
    
    public function close(?int $userId = null, ?string $motif = null): bool
    {
        if ($this->is_closed) {
            return false;
        }

        $this->update([
            'date_fermeture' => now(),
            'closed_by' => $userId,
            'motif_fermeture' => $motif,
        ]);

        if (class_exists(\App\Models\ActivityLog::class) && $userId) {
            \App\Models\ActivityLog::create([
                'id_user' => $userId,
                'action' => 'close',
                'entity_type' => 'dossier',
                'entity_id' => $this->id,
                'id_district' => $this->id_district,
                'metadata' => json_encode([
                    'motif' => $motif,
                    'date_fermeture' => $this->date_fermeture,
                    'numero_ouverture' => $this->numero_ouverture,
                ]),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }

        return true;
    }

    public function reopen(?int $userId = null): bool
    {
        if ($this->is_open) {
            return false;
        }

        $this->update([
            'date_fermeture' => null,
            'closed_by' => null,
            'motif_fermeture' => null,
        ]);

        if (class_exists(\App\Models\ActivityLog::class) && $userId) {
            \App\Models\ActivityLog::create([
                'id_user' => $userId,
                'action' => 'reopen',
                'entity_type' => 'dossier',
                'entity_id' => $this->id,
                'id_district' => $this->id_district,
                'metadata' => json_encode([
                    'reopened_at' => now(),
                    'numero_ouverture' => $this->numero_ouverture,
                ]),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }

        return true;
    }

    public function canBeModifiedBy(User $user): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdminDistrict() && $user->id_district === $this->id_district) {
            return true;
        }

        return $this->is_open && $user->canAccessDossier($this);
    }

    public function canBeClosedBy(User $user): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdminDistrict() && $user->id_district === $this->id_district) {
            return true;
        }

        return false;
    }

    // ============ MÉTHODES HELPER ============
    
    public function isComplete(): bool
    {
        return $this->proprietes()->exists() && $this->demandeurs()->exists();
    }

    public function getStatusAttribute(): string
    {
        if ($this->is_closed) {
            return 'ferme';
        }

        $proprietes = $this->proprietes()->count();
        $demandeurs = $this->demandeurs()->count();

        if ($proprietes === 0 && $demandeurs === 0) {
            return 'vide';
        }

        if ($proprietes > 0 && $demandeurs > 0) {
            return 'complet';
        }

        return 'en_cours';
    }

    public function getFullLocationAttribute(): string
    {
        return "{$this->commune}, {$this->fokontany} - District {$this->district->nom_district}";
    }

    public function getDaysSinceOpeningAttribute(): int
    {
        if (!$this->date_ouverture) {
            return 0;
        }

        $dateOuverture = $this->date_ouverture instanceof Carbon 
            ? $this->date_ouverture 
            : Carbon::parse($this->date_ouverture);

        return $dateOuverture->diffInDays(now());
    }

    public function getDaysSinceClosureAttribute(): ?int
    {
        if (!$this->date_fermeture) {
            return null;
        }

        $dateFermeture = $this->date_fermeture instanceof Carbon 
            ? $this->date_fermeture 
            : Carbon::parse($this->date_fermeture);

        return $dateFermeture->diffInDays(now());
    }

    public function getStats(): array
    {
        return [
            'total_demandeurs' => $this->demandeurs()->count(),
            'total_proprietes' => $this->proprietes()->count(),
            'proprietes_archivees' => $this->proprietes()->where('is_archived', true)->count(),
            'demandes_actives' => $this->demandes()->where('status', 'active')->count(),
            'is_closed' => $this->is_closed,
            'days_since_opening' => $this->days_since_opening,
            'days_since_closure' => $this->days_since_closure,
            'numero_ouverture' => $this->numero_ouverture,
        ];
    }

    /**
     *  Génération automatique du prochain numéro global
     * Retourne simplement le prochain numéro incrémental
     */
    public static function getNextNumeroOuverture(): int
    {
        // Désactiver temporairement tous les scopes pour obtenir le vrai maximum global
        $maxNumero = static::withoutGlobalScopes()->max('numero_ouverture');
        return ($maxNumero ?? 0) + 1;
    }

    public static function getLastNumeroOuverture(): ?int
    {
        return static::withoutGlobalScopes()->max('numero_ouverture');
    }

    /**
     * MODIFIÉ : Vérifier si un numéro existe déjà
     */
    public static function numeroOuvertureExists(int $numero, ?int $excludeId = null): bool
    {
        $query = static::withoutGlobalScopes()->where('numero_ouverture', $numero);
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        return $query->exists();
    }

    // ============ BOOT METHOD ============
    
    protected static function boot()
    {
        parent::boot();

        /**
         *MODIFIÉ : Ne plus générer automatiquement le numéro
         * L'utilisateur doit le saisir manuellement (pré-rempli dans le formulaire)
         */
        static::creating(function ($dossier) {
            // Définir la date d'ouverture par défaut
            if (empty($dossier->date_ouverture)) {
                $dossier->date_ouverture = $dossier->date_descente_debut ?? now();
            }
            
            //Le numéro doit être fourni par l'utilisateur via le formulaire
            // On ne le génère plus automatiquement ici
        });
    }
}