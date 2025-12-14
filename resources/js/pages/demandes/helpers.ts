// pages/demandes/helpers.ts - ✅ HELPERS COMPLETS

import type { DocumentDemande, FiltreStatutDemandeType, TriDemandeType } from './types';

/**
 * Filtre les demandes par statut
 */
export function filterDemandesByStatus(
    demandes: DocumentDemande[],
    filtre: FiltreStatutDemandeType
): DocumentDemande[] {
    switch (filtre) {
        case 'actives':
            return demandes.filter(d => d.status === 'active');
        case 'archivees':
            return demandes.filter(d => d.status === 'archive');
        case 'incompletes':
            return demandes.filter(d => {
                const hasValidDemandeurs = d.demandeurs && d.demandeurs.length > 0;
                const hasIncomplete = hasValidDemandeurs
                    ? d.demandeurs.some(dem => isDemandeurIncomplete(dem.demandeur)) || isProprieteIncomplete(d.propriete)
                    : isProprieteIncomplete(d.propriete);
                return hasIncomplete && d.status === 'active';
            });
        case 'tous':
        default:
            return demandes;
    }
}

/**
 * Trie les demandes selon le critère choisi
 */
export function sortDemandes(
    demandes: DocumentDemande[],
    tri: TriDemandeType,
    ordre: 'asc' | 'desc'
): DocumentDemande[] {
    const sorted = [...demandes];
    
    sorted.sort((a, b) => {
        let comparison = 0;
        
        switch (tri) {
            case 'lot':
                comparison = (a.propriete?.lot || '').localeCompare(b.propriete?.lot || '');
                break;
            case 'demandeur':
                const nomA = a.demandeurs?.[0]?.demandeur?.nom_demandeur || '';
                const nomB = b.demandeurs?.[0]?.demandeur?.nom_demandeur || '';
                comparison = nomA.localeCompare(nomB);
                break;
            case 'prix':
                comparison = (a.total_prix || 0) - (b.total_prix || 0);
                break;
            case 'statut':
                if (a.status === b.status) {
                    comparison = a.nombre_demandeurs - b.nombre_demandeurs;
                } else {
                    comparison = a.status === 'active' ? -1 : 1;
                }
                break;
            case 'date':
            default:
                comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
                break;
        }
        
        return ordre === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
}

/**
 * Vérifie si une demande correspond à la recherche
 */
export function matchesDemandeSearch(demande: DocumentDemande, recherche: string): boolean {
    const query = recherche.toLowerCase();
    
    // Recherche dans le lot
    if (demande.propriete?.lot?.toLowerCase().includes(query)) {
        return true;
    }
    
    // Recherche dans le titre
    if (demande.propriete?.titre?.toLowerCase().includes(query)) {
        return true;
    }
    
    // Recherche dans les demandeurs
    if (demande.demandeurs && demande.demandeurs.length > 0) {
        return demande.demandeurs.some(d => {
            const dem = d.demandeur;
            if (!dem) return false;
            
            const nomComplet = formatNomComplet(dem).toLowerCase();
            if (nomComplet.includes(query)) return true;
            
            if (dem.cin?.toLowerCase().includes(query)) return true;
            
            return false;
        });
    }
    
    return false;
}

/**
 * Formate le nom complet d'un demandeur
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
 * Vérifie si un demandeur est incomplet
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
 * Vérifie si une propriété est incomplète
 */
export function isProprieteIncomplete(propriete: any): boolean {
    return !propriete?.titre || 
           !propriete?.contenance || 
           !propriete?.proprietaire || 
           !propriete?.nature || 
           !propriete?.vocation || 
           !propriete?.situation;
}

/**
 * Retourne la classe CSS pour une ligne de demande
 */
export function getRowClassName(demande: DocumentDemande, isIncomplete: boolean): string {
    if (demande.status === 'archive') {
        return 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900/70';
    }
    if (isIncomplete) {
        return 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30';
    }
    return 'hover:bg-muted/50';
}

/**
 * Vérifie si une demande est archivée
 */
export function isDemandeArchived(demande: DocumentDemande): boolean {
    return demande.status === 'archive';
}

/**
 * Vérifie si une demande a des demandeurs valides
 */
export function hasValidDemandeurs(demande: DocumentDemande): boolean {
    return demande.demandeurs && Array.isArray(demande.demandeurs) && demande.demandeurs.length > 0;
}