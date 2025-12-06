// pages/proprietes/helpers.ts
// ✅ Fonctions utilitaires pour les propriétés

import type { ProprieteFormData, ProprieteWithDetails } from './types';

/**
 * ✅ SOLUTION : Convertir une date ISO en format YYYY-MM-DD pour input[type="date"]
 * Gère tous les formats de dates (ISO, timestamp, objets Date)
 */
export function formatDateForInput(dateValue: string | Date | null | undefined): string {
    if (!dateValue) return '';
    
    try {
        const date = new Date(dateValue);
        
        // Vérifier si la date est valide
        if (isNaN(date.getTime())) {
            return '';
        }
        
        // Format YYYY-MM-DD requis par input[type="date"]
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Erreur formatage date:', error, dateValue);
        return '';
    }
}

/**
 * ✅ Convertir une date ISO en format DD-MM-YYYY pour affichage
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

/**
 * Convertir une propriété du serveur en données de formulaire
 * ✅ CORRIGE le problème des dates vides
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
        // ✅ CORRECTION CRITIQUE : Utiliser formatDateForInput
        date_requisition: formatDateForInput(propriete.date_requisition),
        date_inscription: formatDateForInput(propriete.date_inscription),
        dep_vol: propriete.dep_vol || '',
        numero_dep_vol: propriete.numero_dep_vol || '',
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

/**
 * Formater le dep/vol complet
 */
export function formatDepVol(depVol?: string, numeroDepVol?: string): string {
    if (!depVol) return '-';
    if (numeroDepVol) return `${depVol} n°${numeroDepVol}`;
    return depVol;
}

/**
 * Formater le titre complet
 */
export function formatTitre(titre?: string): string {
    if (!titre) return '-';
    return `TNº${titre}`;
}

/**
 * Formater la contenance
 */
export function formatContenance(contenance?: number): string {
    if (!contenance) return '-';
    return `${new Intl.NumberFormat('fr-FR').format(contenance)} m²`;
}

/**
 * Vérifier si une propriété est incomplète
 */
export function isPropertyIncomplete(propriete: ProprieteWithDetails): boolean {
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
export function getPropertyStatusLabel(propriete: ProprieteWithDetails): string {
    if (propriete.status_label) return propriete.status_label;
    
    if (propriete.is_empty) return 'Vide';
    if (propriete.is_archived) return 'Acquise';
    if (propriete.has_active_demandes) return 'Active';
    
    return 'Inconnu';
}

/**
 * Obtenir la classe CSS selon le statut de la propriété
 */
export function getPropertyRowClass(propriete: ProprieteWithDetails): string {
    const baseClass = 'cursor-pointer transition-colors';
    
    if (propriete.is_archived) {
        return `${baseClass} hover:bg-green-50/50 dark:hover:bg-green-900/20 bg-green-50/30 dark:bg-green-900/10`;
    }
    
    if (isPropertyIncomplete(propriete)) {
        return `${baseClass} hover:bg-red-50/50 dark:hover:bg-red-950/20 bg-red-50/30 dark:bg-red-950/10`;
    }
    
    if (propriete.has_active_demandes) {
        return `${baseClass} hover:bg-muted/30`;
    }
    
    // Sans demandeur
    return `${baseClass} hover:bg-amber-50/50 dark:hover:bg-amber-950/20 bg-amber-50/30 dark:bg-amber-950/10`;
}