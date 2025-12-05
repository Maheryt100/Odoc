// admin/activity-logs/helpers.ts
import { ActivityFilters } from './types';

/**
 * Construit les paramètres de recherche pour l'URL
 */
export const buildSearchParams = (filters: ActivityFilters): Record<string, string> => {
    const params: Record<string, string> = {};
    
    if (filters.search?.trim()) {
        params.search = filters.search.trim();
    }
    if (filters.user_id && filters.user_id !== 'all') {
        params.user_id = filters.user_id;
    }
    if (filters.action && filters.action !== 'all') {
        params.action = filters.action;
    }
    if (filters.document_type && filters.document_type !== 'all') {
        params.document_type = filters.document_type;
    }
    if (filters.date_from) {
        params.date_from = filters.date_from;
    }
    if (filters.date_to) {
        params.date_to = filters.date_to;
    }
    
    return params;
};

/**
 * Vérifie si des filtres sont actifs
 */
export const hasActiveFilters = (filters: ActivityFilters): boolean => {
    return !!(
        filters.search ||
        (filters.user_id && filters.user_id !== 'all') ||
        (filters.action && filters.action !== 'all') ||
        (filters.document_type && filters.document_type !== 'all') ||
        filters.date_from ||
        filters.date_to
    );
};

/**
 * Réinitialise tous les filtres
 */
export const clearAllFilters = (): ActivityFilters => ({
    search: '',
    user_id: 'all',
    action: 'all',
    document_type: 'all',
    date_from: '',
    date_to: '',
});

/**
 * Formate les métadonnées d'un log
 */
export const formatMetadata = (metadata: any): string => {
    if (!metadata) return 'N/A';
    
    const keys = ['lot', 'numero_recu', 'montant', 'demandeurs_count'];
    const parts: string[] = [];
    
    for (const key of keys) {
        if (metadata[key]) {
            const label = formatMetadataKey(key);
            parts.push(`${label}: ${metadata[key]}`);
        }
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'N/A';
};

/**
 * Formate une clé de métadonnée
 */
const formatMetadataKey = (key: string): string => {
    const labels: Record<string, string> = {
        lot: 'Lot',
        numero_recu: 'N° Reçu',
        montant: 'Montant',
        demandeurs_count: 'Demandeurs',
    };
    return labels[key] || key;
};

/**
 * Formate une date au format local
 */
export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Génère un avatar coloré basé sur le nom
 */
export const getAvatarColor = (name: string): string => {
    const colors = [
        'from-blue-500 to-indigo-500',
        'from-purple-500 to-pink-500',
        'from-green-500 to-emerald-500',
        'from-orange-500 to-red-500',
        'from-cyan-500 to-blue-500',
        'from-violet-500 to-purple-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

/**
 * Obtient les initiales d'un nom
 */
export const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};