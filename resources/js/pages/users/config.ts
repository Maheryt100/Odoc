// users/config.ts - VERSION CORRIGÉE
import { UserRole } from './types';

/**
 * Configuration des badges de rôle avec descriptions CORRIGÉES
 */
export const ROLE_BADGE_CONFIG: Record<UserRole, { variant: any; label: string; description: string }> = {
    super_admin: {
        variant: 'destructive',
        label: 'Super Admin',
        description: '👁️ LECTURE SEULE sur tous les districts. Peut créer des admin_district uniquement.',
    },
    central_user: {
        variant: 'default',
        label: 'Utilisateur Central',
        description: '👁️ LECTURE SEULE sur tous les districts. Peut exporter les données. Aucune gestion d\'utilisateurs.',
    },
    admin_district: {
        variant: 'default',
        label: 'Admin District',
        description: '✏️ CRÉATION/MODIFICATION/SUPPRESSION dans son district. Peut créer des user_district et configurer les prix.',
    },
    user_district: {
        variant: 'secondary',
        label: 'User District',
        description: '✏️ CRÉATION/MODIFICATION dans son district uniquement. Pas de suppression ni gestion d\'utilisateurs.',
    },
};

/**
 * Configuration des couleurs de statut
 */
export const STATUS_CONFIG = {
    active: {
        variant: 'default' as const,
        className: 'bg-green-500',
        label: 'Actif',
    },
    inactive: {
        variant: 'destructive' as const,
        className: '',
        label: 'Inactif',
    },
};

/**
 * Matrice des permissions par rôle
 */
export const ROLE_PERMISSIONS = {
    super_admin: {
        canCreate: false,           // ❌ LECTURE SEULE
        canUpdate: false,           // ❌ LECTURE SEULE
        canDelete: false,           // ❌ LECTURE SEULE
        canArchive: false,          // ❌ LECTURE SEULE
        canExport: true,            // ✅ Peut exporter
        canManageUsers: true,       // ✅ Peut créer admin_district uniquement
        canConfigurePrices: false,  // ❌ LECTURE SEULE
        canGenerateDocuments: false,// ❌ LECTURE SEULE
        canCloseDossier: false,     // ❌ LECTURE SEULE
        accessScope: 'all',         // Accès à tous les districts
    },
    central_user: {
        canCreate: false,           // ❌ LECTURE SEULE
        canUpdate: false,           // ❌ LECTURE SEULE
        canDelete: false,           // ❌ LECTURE SEULE
        canArchive: false,          // ❌ LECTURE SEULE
        canExport: true,            // ✅ Peut exporter
        canManageUsers: false,      // ❌ Aucune gestion
        canConfigurePrices: false,  // ❌ LECTURE SEULE
        canGenerateDocuments: false,// ❌ LECTURE SEULE
        canCloseDossier: false,     // ❌ LECTURE SEULE
        accessScope: 'all',         // Accès à tous les districts
    },
    admin_district: {
        canCreate: true,            // ✅ Peut créer
        canUpdate: true,            // ✅ Peut modifier
        canDelete: true,            // ✅ Peut supprimer
        canArchive: true,           // ✅ Peut archiver
        canExport: true,            // ✅ Peut exporter
        canManageUsers: true,       // ✅ Peut créer user_district de son district
        canConfigurePrices: true,   // ✅ Peut configurer prix
        canGenerateDocuments: true, // ✅ Peut générer documents
        canCloseDossier: true,      // ✅ Peut fermer/rouvrir dossiers
        accessScope: 'district',    // Accès à son district uniquement
    },
    user_district: {
        canCreate: true,            // ✅ Peut créer
        canUpdate: true,            // ✅ Peut modifier (ses créations)
        canDelete: false,           // ❌ Ne peut pas supprimer
        canArchive: true,           // ✅ Peut archiver
        canExport: true,            // ✅ Peut exporter
        canManageUsers: false,      // ❌ Aucune gestion
        canConfigurePrices: false,  // ❌ Ne peut pas configurer
        canGenerateDocuments: true, // ✅ Peut générer documents
        canCloseDossier: false,     // ❌ Ne peut pas fermer
        accessScope: 'district',    // Accès à son district uniquement
    },
};

/**
 * Labels des permissions
 */
