<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSettings extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
    ];

    /**
     * Obtenir une valeur de paramètre (avec cache)
     */
    public static function get(string $key, $default = null)
    {
        return Cache::remember("setting_{$key}", 3600, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();
            
            if (!$setting) {
                return $default;
            }

            return static::castValue($setting->value, $setting->type);
        });
    }

    /**
     * Définir une valeur de paramètre
     */
    public static function set(string $key, $value, string $type = 'string'): void
    {
        $stringValue = is_array($value) ? json_encode($value) : (string) $value;
        
        static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $stringValue,
                'type' => $type,
            ]
        );

        Cache::forget("setting_{$key}");
    }

    /**
     * Convertir une valeur selon son type
     */
    private static function castValue($value, string $type)
    {
        if ($value === null) {
            return null;
        }

        return match($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $value,
            'float' => (float) $value,
            'json' => json_decode($value, true),
            default => $value,
        };
    }

    /**
     * Obtenir tous les paramètres d'un groupe
     */
    public static function getGroup(string $prefix): array
    {
        return static::where('key', 'like', "{$prefix}%")
            ->get()
            ->mapWithKeys(function ($setting) {
                return [$setting->key => static::castValue($setting->value, $setting->type)];
            })
            ->toArray();
    }

    /**
     * Vérifier si la suppression automatique est activée
     */
    public static function isAutoDeleteEnabled(): bool
    {
        return static::get('logs_auto_delete_enabled', false);
    }

    /**
     * Obtenir le nombre de jours de rétention
     */
    public static function getRetentionDays(): int
    {
        return static::get('logs_retention_days', 90);
    }

    /**
     * Vérifier si l'export automatique est activé
     */
    public static function isAutoExportEnabled(): bool
    {
        return static::get('logs_auto_export_before_delete', true);
    }

    /**
     * Mettre à jour la date du dernier nettoyage
     */
    public static function updateLastCleanup(): void
    {
        static::set('logs_last_cleanup', now()->toDateTimeString());
    }

    /**
     * Mettre à jour la date du dernier export
     */
    public static function updateLastExport(): void
    {
        static::set('logs_last_export', now()->toDateTimeString());
    }

    /**
     * Obtenir la date du dernier nettoyage
     */
    public static function getLastCleanup(): ?string
    {
        return static::get('logs_last_cleanup');
    }

    /**
     * Obtenir la date du dernier export
     */
    public static function getLastExport(): ?string
    {
        return static::get('logs_last_export');
    }

    public static function getCleanupFrequency(): string
    {
        return static::get('logs_cleanup_frequency', 'monthly');
    }

    public static function updateLastAutoCheck(): void
    {
        static::set('logs_last_auto_check', now()->toDateTimeString());
    }

    public static function getLastAutoCheck(): ?string
    {
        return static::get('logs_last_auto_check');
    }

    public static function shouldCheckForCleanup(): bool
    {
        $lastCheck = static::getLastAutoCheck();
        if (!$lastCheck) return true;
        
        return now()->diffInHours($lastCheck) >= 1;
    }

    public static function shouldRunAutoCleanup(): bool
    {
        if (!static::isAutoDeleteEnabled()) {
            return false;
        }

        $lastCleanup = static::getLastCleanup();
        if (!$lastCleanup) return true;

        $frequency = static::getCleanupFrequency();
        $lastCleanupDate = new \DateTime($lastCleanup);
        $now = new \DateTime();

        return match($frequency) {
            'daily' => $now->diff($lastCleanupDate)->days >= 1,
            'weekly' => $now->diff($lastCleanupDate)->days >= 7,
            'monthly' => $now->diff($lastCleanupDate)->days >= 30,
            default => false,
        };
    }

    public static function getNextCleanupDate(): ?\DateTime
    {
        if (!static::isAutoDeleteEnabled()) {
            return null;
        }

        $lastCleanup = static::getLastCleanup();
        if (!$lastCleanup) {
            return now();
        }

        $frequency = static::getCleanupFrequency();
        $lastDate = new \DateTime($lastCleanup);

        return match($frequency) {
            'daily' => (clone $lastDate)->modify('+1 day'),
            'weekly' => (clone $lastDate)->modify('+7 days'),
            'monthly' => (clone $lastDate)->modify('+1 month'),
            default => null,
        };
    }
}