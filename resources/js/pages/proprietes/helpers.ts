// pages/proprietes/helpers.ts - ✅ RECHERCHE MISE À JOUR

import type { Propriete } from '@/types';
import type { 
    FiltreStatutProprieteType, 
    TriProprieteType,
    ProprieteFormData,
    ProprieteWithDetails 
} from './types';

// ============================================
// 🔍 FILTRAGE ET RECHERCHE
// ============================================

/**
 * Vérifier si propriété a des demandeurs actifs
 */
export const hasActiveDemandeurs = (prop: Propriete): boolean => {
    if (prop.demandes && Array.isArray(prop.demandes) && prop.demandes.length > 0) {
        return prop.demandes.some(d => d.status === 'active');
    }
    return false;
};

/**
 * Vérifier si propriété est acquise (archivée)
 */
export const isPropertyArchived = (prop: Propriete): boolean => {
    if (prop.is_archived === true) {
        return true;
    }
    
    if (prop.demandes && Array.isArray(prop.demandes) && prop.demandes.length > 0) {
        const activeDemandes = prop.demandes.filter(d => d.status === 'active');
        const archivedDemandes = prop.demandes.filter(d => d.status === 'archive');
        
        return activeDemandes.length === 0 && archivedDemandes.length > 0;
    }
    
    return false;
};

/**
 * Filtrer propriétés par statut
 */
export const filterProprietesByStatus = (
    proprietes: Propriete[],
    filtre: FiltreStatutProprieteType
): Propriete[] => {
    if (filtre === 'tous') return proprietes;
    
    return proprietes.filter(prop => {
        switch (filtre) {
            case 'actives':
                return hasActiveDemandeurs(prop) && !isPropertyArchived(prop);
            case 'acquises':
                return isPropertyArchived(prop);
            case 'sans_demandeur':
                return !prop.demandes || prop.demandes.length === 0;
            default:
                return true;
        }
    });
};

/**
 * ✅ RECHERCHE COMPLÈTE - Incluant propriétaire et dep/vol
 */
export const matchesSearch = (prop: Propriete, search: string): boolean => {
    const searchLower = search.toLowerCase();
    return (
        // Recherche de base
        prop.lot?.toLowerCase().includes(searchLower) ||
        prop.titre?.toLowerCase().includes(searchLower) ||
        prop.titre_complet?.toLowerCase().includes(searchLower) ||
        prop.nature?.toLowerCase().includes(searchLower) ||
        prop.situation?.toLowerCase().includes(searchLower) ||
        
        // ✅ AJOUT : Recherche dans propriétaire
        prop.proprietaire?.toLowerCase().includes(searchLower) ||
        
        // Recherche dans Dep/Vol Inscription
        prop.dep_vol_inscription?.toLowerCase().includes(searchLower) ||
        prop.numero_dep_vol_inscription?.toLowerCase().includes(searchLower) ||
        prop.dep_vol_inscription_complet?.toLowerCase().includes(searchLower) ||
        
        // Recherche dans Dep/Vol Réquisition
        prop.dep_vol_requisition?.toLowerCase().includes(searchLower) ||
        prop.numero_dep_vol_requisition?.toLowerCase().includes(searchLower) ||
        prop.dep_vol_requisition_complet?.toLowerCase().includes(searchLower) ||
        
        // ⚠️ Recherche dans anciens champs (compatibilité)
        prop.dep_vol?.toLowerCase().includes(searchLower) ||
        prop.numero_dep_vol?.toLowerCase().includes(searchLower) ||
        prop.dep_vol_complet?.toLowerCase().includes(searchLower)
    );
};

/**
 * Trier propriétés
 */
