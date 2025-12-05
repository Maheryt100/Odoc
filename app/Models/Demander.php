<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔗 MODÈLE PIVOT : Demander (table pivot demander)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * LOGIQUE MÉTIER CONFIRMÉE :
 * 
 * ✅ STATUS :
 *    - 'active' : Demande en cours d'acquisition
 *    - 'archive' : Propriété ACQUISE par le demandeur
 * 
 * ✅ ORDRE :
 *    - AUTOMATIQUE (1, 2, 3...)
 *    - ordre = 1 : Demandeur principal
 *    - ordre > 1 : Consorts
 *    - Calculé automatiquement à la création
 *    - Réorganisé automatiquement après suppression
 * 
 * ✅ ARCHIVAGE :
 *    - Archiver une propriété = archiver TOUTES ses demandes actives
 *    - Désarchiver = réactiver TOUTES les demandes archivées
 * 
 * ✅ SUPPRESSION :
 *    - Propriété archivée = NON supprimable
 *    - Demandeur avec propriétés (actives OU archivées) = NON supprimable
 */
class Demander extends Model
{
    protected $table = 'demander';
    
    protected $fillable = [
        'id_demandeur',
        'id_propriete',
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
    ];

    protected $appends = [
        'is_principal',
        'is_active',
        'is_archived',
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
    // ACCESSORS
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Vérifier si c'est le demandeur principal
     */
    public function getIsPrincipalAttribute(): bool
    {
        return $this->ordre === 1;
    }

    /**
     * Vérifier si c'est un consort
     */
    public function getIsConsortAttribute(): bool
    {
        return $this->ordre > 1;
    }

    /**
     * Vérifier si la demande est active
     */
    public function getIsActiveAttribute(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Vérifier si la demande est archivée (propriété acquise)
     */
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

    // ════════════════════════════════════════════════════════════════════════
    // MÉTHODES MÉTIER
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Vérifier si peut être dissociée
     * 
     * ✅ RÈGLES CONFIRMÉES :
     * - Une demande ACTIVE peut être dissociée
     * - Une demande ARCHIVÉE ne peut PAS être dissociée
     * - Le dossier ne doit pas être fermé
     */
    public function canBeDissociated(): bool
    {
        // ❌ Ne peut pas dissocier si demande archivée (propriété acquise)
        if ($this->status === self::STATUS_ARCHIVE) {
            return false;
        }

        // ❌ Ne peut pas dissocier si dossier fermé
        if ($this->propriete && $this->propriete->dossier && $this->propriete->dossier->is_closed) {
            return false;
        }

        return true;
    }

    /**
     * Vérifier si peut être modifiée
     */
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

    /**
     * Archiver la demande (marquer propriété comme acquise)
     */
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

    /**
     * Désarchiver la demande (réactiver)
     */
    public function unarchive(): bool
    {
        if (!$this->is_archived) {
            return false;
        }

        // Vérifier que le dossier n'est pas fermé
        if ($this->propriete && $this->propriete->dossier && $this->propriete->dossier->is_closed) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_ACTIVE,
            'motif_archive' => null
        ]);
    }

    /**
     * Obtenir le libellé du statut
     */
    public function getStatusLabel(): string
    {
        return match($this->status) {
            self::STATUS_ACTIVE => 'En cours',
            self::STATUS_ARCHIVE => 'Acquise',
            default => 'Inconnu',
        };
    }

    /**
     * Obtenir le libellé du rôle (principal/consort)
     */
    public function getRoleLabel(): string
    {
        return $this->is_principal ? 'Principal' : "Consort {$this->ordre}";
    }

    /**
     * ✅ NOUVEAU : Promouvoir un consort en principal
     * Utile si le demandeur principal se retire
     */
    public function promoteToMain(): bool
    {
        if ($this->ordre === 1) {
            return false; // Déjà principal
        }

        DB::transaction(function () {
            // Trouver l'actuel principal
            $currentMain = static::where('id_propriete', $this->id_propriete)
                ->where('status', $this->status)
                ->where('ordre', 1)
                ->first();

            if ($currentMain) {
                // Échanger les ordres
                $currentMain->update(['ordre' => $this->ordre]);
            }

            $this->update(['ordre' => 1, 'status_consort' => false]);
        });

        return true;
    }

