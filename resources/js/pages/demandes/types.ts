// ============================================
// 3️⃣ js/pages/demandes/types.ts
// ============================================
import type { Demandeur, Propriete } from '@/types';

export interface DemandeBase {
    id: number;
    id_demandeur: number;
    id_propriete: number;
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
}

export type Demande = DemandeWithRelations;

export interface DemandeFormData {
    id_demandeur: number;
    id_propriete: number;
    total_prix: number;
    status_consort: boolean;
}

export interface DemandeFilters {
    status?: 'active' | 'archive' | 'all';
    propriete_id?: number;
    demandeur_id?: number;
}

// Type pour le pivot (legacy support)
export type Demander = Demande;