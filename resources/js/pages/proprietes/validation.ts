// pages/proprietes/validation.ts 

import type { ProprieteFormData } from './types';
import { toast } from 'sonner';

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
    firstError?: string;
}

/**
 *  Valider les champs obligatoires avec nouvelles dates
 */
export function validateProprieteForm(data: ProprieteFormData): ValidationResult {
    const errors: Record<string, string> = {};

    // Champs obligatoires de base
    if (!data.lot?.trim()) {
        errors.lot = 'Le lot est obligatoire';
    }

    if (!data.type_operation) {
        errors.type_operation = 'Le type d\'opération est obligatoire';
    }

    if (!data.nature) {
        errors.nature = 'La nature est obligatoire';
    }

    if (!data.vocation) {
        errors.vocation = 'La vocation est obligatoire';
    }

    // Validation de la contenance si présente
    if (data.contenance) {
        const contenanceNum = parseFloat(data.contenance);
        if (isNaN(contenanceNum) || contenanceNum <= 0) {
            errors.contenance = 'La contenance doit être un nombre positif';
        }
    }

    //  VALIDATION DES DATES
    if (data.date_requisition && !isValidDate(data.date_requisition)) {
        errors.date_requisition = 'Date de réquisition invalide';
    }

    if (data.date_depot_1 && !isValidDate(data.date_depot_1)) {
        errors.date_depot_1 = 'Date de dépôt 1 invalide';
    }

    if (data.date_depot_2 && !isValidDate(data.date_depot_2)) {
        errors.date_depot_2 = 'Date de dépôt 2 invalide';
    }

    if (data.date_approbation_acte && !isValidDate(data.date_approbation_acte)) {
        errors.date_approbation_acte = 'Date d\'approbation invalide';
    }

    //  VALIDATION : date_approbation_acte >= date_requisition
    if (data.date_approbation_acte && data.date_requisition) {
        const dateApprobation = new Date(data.date_approbation_acte);
        const dateRequisition = new Date(data.date_requisition);
        
        if (dateApprobation < dateRequisition) {
            errors.date_approbation_acte = 'La date d\'approbation doit être postérieure ou égale à la date de réquisition';
        }
    }

    const isValid = Object.keys(errors).length === 0;
    const firstError = isValid ? undefined : Object.values(errors)[0];

    return { isValid, errors, firstError };
}

/**
 * Valider et afficher les erreurs avec toast
 */
export function validateAndShowErrors(data: ProprieteFormData): boolean {
    const validation = validateProprieteForm(data);

    if (!validation.isValid) {
        toast.error('Erreur de validation', {
            description: validation.firstError
        });
        return false;
    }

    return true;
}

/**
 * Validation spécifique pour la génération de document
 */
export function validateForDocumentGeneration(data: ProprieteFormData): ValidationResult {
    const errors: Record<string, string> = {};

    //  date_approbation_acte OBLIGATOIRE pour génération
    if (!data.date_approbation_acte) {
        errors.date_approbation_acte = 'La date d\'approbation de l\'acte est obligatoire pour générer le document';
    }

    const isValid = Object.keys(errors).length === 0;
    const firstError = isValid ? undefined : Object.values(errors)[0];

    return { isValid, errors, firstError };
}

/**
 * Vérifier si une date est valide
 */
function isValidDate(dateString: string): boolean {
    if (!dateString) return true; // Date optionnelle
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
}

/**
 * Valider les champs spécifiques au morcellement
 */
export function validateMorcellementFields(data: ProprieteFormData): ValidationResult {
    const errors: Record<string, string> = {};

    if (data.type_operation === 'morcellement') {
        if (!data.propriete_mere?.trim()) {
            errors.propriete_mere = 'La propriété mère est requise pour un morcellement';
        }
        
        if (!data.titre_mere?.trim()) {
            errors.titre_mere = 'Le titre mère est requis pour un morcellement';
        }
    }

    const isValid = Object.keys(errors).length === 0;
    const firstError = isValid ? undefined : Object.values(errors)[0];

    return { isValid, errors, firstError };
}

/**
 * Valider les charges sélectionnées
 */
export function validateCharges(selectedCharges: string[]): boolean {
    if (selectedCharges.includes("Aucune") && selectedCharges.length > 1) {
        toast.error('La charge "Aucune" ne peut pas être combinée avec d\'autres charges');
        return false;
    }

    return true;
}