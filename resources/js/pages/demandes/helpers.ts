// pages/demandes/helpers.ts - ✅ CORRECTION TRI

import type { DemandeWithDetails, FiltreStatutDemandeType, TriDemandeType } from './types';

/**
 * Filtrer les demandes par statut
 */
export function filterDemandesByStatus(
    demandes: DemandeWithDetails[],
    filtre: FiltreStatutDemandeType
): DemandeWithDetails[] {
    switch (filtre) {
        case 'actives':
            return demandes.filter(d => d.status === 'active' && !d._computed.isArchived);
        
        case 'archivees':
            return demandes.filter(d => d._computed.isArchived);
        
        case 'incompletes':
            return demandes.filter(d => d._computed.isIncomplete && !d._computed.isArchived);
        
        case 'tous':
        default:
            return demandes;
    }
}

/**
 * ✅ CORRECTION : Trier les demandes (sans 'date_demande' dans le type)
 */
export function sortDemandes(
    demandes: DemandeWithDetails[],
    tri: TriDemandeType,
    ordre: 'asc' | 'desc'
): DemandeWithDetails[] {
    const sorted = [...demandes].sort((a, b) => {
        let comparison = 0;

        switch (tri) {
            case 'date':
                // ✅ Utiliser created_at par défaut, ou date_demande si disponible
                const dateA = a.date_demande || a.created_at || '';
                const dateB = b.date_demande || b.created_at || '';
                comparison = new Date(dateA).getTime() - new Date(dateB).getTime();
                break;

            case 'lot':
                const lotA = a.propriete?.lot || '';
                const lotB = b.propriete?.lot || '';
                comparison = lotA.localeCompare(lotB, 'fr', { numeric: true });
                break;

            case 'demandeur':
                const nomA = a.demandeurs?.[0]?.demandeur?.nom_demandeur || '';
                const nomB = b.demandeurs?.[0]?.demandeur?.nom_demandeur || '';
                comparison = nomA.localeCompare(nomB, 'fr');
                break;

            case 'prix':
                comparison = (a.total_prix || 0) - (b.total_prix || 0);
                break;

            case 'statut':
                const statusA = a._computed.isArchived ? 2 : (a._computed.isIncomplete ? 1 : 0);
                const statusB = b._computed.isArchived ? 2 : (b._computed.isIncomplete ? 1 : 0);
                comparison = statusA - statusB;
                break;

            default:
                comparison = 0;
        }

        return ordre === 'asc' ? comparison : -comparison;
    });

    return sorted;
}

/**
 * Recherche dans les demandes
 */
export function matchesDemandeSearch(demande: DemandeWithDetails, searchTerm: string): boolean {
    const search = searchTerm.toLowerCase().trim();
    
    if (!search) return true;

    // Recherche dans le lot
    if (demande.propriete?.lot?.toLowerCase().includes(search)) {
        return true;
    }

    // Recherche dans le titre
    if (demande.propriete?.titre?.toLowerCase().includes(search)) {
        return true;
    }

    // Recherche dans les demandeurs
    if (demande.demandeurs?.some(d => {
        const dem = d.demandeur;
        return dem?.nom_demandeur?.toLowerCase().includes(search) ||
               dem?.prenom_demandeur?.toLowerCase().includes(search) ||
               dem?.cin?.includes(search);
    })) {
        return true;
    }

    return false;
}

/**
 * Formater un nom complet
 */
export function formatNomComplet(demandeur: any): string {
    if (!demandeur) return 'N/A';
    
    return [
        demandeur.titre_demandeur,
        demandeur.nom_demandeur,
        demandeur.prenom_demandeur
    ].filter(Boolean).join(' ');
}

/**
 * Vérifier si un demandeur est incomplet
 */
export function isDemandeurIncomplete(demandeur: any): boolean {
    if (!demandeur) return true;
    
    const champsRequis = [
        'date_naissance',
        'lieu_naissance',
        'date_delivrance',
        'lieu_delivrance',
        'domiciliation',
        'occupation',
        'nom_mere'
    ];
    
    return champsRequis.some(champ => !demandeur[champ]);
}

