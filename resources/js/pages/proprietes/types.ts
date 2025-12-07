// pages/proprietes/types.ts - ✅ VERSION COMPLÈTE

import type { Dossier, Demandeur, Nature, Vocation, TypeOperation, Propriete } from '@/types';

/**
 * ✅ Type pour les filtres de statut
 */
export type FiltreStatutProprieteType = 'tous' | 'actives' | 'acquises' | 'sans_demandeur';

/**
 * ✅ Type pour les options de tri
 */
export type TriProprieteType = 'date' | 'lot' | 'contenance' | 'statut';

/**
 * ✅ Propriété avec détails complets et calculs
 */
export interface ProprieteWithDetails extends Propriete {
    demandeurs?: Demandeur[];
    _computed?: {
        isIncomplete: boolean;
        hasDemandeurs: boolean;
        isArchived: boolean;
    };
}

/**
 * ✅ Props pour ProprietesIndex
 */
export interface ProprietesIndexProps {
    proprietes: Propriete[];
    dossier: Dossier;
    demandeurs: Demandeur[];
    onDeletePropriete: (id: number) => void;
    onArchivePropriete: (id: number) => void;
    onUnarchivePropriete: (id: number) => void;
    isPropertyIncomplete: (prop: Propriete) => boolean;
    onLinkDemandeur?: (propriete: Propriete) => void;
    onDissociate: (
        demandeurId: number,
        proprieteId: number,
        demandeurNom: string,
        proprieteLot: string,
        type: 'from-demandeur' | 'from-propriete'
    ) => void;
}

/**
 * Données du formulaire de propriété
 */
export interface ProprieteFormData {
    lot: string;
    type_operation: TypeOperation;
    nature: Nature | '';
    vocation: Vocation | '';
    proprietaire: string;
    situation: string;
    propriete_mere: string;
    titre_mere: string;
    titre: string;
    contenance: string;
    charge: string;
    numero_FN: string;
    numero_requisition: string;
    date_requisition: string;
    date_inscription: string;
    dep_vol: string;
    numero_dep_vol: string;
    id_dossier?: number;
}

/**
 * Props du composant de formulaire de propriété
 */
export interface ProprieteFormProps {
    data: ProprieteFormData;
    onChange: (field: keyof ProprieteFormData, value: string) => void;
    onRemove?: () => void;
    index?: number;
    showRemoveButton?: boolean;
    selectedCharges?: string[];
    onChargeChange?: (charge: string, checked: boolean) => void;
}

/**
 * Props pour la page de mise à jour
 */
export interface ProprieteUpdatePageProps {
    propriete: ProprieteWithDetails;
    dossier: Dossier;
    [key: string]: unknown;
}

/**
 * Options de charges disponibles
 */
export const CHARGE_OPTIONS = [
    "Voie(s) publique(s)",
    "Voie(s) d'accès",
    "Servitude(s)",
    "Aucune"
] as const;

/**
 * Propriété vide pour initialisation
 */
export const EMPTY_PROPRIETE: ProprieteFormData = {
    lot: '',
    type_operation: 'immatriculation',
    nature: '',
    vocation: '',
    proprietaire: '',
    situation: '',
    propriete_mere: '',
    titre_mere: '',
    titre: '',
    contenance: '',
    charge: '',
    numero_FN: '',
    numero_requisition: '',
    date_requisition: '',
    date_inscription: '',
    dep_vol: '',
    numero_dep_vol: ''
};