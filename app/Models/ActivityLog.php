<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class ActivityLog extends Model
{
    protected $fillable = [
        'id_user',
        'action',
        'entity_type',
        'entity_id',
        'document_type',
        'id_district',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ============ RELATIONS ============
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class, 'id_district');
    }

    // ============ SCOPES ============
    
    public function scopeDocuments($query)
    {
        return $query->where('entity_type', self::ENTITY_DOCUMENT);
    }

    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('id_user', $userId);
    }

    public function scopeByDistrict($query, int $districtId)
    {
        return $query->where('id_district', $districtId);
    }

    public function scopeInDateRange($query, $dateFrom, $dateTo)
    {
        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }
        return $query;
    }

    /**
     *  Scope pour les activités récentes
     */
    public function scopeRecent($query, int $hours = 24)
    {
        return $query->where('created_at', '>=', now()->subHours($hours));
    }

    /**
     *Scope pour les dossiers (toutes actions)
     */
    public function scopeDossiers($query)
    {
        return $query->where('entity_type', self::ENTITY_DOSSIER);
    }

    /**
     * Scope pour les fermetures de dossiers
     */
    public function scopeClosedDossiers($query)
    {
        return $query->where('entity_type', self::ENTITY_DOSSIER)
                     ->where('action', self::ACTION_CLOSE);
    }

    /**
     * Scope pour les réouvertures de dossiers
     */
    public function scopeReopenedDossiers($query)
    {
        return $query->where('entity_type', self::ENTITY_DOSSIER)
                     ->where('action', self::ACTION_REOPEN);
    }

    // ============ CONSTANTES ============
    
    // Actions
    const ACTION_LOGIN = 'login';
    const ACTION_LOGOUT = 'logout';
    const ACTION_GENERATE = 'generate';
    const ACTION_DOWNLOAD = 'download';
    const ACTION_CREATE = 'create';
    const ACTION_UPDATE = 'update';
    const ACTION_DELETE = 'delete';
    const ACTION_ARCHIVE = 'archive';
    const ACTION_UNARCHIVE = 'unarchive';
    const ACTION_EXPORT = 'export';
    const ACTION_VIEW = 'view'; 
    const ACTION_CLOSE = 'close';
    const ACTION_REOPEN = 'reopen';
    const ACTION_UPLOAD = 'upload';
    const ACTION_VERIFY = 'verify'; 
    
    // Types d'entités
    const ENTITY_DOCUMENT = 'document';
    const ENTITY_DOSSIER = 'dossier';
    const ENTITY_PROPRIETE = 'propriete';
    const ENTITY_DEMANDEUR = 'demandeur';
    const ENTITY_USER = 'user';
    const ENTITY_AUTH = 'auth';
    const ENTITY_DISTRICT = 'district';
    const ENTITY_PIECE_JOINTE = 'piece_jointe'; 
    
    // Types de documents
    const DOC_RECU = 'recu';
    const DOC_ACTE_VENTE = 'acte_vente';
    const DOC_CSF = 'csf';
    const DOC_REQUISITION = 'requisition';

    // ============ HELPERS ============
    
    /**
     * Logger une activité
     */
    public static function logActivity(
        string $action,
        string $entityType,
        ?int $entityId = null,
        array $metadata = []
    ): self {
        $user = Auth::user();
        
        if (!$user) {
            throw new \Exception('Utilisateur non authentifié pour logger l\'activité');
        }
        
        return self::create([
            'id_user' => $user->id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'document_type' => $metadata['document_type'] ?? null,
            'id_district' => $metadata['id_district'] ?? $user->id_district,
            'metadata' => $metadata,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     *Logger un upload de pièce jointe
     */
    public static function logPieceJointeUpload(
        int $pieceJointeId,
        string $nomFichier,
        int $taille,
        string $attachableType,
        int $attachableId,
        int $districtId,
        ?string $typeDocument = null
    ): self {
        return self::logActivity(
            self::ACTION_UPLOAD,
            self::ENTITY_PIECE_JOINTE,
            $pieceJointeId,
            [
                'nom_fichier' => $nomFichier,
                'taille' => $taille,
                'type_document' => $typeDocument,
                'attachable_type' => $attachableType,
                'attachable_id' => $attachableId,
                'id_district' => $districtId,
            ]
        );
    }

    /**
     *  Logger une vérification de document
     */
    public static function logPieceJointeVerification(
        int $pieceJointeId,
        string $nomFichier,
        int $districtId
    ): self {
        return self::logActivity(
            self::ACTION_VERIFY,
            self::ENTITY_PIECE_JOINTE,
            $pieceJointeId,
            [
                'nom_fichier' => $nomFichier,
                'id_district' => $districtId,
            ]
        );
    }


    /**
     * Logger une fermeture de dossier
     */
    public static function logDossierClosure(
        int $dossierId,
        int $districtId,
        ?string $motif = null,
        ?string $dateFermeture = null
    ): self {
        return self::logActivity(
            self::ACTION_CLOSE,
            self::ENTITY_DOSSIER,
            $dossierId,
            [
                'id_district' => $districtId,
                'motif_fermeture' => $motif,
                'date_fermeture' => $dateFermeture,
                'timestamp' => now()->toDateTimeString(),
            ]
        );
    }

    /**
     * Logger une réouverture de dossier
     */
    public static function logDossierReopen(
        int $dossierId,
        int $districtId,
        ?string $reason = null
    ): self {
        return self::logActivity(
            self::ACTION_REOPEN,
            self::ENTITY_DOSSIER,
            $dossierId,
            [
                'id_district' => $districtId,
                'reopen_reason' => $reason,
                'timestamp' => now()->toDateTimeString(),
            ]
        );
    }

    /**
     * Logger une génération de document
     */
    public static function logDocumentGeneration(
        string $documentType,
        int $entityId,
        int $districtId,
        array $additionalMetadata = []
    ): self {
        return self::logActivity(
            self::ACTION_GENERATE,
            self::ENTITY_DOCUMENT,
            $entityId,
            array_merge([
                'document_type' => $documentType,
                'id_district' => $districtId,
                'generated_at' => now()->toDateTimeString(),
            ], $additionalMetadata)
        );
    }

    /**
     * Logger un téléchargement de document
     */
    public static function logDocumentDownload(
        string $documentType,
        int $entityId,
        int $districtId,
        array $additionalMetadata = []
    ): self {
        return self::logActivity(
            self::ACTION_DOWNLOAD,
            self::ENTITY_DOCUMENT,
            $entityId,
            array_merge([
                'document_type' => $documentType,
                'id_district' => $districtId,
                'downloaded_at' => now()->toDateTimeString(),
            ], $additionalMetadata)
        );
    }

    /**
     * Obtenir le label de l'action
     */
    public function getActionLabelAttribute(): string
    {
        return match($this->action) {
            self::ACTION_LOGIN => 'Connexion',
            self::ACTION_LOGOUT => 'Déconnexion',
            self::ACTION_GENERATE => 'Génération',
            self::ACTION_DOWNLOAD => 'Téléchargement',
            self::ACTION_CREATE => 'Création',
            self::ACTION_UPDATE => 'Modification',
            self::ACTION_DELETE => 'Suppression',
            self::ACTION_ARCHIVE => 'Archivage',
            self::ACTION_UNARCHIVE => 'Désarchivage',
            self::ACTION_EXPORT => 'Export',
            self::ACTION_VIEW => 'Consultation',
            self::ACTION_CLOSE => 'Fermeture',
            self::ACTION_REOPEN => 'Réouverture', 
            self::ACTION_UPLOAD => 'Upload', 
            self::ACTION_VERIFY => 'Vérification', 
            default => ucfirst($this->action),
        };
    }

    /**
     * Obtenir le label du type d'entité
     */
    public function getEntityLabelAttribute(): string
    {
        return match($this->entity_type) {
            self::ENTITY_DOCUMENT => 'Document',
            self::ENTITY_DOSSIER => 'Dossier',
            self::ENTITY_PROPRIETE => 'Propriété',
            self::ENTITY_DEMANDEUR => 'Demandeur',
            self::ENTITY_USER => 'Utilisateur',
            self::ENTITY_AUTH => 'Authentification',
            self::ENTITY_DISTRICT => 'District',
            self::ENTITY_PIECE_JOINTE => 'Pièce jointe',
            default => ucfirst($this->entity_type),
        };
    }

    /**
     * Obtenir la description lisible de l'activité
     */
    public function getDescriptionAttribute(): string
    {
        $description = "{$this->action_label} de {$this->entity_label}";
        
        if ($this->document_type) {
            $docType = match($this->document_type) {
                self::DOC_RECU => 'Reçu',
                self::DOC_ACTE_VENTE => 'Acte de Vente',
                self::DOC_CSF => 'CSF',
                self::DOC_REQUISITION => 'Réquisition',
                default => ucfirst($this->document_type),
            };
            $description .= " ({$docType})";
        }
        
        if ($this->action === self::ACTION_CLOSE && isset($this->metadata['motif_fermeture'])) {
            $description .= " - Motif: " . \Illuminate\Support\Str::limit($this->metadata['motif_fermeture'], 50);
        }
        
        return $description;
    }

    /**
     *Obtenir le badge de couleur selon l'action
     */
    public function getActionColorAttribute(): string
    {
        return match($this->action) {
            self::ACTION_CREATE => 'green',
            self::ACTION_UPDATE => 'blue',
            self::ACTION_DELETE => 'red',
            self::ACTION_CLOSE => 'orange',
            self::ACTION_REOPEN => 'green',
            self::ACTION_ARCHIVE => 'gray',
            self::ACTION_UNARCHIVE => 'blue',
            self::ACTION_GENERATE => 'purple',
            self::ACTION_DOWNLOAD => 'indigo',
            self::ACTION_EXPORT => 'pink',
            self::ACTION_VIEW => 'slate',
            self::ACTION_LOGIN => 'cyan',
            self::ACTION_LOGOUT => 'gray',
            self::ACTION_UPLOAD => 'teal', 
            self::ACTION_VERIFY => 'emerald', 
            default => 'gray',
        };
    }

    /**
     * Obtenir l'icône selon l'action
     */
    public function getActionIconAttribute(): string
    {
        return match($this->action) {
            self::ACTION_CREATE => 'plus-circle',
            self::ACTION_UPDATE => 'edit',
            self::ACTION_DELETE => 'trash',
            self::ACTION_CLOSE => 'lock',
            self::ACTION_REOPEN => 'lock-open',
            self::ACTION_ARCHIVE => 'archive',
            self::ACTION_UNARCHIVE => 'archive-restore',
            self::ACTION_GENERATE => 'file-text',
            self::ACTION_DOWNLOAD => 'download',
            self::ACTION_EXPORT => 'file-export',
            self::ACTION_VIEW => 'eye',
            self::ACTION_LOGIN => 'log-in',
            self::ACTION_LOGOUT => 'log-out',
            self::ACTION_UPLOAD => 'upload',
            self::ACTION_VERIFY => 'check-circle',
            default => 'activity',
        };
    }

    // ============ STATISTIQUES ============
    
    /**
     *  Obtenir les statistiques d'activité par période
     */
    public static function getStatsByPeriod(
        string $period = 'week',
        ?int $districtId = null
    ): array {
        $query = self::query();
        
        $days = match($period) {
            'today' => 1,
            'week' => 7,
            'month' => 30,
            'quarter' => 90,
            'year' => 365,
            default => 7,
        };
        
        $query->where('created_at', '>=', now()->subDays($days));
        
        if ($districtId) {
            $query->where('id_district', $districtId);
        }
        
        return [
            'total_actions' => $query->count(),
            'by_action' => $query->groupBy('action')
                ->selectRaw('action, COUNT(*) as count')
                ->pluck('count', 'action')
                ->toArray(),
            'by_entity' => $query->groupBy('entity_type')
                ->selectRaw('entity_type, COUNT(*) as count')
                ->pluck('count', 'entity_type')
                ->toArray(),
            'unique_users' => $query->distinct('id_user')->count('id_user'),
            'documents_generated' => $query->where('action', self::ACTION_GENERATE)
                ->where('entity_type', self::ENTITY_DOCUMENT)
                ->count(),
            'dossiers_closed' => $query->where('action', self::ACTION_CLOSE)
                ->where('entity_type', self::ENTITY_DOSSIER)
                ->count(),
            'dossiers_reopened' => $query->where('action', self::ACTION_REOPEN)
                ->where('entity_type', self::ENTITY_DOSSIER)
                ->count(),
            'pieces_jointes_uploaded' => $query->where('action', self::ACTION_UPLOAD)
                ->where('entity_type', self::ENTITY_PIECE_JOINTE)
                ->count(),
        ];
    }

    /**
     * Obtenir l'historique de fermeture d'un dossier
     */
    public static function getDossierClosureHistory(int $dossierId): array
    {
        $closures = self::where('entity_type', self::ENTITY_DOSSIER)
            ->where('entity_id', $dossierId)
            ->whereIn('action', [self::ACTION_CLOSE, self::ACTION_REOPEN])
            ->with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $closures->map(function($log) {
            return [
                'action' => $log->action,
                'action_label' => $log->action_label,
                'user' => $log->user?->name,
                'date' => $log->created_at->format('d/m/Y H:i'),
                'motif' => $log->metadata['motif_fermeture'] ?? null,
                'metadata' => $log->metadata,
            ];
        })->toArray();
    }

    /**
     * Obtenir les utilisateurs les plus actifs
     */
    public static function getMostActiveUsers(
        int $limit = 10,
        ?int $districtId = null,
        int $days = 30
    ): array {
        $query = self::with('user:id,name,email,role')
            ->where('created_at', '>=', now()->subDays($days));
        
        if ($districtId) {
            $query->where('id_district', $districtId);
        }
        
        return $query->selectRaw('id_user, COUNT(*) as actions_count')
            ->groupBy('id_user')
            ->orderByDesc('actions_count')
            ->limit($limit)
            ->get()
            ->map(function($log) {
                return [
                    'user' => $log->user,
                    'actions_count' => $log->actions_count,
                ];
            })
            ->toArray();
    }

    /**
     * Obtenir les documents les plus générés
     */
    public static function getMostGeneratedDocuments(
        int $limit = 5,
        ?int $districtId = null,
        int $days = 30
    ): array {
        $query = self::where('action', self::ACTION_GENERATE)
            ->where('entity_type', self::ENTITY_DOCUMENT)
            ->where('created_at', '>=', now()->subDays($days));
        
        if ($districtId) {
            $query->where('id_district', $districtId);
        }
        
        return $query->selectRaw('document_type, COUNT(*) as count')
            ->whereNotNull('document_type')
            ->groupBy('document_type')
            ->orderByDesc('count')
            ->limit($limit)
            ->get()
            ->map(function($log) {
                $label = match($log->document_type) {
                    self::DOC_RECU => 'Reçu',
                    self::DOC_ACTE_VENTE => 'Acte de Vente',
                    self::DOC_CSF => 'CSF',
                    self::DOC_REQUISITION => 'Réquisition',
                    default => ucfirst($log->document_type),
                };
                
                return [
                    'type' => $log->document_type,
                    'label' => $label,
                    'count' => $log->count,
                ];
            })
            ->toArray();
    }

    /**
     * Nettoyer les anciens logs (à exécuter via CRON)
     */
    public static function cleanOldLogs(int $keepDays = 365): int
    {
        return self::where('created_at', '<', now()->subDays($keepDays))->delete();
    }


    /**
     * Obtenir les détails formatés selon le type d'action
     */
    public function getDetailsAttribute(): string
    {
        $meta = $this->metadata ?? [];
        
        return match($this->entity_type) {
            self::ENTITY_DOCUMENT => $this->getDocumentDetails($meta),
            self::ENTITY_DOSSIER => $this->getDossierDetails($meta),
            self::ENTITY_PROPRIETE => $this->getProprieteDetails($meta),
            self::ENTITY_DEMANDEUR => $this->getDemandeurDetails($meta),
            self::ENTITY_USER => $this->getUserDetails($meta),
            self::ENTITY_PIECE_JOINTE => $this->getPieceJointeDetails($meta),
            self::ENTITY_AUTH => $this->getAuthDetails($meta),
            default => 'Action effectuée',
        };
    }

    private function getDocumentDetails(array $meta): string
    {
        $parts = [];
        
        // Type de document
        if (isset($meta['document_type'])) {
            $docType = match($meta['document_type']) {
                self::DOC_RECU => 'Reçu',
                self::DOC_ACTE_VENTE => 'Acte de Vente',
                self::DOC_CSF => 'CSF',
                self::DOC_REQUISITION => 'Réquisition',
                default => $meta['document_type'],
            };
            $parts[] = $docType;
        }
        
        // Lot
        if (isset($meta['lot'])) {
            $parts[] = "Lot: {$meta['lot']}";
        }
        
        // Titre
        if (isset($meta['titre'])) {
            $parts[] = "TN°{$meta['titre']}";
        }
        
        // Numéro de reçu
        if (isset($meta['numero_recu'])) {
            $parts[] = "N°{$meta['numero_recu']}";
        }
        
        // Montant
        if (isset($meta['montant'])) {
            $montant = number_format($meta['montant'], 0, ',', ' ');
            $parts[] = "{$montant} Ar";
        }
        
        // Total prix
        if (isset($meta['total_prix']) && !isset($meta['montant'])) {
            $total = number_format($meta['total_prix'], 0, ',', ' ');
            $parts[] = "{$total} Ar";
        }
        
        // Consorts
        if (isset($meta['has_consorts']) && $meta['has_consorts']) {
            $nb = $meta['nb_demandeurs'] ?? 'plusieurs';
            $parts[] = "{$nb} consorts";
        }
        
        return !empty($parts) ? implode(' • ', $parts) : 'Document généré';
    }

    private function getDossierDetails(array $meta): string
    {
        $parts = [];
        
        // Nom du dossier
        if (isset($meta['nom_dossier'])) {
            $parts[] = "\"{$meta['nom_dossier']}\"";
        }
        
        // Numéro d'ouverture
        if (isset($meta['numero_ouverture'])) {
            $parts[] = "N°{$meta['numero_ouverture']}";
        }
        
        // Commune
        if (isset($meta['commune'])) {
            $parts[] = "Commune: {$meta['commune']}";
        }
        
        // Circonscription
        if (isset($meta['circonscription'])) {
            $parts[] = "{$meta['circonscription']}";
        }
        
        // Type de commune
        if (isset($meta['type_commune'])) {
            $parts[] = $meta['type_commune'];
        }
        
        // Pour les fermetures
        if ($this->action === self::ACTION_CLOSE) {
            if (isset($meta['motif_fermeture'])) {
                $motif = \Illuminate\Support\Str::limit($meta['motif_fermeture'], 50);
                $parts[] = "Motif: {$motif}";
            }
        }
        
        return !empty($parts) ? implode(' • ', $parts) : 'Dossier modifié';
    }

    private function getProprieteDetails(array $meta): string
    {
        $parts = [];
        
        // Lot
        if (isset($meta['lot'])) {
            $parts[] = "Lot: {$meta['lot']}";
        }
        
        // Titre
        if (isset($meta['titre'])) {
            $parts[] = "TN°{$meta['titre']}";
        }
        
        // Contenance
        if (isset($meta['contenance'])) {
            $parts[] = "{$meta['contenance']}m²";
        }
        
        // Nature
        if (isset($meta['nature'])) {
            $parts[] = $meta['nature'];
        }
        
        // Vocation
        if (isset($meta['vocation'])) {
            $parts[] = $meta['vocation'];
        }
        
        // Actions en masse
        if (isset($meta['action_type'])) {
            if ($meta['action_type'] === 'bulk_create') {
                $count = $meta['count'] ?? 0;
                return "Création en masse de {$count} propriétés";
            }
        }
        
        return !empty($parts) ? implode(' • ', $parts) : 'Propriété modifiée';
    }

    private function getDemandeurDetails(array $meta): string
    {
        $parts = [];
        
        // Nom complet
        if (isset($meta['nom'])) {
            $nom = $meta['nom'];
            if (isset($meta['prenom'])) {
                $nom .= ' ' . $meta['prenom'];
            }
            $parts[] = $nom;
        }
        
        // CIN
        if (isset($meta['cin'])) {
            $parts[] = "CIN: {$meta['cin']}";
        }
        
        // Actions spéciales
        if (isset($meta['action_type'])) {
            if ($meta['action_type'] === 'bulk_create') {
                $created = $meta['created_count'] ?? 0;
                $updated = $meta['updated_count'] ?? 0;
                return "Traitement en masse: {$created} créés, {$updated} mis à jour";
            } elseif ($meta['action_type'] === 'remove_from_dossier') {
                return "Retiré du dossier";
            } elseif ($meta['action_type'] === 'definitive_deletion') {
                return "Suppression définitive";
            }
        }
        
        return !empty($parts) ? implode(' • ', $parts) : 'Demandeur modifié';
    }

    private function getUserDetails(array $meta): string
    {
        $parts = [];
        
        // Nom de l'utilisateur
        if (isset($meta['user_name'])) {
            $parts[] = $meta['user_name'];
        }
        
        // Email
        if (isset($meta['user_email'])) {
            $parts[] = $meta['user_email'];
        }
        
        // Rôle
        if (isset($meta['user_role'])) {
            $role = match($meta['user_role']) {
                'super_admin' => 'Super Admin',
                'central_user' => 'Utilisateur Central',
                'admin_district' => 'Admin District',
                'user_district' => 'Utilisateur District',
                default => $meta['user_role'],
            };
            $parts[] = $role;
        }
        
        // Actions spéciales
        if (isset($meta['action_type'])) {
            if ($meta['action_type'] === 'toggle_status') {
                $status = $meta['new_status'] ? 'Activé' : 'Désactivé';
                return "Compte {$status}";
            } elseif ($meta['action_type'] === 'reset_password') {
                return "Mot de passe réinitialisé";
            }
        }
        
        return !empty($parts) ? implode(' • ', $parts) : 'Utilisateur modifié';
    }

    private function getPieceJointeDetails(array $meta): string
    {
        $parts = [];
        
        // Nom du fichier
        if (isset($meta['nom_fichier'])) {
            $parts[] = $meta['nom_fichier'];
        }
        
        // Taille
        if (isset($meta['taille_formatee'])) {
            $parts[] = $meta['taille_formatee'];
        } elseif (isset($meta['taille'])) {
            $parts[] = $this->formatBytes($meta['taille']);
        }
        
        // Type de document
        if (isset($meta['type_document'])) {
            $parts[] = "Type: {$meta['type_document']}";
        }
        
        // Entité attachée
        if (isset($meta['attachable_type'])) {
            $entity = class_basename($meta['attachable_type']);
            $parts[] = "Attaché à: {$entity}";
        }
        
        return !empty($parts) ? implode(' • ', $parts) : 'Fichier';
    }


    private function getAuthDetails(array $meta): string
    {
        $parts = [];
        
        // Nom de l'utilisateur
        if (isset($meta['user_name'])) {
            $parts[] = $meta['user_name'];
        }
        
        // Rôle
        if (isset($meta['user_role'])) {
            $role = match($meta['user_role']) {
                'super_admin' => 'Super Admin',
                'central_user' => 'Utilisateur Central',
                'admin_district' => 'Admin District',
                'user_district' => 'Utilisateur District',
                default => $meta['user_role'],
            };
            $parts[] = $role;
        }
        
        if (empty($parts)) {
            return $this->action === self::ACTION_LOGIN ? 'Connexion' : 'Déconnexion';
        }
        
        return implode(' • ', $parts);
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['o', 'Ko', 'Mo', 'Go'];
        $i = 0;
        
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}