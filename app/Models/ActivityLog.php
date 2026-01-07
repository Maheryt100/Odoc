<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'id_user',
        'action',
        'entity_type',
        'entity_id',
        'entity_name',
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

    // ============ CONSTANTES ============
    
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
    
    const ENTITY_DOCUMENT = 'document';
    const ENTITY_DOSSIER = 'dossier';
    const ENTITY_PROPRIETE = 'propriete';
    const ENTITY_DEMANDEUR = 'demandeur';
    const ENTITY_USER = 'user';
    const ENTITY_AUTH = 'auth';
    const ENTITY_DISTRICT = 'district';
    const ENTITY_PIECE_JOINTE = 'piece_jointe'; 
    
    const DOC_RECU = 'recu';
    const DOC_ACTE_VENTE = 'acte_vente';
    const DOC_CSF = 'csf';
    const DOC_REQUISITION = 'requisition';

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

    public function scopeRecent($query, int $hours = 24)
    {
        return $query->where('created_at', '>=', now()->subHours($hours));
    }

    public function scopeDossiers($query)
    {
        return $query->where('entity_type', self::ENTITY_DOSSIER);
    }

    public function scopeClosedDossiers($query)
    {
        return $query->where('entity_type', self::ENTITY_DOSSIER)
                     ->where('action', self::ACTION_CLOSE);
    }

    public function scopeReopenedDossiers($query)
    {
        return $query->where('entity_type', self::ENTITY_DOSSIER)
                     ->where('action', self::ACTION_REOPEN);
    }

    // ============ ACCESSORS ============

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

    public function getDescriptionAttribute(): string
    {
        $description = "{$this->action_label} de {$this->entity_label}";
        
        if ($this->entity_name) {
            $description .= " : {$this->entity_name}";
        }
        
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
        
        return $description;
    }

    public function getDetailsAttribute(): string
    {
        $meta = $this->metadata ?? [];
        $details = $this->description;
        
        $importantKeys = ['lot', 'titre', 'numero_recu', 'montant', 'commune', 'cin'];
        $extras = [];
        
        foreach ($importantKeys as $key) {
            if (isset($meta[$key]) && $meta[$key]) {
                $label = ucfirst(str_replace('_', ' ', $key));
                $extras[] = "{$label}: {$meta[$key]}";
            }
        }
        
        if (!empty($extras)) {
            $details .= ' • ' . implode(' • ', $extras);
        }
        
        return $details;
    }

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
}