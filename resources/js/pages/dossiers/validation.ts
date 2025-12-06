// resources/js/pages/dossiers/validation.ts
import type { DossierFormData } from './types';

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

/**
 * Valider les données du formulaire de dossier
 */
export function validateDossierForm(data: DossierFormData): ValidationResult {
    const errors: ValidationError[] = [];

    // Nom du dossier
    if (!data.nom_dossier || data.nom_dossier.trim().length === 0) {
        errors.push({
            field: 'nom_dossier',
            message: 'Le nom du dossier est obligatoire'
        });
    } else if (data.nom_dossier.length > 100) {
        errors.push({
            field: 'nom_dossier',
            message: 'Le nom du dossier ne peut pas dépasser 100 caractères'
        });
    }

    // Type commune
    if (!data.type_commune) {
        errors.push({
            field: 'type_commune',
            message: 'Le type de commune est obligatoire'
        });
    } else if (!['Commune Urbaine', 'Commune Rurale'].includes(data.type_commune)) {
        errors.push({
            field: 'type_commune',
            message: 'Type de commune invalide'
        });
    }

    // Commune
    if (!data.commune || data.commune.trim().length === 0) {
        errors.push({
            field: 'commune',
            message: 'La commune est obligatoire'
        });
    } else if (data.commune.length > 70) {
        errors.push({
            field: 'commune',
            message: 'Le nom de la commune ne peut pas dépasser 70 caractères'
        });
    }

    // Fokontany
    if (!data.fokontany || data.fokontany.trim().length === 0) {
        errors.push({
            field: 'fokontany',
            message: 'Le fokontany est obligatoire'
        });
    } else if (data.fokontany.length > 70) {
        errors.push({
            field: 'fokontany',
            message: 'Le nom du fokontany ne peut pas dépasser 70 caractères'
        });
    }

    // Circonscription
    if (!data.circonscription || data.circonscription.trim().length === 0) {
        errors.push({
            field: 'circonscription',
            message: 'La circonscription est obligatoire'
        });
    } else if (data.circonscription.length > 50) {
        errors.push({
            field: 'circonscription',
            message: 'Le nom de la circonscription ne peut pas dépasser 50 caractères'
        });
    }

    // Dates
    if (!data.date_descente_debut) {
        errors.push({
            field: 'date_descente_debut',
            message: 'La date de début de descente est obligatoire'
        });
    }

    if (!data.date_descente_fin) {
        errors.push({
            field: 'date_descente_fin',
            message: 'La date de fin de descente est obligatoire'
        });
    }

    if (!data.date_ouverture) {
        errors.push({
            field: 'date_ouverture',
            message: "La date d'ouverture est obligatoire"
        });
    }

    // Validation des dates si toutes présentes
    if (data.date_descente_debut && data.date_descente_fin) {
        const dateDebut = new Date(data.date_descente_debut);
        const dateFin = new Date(data.date_descente_fin);

        if (dateDebut > dateFin) {
            errors.push({
                field: 'date_descente_fin',
                message: 'La date de fin doit être postérieure à la date de début'
            });
        }
    }

    // District
    if (!data.id_district || data.id_district === 0) {
        errors.push({
            field: 'id_district',
            message: 'Le district est obligatoire'
        });
    }

    // Numéro d'ouverture (optionnel mais si présent, doit être valide)
    if (data.numero_ouverture && data.numero_ouverture.length > 50) {
        errors.push({
            field: 'numero_ouverture',
            message: "Le numéro d'ouverture ne peut pas dépasser 50 caractères"
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valider une date de fermeture
 */
export function validateClosureDate(
    dateFermeture: string,
    dateOuverture: string
): ValidationResult {
    const errors: ValidationError[] = [];

    if (!dateFermeture) {
        errors.push({
            field: 'date_fermeture',
            message: 'La date de fermeture est obligatoire'
        });
    } else {
        const fermeture = new Date(dateFermeture);
        const ouverture = new Date(dateOuverture);

        if (fermeture < ouverture) {
            errors.push({
                field: 'date_fermeture',
                message: "La date de fermeture doit être postérieure à la date d'ouverture"
            });
        }

        const now = new Date();
        if (fermeture > now) {
            errors.push({
                field: 'date_fermeture',
                message: 'La date de fermeture ne peut pas être dans le futur'
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valider un motif de fermeture
 */
export function validateClosureReason(motif: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (motif && motif.length > 500) {
        errors.push({
            field: 'motif_fermeture',
            message: 'Le motif de fermeture ne peut pas dépasser 500 caractères'
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Obtenir le message d'erreur pour un champ spécifique
 */
export function getFieldError(
    errors: ValidationError[],
    field: string
): string | undefined {
    return errors.find(e => e.field === field)?.message;
}

/**
 * Vérifier si un champ a une erreur
 */
export function hasFieldError(
    errors: ValidationError[],
    field: string
): boolean {
    return errors.some(e => e.field === field);
}

/**
 * Formater les erreurs pour l'affichage
 */
export function formatValidationErrors(errors: ValidationError[]): string {
    return errors.map(e => e.message).join('\n');
}