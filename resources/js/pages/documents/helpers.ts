// documents/helpers.ts - FONCTIONS CORRIGÉES

import { DocumentGenere } from "./types";

/**
 * ✅ CORRIGÉ : Gérer undefined au lieu de null
 */
export const safePrix = (prix: number | undefined): number => {
    return prix ?? 0;
};

export const safeContenance = (contenance: number | undefined): number => {
    return contenance ?? 0;
};

export const formatMontant = (montant: number | string | undefined): string => {
    const num = typeof montant === 'string' ? parseFloat(montant) : (montant ?? 0);
    return `${num.toLocaleString('fr-FR')} Ar`;
};

export const formatContenance = (contenance: number | undefined): string => {
    const contenanceSafe = safeContenance(contenance);
    
    if (contenanceSafe === 0) return '-';
    
    const hectares = Math.floor(contenanceSafe / 10000);
    const reste = contenanceSafe % 10000;
    const ares = Math.floor(reste / 100);
    const centiares = reste % 100;
    
    const parts = [];
    if (hectares > 0) parts.push(`${hectares}Ha`);
    if (ares > 0) parts.push(`${ares}A`);
    parts.push(`${centiares}Ca`);
    
    return parts.join(' ');
};

export const formatDate = (date: string | Date | undefined): string => {
    if (!date) return '-';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Calculer le pourcentage avec gestion des cas limites
 */
export const calculatePercentage = (part: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
};

/**
 * ✅ Vérifier si un document nécessite une régénération
 */
export const needsRegeneration = (document: DocumentGenere | null | undefined): boolean => {
    return document?.metadata?.needs_regeneration === true;
};

/**
 * ✅ Vérifier si la régénération a échoué
 */
export const hasRegenerationFailed = (document: DocumentGenere | null | undefined): boolean => {
    return document?.metadata?.regeneration_failed === true;
};

/**
 * ✅ Obtenir le nombre de régénérations
 */
export const getRegenerationCount = (document: DocumentGenere | null | undefined): number => {
    return document?.metadata?.regeneration_count ?? 0;
};

/**
 * ✅ Obtenir le statut d'un document pour l'UI
 */
export const getDocumentStatus = (
    document: DocumentGenere | null | undefined
): {
    status: 'missing' | 'needs_regen' | 'failed' | 'valid';
    label: string;
    variant: 'outline' | 'destructive' | 'default';
    color: string;
} => {
    if (!document) {
        return {
            status: 'missing',
            label: 'Non généré',
            variant: 'outline',
            color: 'text-gray-500',
        };
    }

    if (hasRegenerationFailed(document)) {
        return {
            status: 'failed',
            label: 'Échec régénération',
            variant: 'destructive',
            color: 'text-red-500',
        };
    }

    if (needsRegeneration(document)) {
        return {
            status: 'needs_regen',
            label: 'Régénération requise',
            variant: 'outline',
            color: 'text-amber-500',
        };
    }

    const regenCount = getRegenerationCount(document);
    return {
        status: 'valid',
        label: regenCount > 0 ? `Disponible (×${regenCount})` : 'Disponible',
        variant: 'default',
        color: 'text-green-500',
    };
};