// documents/hooks/useDocumentStats.ts - NOUVEAU HOOK OPTIMISÉ
import { useMemo } from 'react';
import { ProprieteWithDemandeurs, DemandeurWithCSF, DocumentStats } from '../types';
import { calculatePercentage } from '../helpers';

interface UseDocumentStatsParams {
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: DemandeurWithCSF[];
}

interface UseDocumentStatsReturn extends DocumentStats {
    recuPercentage: number;
    advPercentage: number;
    csfPercentage: number;
    requisitionPercentage: number;
    calculatePercentage: (part: number, total: number) => number;
}

/**
 * ✅ Hook personnalisé pour calculer les statistiques des documents
 * Optimisé avec useMemo pour éviter les recalculs inutiles
 */
export const useDocumentStats = ({ 
    proprietes, 
    demandeurs 
}: UseDocumentStatsParams): UseDocumentStatsReturn => {
    
    return useMemo(() => {
        const stats = {
            totalProprietes: proprietes.length,
            proprietesAvecRecu: proprietes.filter(p => p.document_recu).length,
            proprietesAvecAdv: proprietes.filter(p => p.document_adv).length,
            totalDemandeurs: demandeurs.length,
            demandeursAvecCsf: demandeurs.filter(d => d.document_csf).length,
            requisitionsGenerees: proprietes.filter(p => p.document_requisition).length,
        };

        return {
            ...stats,
            recuPercentage: calculatePercentage(stats.proprietesAvecRecu, stats.totalProprietes),
            advPercentage: calculatePercentage(stats.proprietesAvecAdv, stats.totalProprietes),
            csfPercentage: calculatePercentage(stats.demandeursAvecCsf, stats.totalDemandeurs),
            requisitionPercentage: calculatePercentage(stats.requisitionsGenerees, stats.totalProprietes),
            calculatePercentage,
        };
    }, [proprietes, demandeurs]);
};

/**
 * ✅ EXEMPLE D'UTILISATION :
 * 
 * const stats = useDocumentStats({ proprietes, demandeurs });
 * 
 * console.log(stats.proprietesAvecRecu); // 5
 * console.log(stats.recuPercentage); // 50
 */