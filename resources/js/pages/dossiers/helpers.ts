// resources/js/pages/dossiers/helpers.ts
import type { Dossier, DossierPermissions } from './types';

/*
 * RÈGLE DE PERMISSION : Génération de documents sur dossiers fermés
 * AUTORISÉS : super_admin, admin_district (leur district uniquement)
 * INTERDITS : central_user, user_district
 */

interface UserRole {
    role: string;
    id_district?: number | null;
}

/**
 * Vérifier si l'utilisateur peut générer des documents sur un dossier fermé
 */
export function canGenerateDocumentsOnClosedDossier(
    dossier: Dossier,
    user: UserRole
): boolean {
    // Si le dossier est ouvert, tout le monde peut générer (selon permissions habituelles)
    if (!dossier.is_closed) {
        return true;
    }

    // Dossier fermé : seulement super_admin et admin_district
    if (user.role === 'super_admin') {
        return true;
    }

    if (user.role === 'admin_district') {
        // Admin district peut seulement dans son district
        return user.id_district === dossier.id_district;
    }

    // central_user et user_district NE PEUVENT PAS
    return false;
}

/**
 * Obtenir le message de tooltip pour un bouton désactivé
 */
export function getDisabledDocumentButtonTooltip(
    dossier: Dossier,
    user: UserRole
): string {
    if (!dossier.is_closed) {
        return '';
    }

    if (user.role === 'super_admin') {
        return '';
    }

    if (user.role === 'admin_district') {
        if (user.id_district !== dossier.id_district) {
            return 'Ce dossier appartient à un autre district';
        }
        return '';
    }

    // central_user et user_district
    return 'Génération de documents interdite sur les dossiers fermés. Contactez un administrateur.';
}

/**
 * Formater une date pour l'affichage
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Obtenir la durée en jours entre deux dates
 */
export function getDurationInDays(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Obtenir le nombre de jours depuis une date
 */
export function getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Vérifier si un dossier est complet
 */
export function isDossierComplete(dossier: Dossier): boolean {
    return (dossier.demandeurs_count ?? 0) > 0 && (dossier.proprietes_count ?? 0) > 0;
}

/**
 * Obtenir le badge de statut du dossier
 */
export function getDossierStatusBadge(dossier: Dossier): {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    label: string;
    color: string;
} {
    if (dossier.is_closed) {
        return {
            variant: 'outline',
            label: 'Fermé',
            color: 'bg-orange-100 text-orange-700 border-orange-300'
        };
    }

    if (!isDossierComplete(dossier)) {
        return {
            variant: 'outline',
            label: 'Incomplet',
            color: 'bg-amber-100 text-amber-700 border-amber-300'
        };
    }

    return {
        variant: 'outline',
        label: 'Ouvert',
        color: 'bg-green-100 text-green-700 border-green-300'
    };
}

/**
 * Calculer toutes les permissions pour un dossier
 */
export function calculateDossierPermissions(
    dossier: Dossier,
    user: UserRole
): DossierPermissions {
    const isSuperAdmin = user.role === 'super_admin';
    const isAdminDistrict = user.role === 'admin_district';
    const isCentralUser = user.role === 'central_user';
    const isUserDistrict = user.role === 'user_district';
    
    const isOwnDistrict = user.id_district === dossier.id_district;
    const canAccessAllDistricts = isSuperAdmin || isCentralUser;

    // Permissions de base
    const hasDistrictAccess = canAccessAllDistricts || isOwnDistrict;

    // Modification : seulement si ouvert et accès au district
    const canEdit = !dossier.is_closed && hasDistrictAccess && 
        (isSuperAdmin || isAdminDistrict || isCentralUser || isUserDistrict);

    // Suppression : seulement admins, dossier ouvert et accès
    const canDelete = !dossier.is_closed && hasDistrictAccess && 
        (isSuperAdmin || isAdminDistrict);

    // Fermeture/Réouverture : super_admin, central_user, admin_district
    const canClose = hasDistrictAccess && 
        (isSuperAdmin || isCentralUser || (isAdminDistrict && isOwnDistrict));

    // Archivage : si peut modifier
    const canArchive = canEdit;

    // Export : tous sauf user_district
    const canExport = hasDistrictAccess && 
        (isSuperAdmin || isCentralUser || isAdminDistrict);

    //Génération de documents
    const canGenerateDocuments = canGenerateDocumentsOnClosedDossier(dossier, user);

    return {
        canEdit,
        canDelete,
        canClose,
        canArchive,
        canExport,
        canGenerateDocuments
    };
}

/**
 * Filtrer les dossiers selon les critères
 */
export function filterDossiers(
    dossiers: Dossier[],
    filters: {
        search?: string;
        status?: 'all' | 'open' | 'closed';
        dateDebut?: string;
        dateFin?: string;
        selectedLetter?: string | null;
    }
): Dossier[] {
    return dossiers.filter(dossier => {
        // Filtre par recherche
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const numeroStr = dossier.numero_ouverture?.toString() || '';
            const matchesSearch = 
                dossier.nom_dossier.toLowerCase().includes(searchLower) ||
                dossier.commune.toLowerCase().includes(searchLower) ||
                dossier.circonscription.toLowerCase().includes(searchLower) ||
                numeroStr.includes(searchLower);
            
            if (!matchesSearch) return false;
        }

        // Filtre par statut
        if (filters.status === 'open' && dossier.is_closed) return false;
        if (filters.status === 'closed' && !dossier.is_closed) return false;

        // Filtre par dates
        if (filters.dateDebut) {
            const dateDebut = new Date(filters.dateDebut);
            const dossierDate = new Date(dossier.date_descente_debut);
            if (dossierDate < dateDebut) return false;
        }

        if (filters.dateFin) {
            const dateFin = new Date(filters.dateFin);
            const dossierDate = new Date(dossier.date_descente_fin);
            if (dossierDate > dateFin) return false;
        }

        // Filtre par lettre
        if (filters.selectedLetter) {
            if (!dossier.nom_dossier.toUpperCase().startsWith(filters.selectedLetter)) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Trier les dossiers
 */
export function sortDossiers(
    dossiers: Dossier[],
    sortBy: 'date' | 'nom',
    sortOrder: 'asc' | 'desc'
): Dossier[] {
    const sorted = [...dossiers].sort((a, b) => {
        if (sortBy === 'date') {
            const dateA = new Date(a.date_descente_debut).getTime();
            const dateB = new Date(b.date_descente_debut).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
            return sortOrder === 'asc'
                ? a.nom_dossier.localeCompare(b.nom_dossier)
                : b.nom_dossier.localeCompare(a.nom_dossier);
        }
    });

    return sorted;
}