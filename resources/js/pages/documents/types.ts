// pages/documents/types.ts - VERSION SANS REÇU GÉNÉRÉ
import { Demandeur, Propriete, Dossier } from '@/types';

/**
 * ✅ Métadonnées d'un document
 */
export interface DocumentMetadata {
    needs_regeneration?: boolean;
    marked_at?: string;
    reason?: string;
    last_check_status?: {
        exists: boolean;
        valid: boolean;
        readable: boolean;
        size: number;
        error: string | null;
    };
    regeneration_count?: number;
    last_regenerated_at?: string;
    regeneration_failed?: boolean;
    last_error?: string;
    failed_at?: string;
    recu_reference_id?: number;
    recu_numero?: string;
}

/**
 * ✅ Document généré
 */
export interface DocumentGenere {
    id: number;
    type_document: 'ADV' | 'CSF' | 'REQ'; // RECU retiré
    id_propriete: number;
    id_demandeur?: number;
    id_dossier: number;
    id_district: number;
    numero_document?: string;
    file_path: string;
    nom_fichier: string;
    montant?: number;
    date_document?: string;
    has_consorts: boolean;
    demandeurs_ids?: number[];
    
    // ✅ NOUVEAU : Numéro de reçu externe
    numero_recu_externe?: string;
    numero_recu_saisi_at?: string;
    numero_recu_saisi_by?: number;
    
    metadata?: DocumentMetadata; 
    generated_by: string;
    generated_at: string;
    download_count: number;
    last_downloaded_at?: string;
    status: 'active' | 'archived' | 'obsolete';
}

/**
 * ✅ Référence de reçu externe (nouveau)
 */
export interface RecuReference {
    id: number;
    id_propriete: number;
    id_demandeur: number;
    id_dossier: number;
    numero_recu: string;
    montant?: number;
    date_recu?: string;
    notes?: string;
    created_by: number;
    updated_by?: number;
    created_at: string;
    updated_at: string;
}

/**
 * ✅ Demandeur lié avec prix garanti
 */
export interface DemandeurLie {
    id: number;
    id_demande: number;
    nom: string;
    prenom: string;
    cin: string;
    ordre: number;
    status: 'active' | 'archive';
    status_consort: boolean;
    total_prix: number;
}

/**
 * ✅ Propriété avec relation dossier explicite
 */
export interface ProprieteWithDemandeurs extends Propriete {
    [x: string]: any;
    demandeurs_lies: DemandeurLie[];
    
    // ✅ Relation dossier explicite
    dossier: Dossier;
    
    // ✅ RETIRÉ : document_recu
    // Documents générés
    document_adv?: DocumentGenere | null;
    document_csf?: DocumentGenere | null;
    document_requisition?: DocumentGenere | null;
    
    // ✅ NOUVEAU : Référence reçu externe
    recu_reference?: RecuReference | null;
    has_recu_reference?: boolean;
}

/**
 * ✅ Demandeur avec son document CSF
 */
export interface DemandeurWithCSF extends Demandeur {
    document_csf?: DocumentGenere | null;
}

/**
 * ✅ Types de documents (RECU retiré)
 */
export type DocumentType = 'acte_vente' | 'csf' | 'requisition';

/**
 * ✅ État d'un document
 */
export interface DocumentState {
    exists: boolean;
    document?: DocumentGenere;
    canGenerate: boolean;
    buttonLabel: string;
    buttonIcon: 'download' | 'generate';
}

/**
 * ✅ Configuration d'un type de document
 */
export interface DocumentConfig {
    icon: any;
    title: string;
    description: string;
    color: string;
    buttonText: string;
    requiresRecuReference: boolean; // Changé de requiresRecu
    requiresDemandeur: boolean;
}

/**
 * ✅ Stats pour les cartes (sans reçu)
 */
export interface DocumentStats {
    totalProprietes: number;
    proprietesAvecRecuReference: number; // ✅ NOUVEAU
    proprietesAvecAdv: number;
    totalDemandeurs: number;
    demandeursAvecCsf: number;
    requisitionsGenerees: number;
}

/**
 * ✅ Validation des champs manquants
 */
export interface ValidationResult {
    isValid: boolean;
    missingFields: {
        propriete: string[];
        demandeur: string[];
        general: string[];
    };
    errorMessage: string | null;
}