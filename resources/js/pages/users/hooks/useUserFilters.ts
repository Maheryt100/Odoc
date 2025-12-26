// pages/users/hooks/useUserFilters.ts
import { useMemo } from 'react';
import { User } from '../types';

export interface UserFiltersState {
    search: string;
    role: string;
    district: string;
    status: string;
}

/**
 * Hook pour filtrer les utilisateurs côté client (comme Demandeurs)
 */
export const useUserFilters = (
    users: User[],
    filters: UserFiltersState
) => {
    return useMemo(() => {
        let filtered = [...users];

        // Recherche textuelle
        if (filters.search) {
            const searchLower = filters.search.toLowerCase().trim();
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower)
            );
        }

        // Filtre par rôle
        if (filters.role && filters.role !== '') {
            filtered = filtered.filter(user => user.role === filters.role);
        }

        // Filtre par district
        if (filters.district && filters.district !== '') {
            filtered = filtered.filter(user =>
                user.id_district?.toString() === filters.district
            );
        }

        // Filtre par statut
        if (filters.status && filters.status !== '') {
            const isActive = filters.status === 'active';
            filtered = filtered.filter(user => user.status === isActive);
        }

        return filtered;
    }, [users, filters.search, filters.role, filters.district, filters.status]);
};

/**
 * Vérifie si des filtres sont actifs
 */
export const hasActiveFilters = (filters: UserFiltersState): boolean => {
    return !!(
        filters.search ||
        (filters.role && filters.role !== '') ||
        (filters.district && filters.district !== '') ||
        (filters.status && filters.status !== '')
    );
};

/**
 * Réinitialise tous les filtres
 */
export const clearAllFilters = (): UserFiltersState => ({
    search: '',
    role: '',
    district: '',
    status: '',
});