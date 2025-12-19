// utils/permissions.ts - Helper de permissions frontend

import type { User, Dossier } from '@/types';

/**
 * Vérifie si l'utilisateur peut créer des ressources
 */
export function canCreate(user: User | undefined): boolean {
    if (!user || !user.status) return false;
    
    // ❌ Super Admin et Central User : READ-ONLY
    if (user.role === 'super_admin' || user.role === 'central_user') {
        return false;
    }
    
    // ✅ Admin District et User District : peuvent créer
    return (user.role === 'admin_district' || user.role === 'user_district') 
        && user.id_district !== null;
}

/**
 * Vérifie si l'utilisateur peut modifier des ressources
 */
export function canUpdate(user: User | undefined): boolean {
    if (!user || !user.status) return false;
    
    // ❌ Super Admin et Central User : READ-ONLY
    if (user.role === 'super_admin' || user.role === 'central_user') {
        return false;
    }
    
    // ✅ Admin District et User District : peuvent modifier
    return (user.role === 'admin_district' || user.role === 'user_district') 
        && user.id_district !== null;
}

/**
 * Vérifie si l'utilisateur peut supprimer des ressources
 */
export function canDelete(user: User | undefined): boolean {
    if (!user || !user.status) return false;
    
    // ❌ Super Admin et Central User : READ-ONLY
    if (user.role === 'super_admin' || user.role === 'central_user') {
        return false;
    }
    
    // ✅ Seul Admin District peut supprimer
    return user.role === 'admin_district' && user.id_district !== null;
}

/**
 * Vérifie si l'utilisateur peut archiver/désarchiver
 */
export function canArchive(user: User | undefined): boolean {
    if (!user || !user.status) return false;
    
    // ❌ Super Admin et Central User : NE PEUVENT PAS
    if (user.role === 'super_admin' || user.role === 'central_user') {
        return false;
    }
    
    // ✅ Admin District et User District peuvent archiver
    return (user.role === 'admin_district' || user.role === 'user_district')
        && user.id_district !== null;
}

/**
 * Vérifie si l'utilisateur peut générer des documents
 */
export function canGenerateDocuments(user: User | undefined): boolean {
    if (!user || !user.status) return false;
    
    // ❌ Super Admin et Central User : NE PEUVENT PAS
    if (user.role === 'super_admin' || user.role === 'central_user') {
        return false;
    }
    
    // ✅ Admin District et User District : PEUVENT
    return (user.role === 'admin_district' || user.role === 'user_district')
        && user.id_district !== null;
}

/**
 * Vérifie si l'utilisateur peut fermer/rouvrir des dossiers
 */
export function canCloseDossier(user: User | undefined): boolean {
    if (!user || !user.status) return false;
    
    // ❌ Super Admin et Central User : NE PEUVENT PAS
    if (user.role === 'super_admin' || user.role === 'central_user') {
        return false;
    }
    
    // ✅ Seul Admin District peut fermer/rouvrir
    return user.role === 'admin_district' && user.id_district !== null;
}

/**
 * Vérifie si l'utilisateur peut gérer les utilisateurs
 */
export function canManageUsers(user: User | undefined): boolean {
    if (!user || !user.status) return false;
    
    // ✅ Super Admin et Admin District peuvent gérer (avec restrictions)
    return user.role === 'super_admin' || user.role === 'admin_district';
}

/**
 * Vérifie quel type d'utilisateur peut être créé
 */
export function canCreateUserType(user: User | undefined, targetRole: string): boolean {
    if (!user || !user.status) return false;
    
    // Super Admin : UNIQUEMENT admin_district
    if (user.role === 'super_admin') {
        return targetRole === 'admin_district';
    }
    
    // Admin District : UNIQUEMENT user_district
    if (user.role === 'admin_district') {
        return targetRole === 'user_district';
    }
    
    return false;
}

/**
 * Vérifie si l'utilisateur peut configurer les prix
 */
export function canConfigurePrices(user: User | undefined): boolean {
    if (!user || !user.status) return false;
    
    // ❌ Super Admin et Central User : READ-ONLY
    if (user.role === 'super_admin' || user.role === 'central_user') {
        return false;
    }
    
    // ✅ Seul Admin District peut configurer
    return user.role === 'admin_district' && user.id_district !== null;
}

/**
 * Obtient le label du rôle avec indication read-only si applicable
 */
export function getRoleLabel(user: User | undefined): string {
    if (!user) return 'Invité';
    
    const labels = {
        super_admin: 'Super Admin (Consultation)',
        central_user: 'Utilisateur Central (Consultation)',
        admin_district: 'Administrateur District',
        user_district: 'Utilisateur District',
    };
    
    return labels[user.role as keyof typeof labels] || user.role;
}

/**
 * Vérifie si l'utilisateur est en mode read-only
 */
export function isReadOnly(user: User | undefined): boolean {
    if (!user) return true;
    return user.role === 'super_admin' || user.role === 'central_user';
}

/**
 * Messages d'explication pour les utilisateurs read-only
 */
export const READ_ONLY_MESSAGES = {
    super_admin: "En tant que Super Administrateur, vous pouvez consulter tous les dossiers mais pas les modifier. Seuls les administrateurs de district peuvent créer et modifier des données.",
    central_user: "En tant qu'Utilisateur Central, vous avez accès à tous les districts en consultation uniquement. Vous ne pouvez pas créer ou modifier de données.",
} as const;

/**
 * Obtient le message d'information read-only approprié
 */
export function getReadOnlyMessage(user: User | undefined): string | null {
    if (!user) return null;
    return READ_ONLY_MESSAGES[user.role as keyof typeof READ_ONLY_MESSAGES] || null;
}