// documents/validation.ts - VERSION STRICTE
import { Demandeur } from '@/types';
import { ProprieteWithDemandeurs, DemandeurLie, ValidationResult } from './types';

/**
 * ✅ Champs OBLIGATOIRES pour l'ADV (toutes les données utilisées dans le template)
 */
const REQUIRED_PROPRIETE_FIELDS = [
    'titre',
    'contenance',
    'proprietaire',
    'nature',
    'vocation',
    'situation',
    'type_operation',
    'date_requisition',
    'date_depot_1',
    'date_depot_2',
    'date_approbation_acte',
    'dep_vol_inscription',
    'numero_dep_vol_inscription',
    'dep_vol_requisition',
    'numero_dep_vol_requisition',
] as const;

const REQUIRED_DEMANDEUR_FIELDS = [
    'titre_demandeur',
    'nom_demandeur',
    'prenom_demandeur',
    'sexe',
    'cin',
    'date_naissance',
    'lieu_naissance',
    'date_delivrance',
    'lieu_delivrance',
    'domiciliation',
    'occupation',
    'nom_mere',
    'nationalite',
] as const;

/**
 * Labels pour affichage utilisateur
 */
const FIELD_LABELS: Record<string, string> = {
    titre: 'Titre',
    contenance: 'Contenance',
    proprietaire: 'Propriétaire',
    nature: 'Nature',
    vocation: 'Vocation',
    situation: 'Situation',
    type_operation: 'Type d\'opération',
    date_requisition: 'Date de réquisition',
    date_depot_1: 'Date de dépôt 1',
    date_depot_2: 'Date de dépôt 2',
    date_approbation_acte: 'Date d\'approbation',
    dep_vol_inscription: 'Dep/Vol inscription',
    numero_dep_vol_inscription: 'N° Dep/Vol inscription',
    dep_vol_requisition: 'Dep/Vol réquisition',
    numero_dep_vol_requisition: 'N° Dep/Vol réquisition',
    titre_demandeur: 'Titre',
    nom_demandeur: 'Nom',
    prenom_demandeur: 'Prénom',
    sexe: 'Sexe',
    cin: 'CIN',
    date_naissance: 'Date de naissance',
    lieu_naissance: 'Lieu de naissance',
    date_delivrance: 'Date de délivrance CIN',
    lieu_delivrance: 'Lieu de délivrance CIN',
    domiciliation: 'Domiciliation',
    occupation: 'Occupation',
    nom_mere: 'Nom de la mère',
    nationalite: 'Nationalité',
};

/**
 * ✅ Valider le format du numéro de reçu XXX/XX
 */
export const validateNumeroRecuFormat = (numero: string): boolean => {
    const trimmed = numero.trim();
    return /^\d{3}\/\d{2}$/.test(trimmed);
};

/**
 * ✅ Formater automatiquement la saisie du numéro de reçu
 */
export const formatNumeroRecuInput = (input: string): string => {
    // Retirer tout ce qui n'est pas un chiffre
    const digits = input.replace(/\D/g, '');
    
    // Limiter à 5 chiffres max
    const limited = digits.slice(0, 5);
    
    // Insérer le "/" après les 3 premiers chiffres
    if (limited.length <= 3) {
        return limited;
    }
    
    return `${limited.slice(0, 3)}/${limited.slice(3)}`;
};

/**
 * ✅ Obtenir les champs manquants d'une propriété
 */
export const getMissingProprieteFields = (prop: ProprieteWithDemandeurs): string[] => {
    const missing: string[] = [];
    
    for (const field of REQUIRED_PROPRIETE_FIELDS) {
        const value = prop[field as keyof ProprieteWithDemandeurs];
        
        if (value === null || value === undefined || value === '') {
            missing.push(FIELD_LABELS[field] || field);
        }
        
        // Cas spécial : contenance doit être > 0
        if (field === 'contenance' && typeof value === 'number' && value <= 0) {
            missing.push(FIELD_LABELS[field]);
        }
    }
    
    // Validation conditionnelle pour morcellement
    if (prop.type_operation === 'morcellement') {
        if (!prop.propriete_mere) missing.push('Propriété mère');
        if (!prop.titre_mere) missing.push('Titre mère');
    }
    
    return missing;
};

/**
 * ✅ Obtenir les champs manquants d'un demandeur
 */
export const getMissingDemandeurFields = (dem: Demandeur): string[] => {
    const missing: string[] = [];
    
    for (const field of REQUIRED_DEMANDEUR_FIELDS) {
        const value = dem[field as keyof Demandeur];
        
        if (value === null || value === undefined || value === '') {
            missing.push(FIELD_LABELS[field] || field);
        }
    }
    
    // Validation conditionnelle pour marié(e)
    if (dem.situation_familiale === 'Marié(e)') {
        if (!dem.marie_a) missing.push('Nom du/de la conjoint(e)');
        if (!dem.date_mariage) missing.push('Date de mariage');
        if (!dem.lieu_mariage) missing.push('Lieu de mariage');
    }
    
    return missing;
};

/**
 * ✅ Validation complète pour génération ADV
 */
