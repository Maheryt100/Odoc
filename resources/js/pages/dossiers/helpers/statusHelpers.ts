// resources/js/pages/dossiers/helpers/statusHelpers.ts
import type { Dossier } from '@/types';
import { AlertCircle, Archive, Clock, Users, LandPlot } from 'lucide-react';

export interface StatusBadge {
    type: 'warning' | 'error' | 'info' | 'success';
    label: string;
    icon: any;
    tooltip: string;
}

/**
 * Obtenir les badges de statut pour un dossier
 */
export function getDossierStatusBadges(dossier: Dossier): StatusBadge[] {
    const badges: StatusBadge[] = [];
    
    const demandeursCount = dossier.demandeurs_count ?? 0;
    const proprietesCount = dossier.proprietes_count ?? 0;

    // Dossier incomplet (aucun demandeur ou propriété)
    if (demandeursCount === 0 || proprietesCount === 0) {
        badges.push({
            type: 'error',
            label: 'Incomplet',
            icon: '',
            tooltip: demandeursCount === 0 && proprietesCount === 0
                ? 'Aucun demandeur ni propriété'
                : demandeursCount === 0
                    ? 'Aucun demandeur'
                    : 'Aucune propriété'
        });
    }

    // Dossier vide (ni demandeurs ni propriétés)
    if (demandeursCount === 0 && proprietesCount === 0) {
        badges.push({
            type: 'warning',
            label: 'Vide',
            icon: '',
            tooltip: 'Ce dossier ne contient aucune donnée'
        });
    }

    // Dossier récent (moins de 30 jours)
    const dateOuverture = new Date(dossier.date_ouverture);
    const daysSinceOpening = Math.floor((Date.now() - dateOuverture.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceOpening <= 30 && !dossier.is_closed) {
        badges.push({
            type: 'info',
            label: 'Récent',
            icon: '! ',
            tooltip: `Ouvert il y a ${daysSinceOpening} jour${daysSinceOpening > 1 ? 's' : ''}`
        });
    }

    return badges;
}

/**
 * Obtenir la couleur du badge selon le type
 */
export function getBadgeColor(type: StatusBadge['type']): string {
    switch (type) {
        case 'error':
            return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400';
        case 'warning':
            return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400';
        case 'info':
            return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400';
        case 'success':
            return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-950 dark:text-gray-400';
    }
}

/**
 * Vérifier si un dossier a des problèmes
 */
export function hasIssues(dossier: Dossier): boolean {
    const demandeursCount = dossier.demandeurs_count ?? 0;
    const proprietesCount = dossier.proprietes_count ?? 0;
    
    return demandeursCount === 0 || proprietesCount === 0;
}

/**
 * Calculer le score de complétude d'un dossier (0-100)
 */
export function getDossierCompletenessScore(dossier: Dossier): number {
    let score = 0;
    const demandeursCount = dossier.demandeurs_count ?? 0;
    const proprietesCount = dossier.proprietes_count ?? 0;

    // Nom du dossier (10 points)
    if (dossier.nom_dossier) score += 10;

    // Numéro d'ouverture (10 points)
    if (dossier.numero_ouverture) score += 10;

    // Localisation complète (20 points)
    if (dossier.commune) score += 7;
    if (dossier.fokontany) score += 7;
    if (dossier.circonscription) score += 6;

    // Dates (15 points)
    if (dossier.date_descente_debut) score += 5;
    if (dossier.date_descente_fin) score += 5;
    if (dossier.date_ouverture) score += 5;

    // Demandeurs (25 points)
    if (demandeursCount > 0) {
        score += Math.min(25, demandeursCount * 5);
    }

    // Propriétés (20 points)
    if (proprietesCount > 0) {
        score += Math.min(20, proprietesCount * 4);
    }

    return Math.min(100, score);
}

/**
 * Obtenir la couleur du score de complétude
 */
export function getCompletenessScoreColor(score: number): string {
    if (score >= 80) {
        return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400';
    } else if (score >= 60) {
        return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400';
    } else if (score >= 40) {
        return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400';
    } else {
        return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400';
    }
}

/**
 * Obtenir le label de statut textuel
 */
export function getDossierStatusLabel(dossier: Dossier): string {
    if (dossier.is_closed) {
        return 'Fermé';
    }

    const demandeursCount = dossier.demandeurs_count ?? 0;
    const proprietesCount = dossier.proprietes_count ?? 0;

    if (demandeursCount === 0 && proprietesCount === 0) {
        return 'Vide';
    }

    if (demandeursCount > 0 && proprietesCount > 0) {
        return 'En cours';
    }

    return 'Incomplet';
}