export const PERMISSION_LABELS: Record<string, string> = {
    view_statistics: 'Voir les statistiques',
    export_data: 'Exporter les données',
    manage_prices: 'Gérer les prix',
    archive_documents: 'Archiver les documents',
    delete_documents: 'Supprimer les documents',
    manage_consorts: 'Gérer les consorts',
    generate_documents: 'Générer les documents',
    close_dossiers: 'Fermer/Rouvrir les dossiers',
    manage_users: 'Gérer les utilisateurs',
};

/**
 * Configuration de la pagination
 */
export const PAGINATION_CONFIG = {
    perPage: 15,
    maxPages: 5,
};

/**
 * Configuration du debounce pour la recherche
 */
export const SEARCH_CONFIG = {
    debounceDelay: 500,
    minSearchLength: 2,
};

/**
 * Messages de confirmation
 */
export const CONFIRMATION_MESSAGES = {
    delete: (userName: string) => 
        `Voulez-vous vraiment supprimer l'utilisateur ${userName} ? Cette action est irréversible.`,
    toggleStatus: (userName: string, currentStatus: boolean) =>
        `Voulez-vous vraiment ${currentStatus ? 'désactiver' : 'activer'} l'utilisateur ${userName} ?`,
    resetPassword: (userName: string) =>
        `Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${userName} ?`,
};

/**
 * Messages de succès
 */
export const SUCCESS_MESSAGES = {
    created: (userName: string) => `Utilisateur ${userName} créé avec succès`,
    updated: (userName: string) => `Utilisateur ${userName} modifié avec succès`,
    deleted: (userName: string) => `Utilisateur ${userName} supprimé avec succès`,
    activated: 'Utilisateur activé',
    deactivated: 'Utilisateur désactivé',
    passwordReset: 'Mot de passe réinitialisé avec succès',
};

/**
 * Rôles qui nécessitent une affectation de district
 */
export const ROLES_REQUIRING_DISTRICT: UserRole[] = ['admin_district', 'user_district'];

/**
 * Rôles avec accès global (tous les districts) - LECTURE SEULE
 */
export const ROLES_WITH_GLOBAL_ACCESS: UserRole[] = ['super_admin', 'central_user'];

/**
 * Rôles en lecture seule (ne peuvent ni créer, ni modifier, ni supprimer)
 */
export const READ_ONLY_ROLES: UserRole[] = ['super_admin', 'central_user'];

/**
 * Hiérarchie des rôles pour les créations autorisées
 */
export const ROLE_CREATION_HIERARCHY: Record<UserRole, UserRole[]> = {
    super_admin: ['admin_district'],        // Super admin peut créer admin_district uniquement
    central_user: [],                       // Central user ne peut créer personne
    admin_district: ['user_district'],      // Admin district peut créer user_district uniquement
    user_district: [],                      // User district ne peut créer personne
};

/**
 * Retourne les permissions d'un rôle
 */
export const getRolePermissions = (role: UserRole) => {
    return ROLE_PERMISSIONS[role];
};

/**
 * Vérifie si un rôle est en lecture seule
 */
export const isReadOnlyRole = (role: UserRole): boolean => {
    return READ_ONLY_ROLES.includes(role);
};

/**
 * Vérifie si un rôle peut créer un autre rôle
 */
export const canRoleCreateRole = (creatorRole: UserRole, targetRole: UserRole): boolean => {
    const allowedRoles = ROLE_CREATION_HIERARCHY[creatorRole] || [];
    return allowedRoles.includes(targetRole);
};

/**
 * Messages d'erreur standards
 */
export const ERROR_MESSAGES = {
    unauthorized: 'Vous n\'avez pas la permission d\'effectuer cette action',
    readOnlyRole: 'Ce rôle est en lecture seule et ne peut pas effectuer de modifications',
    invalidDistrict: 'Vous ne pouvez gérer que les utilisateurs de votre district',
    cannotModifySelf: 'Vous ne pouvez pas modifier votre propre compte',
    cannotDeleteLastAdmin: 'Impossible de supprimer le dernier super administrateur',
    userHasData: 'Cet utilisateur a créé des données et ne peut pas être supprimé',
    invalidRoleCreation: 'Vous ne pouvez pas créer ce type d\'utilisateur',
};