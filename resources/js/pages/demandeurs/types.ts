// pages/demandeurs/types.ts - VERSION CORRIGEE
import type { Demandeur, Dossier, Propriete } from '@/types';
import type { LucideIcon } from 'lucide-react';

export interface DemandeurWithProperty extends Demandeur {
    hasProperty: boolean;
    proprietes_actives_count: number;
    proprietes_acquises_count: number;
    proprietes_actives?: Propriete[];
    proprietes_acquises?: Propriete[];
}

export interface DemandeursIndexProps {
    demandeurs: DemandeurWithProperty[];
    dossier: Dossier;
    proprietes: Propriete[];
    onDeleteDemandeur: (id: number) => void;
    onSelectDemandeur?: (demandeur: DemandeurWithProperty) => void;
    onEditDemandeur?: (demandeur: DemandeurWithProperty) => void;
    onLinkPropriete?: (demandeur: Demandeur) => void;
    isDemandeurIncomplete: (dem: Demandeur) => boolean;
    onDissociate: (
        demandeurId: number,
        proprieteId: number,
        demandeurNom: string,
        proprieteLot: string,
        type: 'from-demandeur' | 'from-propriete'
    ) => void;
}

export type FiltreStatutType = 'tous' | 'actives' | 'acquises' | 'sans';
export type TriType = 'date' | 'nom' | 'proprietes' | 'statut';

export interface BadgeConfig {
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
    text: string;
    className?: string;
    icon?: LucideIcon;
}

export interface DemandeurStats {
    total_proprietes: number;
    proprietes_actives: number;
    proprietes_acquises: number;
    lots_actifs: string[];
    lots_acquis: string[];
    is_complete: boolean;
}

export interface FiltreState {
    statut: FiltreStatutType;
    recherche: string;
    tri: TriType;
    ordre: 'asc' | 'desc';
}