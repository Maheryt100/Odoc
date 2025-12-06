// documents/helpers.ts - FONCTIONS CORRIGÉES

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