// pages/admin/activity-logs/hooks/useLogFilters.ts
import { useMemo } from 'react';
import { ActivityLog, ActivityFilters } from '../types';

export const useLogFilters = (
    logs: ActivityLog[],
    filters: ActivityFilters
) => {
    return useMemo(() => {
        let filtered = [...logs];

        // Recherche textuelle
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(log =>
                log.user?.name.toLowerCase().includes(searchLower) ||
                log.user?.email.toLowerCase().includes(searchLower) ||
                log.action_label.toLowerCase().includes(searchLower) ||
                log.entity_label.toLowerCase().includes(searchLower) ||
                log.details.toLowerCase().includes(searchLower)
            );
        }

        // Filtre par utilisateur
        if (filters.user_id && filters.user_id !== 'all') {
            filtered = filtered.filter(log =>
                log.user?.id.toString() === filters.user_id
            );
        }

        // Filtre par action
        if (filters.action && filters.action !== 'all') {
            filtered = filtered.filter(log => log.action === filters.action);
        }

        // Filtre par type de document
        if (filters.document_type && filters.document_type !== 'all') {
            filtered = filtered.filter(log =>
                log.document_type === filters.document_type
            );
        }

        // Filtre par date début
        if (filters.date_from) {
            filtered = filtered.filter(log =>
                new Date(log.created_at) >= new Date(filters.date_from!)
            );
        }

        // Filtre par date fin
        if (filters.date_to) {
            filtered = filtered.filter(log =>
                new Date(log.created_at) <= new Date(filters.date_to!)
            );
        }

        return filtered;
    }, [
        logs,
        filters.search,
        filters.user_id,
        filters.action,
        filters.document_type,
        filters.date_from,
        filters.date_to,
    ]);
};

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

export const clearAllFilters = (): ActivityFilters => ({
    search: '',
    user_id: 'all',
    action: 'all',
    document_type: 'all',
    date_from: '',
    date_to: '',
});