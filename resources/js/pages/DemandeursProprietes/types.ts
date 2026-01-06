// pages/DemandeursProprietes/types.ts

export interface DemandeurFormData {
    _tempId?: number; // ✅ Ajout pour clé unique
    titre_demandeur: string;
    nom_demandeur: string;
    prenom_demandeur: string;
    date_naissance: string;
    lieu_naissance: string;
    sexe: string;
    occupation: string;
    nom_pere: string;
    nom_mere: string;
    cin: string;
    date_delivrance: string;
    lieu_delivrance: string;
    date_delivrance_duplicata: string;
    lieu_delivrance_duplicata: string;
    domiciliation: string;
    nationalite: string;
    situation_familiale: string;
    regime_matrimoniale: string;
    date_mariage: string;
    lieu_mariage: string;
    marie_a: string;
    telephone: string;
    _is_update?: boolean;
    _existing_id?: number;
}

export interface ProprieteFormData {
    _tempId?: number; // ✅ Ajout pour clé unique
    lot: string;
    type_operation: string;
    nature: string;
    vocation: string;
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
    _is_update?: boolean;
    _existing_id?: number;
}