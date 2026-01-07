import type { Demandeur, Propriete, Dossier } from '@/types';

/**
 * Métadonnées étendues pour les documents
 */
export interface DocumentMetadata {
  needs_regeneration?: boolean;
  regeneration_count?: number;
  regeneration_failed?: boolean;
  last_error?: string;
  marked_at?: string;
  reason?: string;
  
  // Données spécifiques ADV
  recu_numero?: string;
  recu_date?: string;
  recu_reference_id?: number;
  
  // Autres métadonnées
  last_regenerated_at?: string;
}

/**
 * Document généré
 */
export interface DocumentGenere {
  id: number;
  type_document: 'ADV' | 'CSF' | 'REQ';
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
  
  // Numéro de reçu externe
  numero_recu_externe?: string;
  numero_recu_saisi_at?: string;
  
  // Métadonnées avec type étendu
  metadata?: DocumentMetadata;
  
  // Statistiques
  generated_by: string;
  generated_at: string;
  download_count: number;
  last_downloaded_at?: string;
  status: 'active' | 'archived' | 'obsolete';
}

/**
 * Référence de reçu externe
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
  created_at: string;
  updated_at: string;
}

/**
 * Demandeur lié (avec prix garanti)
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
 * Propriété enrichie
 */
export interface ProprieteWithDemandeurs extends Propriete {
  demandeurs_lies: DemandeurLie[];
  dossier: Dossier;
  
  // Documents générés
  document_adv?: DocumentGenere | null;
  document_csf?: DocumentGenere | null;
  document_requisition?: DocumentGenere | null;
  
  // Référence reçu externe
  recu_reference?: RecuReference | null;
  has_recu_reference?: boolean;
}

/**
 * Demandeur avec CSF
 */
export interface DemandeurWithCSF extends Demandeur {
  document_csf?: DocumentGenere | null;
}

/**
 * Types de tabs
 */
export type DocumentTabType = 'acte_vente' | 'csf' | 'requisition';

/**
 * Stats pour DocumentTabs
 */
export interface DocumentStats {
  proprietesAvecAdv: number;
  totalProprietes: number;
  demandeursAvecCsf: number;
  totalDemandeurs: number;
  requisitionsGenerees: number;
}

/**
 * Options pour EntitySelect
 */
export interface SelectOption {
  id: number;
  label: string;
  sublabel?: string;
  badges?: Array<{
    label: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
    icon?: React.ReactNode;
  }>;
}

/**
 * Champ pour EntityCard
 */
export interface EntityCardField {
  label: string;
  value: any;
  icon?: React.ReactNode;
  format?: 'montant' | 'contenance' | 'date' | 'text';
  className?: string;
}

/**
 * Type pour la fonction generateDocument
 */
export type GenerateDocumentFn = (
  type: 'adv' | 'csf' | 'requisition',
  data?: Record<string, any>
) => Promise<any>;