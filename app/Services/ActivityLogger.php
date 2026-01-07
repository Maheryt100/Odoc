<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ActivityLogger
{
    /**
     * Format standardisé des métadonnées selon le type d'entité
     * 
     * @param string $entityType
     * @param array $metadata
     * @return array
     */
    private static function formatMetadata(string $entityType, array $metadata): array
    {
        $formatted = $metadata;
        
        // Ajouter timestamp systématique
        if (!isset($formatted['logged_at'])) {
            $formatted['logged_at'] = now()->toDateTimeString();
        }
        
        // Ajouter infos utilisateur si manquant
        if (!isset($formatted['logged_by'])) {
            $user = Auth::user();
            if ($user) {
                $formatted['logged_by'] = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                ];
            }
        }
        
        return $formatted;
    }

    /**
     * Logger une activité (méthode centrale privée)
     * 
     * @param string $action
     * @param string $entityType
     * @param int|null $entityId
     * @param array $metadata
     * @return ActivityLog|null
     */
    private static function logActivity(
        string $action,
        string $entityType,
        ?int $entityId = null,
        array $metadata = []
    ): ?ActivityLog {
        $user = Auth::user();
        
        if (!$user) {
            Log::warning('Tentative de log sans utilisateur authentifié', [
                'action' => $action,
                'entity' => $entityType,
            ]);
            return null;
        }
        
        // Formater les métadonnées
        $formattedMetadata = self::formatMetadata($entityType, $metadata);
        
        // Créer le log
        $log = ActivityLog::create([
            'id_user' => $user->id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'document_type' => $metadata['document_type'] ?? null,
            'id_district' => $metadata['id_district'] ?? $user->id_district,
            'metadata' => $formattedMetadata,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
        
        // Invalider les caches après création
        self::clearCache($log->id_district);
        
        return $log;
    }

    // ============================================================================
    // AUTHENTIFICATION
    // ============================================================================

    /**
     * Log une connexion
     */
    public static function logLogin(User $user): ActivityLog
    {
        $log = ActivityLog::create([
            'id_user' => $user->id,
            'action' => ActivityLog::ACTION_LOGIN,
            'entity_type' => ActivityLog::ENTITY_AUTH,
            'entity_id' => $user->id,
            'id_district' => $user->id_district,
            'metadata' => [
                'user_name' => $user->name,
                'user_email' => $user->email,
                'user_role' => $user->role,
                'logged_at' => now()->toDateTimeString(),
            ],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
        
        self::clearCache($user->id_district);
        
        return $log;
    }

    /**
     * Log une déconnexion
     */
    public static function logLogout(User $user): ActivityLog
    {
        $log = ActivityLog::create([
            'id_user' => $user->id,
            'action' => ActivityLog::ACTION_LOGOUT,
            'entity_type' => ActivityLog::ENTITY_AUTH,
            'entity_id' => $user->id,
            'id_district' => $user->id_district,
            'metadata' => [
                'user_name' => $user->name,
                'user_email' => $user->email,
                'logged_at' => now()->toDateTimeString(),
            ],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
        
        self::clearCache($user->id_district);
        
        return $log;
    }

    // ============================================================================
    // DOCUMENTS
    // ============================================================================

    /**
     * Log la génération d'un document
     */
    public static function logDocumentGeneration(
        string $documentType,
        int $entityId,
        array $metadata = []
    ): ?ActivityLog {
        return self::logActivity(
            ActivityLog::ACTION_GENERATE,
            ActivityLog::ENTITY_DOCUMENT,
            $entityId,
            array_merge(['document_type' => $documentType], $metadata)
        );
    }

    /**
     * Log le téléchargement d'un document
     */
    public static function logDocumentDownload(
        string $documentType,
        int $entityId,
        array $metadata = []
    ): ?ActivityLog {
        return self::logActivity(
            ActivityLog::ACTION_DOWNLOAD,
            ActivityLog::ENTITY_DOCUMENT,
            $entityId,
            array_merge(['document_type' => $documentType], $metadata)
        );
    }

    // ============================================================================
    // CRUD GÉNÉRAL
    // ============================================================================

    /**
     * Log la création d'une entité
     */
    public static function logCreation(
        string $entityType,
        ?int $entityId,
        array $metadata = []
    ): ?ActivityLog {
        return self::logActivity(
            ActivityLog::ACTION_CREATE,
            $entityType,
            $entityId,
            $metadata
        );
    }

    /**
     * Log la modification d'une entité
     */
    public static function logUpdate(
        string $entityType,
        int $entityId,
        array $metadata = []
    ): ?ActivityLog {
        return self::logActivity(
            ActivityLog::ACTION_UPDATE,
            $entityType,
            $entityId,
            $metadata
        );
    }

    /**
     * Log la suppression d'une entité
     */
    public static function logDeletion(
        string $entityType,
        int $entityId,
        array $metadata = []
    ): ?ActivityLog {
        return self::logActivity(
            ActivityLog::ACTION_DELETE,
            $entityType,
            $entityId,
            $metadata
        );
    }

    /**
     * Log l'archivage
     */
    public static function logArchive(
        string $entityType,
        int $entityId,
        array $metadata = []
    ): ?ActivityLog {
        return self::logActivity(
            ActivityLog::ACTION_ARCHIVE,
            $entityType,
            $entityId,
            $metadata
        );
    }

    /**
     * Log le désarchivage
     */
    public static function logUnarchive(
        string $entityType,
        int $entityId,
        array $metadata = []
    ): ?ActivityLog {
        return self::logActivity(
            ActivityLog::ACTION_UNARCHIVE,
            $entityType,
            $entityId,
            $metadata
        );
    }

    /**
     * Log un export
     */
    public static function logExport(
        string $entityType,
        array $metadata = []
    ): ?ActivityLog {
        return self::logActivity(
            ActivityLog::ACTION_EXPORT,
            $entityType,
            null,
            $metadata
        );
    }

    // ============================================================================
    // PIÈCES JOINTES (NOUVEAUX LOGS)
    // ============================================================================

    /**
     * Log l'upload d'une pièce jointe
     */
    public static function logPieceJointeUpload(
        int $pieceJointeId,
        string $nomFichier,
        int $taille,
        string $attachableType,
        int $attachableId,
        ?int $districtId = null,
        ?string $typeDocument = null
    ): ?ActivityLog {
        return self::logActivity(
            ActivityLog::ACTION_UPLOAD,
            ActivityLog::ENTITY_PIECE_JOINTE,
            $pieceJointeId,
            [
                'nom_fichier' => $nomFichier,
                'taille' => $taille,
                'taille_formatee' => self::formatBytes($taille),
                'type_document' => $typeDocument,
                'attachable_type' => $attachableType,
                'attachable_id' => $attachableId,
                'id_district' => $districtId,
            ]
        );
    }

    /**
     * Log la vérification d'une pièce jointe
     */
    public static function logPieceJointeVerification(
        int $pieceJointeId,
        string $nomFichier,
        ?int $districtId = null
    ): ?ActivityLog {
        return self::logActivity(
            ActivityLog::ACTION_VERIFY,
            ActivityLog::ENTITY_PIECE_JOINTE,
            $pieceJointeId,
            [
                'nom_fichier' => $nomFichier,
                'id_district' => $districtId,
            ]
        );
    }

    /**
     * Log la suppression d'une pièce jointe
     */
    public static function logPieceJointeDeletion(
        int $pieceJointeId,
        string $nomFichier,
        ?int $districtId = null
    ): ?ActivityLog {
        return self::logActivity(
            ActivityLog::ACTION_DELETE,
            ActivityLog::ENTITY_PIECE_JOINTE,
            $pieceJointeId,
            [
                'nom_fichier' => $nomFichier,
                'id_district' => $districtId,
            ]
        );
    }

    // ============================================================================
    // STATISTIQUES (INCHANGÉES)
    // ============================================================================

    /**
     * Obtenir les statistiques de téléchargement par utilisateur avec cache
     */
    public static function getUserDocumentStats(?int $userId = null)
    {
        $cacheKey = $userId 
            ? "user_doc_stats_{$userId}" 
            : 'all_user_doc_stats';
        
        return Cache::remember($cacheKey, 300, function () use ($userId) {
            $query = ActivityLog::documents()
                ->where('action', ActivityLog::ACTION_DOWNLOAD);

            if ($userId) {
                $query->where('id_user', $userId);
            }

            return $query->selectRaw('
                    id_user,
                    document_type,
                    COUNT(*) as download_count,
                    MAX(created_at) as last_download
                ')
                ->groupBy('id_user', 'document_type')
                ->with('user:id,name,email,id_district')
                ->get();
        });
    }

    /**
     * Obtenir l'activité récente avec cache
     */
    public static function getRecentActivity(int $limit = 50, ?int $districtId = null)
    {
        $cacheKey = $districtId 
            ? "recent_activity_district_{$districtId}_{$limit}" 
            : "recent_activity_all_{$limit}";
        
        return Cache::remember($cacheKey, 60, function () use ($limit, $districtId) {
            $query = ActivityLog::with(['user:id,name,email', 'district:id,nom_district'])
                ->orderBy('created_at', 'desc')
                ->limit($limit);

            if ($districtId) {
                $query->where('id_district', $districtId);
            }

            return $query->get();
        });
    }

    /**
     * Obtenir les statistiques globales avec cache optimisé
     */
    public static function getGlobalStats(?int $districtId = null): array
    {
        $cacheKey = $districtId 
            ? "global_stats_district_{$districtId}" 
            : 'global_stats_all';
        
        return Cache::remember($cacheKey, 300, function () use ($districtId) {
            $query = ActivityLog::query();

            if ($districtId) {
                $query->where('id_district', $districtId);
            }

            // Requête compatible PostgreSQL
            $stats = DB::select("
                SELECT 
                    COUNT(*) as total_actions,
                    SUM(CASE WHEN entity_type = ? THEN 1 ELSE 0 END) as total_documents,
                    SUM(CASE WHEN created_at::date = CURRENT_DATE THEN 1 ELSE 0 END) as today_actions,
                    SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as week_actions,
                    SUM(CASE WHEN EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW()) 
                        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW()) THEN 1 ELSE 0 END) as month_actions
                FROM activity_logs
                " . ($districtId ? "WHERE id_district = ?" : ""),
                $districtId 
                    ? [ActivityLog::ENTITY_DOCUMENT, $districtId] 
                    : [ActivityLog::ENTITY_DOCUMENT]
            );

            $baseStats = (array) $stats[0];

            // Statistiques par action
            $byAction = (clone $query)->selectRaw('action, COUNT(*) as count')
                ->groupBy('action')
                ->pluck('count', 'action')
                ->toArray();

            // Statistiques par entité
            $byEntity = (clone $query)->selectRaw('entity_type, COUNT(*) as count')
                ->groupBy('entity_type')
                ->pluck('count', 'entity_type')
                ->toArray();

            return array_merge($baseStats, [
                'by_action' => $byAction,
                'by_entity' => $byEntity,
            ]);
        });
    }

    /**
     * Obtenir l'activité d'un utilisateur spécifique
     */
    public static function getUserActivity(int $userId, int $limit = 100)
    {
        return Cache::remember("user_activity_{$userId}_{$limit}", 60, function () use ($userId, $limit) {
            return ActivityLog::with(['district:id,nom_district'])
                ->where('id_user', $userId)
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();
        });
    }

    /**
     * Nettoyer les anciens logs (au-delà de X jours)
     */
    public static function cleanOldLogs(int $days = 90): int
    {
        $deleted = ActivityLog::where('created_at', '<', now()->subDays($days))
            ->delete();
        
        // Invalider les caches après nettoyage
        self::clearCache();
        
        return $deleted;
    }

    /**
     * Invalider les caches de statistiques
     */
    public static function clearCache(?int $districtId = null): void
    {
        if ($districtId) {
            Cache::forget("global_stats_district_{$districtId}");
            Cache::forget("recent_activity_district_{$districtId}_50");
            Cache::forget("top_users_district_{$districtId}_10");
            Cache::forget("daily_stats_district_{$districtId}_30");
        } else {
            // Invalider tous les caches de stats
            Cache::forget('global_stats_all');
            Cache::forget('all_user_doc_stats');
            Cache::forget('recent_activity_all_50');
            Cache::forget('top_users_all_10');
            Cache::forget('daily_stats_all_30');
        }
    }

    /**
     * Obtenir les statistiques d'activité par jour (pour graphiques)
     */
    public static function getDailyActivityStats(int $days = 30, ?int $districtId = null): array
    {
        $cacheKey = $districtId 
            ? "daily_stats_district_{$districtId}_{$days}" 
            : "daily_stats_all_{$days}";
        
        return Cache::remember($cacheKey, 3600, function () use ($days, $districtId) {
            $query = ActivityLog::selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->where('created_at', '>=', now()->subDays($days))
                ->groupBy('date')
                ->orderBy('date');

            if ($districtId) {
                $query->where('id_district', $districtId);
            }

            return $query->get()->mapWithKeys(function ($item) {
                return [$item->date => $item->count];
            })->toArray();
        });
    }

    /**
     * Obtenir les utilisateurs les plus actifs
     */
    public static function getTopUsers(int $limit = 10, ?int $districtId = null): array
    {
        $cacheKey = $districtId 
            ? "top_users_district_{$districtId}_{$limit}" 
            : "top_users_all_{$limit}";
        
        return Cache::remember($cacheKey, 600, function () use ($limit, $districtId) {
            $query = ActivityLog::with('user:id,name,email')
                ->selectRaw('id_user, COUNT(*) as actions_count')
                ->groupBy('id_user')
                ->orderByDesc('actions_count')
                ->limit($limit);

            if ($districtId) {
                $query->where('id_district', $districtId);
            }

            return $query->get()->map(function ($item) {
                return [
                    'user' => $item->user,
                    'actions_count' => $item->actions_count,
                ];
            })->toArray();
        });
    }

    // ============================================================================
    // HELPERS PRIVÉS
    // ============================================================================

    /**
     * Formater la taille d'un fichier
     * 
     * @param int $bytes
     * @return string
     */
    private static function formatBytes(int $bytes): string
    {
        $units = ['o', 'Ko', 'Mo', 'Go'];
        $i = 0;
        
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    public static function logDocumentDeletion(string $type, int $documentId, array $context = []): void
    {
        ActivityLog::create([
            'id_user' => Auth::id(),
            'action' => ActivityLog::ACTION_DELETE,
            'entity_type' => ActivityLog::ENTITY_DOCUMENT,
            'entity_id' => $documentId,
            'document_type' => $type,
            'metadata' => array_merge($context, [
                'timestamp' => now()->toIso8601String(),
                'action_type' => 'delete_document',
            ]),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}