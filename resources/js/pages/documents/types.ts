// pages/documents/types.ts 
import { Demandeur, Propriete, Dossier } from '@/types';

/**
 * ✅ Métadonnées d'un document (pour régénération)
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
}

/**
 * ✅ Document généré (référence dans la base)
 */
export interface DocumentGenere {
    id: number;
    type_document: 'RECU' | 'ADV' | 'CSF' | 'REQ';
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
    metadata?: DocumentMetadata; 
    generated_by: string;
    generated_at: string;
    download_count: number;
    last_downloaded_at?: string;
    status: 'active' | 'archived' | 'obsolete';
}

/**
 * ✅ Reçu de paiement (ancienne table - compatibilité)
 */
export interface RecuPaiement {
    id: number;
    numero_recu: string;
    montant: string;
    date_recu: string;
    status: 'draft' | 'confirmed';
    generated_by: string;
    generated_at: string;
    download_count: number;
    source?: 'old_table' | 'documents_generes';
}

/**
 * ✅ CORRECTION CRITIQUE : total_prix garanti non-null
 * L'Observer backend garantit toujours un prix calculé
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
    total_prix: number; // ✅ Garanti par Observer
}

/**
 * ✅ Demandeur avec ordre pour affichage
 */
export interface DemandeurWithOrder {
    demandeur: Demandeur;
    ordre: number;
    status: 'active' | 'archive';
    total_prix: number;
    is_principal?: boolean;
}

/**
 * ✅ CORRECTION : Propriété avec relation dossier explicite
 * Pour éviter l'erreur "Property 'dossier' does not exist"
 */
export interface ProprieteWithDemandeurs extends Propriete {
    demandeurs_lies: DemandeurLie[];
    has_recu?: boolean;
    dernier_recu?: RecuPaiement | null;
    
    // ✅ AJOUT : Relation dossier explicite
    dossier: Dossier;
    
    // Documents générés
    document_recu?: DocumentGenere | null;
    document_adv?: DocumentGenere | null;
    document_csf?: DocumentGenere | null;
    document_requisition?: DocumentGenere | null;
}

/**
 * ✅ Demandeur avec son document CSF
 */
export interface DemandeurWithCSF extends Demandeur {
    document_csf?: DocumentGenere | null;
}

/**
 * ✅ Types de documents
 */
export type DocumentType = 'recu' | 'acte_vente' | 'csf' | 'requisition';

/**
 * ✅ État d'un document (pour l'UI)
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
    requiresRecu: boolean;
    requiresDemandeur: boolean;
}

/**
 * ✅ NOUVEAU : Stats pour les cartes
 */
export interface DocumentStats {
    totalProprietes: number;
    proprietesAvecRecu: number;
    proprietesAvecAdv: number;
    totalDemandeurs: number;
    demandeursAvecCsf: number;
    requisitionsGenerees: number;
}