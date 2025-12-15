<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class DocumentGenere extends Model
{
    use HasFactory;
    
    protected $table = 'documents_generes';
    
    const TYPE_RECU = 'RECU';
    const TYPE_ADV = 'ADV';
    const TYPE_CSF = 'CSF';
    const TYPE_REQ = 'REQ';

    const STATUS_ACTIVE = 'active';
    const STATUS_ARCHIVED = 'archived';
    const STATUS_OBSOLETE = 'obsolete';

    protected $fillable = [
        'type_document', 'id_propriete', 'id_demandeur', 'id_dossier', 'id_district',
        'numero_document', 'file_path', 'nom_fichier', 'montant', 'date_document',
        'has_consorts', 'demandeurs_ids', 'metadata', 'generated_by', 'generated_at',
        'download_count', 'last_downloaded_at', 'status',
    ];

    protected $casts = [
        'date_document' => 'date',
        'generated_at' => 'datetime',
        'last_downloaded_at' => 'datetime',
        'montant' => 'integer',
        'has_consorts' => 'boolean',
        'demandeurs_ids' => 'array',
        'metadata' => 'array',
        'download_count' => 'integer',
    ];

    /**
     * ✅ Vérification complète de l'état du fichier
     */
    public function checkFileStatus(): array
    {
        $status = [
            'exists' => false,
            'valid' => false,
            'readable' => false,
            'size' => 0,
            'error' => null,
        ];

        if (!$this->file_path) {
            $status['error'] = 'Chemin de fichier manquant';
            return $status;
        }

        try {
            if (!Storage::disk('public')->exists($this->file_path)) {
                $status['error'] = 'Fichier introuvable';
                return $status;
            }
            $status['exists'] = true;

            $size = Storage::disk('public')->size($this->file_path);
            if ($size === false || $size === 0) {
                $status['error'] = 'Fichier vide';
                return $status;
            }
            $status['size'] = $size;

            $fullPath = Storage::disk('public')->path($this->file_path);
            if (!is_readable($fullPath)) {
                $status['error'] = 'Fichier non lisible';
                return $status;
            }
            $status['readable'] = true;
            $status['valid'] = true;

            return $status;
        } catch (\Exception $e) {
            Log::error('Erreur vérification fichier', [
                'document_id' => $this->id,
                'error' => $e->getMessage(),
            ]);
            $status['error'] = 'Erreur système : ' . $e->getMessage();
            return $status;
        }
    }

    public function fileExists(): bool
    {
        return $this->file_path && Storage::disk('public')->exists($this->file_path);
    }

    public function hasValidFile(): bool
    {
        return $this->checkFileStatus()['valid'];
    }

    public function getValidatedPath(): ?string
    {
        $status = $this->checkFileStatus();
        return $status['valid'] ? Storage::disk('public')->path($this->file_path) : null;
    }

    public function markForRegeneration(string $reason = 'file_missing'): void
    {
        $this->update([
            'metadata' => array_merge($this->metadata ?? [], [
                'needs_regeneration' => true,
                'marked_at' => now()->toIso8601String(),
                'reason' => $reason,
            ])
        ]);
    }

    public function incrementDownloadCount(): void
    {
        $this->increment('download_count');
        $this->update(['last_downloaded_at' => now()]);
    }

    public function incrementRegenerationCount(): void
    {
        $metadata = $this->metadata ?? [];
        $metadata['regeneration_count'] = ($metadata['regeneration_count'] ?? 0) + 1;
        $metadata['last_regenerated_at'] = now()->toIso8601String();
        $metadata['needs_regeneration'] = false;
        $this->update(['metadata' => $metadata]);
    }

    public function markAsObsolete(): bool
    {
        return $this->update(['status' => self::STATUS_OBSOLETE]);
    }

    public static function findExisting(string $type, int $idPropriete, ?int $idDemandeur = null, ?int $idDistrict = null): ?self
    {
        $query = self::where('type_document', $type)
            ->where('id_propriete', $idPropriete)
            ->where('status', self::STATUS_ACTIVE);

        if ($idDistrict) $query->where('id_district', $idDistrict);

        if ($type === self::TYPE_REQ) return $query->first();

        if ($idDemandeur) {
            $query->where(function($q) use ($idDemandeur) {
                $q->where('id_demandeur', $idDemandeur)
                  ->orWhereJsonContains('demandeurs_ids', $idDemandeur);
            });
        }

        return $query->first();
    }

    // Relations
    public function propriete() { return $this->belongsTo(Propriete::class, 'id_propriete'); }
    public function demandeur() { return $this->belongsTo(Demandeur::class, 'id_demandeur'); }
    public function dossier() { return $this->belongsTo(Dossier::class, 'id_dossier'); }
    public function district() { return $this->belongsTo(District::class, 'id_district'); }
    public function generatedBy() { return $this->belongsTo(User::class, 'generated_by'); }

    // Scopes
    public function scopeActive($query) { return $query->where('status', self::STATUS_ACTIVE); }
    public function scopeOfType($query, string $type) { return $query->where('type_document', $type); }

    // Accessors
    public function getFullPathAttribute(): string
    {
        return Storage::disk('public')->path($this->file_path);
    }

    public function getTypeDisplayAttribute(): string
    {
        return match($this->type_document) {
            self::TYPE_RECU => 'Reçu de Paiement',
            self::TYPE_ADV => 'Acte de Vente',
            self::TYPE_CSF => 'Certificat de Situation Financière',
            self::TYPE_REQ => 'Réquisition',
            default => $this->type_document,
        };
    }
}