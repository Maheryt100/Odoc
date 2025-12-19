// ============================================
// 📦 pages/demandeurs/types.ts - VERSION SIMPLIFIÉE
// ============================================

import type { Demandeur, Dossier, Propriete } from '@/types';
import type { LucideIcon } from 'lucide-react';
import { DocumentDemande } from '../demandes/types';

/**
 * ✅ Demandeur enrichi avec informations de propriétés
 * Étend le type global Demandeur
 */
export interface DemandeurWithProperty extends Demandeur {
    // Accessors déjà définis dans le type global
    hasProperty: boolean;
    proprietes_actives_count: number;
    proprietes_acquises_count: number;
    
    // Données supplémentaires chargées côté serveur
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
    onEditDemandeur?: (demandeur: DemandeurWithProperty) => void; // ✅ AJOUT
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
 * ✅ Types de filtres disponibles
 */
export type FiltreStatutType = 'tous' | 'actives' | 'acquises' | 'sans';

/**
 * ✅ Types de tri disponibles
 */
export type TriType = 'date' | 'nom' | 'proprietes' | 'statut';

/**
 * ✅ Configuration de badge pour affichage
 */
export interface BadgeConfig {
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
    text: string;
    className?: string;
    icon?: LucideIcon;
}

/**
 * ✅ Statistiques d'un demandeur
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

export interface DemandeWithDetails extends DocumentDemande {
  _computed: {
    isIncomplete: boolean;
    hasValidDemandeurs: boolean;
    isArchived: boolean;
  };
}