export const sortProprietes = (
    proprietes: Propriete[],
    tri: TriProprieteType,
    ordre: 'asc' | 'desc'
): Propriete[] => {
    const sorted = [...proprietes].sort((a, b) => {
        let comparison = 0;
        
        switch (tri) {
            case 'date':
                comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
                break;
            case 'lot':
                comparison = (a.lot || '').localeCompare(b.lot || '');
                break;
            case 'contenance':
                comparison = (a.contenance || 0) - (b.contenance || 0);
                break;
            case 'statut':
                const getStatutScore = (prop: Propriete) => {
                    if (isPropertyArchived(prop)) return 2;
                    if (hasActiveDemandeurs(prop)) return 3;
                    if (!prop.demandes || prop.demandes.length === 0) return 1;
                    return 4;
                };
                comparison = getStatutScore(a) - getStatutScore(b);
                break;
        }
        
        return ordre === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
};

/**
 * Obtenir la classe CSS pour la ligne
 */
export const getRowClassName = (prop: Propriete, isIncomplete: boolean): string => {
    const archived = isPropertyArchived(prop);
    const hasActive = hasActiveDemandeurs(prop);
    
    if (archived) {
        return 'hover:bg-green-50/50 dark:hover:bg-green-900/20 bg-green-50/30 dark:bg-green-900/10 cursor-pointer transition-colors';
    }
    if (isIncomplete) {
        return 'hover:bg-red-50/50 dark:hover:bg-red-950/20 bg-red-50/30 dark:bg-red-950/10 cursor-pointer transition-colors';
    }
    if (hasActive) {
        return 'hover:bg-muted/30 cursor-pointer transition-colors';
    }
    return 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20 bg-amber-50/30 dark:bg-amber-950/10 cursor-pointer transition-colors';
};

// ============================================
// 📅 FORMATAGE DES DATES
// ============================================

/**
 * Convertir une date ISO en format YYYY-MM-DD pour input[type="date"]
 */
export function formatDateForInput(dateValue: string | Date | null | undefined): string {
    if (!dateValue) return '';
    
    try {
        const date = new Date(dateValue);
        
        if (isNaN(date.getTime())) {
            return '';
        }
        
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Erreur formatage date:', error, dateValue);
        return '';
    }
}

/**
 * Convertir une date ISO en format DD-MM-YYYY pour affichage
 */
export function formatDateForDisplay(dateValue: string | Date | null | undefined): string {
    if (!dateValue) return '-';
    
    try {
        const date = new Date(dateValue);
        
        if (isNaN(date.getTime())) {
            return '-';
        }
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}-${month}-${year}`;
    } catch (error) {
        console.error('Erreur formatage date affichage:', error, dateValue);
        return '-';
    }
}

// ============================================
// 🎨 FORMATAGE POUR AFFICHAGE
// ============================================

/**
 * Formater le titre complet
 */
export function formatTitre(titre?: string | null): string {
    if (!titre) return '-';
    return `TNº${titre}`;
}

/**
 * Formater la contenance
 */
export function formatContenance(contenance?: number | null): string {
    if (!contenance) return '-';
    return `${new Intl.NumberFormat('fr-FR').format(contenance)} m²`;
}

// ============================================
// 🔄 CONVERSION DE DONNÉES
// ============================================

/**
 * ✅ Convertir une propriété en données de formulaire
 */
export function proprieteToFormData(propriete: ProprieteWithDetails, dossierId?: number): ProprieteFormData {
    return {
        lot: propriete.lot || '',
        type_operation: propriete.type_operation || 'immatriculation',
        nature: propriete.nature || '',
        vocation: propriete.vocation || '',
        proprietaire: propriete.proprietaire || '',
        situation: propriete.situation || '',
        propriete_mere: propriete.propriete_mere || '',
        titre_mere: propriete.titre_mere || '',
        titre: propriete.titre || '',
        contenance: propriete.contenance?.toString() || '',
        charge: propriete.charge || '',
        numero_FN: propriete.numero_FN || '',
        numero_requisition: propriete.numero_requisition || '',
        
        // ✅ DATES MISES À JOUR
        date_requisition: formatDateForInput(propriete.date_requisition),
        date_depot_1: formatDateForInput(propriete.date_depot_1),
        date_depot_2: formatDateForInput(propriete.date_depot_2),
        date_approbation_acte: formatDateForInput(propriete.date_approbation_acte),
        
        // Dep/Vol
        dep_vol_inscription: propriete.dep_vol_inscription || '',
        numero_dep_vol_inscription: propriete.numero_dep_vol_inscription || '',
        dep_vol_requisition: propriete.dep_vol_requisition || '',
        numero_dep_vol_requisition: propriete.numero_dep_vol_requisition || '',
        
        id_dossier: dossierId || propriete.id_dossier || 0,
    };
}

/**
 * Extraire les charges sélectionnées depuis une chaîne
 */
export function parseSelectedCharges(chargeString: string | null | undefined): string[] {
    if (!chargeString) return [];
    return chargeString.split(',').map(c => c.trim()).filter(Boolean);
}

// ============================================
// ✅ VALIDATION ET VÉRIFICATION
// ============================================

/**
 * Vérifier si une propriété est incomplète
 */
export function isPropertyIncomplete(propriete: Propriete): boolean {
    return !propriete.titre 
        || !propriete.contenance 
        || !propriete.proprietaire 
        || !propriete.nature 
        || !propriete.vocation 
        || !propriete.situation;
}

/**
 * Obtenir le label de statut d'une propriété
 */
export function getPropertyStatusLabel(propriete: Propriete): string {
    if (propriete.status_label) return propriete.status_label;
    
    if (!propriete.demandes || propriete.demandes.length === 0) return 'Sans demandeur';
    if (isPropertyArchived(propriete)) return 'Acquise';
    if (hasActiveDemandeurs(propriete)) return 'Active';
    
    return 'Inconnu';
}

/**
 * Obtenir la classe CSS selon le statut de la propriété
 */
export function getPropertyRowClass(propriete: Propriete): string {
    const baseClass = 'cursor-pointer transition-colors';
    const isIncomplete = isPropertyIncomplete(propriete);
    
    if (isPropertyArchived(propriete)) {
        return `${baseClass} hover:bg-green-50/50 dark:hover:bg-green-900/20 bg-green-50/30 dark:bg-green-900/10`;
    }
    
    if (isIncomplete) {
        return `${baseClass} hover:bg-red-50/50 dark:hover:bg-red-950/20 bg-red-50/30 dark:bg-red-950/10`;
    }
    
    if (hasActiveDemandeurs(propriete)) {
        return `${baseClass} hover:bg-muted/30`;
    }
    
    // Sans demandeur
    return `${baseClass} hover:bg-amber-50/50 dark:hover:bg-amber-950/20 bg-amber-50/30 dark:bg-amber-950/10`;
}