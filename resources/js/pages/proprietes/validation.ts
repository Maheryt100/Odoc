// pages/proprietes/validation.ts - ✅ VERSION FINALE
// Logique de validation pour les propriétés

import type { ProprieteFormData } from './types';
import { toast } from 'sonner';

/**
 * Résultat de validation
 */
export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
    firstError?: string;
}

/**
 * Valider les champs obligatoires d'une propriété
 */
export function validateProprieteForm(data: ProprieteFormData): ValidationResult {
    const errors: Record<string, string> = {};

    // Champs obligatoires
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

    // Validation des dates si présentes
    if (data.date_requisition && !isValidDate(data.date_requisition)) {
        errors.date_requisition = 'Date de réquisition invalide';
    }

    if (data.date_inscription && !isValidDate(data.date_inscription)) {
        errors.date_inscription = 'Date d\'inscription invalide';
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
 * Valider un tableau de propriétés (pour création multiple)
 */
export function validateMultipleProprietes(proprietes: ProprieteFormData[]): ValidationResult {
    const errors: Record<string, string> = {};

    for (let i = 0; i < proprietes.length; i++) {
        const validation = validateProprieteForm(proprietes[i]);
        
        if (!validation.isValid) {
            Object.entries(validation.errors).forEach(([field, message]) => {
                errors[`propriete_${i + 1}_${field}`] = `Propriété ${i + 1}: ${message}`;
            });
        }
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
    // "Aucune" ne peut pas être combinée avec d'autres charges
    if (selectedCharges.includes("Aucune") && selectedCharges.length > 1) {
        toast.error('La charge "Aucune" ne peut pas être combinée avec d\'autres charges');
        return false;
    }

    return true;
}