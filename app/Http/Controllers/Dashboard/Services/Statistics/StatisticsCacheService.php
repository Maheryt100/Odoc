<?php

namespace App\Http\Controllers\Dashboard\Services\Statistics;


use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;


/**
 * Service de gestion du cache pour les statistiques
 * Responsabilité : Gérer intelligemment le cache des statistiques
 * 
 * STRATÉGIE DE CACHE :
 * - Cache court (5 min) : Stats temps réel (overview, KPIs)
 * - Cache moyen (15 min) : Stats intermédiaires (dossiers, propriétés)
 * - Cache long (30 min) : Stats lourdes (graphiques, démographies)
 * - Invalidation intelligente : Basée sur les événements métier
 */
class StatisticsCacheService
{
    // Durées de cache en secondes
    const TTL_SHORT = 300;      // 5 minutes
    const TTL_MEDIUM = 900;     // 15 minutes
    const TTL_LONG = 1800;      // 30 minutes
    const TTL_VERY_LONG = 3600; // 1 heure
    
    // Préfixes de clés
    const PREFIX_STATS = 'stats';
    const PREFIX_CHARTS = 'charts';
    const PREFIX_USER = 'user';
    
    /**
     * Construire une clé de cache unique
     */
    public function buildKey(string $type, array $params = []): string
    {
        $user = Auth::user();
        $userId = $user->id;
        $districtId = $user->id_district ?? 'all';
        
        // Normaliser les paramètres
        $normalizedParams = $this->normalizeParams($params);
        
        // Format: stats:user_{id}:district_{id}:type:params_hash
        $paramsHash = md5(json_encode($normalizedParams));
        
        return sprintf(
            '%s:%s_%d:%s_%s:%s:%s',
            self::PREFIX_STATS,
            self::PREFIX_USER,
            $userId,
            'district',
            $districtId,
            $type,
            $paramsHash
        );
    }
    
    /**
     * Récupérer depuis le cache ou calculer
     */
    public function remember(string $type, array $params, callable $callback, ?int $ttl = null): mixed
    {
        $key = $this->buildKey($type, $params);
        $ttl = $ttl ?? $this->getTtlForType($type);
        
        return Cache::remember($key, $ttl, function() use ($callback, $key) {
            $result = $callback();
            
            // Log pour monitoring
            Log::info("✅ Cache MISS: Calcul et stockage", [
                'key' => $key,
                'size' => strlen(json_encode($result)) . ' bytes'
            ]);
            
            return $result;
        });
    }
    
    /**
     * Invalider le cache pour un type spécifique
     */
    public function forget(string $type, array $params = []): bool
    {
        $key = $this->buildKey($type, $params);
        
        Log::info("🗑️ Cache INVALIDATED", ['key' => $key]);
        
        return Cache::forget($key);
    }
    
    /**
     * Invalider tout le cache d'un utilisateur
     */
    public function forgetUserCache(?int $userId = null): void
    {
        $userId = $userId ?? Auth::id();
        $pattern = sprintf('%s:%s_%d:*', self::PREFIX_STATS, self::PREFIX_USER, $userId);
        
        $this->forgetPattern($pattern);
        
        Log::info("🗑️ Cache utilisateur INVALIDATED", [
            'user_id' => $userId,
            'pattern' => $pattern
        ]);
    }
    
    /**
     * Invalider tout le cache d'un district
     */
    public function forgetDistrictCache(int $districtId): void
    {
        $pattern = sprintf('%s:*:district_%d:*', self::PREFIX_STATS, $districtId);
        
        $this->forgetPattern($pattern);
        
        Log::info("🗑️ Cache district INVALIDATED", [
            'district_id' => $districtId,
            'pattern' => $pattern
        ]);
    }
    
    /**
     * Invalider tout le cache des statistiques
     */
    public function forgetAll(): void
    {
        $pattern = self::PREFIX_STATS . ':*';
        
        $this->forgetPattern($pattern);
        
        Log::info("🗑️ TOUS les caches statistiques INVALIDATED");
    }
    
