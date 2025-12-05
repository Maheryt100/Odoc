// admin/activity-logs/config.ts

/**
 * Configuration des badges d'actions
 */
export const ACTION_BADGE_CONFIG: Record<string, { className: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    generate: {
        className: 'bg-blue-500 hover:bg-blue-600',
        variant: 'default',
    },
    download: {
        className: 'bg-green-500 hover:bg-green-600',
        variant: 'default',
    },
    create: {
        className: 'bg-purple-500 hover:bg-purple-600',
        variant: 'default',
    },
    update: {
        className: 'bg-yellow-500 hover:bg-yellow-600',
        variant: 'default',
    },
    delete: {
        className: 'bg-red-500 hover:bg-red-600',
        variant: 'destructive',
    },
    login: {
        className: 'bg-gray-500 hover:bg-gray-600',
        variant: 'secondary',
    },
    logout: {
        className: 'bg-gray-400 hover:bg-gray-500',
        variant: 'secondary',
    },
    archive: {
        className: 'bg-orange-500 hover:bg-orange-600',
        variant: 'default',
    },
    unarchive: {
        className: 'bg-indigo-500 hover:bg-indigo-600',
        variant: 'default',
    },
    export: {
        className: 'bg-teal-500 hover:bg-teal-600',
        variant: 'default',
    },
};

/**
 * Configuration de la recherche
 */
export const SEARCH_CONFIG = {
    debounceDelay: 500,
    minSearchLength: 2,
    placeholder: 'Rechercher dans les logs...',
};

/**
 * Configuration des icônes pour les stats
 */
export const STATS_ICON_CONFIG = {
    total: { color: 'text-muted-foreground' },
    today: { color: 'text-blue-500' },
    week: { color: 'text-green-500' },
    month: { color: 'text-purple-500' },
    documents: { color: 'text-orange-500' },
};