    /**
     * Obtenir tous les demandeurs actifs de cette propriété (avec ordre)
     */
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
            ];
        })->toArray();
    }

    /**
     * Obtenir le demandeur principal de cette propriété
     */
    public static function getMainDemandeur(int $proprieteId): ?self
    {
        return static::where('id_propriete', $proprieteId)
            ->where('status', self::STATUS_ACTIVE)
            ->where('ordre', 1)
            ->with('demandeur')
            ->first();
    }

    /**
     * Obtenir tous les consorts de cette demande
     */
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

    /**
     * Obtenir le demandeur principal de cette propriété
     */
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

    /**
     * Formater le prix pour affichage
     */
    public function getPrixFormatte(): string
    {
        return number_format($this->total_prix, 0, ',', ' ') . ' Ar';
    }

    /**
     * Obtenir les statistiques de la demande
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
        ];
    }

    // ════════════════════════════════════════════════════════════════════════
    // BOOT METHOD - ORDRE AUTOMATIQUE
    // ════════════════════════════════════════════════════════════════════════

    protected static function boot()
    {
        parent::boot();

        /**
         * ✅ CRÉATION : Calcul automatique de l'ordre
         * RÈGLE : L'ordre est automatique (1, 2, 3...)
         */
        static::creating(function ($demande) {
            if (!$demande->ordre) {
                // ✅ Trouver le prochain ordre disponible
                $maxOrdre = static::where('id_propriete', $demande->id_propriete)
                    ->where('status', self::STATUS_ACTIVE)
                    ->max('ordre') ?? 0;
                
                $demande->ordre = $maxOrdre + 1;
                
                Log::info('✅ Ordre automatique attribué', [
                    'demande_id' => 'creating',
                    'propriete_id' => $demande->id_propriete,
                    'demandeur_id' => $demande->id_demandeur,
                    'ordre' => $demande->ordre,
                ]);
            }

            // ✅ Auto-calculer status_consort basé sur l'ordre
            $demande->status_consort = $demande->ordre > 1;
        });

        /**
         * ✅ SUPPRESSION : Réorganisation automatique des ordres
         * RÈGLE : Après suppression d'une demande, réorganiser les ordres (1, 2, 3...)
         */
        static::deleted(function ($demande) {
            // ✅ Ne réorganiser que si la demande était active
            if ($demande->status !== self::STATUS_ACTIVE) {
                return;
            }

            $remaining = static::where('id_propriete', $demande->id_propriete)
                ->where('status', self::STATUS_ACTIVE)
                ->orderBy('ordre')
                ->get();

            // ✅ Réorganiser seulement s'il reste des demandes
            if ($remaining->count() > 0) {
                foreach ($remaining as $index => $d) {
                    $newOrdre = $index + 1;
                    if ($d->ordre !== $newOrdre) {
                        $d->update([
                            'ordre' => $newOrdre,
                            'status_consort' => $newOrdre > 1
                        ]);
                        
                        Log::info('✅ Ordre réorganisé après suppression', [
                            'demande_id' => $d->id,
                            'ancien_ordre' => $d->ordre,
                            'nouveau_ordre' => $newOrdre,
                        ]);
                    }
                }
            }
        });
        
        /**
         * ✅ LOG : Après création
         */
        static::created(function ($demande) {
            Log::info('✅ Demande créée', [
                'demande_id' => $demande->id,
                'propriete_id' => $demande->id_propriete,
                'demandeur_id' => $demande->id_demandeur,
                'ordre' => $demande->ordre,
                'status' => $demande->status,
                'total_prix' => $demande->total_prix,
            ]);
        });
    }
}