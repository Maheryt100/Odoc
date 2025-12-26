// pages/demandes/types.ts - ✅ VERSION FINALE CORRIGÉE

import type { Demandeur, Propriete, Dossier } from '@/types';

// ════════════════════════════════════════════════════════════════
// TYPES DE BASE
// ════════════════════════════════════════════════════════════════

export interface DemandeBase {
    id: number;
    id_demandeur: number;
    id_propriete: number;
    date_demande: string;
    total_prix: number;
    ordre: number;
    created_at: string;
    updated_at: string;
}

export interface DemandeWithStatus extends DemandeBase {
    status: 'active' | 'archive';
    status_consort: boolean;
    motif_archive?: string;
}

export interface DemandeWithRelations extends DemandeWithStatus {
    demandeur?: Demandeur;
    propriete?: Propriete;
    date_demande_formatted?: string;
    date_demande_short?: string;
}

export type Demande = DemandeWithRelations;

// ════════════════════════════════════════════════════════════════
// DOCUMENT DEMANDE (Structure groupée par propriété)
// ════════════════════════════════════════════════════════════════

export interface DocumentDemande {
    id: number;
    id_propriete: number;
    date_demande?: string;
    propriete: {
        id: number;
        lot: string;
        titre?: string | null; 
        contenance?: number | null;
        nature?: string;
        vocation?: string;
        proprietaire?: string | null;
        situation?: string | null;
        is_archived?: boolean;
        date_requisition?: string;
    };
    demandeurs: Array<{
        id: number;
        id_demandeur: number;
        demandeur: {
            id: number;
            titre_demandeur?: string;
            nom_demandeur: string;
            prenom_demandeur?: string | null;
            cin: string;
            domiciliation?: string;
            telephone?: string;
            date_naissance?: string;
            lieu_naissance?: string;
            date_delivrance?: string;
            lieu_delivrance?: string;
            occupation?: string;
            nom_mere?: string;
        };
    }>;
    total_prix: number;
    status: 'active' | 'archive'; 
    status_consort: boolean;
    nombre_demandeurs: number;
    created_at?: string;
    updated_at?: string;
}

export interface DemandeWithDetails extends DocumentDemande {
    _computed: {
        isIncomplete: boolean;
        hasValidDemandeurs: boolean;
        isArchived: boolean;
    };
}

// ════════════════════════════════════════════════════════════════
// PROPS COMPOSANTS
// ════════════════════════════════════════════════════════════════

export interface DemandesIndexProps {
    documents: {
        data: DocumentDemande[];
        current_page: number;
        last_page: number;
        total: number;
    };
    dossier: Dossier & {
        proprietes?: Propriete[];
        demandeurs?: Demandeur[];
    };
    onArchive: (doc: DemandeWithDetails) => void;
    onUnarchive: (doc: DemandeWithDetails) => void;
}

// ════════════════════════════════════════════════════════════════
// ✅ CORRECTION : TYPES DE FILTRES ET TRI
// ════════════════════════════════════════════════════════════════

export type FiltreStatutDemandeType = 'tous' | 'actives' | 'archivees' | 'incompletes';

/**
 * ✅ CORRECTION : Type cohérent avec helpers.ts
 * On retire 'date_demande' car c'est juste une variante de 'date'
 * Si besoin, gérer ça dans la logique de tri, pas dans le type
 */
export type TriDemandeType = 'date' | 'lot' | 'demandeur' | 'prix' | 'statut';

// ════════════════════════════════════════════════════════════════
// AUTRES TYPES
// ════════════════════════════════════════════════════════════════

export interface DemandeFormData {
    id_demandeur: number;
    id_propriete: number;
    date_demande: string;
    total_prix: number;
    status_consort: boolean;
}

export interface DemandeFilters {
    status?: 'active' | 'archive' | 'all';
    propriete_id?: number;
    demandeur_id?: number;
    date_debut?: string;
    date_fin?: string;
}

export interface DateRangeFilter {
    dateDebut: string | null;
    dateFin: string | null;
}

export type Demander = Demande;