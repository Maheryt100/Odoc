// ============================================
// 📦 pages/demandeurs/types.ts - VERSION COMPLÈTE
// ============================================

import type { Demandeur, Dossier, Propriete } from '@/types';
import type { LucideIcon } from 'lucide-react';

/**
 * ✅ Demandeur enrichi avec informations de propriétés
 */
export interface DemandeurWithProperty extends Demandeur {
    hasProperty: boolean;
    proprietes_actives_count?: number;
    proprietes_acquises_count?: number;
    proprietes_actives?: Propriete[];
    proprietes_acquises?: Propriete[];
}

/**
 * Props du composant principal index
 */
export interface DemandeursIndexProps {
    demandeurs: DemandeurWithProperty[];
    dossier: Dossier;
    proprietes: Propriete[];
    onDeleteDemandeur: (id: number) => void;
    onSelectDemandeur?: (demandeur: DemandeurWithProperty) => void;
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

/**
 * ✅ AJOUT : Types de filtres disponibles
 */
export type FiltreStatutType = 'tous' | 'actives' | 'acquises' | 'sans';

/**
 * ✅ AJOUT : Types de tri disponibles
 */
export type TriType = 'date' | 'nom' | 'proprietes' | 'statut';

/**
 * ✅ AJOUT : Configuration de badge pour affichage
 */
export interface BadgeConfig {
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
    text: string;
    className?: string;
    icon?: LucideIcon;
}

/**
 * ✅ AJOUT : Statistiques d'un demandeur
 */
export interface DemandeurStats {
    total_proprietes: number;
    proprietes_actives: number;
    proprietes_acquises: number;
    lots_actifs: string[];
    lots_acquis: string[];
    is_complete: boolean;
}

/**
 * État du filtre complet
 */
export interface FiltreState {
    statut: FiltreStatutType;
    recherche: string;
    tri: TriType;
    ordre: 'asc' | 'desc';
}