/**
 * Vérifier si une propriété est incomplète
 */
export function isProprieteIncomplete(prop: any): boolean {
    return !prop?.titre || 
           !prop?.contenance || 
           !prop?.proprietaire || 
           !prop?.nature || 
           !prop?.vocation || 
           !prop?.situation;
}

/**
 * Obtenir la classe CSS pour une ligne de demande
 */
export function getRowClassName(
    demande: DemandeWithDetails,
    isIncomplete: boolean
): string {
    const isArchived = demande._computed.isArchived;
    
    if (isArchived) {
        return 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900/70';
    }
    
    if (isIncomplete) {
        return 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30';
    }
    
    return 'hover:bg-accent/50';
}

/**
 * Formater une date pour affichage
 */
export function formatDate(dateStr: string | null | undefined, format: 'short' | 'long' = 'short'): string {
    if (!dateStr) return '-';
    
    try {
        const date = new Date(dateStr);
        
        if (isNaN(date.getTime())) {
            return dateStr;
        }
        
        if (format === 'long') {
            return date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        return date.toLocaleDateString('fr-FR');
    } catch {
        return dateStr;
    }
}

/**
 * Calculer l'ancienneté d'une demande (en jours)
 */
export function getDemandeAge(dateDemande: string | null | undefined): number | null {
    if (!dateDemande) return null;
    
    try {
        const date = new Date(dateDemande);
        
        if (isNaN(date.getTime())) {
            return null;
        }
        
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    } catch {
        return null;
    }
}

/**
 * Obtenir un badge pour l'ancienneté
 */
export function getAgeLabel(age: number | null): string {
    if (age === null) return '-';
    
    if (age === 0) return "Aujourd'hui";
    if (age === 1) return "Hier";
    if (age < 7) return `Il y a ${age} jours`;
    if (age < 30) return `Il y a ${Math.floor(age / 7)} semaine(s)`;
    if (age < 365) return `Il y a ${Math.floor(age / 30)} mois`;
    return `Il y a ${Math.floor(age / 365)} an(s)`;
}

/**
 * Filtrer par période de date_demande
 */
export function filterByDateRange(
    demandes: DemandeWithDetails[],
    dateDebut: string | null,
    dateFin: string | null
): DemandeWithDetails[] {
    if (!dateDebut && !dateFin) return demandes;
    
    return demandes.filter(d => {
        if (!d.date_demande) return false;
        
        const dateDemande = new Date(d.date_demande);
        
        if (dateDebut && dateDemande < new Date(dateDebut)) {
            return false;
        }
        
        if (dateFin && dateDemande > new Date(dateFin)) {
            return false;
        }
        
        return true;
    });
}

/**
 * Obtenir les statistiques par période
 */
export interface DemandeStats {
    total: number;
    actives: number;
    archivees: number;
    incompletes: number;
    periodeDebut: string | null;
    periodeFin: string | null;
    moyenneAnciennete: number | null;
}

export function getDemandesStats(
    demandes: DemandeWithDetails[],
    dateDebut?: string | null,
    dateFin?: string | null
): DemandeStats {
    const demandesFiltrees = filterByDateRange(demandes, dateDebut || null, dateFin || null);
    
    const actives = demandesFiltrees.filter(d => !d._computed.isArchived).length;
    const archivees = demandesFiltrees.filter(d => d._computed.isArchived).length;
    const incompletes = demandesFiltrees.filter(d => d._computed.isIncomplete).length;
    
    // Calculer moyenne ancienneté
    const ages = demandesFiltrees
        .map(d => getDemandeAge(d.date_demande))
        .filter((age): age is number => age !== null);
    
    const moyenneAnciennete = ages.length > 0 
        ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length)
        : null;
    
    return {
        total: demandesFiltrees.length,
        actives,
        archivees,
        incompletes,
        periodeDebut: dateDebut || null,
        periodeFin: dateFin || null,
        moyenneAnciennete
    };
}