    /**
     * Invalider un pattern de clés (Redis uniquement)
     */
    private function forgetPattern(string $pattern): void
    {
        try {
            // Si Redis est configuré
            if (config('cache.default') === 'redis') {
                $redis = Cache::getRedis();
                $keys = $redis->keys($pattern);
                
                if (!empty($keys)) {
                    $redis->del($keys);
                    Log::info("🗑️ Pattern invalidé", [
                        'pattern' => $pattern,
                        'count' => count($keys)
                    ]);
                }
            } else {
                // Pour les autres drivers, clear tout
                Cache::flush();
            }
        } catch (\Exception $e) {
            Log::error("❌ Erreur invalidation cache", [
                'pattern' => $pattern,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Obtenir la durée de cache selon le type
     */
    private function getTtlForType(string $type): int
    {
        return match(true) {
            // Stats temps réel (5 min)
            str_contains($type, 'overview') => self::TTL_SHORT,
            str_contains($type, 'kpi') => self::TTL_SHORT,
            
            // Stats intermédiaires (15 min)
            str_contains($type, 'dossiers') => self::TTL_MEDIUM,
            str_contains($type, 'proprietes') => self::TTL_MEDIUM,
            str_contains($type, 'demandeurs') => self::TTL_MEDIUM,
            
            // Stats lourdes (30 min)
            str_contains($type, 'charts') => self::TTL_LONG,
            str_contains($type, 'demographics') => self::TTL_LONG,
            str_contains($type, 'financials') => self::TTL_LONG,
            
            // Par défaut (15 min)
            default => self::TTL_MEDIUM,
        };
    }
    
    /**
     * Normaliser les paramètres pour le cache
     */
    private function normalizeParams(array $params): array
    {
        // Trier pour avoir toujours la même clé
        ksort($params);
        
        // Normaliser les dates
        if (isset($params['from'])) {
            $params['from'] = Carbon::parse($params['from'])->format('Y-m-d');
        }
        if (isset($params['to'])) {
            $params['to'] = Carbon::parse($params['to'])->format('Y-m-d');
        }
        
        return $params;
    }
    
    /**
     * Obtenir les statistiques de cache (pour monitoring)
     */
    public function getCacheStats(): array
    {
        try {
            if (config('cache.default') === 'redis') {
                $redis = Cache::getRedis();
                $pattern = self::PREFIX_STATS . ':*';
                $keys = $redis->keys($pattern);
                
                $totalSize = 0;
                $keysByType = [];
                
                foreach ($keys as $key) {
                    $size = strlen($redis->get($key));
                    $totalSize += $size;
                    
                    // Extraire le type
                    preg_match('/:(overview|dossiers|proprietes|demandeurs|charts|demographics|financials):/', $key, $matches);
                    $type = $matches[1] ?? 'other';
                    
                    if (!isset($keysByType[$type])) {
                        $keysByType[$type] = ['count' => 0, 'size' => 0];
                    }
                    
                    $keysByType[$type]['count']++;
                    $keysByType[$type]['size'] += $size;
                }
                
                return [
                    'total_keys' => count($keys),
                    'total_size' => $this->formatBytes($totalSize),
                    'by_type' => $keysByType,
                    'driver' => 'redis',
                ];
            }
        } catch (\Exception $e) {
            return [
                'error' => $e->getMessage(),
                'driver' => config('cache.default'),
            ];
        }
        
        return [
            'driver' => config('cache.default'),
            'message' => 'Cache stats only available for Redis',
        ];
    }
    
    /**
     * Formater les bytes en format lisible
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
    
    /**
     * Préchauffer le cache (à exécuter via cron)
     */
    public function warmUp(array $periods = ['today', 'week', 'month', 'year']): void
    {
        $user = Auth::user();
        
        Log::info("🔥 Préchauffage du cache démarré", [
            'user_id' => $user->id,
            'periods' => $periods
        ]);
        
        $statisticsService = app(StatisticsService::class);
        
        foreach ($periods as $period) {
            try {
                $dates = $statisticsService->getPeriodDates($period);
                
                // Préchauffer stats
                $this->remember(
                    'all_stats_' . $period,
                    ['dates' => $dates],
                    fn() => $statisticsService->getAllStats($dates),
                    self::TTL_VERY_LONG
                );
                
                // Préchauffer charts
                $this->remember(
                    'all_charts_' . $period,
                    ['dates' => $dates],
                    fn() => $statisticsService->getAllCharts($dates),
                    self::TTL_VERY_LONG
                );
                
                Log::info("✅ Cache préchauffé", ['period' => $period]);
            } catch (\Exception $e) {
                Log::error("❌ Erreur préchauffage", [
                    'period' => $period,
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        Log::info("🔥 Préchauffage du cache terminé");
    }
}