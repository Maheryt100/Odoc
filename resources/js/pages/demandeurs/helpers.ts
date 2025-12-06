// pages/demandeurs/helpers.ts

import { Archive } from 'lucide-react';
import type { 
    DemandeurWithProperty, 
    BadgeConfig, 
    DemandeurStats,
    FiltreStatutType,
    TriType
} from './types';
import type { Propriete } from '@/types';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELPERS DEMANDEURS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Obtenir la configuration du badge de statut principal
 */
export function getDemandeurStatusBadge(demandeur: DemandeurWithProperty): BadgeConfig {
    const actives = demandeur.proprietes_actives_count || 0;
    const acquises = demandeur.proprietes_acquises_count || 0;
    const total = actives + acquises;

    // Aucune propriété
    if (total === 0) {
        return {
            variant: 'secondary',
            text: 'Sans propriété',
            className: 'text-xs'
        };
    }

    // Construction du texte
    const parts: string[] = [];
    if (actives > 0) parts.push(`${actives} active${actives > 1 ? 's' : ''}`);
    if (acquises > 0) parts.push(`${acquises} acquise${acquises > 1 ? 's' : ''}`);

    // Cas spécial : uniquement acquises
    if (acquises > 0 && actives === 0) {
        return {
            variant: 'outline',
            text: `Avec propriété(s) : ${parts.join(', ')}`,
            className: 'text-xs bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400',
            icon: Archive
        };
    }

    // Cas normal : avec actives
    return {
        variant: 'default',
        text: `Avec propriété(s) : ${parts.join(', ')}`,
        className: 'text-xs'
    };
}

/**
 * Obtenir les lots acquis pour un demandeur
 */
export function getAcquiredLotsForDemandeur(
    demandeurId: number,
    proprietes: Propriete[]
): string[] {
    const lots: string[] = [];
    
    proprietes.forEach(prop => {
        if (prop.is_archived === true) {
            const isLinked = prop.demandes?.some((d: any) => d.id === demandeurId);
            if (isLinked) {
                lots.push(prop.lot);
            }
        }
    });
    
    return lots;
}

/**
 * Obtenir les statistiques complètes d'un demandeur
 */
export function getDemandeurStats(
    demandeur: DemandeurWithProperty,
    proprietes: Propriete[]
): DemandeurStats {
    const lotsActifs: string[] = [];
    const lotsAcquis: string[] = [];
    
    proprietes.forEach(prop => {
        const demandes = prop.demandes || [];
        const demande = demandes.find(d => d.id_demandeur === demandeur.id);
        
        if (demande) {
            if (demande.status === 'active') {
                lotsActifs.push(prop.lot);
            } else if (demande.status === 'archive') {
                lotsAcquis.push(prop.lot);
            }
        }
    });

    return {
        total_proprietes: lotsActifs.length + lotsAcquis.length,
        proprietes_actives: lotsActifs.length,
        proprietes_acquises: lotsAcquis.length,
        lots_actifs: lotsActifs,
        lots_acquis: lotsAcquis,
        is_complete: !demandeur.is_incomplete
    };
}

/**
 * Filtrer les demandeurs selon le statut
 */
export function filterDemandeursByStatus(
    demandeurs: DemandeurWithProperty[],
    filtre: FiltreStatutType
): DemandeurWithProperty[] {
    switch (filtre) {
        case 'actives':
            return demandeurs.filter(d => (d.proprietes_actives_count || 0) > 0);
        
        case 'acquises':
            return demandeurs.filter(d => (d.proprietes_acquises_count || 0) > 0);
        
        case 'sans':
            return demandeurs.filter(d => {
                const actives = d.proprietes_actives_count || 0;
                const acquises = d.proprietes_acquises_count || 0;
                return actives === 0 && acquises === 0;
            });
        
        case 'tous':
        default:
            return demandeurs;
    }
}

/**
 * Trier les demandeurs
 */
export function sortDemandeurs(
    demandeurs: DemandeurWithProperty[],
    tri: TriType,
    ordre: 'asc' | 'desc'
): DemandeurWithProperty[] {
    const sorted = [...demandeurs].sort((a, b) => {
        let comparison = 0;

        switch (tri) {
            case 'nom':
                comparison = `${a.nom_demandeur} ${a.prenom_demandeur}`.localeCompare(
                    `${b.nom_demandeur} ${b.prenom_demandeur}`
                );
                break;

            case 'proprietes':
                const totalA = (a.proprietes_actives_count || 0) + (a.proprietes_acquises_count || 0);
                const totalB = (b.proprietes_actives_count || 0) + (b.proprietes_acquises_count || 0);
                comparison = totalA - totalB;
                break;

            case 'statut':
                const statusA = a.is_incomplete ? 0 : (a.proprietes_actives_count || 0) > 0 ? 2 : 1;
                const statusB = b.is_incomplete ? 0 : (b.proprietes_actives_count || 0) > 0 ? 2 : 1;
                comparison = statusA - statusB;
                break;

            case 'date':
            default:
                comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                break;
        }

        return ordre === 'asc' ? comparison : -comparison;
    });

    return sorted;
}

/**
 * Obtenir la classe de style de ligne selon l'état
 */
export function getRowClassName(demandeur: DemandeurWithProperty): string {
    if (demandeur.is_incomplete) {
        return 'hover:bg-red-50/50 dark:hover:bg-red-950/20 bg-red-50/30 dark:bg-red-950/10 cursor-pointer transition-colors';
    }
    
    const hasActive = (demandeur.proprietes_actives_count || 0) > 0;
    
    if (hasActive) {
        return 'hover:bg-muted/30 cursor-pointer transition-colors';
    }
    
    return 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20 bg-amber-50/30 dark:bg-amber-950/10 cursor-pointer transition-colors';
}

/**
 * Formater le nom complet d'un demandeur
 */
export function formatNomComplet(demandeur: DemandeurWithProperty): string {
    return [
        demandeur.titre_demandeur,
        demandeur.nom_demandeur,
        demandeur.prenom_demandeur
    ].filter(Boolean).join(' ');
}

/**
 * Vérifier si un demandeur correspond à la recherche
 */
export function matchesSearch(demandeur: DemandeurWithProperty, search: string): boolean {
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    const nomComplet = formatNomComplet(demandeur).toLowerCase();
    const cin = demandeur.cin.toLowerCase();
    const domiciliation = (demandeur.domiciliation || '').toLowerCase();
    
    return nomComplet.includes(searchLower) || 
           cin.includes(searchLower) || 
           domiciliation.includes(searchLower);
}