export const validateForActeVente = (
    prop: ProprieteWithDemandeurs | null,
    demandeur: Demandeur | null,
    numeroRecu: string | null
): ValidationResult => {
    const result: ValidationResult = {
        isValid: false,
        missingFields: {
            propriete: [],
            demandeur: [],
            general: [],
        },
        errorMessage: null,
    };
    
    // Vérifications de base
    if (!prop) {
        result.errorMessage = 'Veuillez sélectionner une propriété';
        return result;
    }
    
    if (!demandeur) {
        result.errorMessage = 'Aucun demandeur principal trouvé';
        return result;
    }
    
    if (!numeroRecu || numeroRecu.trim() === '') {
        result.missingFields.general.push('Numéro de reçu');
    } else if (!validateNumeroRecuFormat(numeroRecu)) {
        result.errorMessage = 'Le numéro de reçu doit être au format XXX/XX (ex: 001/25)';
        return result;
    }
    
    // Vérifier les champs de la propriété
    result.missingFields.propriete = getMissingProprieteFields(prop);
    
    // Vérifier les champs du demandeur
    result.missingFields.demandeur = getMissingDemandeurFields(demandeur);
    
    // Calculer la validité globale
    const totalMissing = 
        result.missingFields.propriete.length +
        result.missingFields.demandeur.length +
        result.missingFields.general.length;
    
    result.isValid = totalMissing === 0;
    
    // Générer le message d'erreur
    if (!result.isValid && !result.errorMessage) {
        const parts: string[] = [];
        
        if (result.missingFields.general.length > 0) {
            parts.push(`Général: ${result.missingFields.general.join(', ')}`);
        }
        
        if (result.missingFields.propriete.length > 0) {
            parts.push(`Propriété: ${result.missingFields.propriete.join(', ')}`);
        }
        
        if (result.missingFields.demandeur.length > 0) {
            parts.push(`Demandeur: ${result.missingFields.demandeur.join(', ')}`);
        }
        
        result.errorMessage = `⚠️ Données manquantes - ${parts.join(' • ')}`;
    }
    
    return result;
};

/**
 * ✅ Obtenir le demandeur principal
 */
export const getDemandeurPrincipal = (demandeurs: DemandeurLie[]): DemandeurLie | null => {
    return demandeurs.find(d => d.ordre === 1) || demandeurs[0] || null;
};

/**
 * ✅ Obtenir les consorts
 */
export const getConsorts = (demandeurs: DemandeurLie[]): DemandeurLie[] => {
    return demandeurs.filter(d => d.ordre > 1).sort((a, b) => a.ordre - b.ordre);
};

/**
 * ✅ Vérifier si une propriété a un demandeur principal valide
 */
export const hasDemandeurPrincipalValid = (
    prop: ProprieteWithDemandeurs, 
    allDemandeurs: Demandeur[]
): boolean => {
    const principal = getDemandeurPrincipal(prop.demandeurs_lies || []);
    if (!principal) return false;
    
    const demandeurData = allDemandeurs.find(d => d.id === principal.id);
    if (!demandeurData) return false;
    
    return getMissingDemandeurFields(demandeurData).length === 0;
};

/**
 * ✅ Message de validation compact (pour mobile)
 */
export const getCompactValidationMessage = (
    prop: ProprieteWithDemandeurs | null,
    demandeur: Demandeur | null,
    numeroRecu: string | null
): string | null => {
    const validation = validateForActeVente(prop, demandeur, numeroRecu);
    
    if (validation.isValid) return null;
    
    const totalMissing = 
        validation.missingFields.propriete.length +
        validation.missingFields.demandeur.length +
        validation.missingFields.general.length;
    
    return `⚠️ ${totalMissing} champ${totalMissing > 1 ? 's' : ''} requis manquant${totalMissing > 1 ? 's' : ''}`;
};

/**
 * ✅ Vérifier si tous les consorts sont valides
 */
export const areAllConsortsValid = (
    prop: ProprieteWithDemandeurs, 
    allDemandeurs: Demandeur[]
): boolean => {
    const consorts = getConsorts(prop.demandeurs_lies || []);
    
    return consorts.every(consort => {
        const demandeurData = allDemandeurs.find(d => d.id === consort.id);
        if (!demandeurData) return false;
        return getMissingDemandeurFields(demandeurData).length === 0;
    });
};

/**
 * ✅ Obtenir les consorts invalides
 */
export const getInvalidConsorts = (
    prop: ProprieteWithDemandeurs, 
    allDemandeurs: Demandeur[]
): string[] => {
    const consorts = getConsorts(prop.demandeurs_lies || []);
    
    return consorts
        .filter(consort => {
            const demandeurData = allDemandeurs.find(d => d.id === consort.id);
            if (!demandeurData) return true;
            return getMissingDemandeurFields(demandeurData).length > 0;
        })
        .map(consort => `${consort.nom} ${consort.prenom} (ordre ${consort.ordre})`);
};

/**
 * ✅ Vérifier si une propriété est complète pour génération de documents
 */
export const isProprieteComplete = (prop: ProprieteWithDemandeurs): boolean => {
    const missingFields = getMissingProprieteFields(prop);
    
    // Vérifier aussi les relations essentielles
    if (!prop.dossier) return false;
    if (!prop.dossier.district) return false;
    if (!prop.dossier.commune) return false;
    if (!prop.dossier.fokontany) return false;
    
    return missingFields.length === 0;
};

/**
 * ✅ Vérifier si un demandeur est complet
 */
export const isDemandeurComplete = (dem: Demandeur): boolean => {
    const missingFields = getMissingDemandeurFields(dem);
    return missingFields.length === 0;
};

/**
 * ✅ Vérifier si une propriété peut générer un ADV
 */
export const canGenerateActeVente = (
    prop: ProprieteWithDemandeurs,
    demandeur: Demandeur | null,
    numeroRecu: string | null
): boolean => {
    if (!prop || !demandeur) return false;
    if (prop.document_adv) return false; // Déjà généré
    
    const validation = validateForActeVente(prop, demandeur, numeroRecu);
    return validation.isValid;
};