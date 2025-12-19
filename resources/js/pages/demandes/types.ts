// pages/demandes/types.ts - ✅ AVEC DATE_DEMANDE

import type { Demandeur, Propriete, Dossier } from '@/types';

// Types de base pour une demande
export interface DemandeBase {
    id: number;
    id_demandeur: number;
    id_propriete: number;
    date_demande: string; // ✅ NOUVEAU (format YYYY-MM-DD)
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
    date_demande_formatted?: string; // ✅ Ex: "15 janvier 2025"
    date_demande_short?: string; // ✅ Ex: "15/01/2025"
}

export type Demande = DemandeWithRelations;

// Type pour un document de demande (utilisé dans ResumeDossier)
export interface DocumentDemande {
    id: number;
    id_propriete: number;
    date_demande?: string; // ✅ NOUVEAU
    propriete: {
        id: number;
        lot: string;
        titre?: string;
        contenance?: number;
        nature?: string;
        vocation?: string;
        proprietaire?: string;
        situation?: string;
        is_archived?: boolean;
        date_requisition?: string; // ✅ Pour validation cohérence
    };
    demandeurs: Array<{
        id: number;
        id_demandeur: number;
        demandeur: {
            id: number;
            titre_demandeur?: string;
            nom_demandeur: string;
            prenom_demandeur?: string;
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

// Type avec propriétés computed
export interface DemandeWithDetails extends DocumentDemande {
    _computed: {
        isIncomplete: boolean;
        hasValidDemandeurs: boolean;
        isArchived: boolean;
    };
}

// Props pour le composant principal
export interface DemandesIndexProps {
    documents: {
        data: DocumentDemande[];
        current_page: number;
        last_page: number;
        total: number;
    };
    dossier: Dossier & {
        proprietes?: Propriete[];
    };
    onArchive: (doc: DocumentDemande) => void;
    onUnarchive: (doc: DocumentDemande) => void;
}

// ✅ MISE À JOUR : Types pour les filtres (avec date_demande)
export type FiltreStatutDemandeType = 'tous' | 'actives' | 'archivees' | 'incompletes';
export type TriDemandeType = 'date' | 'date_demande' | 'lot' | 'demandeur' | 'prix' | 'statut';

// Type pour les données de formulaire
export interface DemandeFormData {
    id_demandeur: number;
    id_propriete: number;
    date_demande: string; // ✅ NOUVEAU
    total_prix: number;
    status_consort: boolean;
}

// Type pour les filtres de recherche
export interface DemandeFilters {
    status?: 'active' | 'archive' | 'all';
    propriete_id?: number;
    demandeur_id?: number;
    date_debut?: string; // ✅ NOUVEAU
    date_fin?: string; // ✅ NOUVEAU
}

// ✅ NOUVEAU : Type pour les filtres de période
export interface DateRangeFilter {
    dateDebut: string | null;
    dateFin: string | null;
}

// Legacy support
export type Demander = Demande;