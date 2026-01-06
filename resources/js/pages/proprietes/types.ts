// pages/proprietes/types.ts - VERSION CORRIGEE
import type { Dossier, Demandeur, Nature, Vocation, TypeOperation, Propriete } from '@/types';

export type FiltreStatutProprieteType = 'tous' | 'actives' | 'acquises' | 'sans_demandeur';
export type TriProprieteType = 'date' | 'lot' | 'contenance' | 'statut';

export interface ProprieteWithDetails extends Propriete {
    demandeurs?: Demandeur[];
    _computed?: {
        isIncomplete: boolean;
        hasDemandeurs: boolean;
        isArchived: boolean;
    };
}

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

export interface ProprieteFormData {
    _tempId?: number;
    _is_update?: boolean;
    _existing_id?: number;
    
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
    date_depot_1: string;
    date_depot_2: string;
    date_approbation_acte: string;

    dep_vol_inscription: string;
    numero_dep_vol_inscription: string;
    
    dep_vol_requisition: string;
    numero_dep_vol_requisition: string;

    id_dossier: number;
}

export interface ProprieteFormProps {
    data: ProprieteFormData;
    onChange: (field: keyof ProprieteFormData, value: string) => void;
    onRemove?: () => void;
    index?: number;
    showRemoveButton?: boolean;
    selectedCharges?: string[];
    onChargeChange?: (charge: string, checked: boolean) => void;
}

export interface ProprieteUpdatePageProps {
    propriete: ProprieteWithDetails;
    dossier: Dossier;
    [key: string]: unknown;
}

export const CHARGE_OPTIONS = [
    "Voie(s) publique(s)",
    "Voie(s) d'accès",
    "Servitude(s)",
    "Aucune"
] as const;

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
    date_depot_1: '',
    date_depot_2: '',
    date_approbation_acte: '',
    dep_vol_inscription: '',
    numero_dep_vol_inscription: '',
    dep_vol_requisition: '',
    numero_dep_vol_requisition: '',
    id_dossier: 0
};