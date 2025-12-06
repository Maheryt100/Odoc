// pages/demandeurs/validation.ts

import type { Demandeur } from '@/types';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VALIDATION DEMANDEURS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Champs obligatoires pour un demandeur complet
 */
const REQUIRED_FIELDS = [
    'date_naissance',
    'lieu_naissance',
    'date_delivrance',
    'lieu_delivrance',
    'domiciliation',
    'occupation',
    'nom_mere'
] as const;

/**
 * Vérifier si un demandeur est incomplet
 */
export function isDemandeurIncomplete(demandeur: Demandeur): boolean {
    return REQUIRED_FIELDS.some(field => !demandeur[field]);
}

/**
 * Obtenir la liste des champs manquants
 */
export function getMissingFields(demandeur: Demandeur): string[] {
    const missing: string[] = [];
    
    const fieldLabels: Record<typeof REQUIRED_FIELDS[number], string> = {
        date_naissance: 'Date de naissance',
        lieu_naissance: 'Lieu de naissance',
        date_delivrance: 'Date de délivrance CIN',
        lieu_delivrance: 'Lieu de délivrance CIN',
        domiciliation: 'Domiciliation',
        occupation: 'Occupation',
        nom_mere: 'Nom de la mère'
    };
    
    REQUIRED_FIELDS.forEach(field => {
        if (!demandeur[field]) {
            missing.push(fieldLabels[field]);
        }
    });
    
    return missing;
}

/**
 * Valider un numéro CIN
 */
export function isValidCIN(cin: string): boolean {
    return /^\d{12}$/.test(cin);
}

/**
 * Valider un numéro de téléphone malgache
 */
export function isValidTelephone(telephone: string): boolean {
    if (!telephone) return true; // Optionnel
    return /^0\d{9}$/.test(telephone);
}

/**
 * Valider une date de naissance (18 ans minimum)
 */
export function isValidDateNaissance(date: string): boolean {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= 18;
    }
    
    return age >= 18;
}

/**
 * Valider les données d'un formulaire demandeur
 */
export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

export function validateDemandeurForm(data: Partial<Demandeur>): ValidationResult {
    const errors: Record<string, string> = {};

    // Titre
    if (!data.titre_demandeur?.trim()) {
        errors.titre_demandeur = 'Le titre de civilité est obligatoire';
    }

    // Nom
    if (!data.nom_demandeur?.trim()) {
        errors.nom_demandeur = 'Le nom est obligatoire';
    }

    // Prénom
    if (!data.prenom_demandeur?.trim()) {
        errors.prenom_demandeur = 'Le prénom est obligatoire';
    }

    // Date de naissance
    if (!data.date_naissance) {
        errors.date_naissance = 'La date de naissance est obligatoire';
    } else if (!isValidDateNaissance(data.date_naissance)) {
        errors.date_naissance = 'Le demandeur doit avoir au moins 18 ans';
    }

    // CIN
    if (!data.cin) {
        errors.cin = 'Le numéro CIN est obligatoire';
    } else if (!isValidCIN(data.cin)) {
        errors.cin = 'Le CIN doit contenir exactement 12 chiffres';
    }

    // Téléphone (optionnel mais validé si présent)
    if (data.telephone && !isValidTelephone(data.telephone)) {
        errors.telephone = 'Le numéro de téléphone doit contenir 10 chiffres et commencer par 0';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Formater un CIN pour affichage (XXX.XXX.XXX.XXX)
 */
export function formatCIN(cin: string): string {
    if (!cin || cin.length !== 12) return cin;
    return cin.match(/.{1,3}/g)?.join('.') || cin;
}

/**
 * Formater un numéro de téléphone pour affichage
 */
export function formatTelephone(telephone: string): string {
    if (!telephone || telephone.length !== 10) return telephone;
    return telephone.replace(/(\d{3})(\d{2})(\d{3})(\d{2})/, '$1 $2 $3 $4');
}

/**
 * Calculer le pourcentage de complétude d'un demandeur
 */
export function getCompletudePercentage(demandeur: Demandeur): number {
    const totalFields = REQUIRED_FIELDS.length;
    const filledFields = REQUIRED_FIELDS.filter(field => demandeur[field]).length;
    
    return Math.round((filledFields / totalFields) * 100);
}