// ============================================
// 📦 pages/proprietes/types.ts - VERSION FINALE
// ============================================

import type { Dossier, Demandeur, Nature, Vocation, TypeOperation, Propriete } from '@/types';

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
 * ✅ CORRECTION : Type-safe onChange handler
 */
export interface ProprieteFormProps {
    data: ProprieteFormData;
    onChange: (field: keyof ProprieteFormData, value: string) => void; // ✅ Simplifié
    onRemove?: () => void;
    index?: number;
    showRemoveButton?: boolean;
    selectedCharges?: string[];
    onChargeChange?: (charge: string, checked: boolean) => void;
}

/**
 * Props pour la page de mise à jour
 * ✅ CORRECTION : Index signature ajoutée
 */
export interface ProprieteUpdatePageProps {
    propriete: ProprieteWithDetails;
    dossier: Dossier;
    [key: string]: unknown; // ✅ AJOUTÉ
}

/**
 * Propriété avec détails complets (depuis le serveur)
 */
export interface ProprieteWithDetails extends Propriete {
    demandeurs?: Demandeur[];
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