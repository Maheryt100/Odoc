<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class Demander extends Model
{
    protected $table = 'demander';
    
    protected $fillable = [
        'id_demandeur',
        'id_propriete',
        'date_demande',
        'total_prix',
        'status',
        'status_consort',
        'ordre',
        'motif_archive',
        'id_user',
    ];

    protected $casts = [
        'total_prix' => 'integer',
        'status_consort' => 'boolean',
        'ordre' => 'integer',
        'date_demande' => 'date',
    ];

    protected $appends = [
        'is_principal',
        'is_active',
        'is_archived',
        'date_demande_formatted',
    ];

    // ════════════════════════════════════════════════════════════════════════
    // CONSTANTES
    // ════════════════════════════════════════════════════════════════════════
    
    const STATUS_ACTIVE = 'active';
    const STATUS_ARCHIVE = 'archive';

    // ════════════════════════════════════════════════════════════════════════
    // RELATIONS
    // ════════════════════════════════════════════════════════════════════════
    
    public function demandeur(): BelongsTo
    {
        return $this->belongsTo(Demandeur::class, 'id_demandeur');
    }
    
    public function propriete(): BelongsTo
    {
        return $this->belongsTo(Propriete::class, 'id_propriete');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function consorts(): BelongsToMany
    {
        return $this->belongsToMany(
            Consort::class,
            'demande_consorts',
            'id_demande',
            'id_consort'
        )->withTimestamps();
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACCESSORS POUR DATE_DEMANDE
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Date de demande formatée pour affichage (ex: "15 janvier 2025")
     */
    public function getDateDemandeFormattedAttribute(): ?string
    {
        if (!$this->date_demande) {
            return null;
        }

        return Carbon::parse($this->date_demande)->translatedFormat('d F Y');
    }

    /**
     * Date de demande au format court (ex: "15/01/2025")
     */
    public function getDateDemandeShortAttribute(): ?string
    {
        if (!$this->date_demande) {
            return null;
        }

        return Carbon::parse($this->date_demande)->format('d/m/Y');
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACCESSORS EXISTANTS
    // ════════════════════════════════════════════════════════════════════════

    public function getIsPrincipalAttribute(): bool
    {
        return $this->ordre === 1;
    }

    public function getIsConsortAttribute(): bool
    {
        return $this->ordre > 1;
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function getIsArchivedAttribute(): bool
    {
        return $this->status === self::STATUS_ARCHIVE;
    }

    // ════════════════════════════════════════════════════════════════════════
    // SCOPES
    // ════════════════════════════════════════════════════════════════════════
    
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeArchived($query)
    {
        return $query->where('status', self::STATUS_ARCHIVE);
    }

    public function scopePrincipal($query)
    {
        return $query->where('ordre', 1);
    }

    public function scopeConsorts($query)
    {
        return $query->where('ordre', '>', 1);
    }

    public function scopeForPropriete($query, int $proprieteId)
    {
        return $query->where('id_propriete', $proprieteId)
            ->orderBy('ordre', 'asc');
    }

    public function scopeByDemandeur($query, int $demandeurId)
    {
        return $query->where('id_demandeur', $demandeurId);
    }

    /**
     * Filtrer par période de demande
     */
    public function scopeByDateDemandePeriod($query, ?string $dateDebut = null, ?string $dateFin = null)
    {
        if ($dateDebut) {
            $query->where('date_demande', '>=', $dateDebut);
        }

        if ($dateFin) {
            $query->where('date_demande', '<=', $dateFin);
        }

        return $query;
    }

    /**
     * Demandes du mois en cours
     */
    public function scopeCurrentMonth($query)
    {
        return $query->whereMonth('date_demande', Carbon::now()->month)
                     ->whereYear('date_demande', Carbon::now()->year);
    }

    /**
     * Demandes de l'année en cours
     */
    public function scopeCurrentYear($query)
    {
        return $query->whereYear('date_demande', Carbon::now()->year);
    }

    // ════════════════════════════════════════════════════════════════════════
    // MÉTHODES MÉTIER (inchangées)
    // ════════════════════════════════════════════════════════════════════════
    
    public function canBeDissociated(): bool
    {
        if ($this->status === self::STATUS_ARCHIVE) {
            return false;
        }

        if ($this->propriete && $this->propriete->dossier && $this->propriete->dossier->is_closed) {
            return false;
        }

        return true;
    }

    public function canBeModified(): bool
    {
        if ($this->status === self::STATUS_ARCHIVE) {
            return false;
        }

        if ($this->propriete && $this->propriete->dossier && $this->propriete->dossier->is_closed) {
            return false;
        }

        return true;
    }

    public function archive(string $motif = null): bool
    {
        if ($this->is_archived) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_ARCHIVE,
            'motif_archive' => $motif
        ]);
    }

    public function unarchive(): bool
    {
        if (!$this->is_archived) {
            return false;
        }

        if ($this->propriete && $this->propriete->dossier && $this->propriete->dossier->is_closed) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_ACTIVE,
            'motif_archive' => null
        ]);
    }

    public function getStatusLabel(): string
    {
        return match($this->status) {
            self::STATUS_ACTIVE => 'En cours',
            self::STATUS_ARCHIVE => 'Acquise',
            default => 'Inconnu',
        };
    }

    public function getRoleLabel(): string
    {
        return $this->is_principal ? 'Principal' : "Consort {$this->ordre}";
    }

    public function promoteToMain(): bool
    {
        if ($this->ordre === 1) {
            return false;
        }

        DB::transaction(function () {
            $currentMain = static::where('id_propriete', $this->id_propriete)
                ->where('status', $this->status)
                ->where('ordre', 1)
                ->first();

            if ($currentMain) {
                $currentMain->update(['ordre' => $this->ordre]);
            }

            $this->update(['ordre' => 1, 'status_consort' => false]);
        });

        return true;
    }

    public function getAllDemandeurs(): array
    {
        $demandes = static::where('id_propriete', $this->id_propriete)
            ->where('status', self::STATUS_ACTIVE)
            ->orderBy('ordre')
            ->with('demandeur')
            ->get();

        return $demandes->map(function ($demande) {
            return [
                'demande_id' => $demande->id,
                'demandeur' => $demande->demandeur,
                'ordre' => $demande->ordre,
                'is_principal' => $demande->is_principal,
                'is_consort' => $demande->is_consort,
                'total_prix' => $demande->total_prix,
                'date_demande' => $demande->date_demande,
                'date_demande_formatted' => $demande->date_demande_formatted,
            ];
        })->toArray();
    }

    public static function getMainDemandeur(int $proprieteId): ?self
    {
        return static::where('id_propriete', $proprieteId)
            ->where('status', self::STATUS_ACTIVE)
            ->where('ordre', 1)
            ->with('demandeur')
            ->first();
    }

    public function getConsorts()
    {
        if (!$this->is_principal) {
            return collect([]);
        }

        return static::where('id_propriete', $this->id_propriete)
            ->where('status', $this->status)
            ->where('ordre', '>', 1)
            ->orderBy('ordre')
            ->with('demandeur')
            ->get();
    }

    public function getPrincipal()
    {
        if ($this->is_principal) {
            return $this;
        }

        return static::where('id_propriete', $this->id_propriete)
            ->where('status', $this->status)
            ->where('ordre', 1)
            ->with('demandeur')
            ->first();
    }

    public function getPrixFormatte(): string
    {
        return number_format($this->total_prix, 0, ',', ' ') . ' Ar';
    }

    /**
     * Inclure date_demande dans les stats
     */
    public function getStats(): array
    {
        return [
            'status' => $this->status,
            'status_label' => $this->getStatusLabel(),
            'is_active' => $this->is_active,
            'is_archived' => $this->is_archived,
            'ordre' => $this->ordre,
            'role_label' => $this->getRoleLabel(),
            'is_principal' => $this->is_principal,
            'is_consort' => $this->is_consort,
            'total_prix' => $this->total_prix,
            'prix_formatte' => $this->getPrixFormatte(),
            'can_be_dissociated' => $this->canBeDissociated(),
            'can_be_modified' => $this->canBeModified(),
            'motif_archive' => $this->motif_archive,
            'date_demande' => $this->date_demande,
            'date_demande_formatted' => $this->date_demande_formatted,
            'date_demande_short' => $this->date_demande_short,
        ];
    }

    // ════════════════════════════════════════════════════════════════════════
    // BOOT METHOD - ORDRE AUTOMATIQUE
    // ════════════════════════════════════════════════════════════════════════

    protected static function boot()
    {
        parent::boot();

        /**
         * CRÉATION : Calcul automatique de l'ordre + date_demande par défaut
         */
        static::creating(function ($demande) {
            // Ordre automatique
            if (!$demande->ordre) {
                $maxOrdre = static::where('id_propriete', $demande->id_propriete)
                    ->where('status', self::STATUS_ACTIVE)
                    ->max('ordre') ?? 0;
                
                $demande->ordre = $maxOrdre + 1;
            }

            // Auto-calculer status_consort
            $demande->status_consort = $demande->ordre > 1;

            // Date de demande par défaut = aujourd'hui
            if (!$demande->date_demande) {
                $demande->date_demande = Carbon::today();
            }
        });

        // Invalider cache après mise à jour
        static::updated(function ($demande) {
            Cache::forget("propriete.{$demande->id_propriete}.status_info");
        });

        /**
         * SUPPRESSION : Réorganisation automatique des ordres
         */
        static::deleted(function ($demande) {
            if ($demande->status !== self::STATUS_ACTIVE) {
                return;
            }

            $remaining = static::where('id_propriete', $demande->id_propriete)
                ->where('status', self::STATUS_ACTIVE)
                ->orderBy('ordre')
                ->get();

            if ($remaining->count() > 0) {
                foreach ($remaining as $index => $d) {
                    $newOrdre = $index + 1;
                    if ($d->ordre !== $newOrdre) {
                        $d->update([
                            'ordre' => $newOrdre,
                            'status_consort' => $newOrdre > 1
                        ]);
                    }
                }
            }
        });
    }
}