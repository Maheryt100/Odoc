<?php

namespace App\Models;

use App\Traits\HasPiecesJointes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Collection;

class Propriete extends Model
{
    use HasPiecesJointes;
    
    protected $fillable = [
        'lot',
        'propriete_mere',
        'titre_mere',
        'titre',
        'proprietaire',
        'contenance',
        'charge',
        'situation',
        'nature',
        'type_operation',
        'vocation',
        'numero_FN',
        'numero_requisition',
        'date_requisition',
        'date_inscription',
        'dep_vol',
        'numero_dep_vol',
        'id_dossier',
        'id_user',
    ];

    protected $casts = [
        'date_requisition' => 'date',
        'date_inscription' => 'date',
        'contenance' => 'integer',
    ];

    protected $appends = [
        // 'nom_complet',
        'is_incomplete',
        'is_archived',
        'is_empty',
        'has_active_demandes',
        'status_label',
    ];

    private $_status_cache = null;

    
    // ============ RELATIONS ============
    
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
        return $this->belongsToMany(
            Demandeur::class,
            'demander',
            'id_propriete',
            'id_demandeur'
        )->withPivot(['id', 'status', 'status_consort', 'ordre', 'total_prix', 'motif_archive'])
          ->withTimestamps();
    }

    public function demandes(): HasMany
    {
        return $this->hasMany(Demander::class, 'id_propriete');
    }

    // ✅ AJOUTER cette méthode helper si besoin d'accéder aux demandeurs
    public function getDemandeurs(): Collection
    {
        return $this->demandes()
            ->with('demandeur')
            ->get()
            ->pluck('demandeur')
            ->filter();
    }

    public function demandesActives(): HasMany
    {
        return $this->demandes()->where('status', Demander::STATUS_ACTIVE);
    }

    public function demandesArchivees(): HasMany
    {
        return $this->demandes()->where('status', Demander::STATUS_ARCHIVE);
    }

    public function recuPaiements(): HasMany
    {
        return $this->hasMany(RecuPaiement::class, 'id_propriete');
    }

    // ============ ACCESSORS ============


    /**
     * Format complet du dep/vol avec numéro
     */
    public function getDepVolCompletAttribute(): string
    {
        if (!$this->dep_vol) {
            return '-';
        }

        if ($this->numero_dep_vol) {
            return "{$this->dep_vol} n°{$this->numero_dep_vol}";
        }

        return $this->dep_vol;
    }

    // ✅ Accessors qui retournent toujours une valeur
    public function getTitreAttribute($value)
    {
        return $value; // Laravel retourne null comme undefined en JSON
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
     * Obtenir le prix selon la vocation et le district
     */
    public function getPrixUnitaire(): int
    {
        if (!$this->dossier || !$this->dossier->district) {
            return 0;
        }

        $district = $this->dossier->district;
        
        return match(strtolower($this->vocation)) {
            'edilitaire' => $district->edilitaire ?? 0,
            'agricole' => $district->agricole ?? 0,
            'forestiere', 'forestière' => $district->forestiere ?? 0,
            'touristique' => $district->touristique ?? 0,
            default => 0,
        };
    }

    /**
     * Calculer le prix total
     */
    public function getPrixTotal(): int
    {
        if (!$this->contenance) {
            return 0;
        }

        return $this->getPrixUnitaire() * $this->contenance;
    }

    /**
     * Formater le titre complet
     */
    public function getTitreCompletAttribute(): string
    {
        if (!$this->titre) {
            return 'Non attribué';
        }
        return "TNº{$this->titre}";
    }

    // ============ MÉTHODES MÉTIER ============

    /**
     * ✅ Vérifier si peut être supprimée
     * RÈGLE : Une propriété ne peut être supprimée que si elle n'a AUCUNE demande
     */
    public function canBeDeleted(): bool
    {
        return $this->getStatusInfo()['can_be_deleted'];
    }

   

    public function getStatusInfo(): array
    {

        return Cache::remember(
        "propriete.{$this->id}.status_info",
        60, // 1 minute
        function () {
             // ✅ Cache d'instance pour éviter les requêtes répétées
            if (isset($this->_status_cache)) {
                return $this->_status_cache;
            }
            
            $hasActives = $this->demandesActives()->exists();
            $hasArchivees = $this->demandesArchivees()->exists();
            $isArchived = !$hasActives && $hasArchivees;
            $isDossierClosed = $this->dossier && $this->dossier->is_closed;
            
            $this->_status_cache = [
                'has_actives' => $hasActives,
                'has_archivees' => $hasArchivees,
                'is_archived' => $isArchived,
                'is_dossier_closed' => $isDossierClosed,
                'can_be_modified' => !$isArchived && !$isDossierClosed,
                'can_be_deleted' => !$hasActives && !$hasArchivees && !$isDossierClosed,
                'can_be_archived' => $hasActives && !$isArchived,
                'can_be_unarchived' => $isArchived && !$isDossierClosed,
            ];
            
            return $this->_status_cache;
        }
    );
       
    }

    /**
     * ✅ CORRECTION CRITIQUE : Accessor is_archived
     * 
     * LOGIQUE CORRECTE :
     * - ACQUISE = Au moins 1 demande archivée ET AUCUNE demande active
     * - VIDE = Aucune demande du tout
     * - ACTIVE = Au moins 1 demande active (peu importe les archivées)
     */
    public function getIsArchivedAttribute(): bool
    {
        // Si aucune demande, pas archivée (juste vide)
        if (!$this->demandes()->exists()) {
            return false;
        }
        
        $hasActiveDemandes = $this->demandes()
            ->where('status', Demander::STATUS_ACTIVE)
            ->exists();
        
        $hasArchivedDemandes = $this->demandes()
            ->where('status', Demander::STATUS_ARCHIVE)
            ->exists();
        
        // ✅ CRITÈRE : AUCUNE active ET au moins UNE archivée
        return !$hasActiveDemandes && $hasArchivedDemandes;
    }

    /**
     * ✅ NOUVEAU : Vérifier si propriété est vide
     */
    public function getIsEmptyAttribute(): bool
    {
        return !$this->demandes()->exists();
    }

    /**
     * ✅ NOUVEAU : Vérifier si propriété a des demandes actives
     */
    public function getHasActiveDemandesAttribute(): bool
    {
        return $this->demandes()
            ->where('status', Demander::STATUS_ACTIVE)
            ->exists();
    }

    public function getStatusLabelAttribute(): string
    {
        if ($this->is_empty) {
            return 'Vide';
        }
        
        if ($this->is_archived) {
            return 'Acquise';
        }
        
        if ($this->has_active_demandes) {
            return 'Active';
        }
        
        return 'Inconnu';
    }

    

    public function canBeModified(): bool {
        return $this->getStatusInfo()['can_be_modified'];
    }

    /**
     * Obtenir le nombre de demandeurs actifs
     */
    public function getActiveDemandeursCount(): int
    {
        return $this->demandesActives()->count();
    }

    /**
     * ✅ Obtenir le demandeur principal (ordre = 1)
     */
    public function getMainDemandeur(): ?Demandeur
    {
        $demande = $this->demandesActives()
            ->where('ordre', 1)
            ->with('demandeur')
            ->first();

        return $demande?->demandeur;
    }

    /**
     * ✅ Obtenir tous les demandeurs actifs avec ordre
     */
    public function getActiveDemandeursWithOrder(): array
    {
        return $this->demandesActives()
            ->orderBy('ordre')
            ->with('demandeur')
            ->get()
            ->map(function ($demande) {
                return [
                    'demande_id' => $demande->id,
                    'demandeur' => $demande->demandeur,
                    'ordre' => $demande->ordre,
                    'is_principal' => $demande->ordre === 1,
                    'is_consort' => $demande->ordre > 1,
                    'total_prix' => $demande->total_prix,
                ];
            })
            ->toArray();
    }

    /**
     * ✅ Obtenir les statistiques complètes
     */

    // ============ SCOPES ============
    
    /**
     * ✅ Propriétés avec au moins une demande active
     */
    public function scopeWithActiveDemandes(Builder $query): Builder
    {
        return $query->whereHas('demandesActives');
    }

    /**
     * ✅ Propriétés sans aucune demande active (vides OU archivées)
     */
    public function scopeWithoutActiveDemandes(Builder $query): Builder
    {
        return $query->whereDoesntHave('demandesActives');
    }

    /**
     * ✅ Propriétés archivées (toutes demandes archivées)
     */
    public function scopeArchived(Builder $query): Builder
    {
        return $query->whereHas('demandesArchivees')
            ->whereDoesntHave('demandesActives');
    }

    /**
     * ✅ Propriétés sans aucune demande (jamais liées)
     */
    public function scopeEmpty(Builder $query): Builder
    {
        return $query->whereDoesntHave('demandes');
    }

    public function scopeByDossier(Builder $query, int $dossierId): Builder
    {
        return $query->where('id_dossier', $dossierId);
    }

    public function scopeByVocation(Builder $query, string $vocation): Builder
    {
        return $query->where('vocation', 'ilike', "%{$vocation}%");
    }

    public function scopeByNature(Builder $query, string $nature): Builder
    {
        return $query->where('nature', 'ilike', "%{$nature}%");
    }

    public function scopeIncomplete(Builder $query): Builder
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

    public function scopeByLot(Builder $query, string $lot): Builder
    {
        return $query->where('lot', 'like', "%{$lot}%");
    }

    // ============ BOOT METHOD ============
    
    /**
     * ✅ Vérifier si peut être archivée
     */
    public function canBeArchived(): bool
    {
        return $this->getStatusInfo()['can_be_archived'];
    }

    /**
     * ✅ Vérifier si peut être désarchivée
     */
    public function canBeUnarchived(): bool
    {
        return $this->getStatusInfo()['can_be_unarchived'];
    }

    /**
     * ✅ Vérifier si peut être liée à un demandeur
     */
    public function canBeLinked(): bool
    {
        $status = $this->getStatusInfo();
        return !$status['is_dossier_closed'] && !$status['is_archived'];
    }

    /**
     * ✅ Obtenir la raison du blocage de liaison
     */
    public function getLinkBlockReason(): string
    {
        $status = $this->getStatusInfo();
        
        if ($status['is_dossier_closed']) {
            return "❌ Impossible de lier : le dossier est fermé.";
        }
        
        if ($status['is_archived']) {
            return "❌ Impossible de lier : la propriété Lot {$this->lot} est archivée (acquise).";
        }
        
        return '';
    }

    /**
     * ✅ MISE À JOUR : Utiliser le cache de getStatusInfo()
     */
    public function getDemandesStats(): array
    {
        $status = $this->getStatusInfo();
        
        return [
            'actives' => $status['has_actives'] ? $this->demandesActives()->count() : 0,
            'archivees' => $status['has_archivees'] ? $this->demandesArchivees()->count() : 0,
            'total' => $this->demandes()->count(),
            'is_archived' => $status['is_archived'],
            'is_empty' => !$status['has_actives'] && !$status['has_archivees'],
        ];
    }

    /**
     * ✅ Obtenir les statistiques complètes
     */
    public function getStats(): array
{
    return Cache::remember(
        "propriete.{$this->id}.stats",
        config('cache.statistics.ttl'),
        function () {
            // 1. Récupérer ou calculer le statut AVANT de l'utiliser
            $status = $this->getStatus(); // adapte au nom de ta méthode réelle

            return [
                'demandes'            => $this->getDemandesStats(),
                'is_archived'         => $this->is_archived,
                'has_active_demandes' => $status['has_actives'] ?? false,
                'prix_unitaire'       => $this->getPrixUnitaire(),
                'prix_total'          => $this->getPrixTotal(),
                'is_complete'         => !$this->is_incomplete,
                'demandeur_principal' => $this->getMainDemandeur()?->nom_complet,
                'can_be_deleted'      => $status['can_be_deleted'] ?? false,
                'can_be_modified'     => $status['can_be_modified'] ?? false,
                'can_be_archived'     => $status['can_be_archived'] ?? false,
                'can_be_unarchived'   => $status['can_be_unarchived'] ?? false,
            ];
        }
    );
}
    // Invalider le cache lors des modifications
    protected static function boot()
    {
        parent::boot();
        
        static::updated(function ($propriete) {
            Cache::forget("propriete.{$propriete->id}.stats");
        });
    }
}