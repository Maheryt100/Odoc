// documents/hooks/useDocumentStats.ts - ✅ HOOK POUR STATISTIQUES

import { useMemo } from 'react';
import { ProprieteWithDemandeurs, DemandeurWithCSF } from '../types';

interface UseDocumentStatsParams {
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: DemandeurWithCSF[];
}

interface DocumentStats {
    // Propriétés
    totalProprietes: number;
    proprietesAvecRecu: number;
    proprietesAvecAdv: number;
    requisitionsGenerees: number;
    
    // Demandeurs
    totalDemandeurs: number;
    demandeursAvecCsf: number;
    
    // Pourcentages
    pourcentageRecu: number;
    pourcentageAdv: number;
    pourcentageCsf: number;
    pourcentageRequisition: number;
    
    // Manquants
    recuManquants: number;
    advManquants: number;
    csfManquants: number;
    requisitionsManquantes: number;
}

/**
 * Hook pour calculer les statistiques de génération de documents
 * 
 * @example
 * ```tsx
 * const stats = useDocumentStats({ proprietes, demandeurs });
 * console.log(stats.proprietesAvecAdv); // 5
 * console.log(stats.pourcentageAdv);     // 50
 * ```
 */
export function useDocumentStats({ 
    proprietes, 
    demandeurs 
}: UseDocumentStatsParams): DocumentStats {
    
    return useMemo(() => {
        // Compteurs propriétés
        const totalProprietes = proprietes.length;
        const proprietesAvecRecu = proprietes.filter(p => p.document_recu).length;
        const proprietesAvecAdv = proprietes.filter(p => p.document_adv).length;
        const requisitionsGenerees = proprietes.filter(p => p.document_requisition).length;
        
        // Compteurs demandeurs
        const totalDemandeurs = demandeurs.length;
        const demandeursAvecCsf = demandeurs.filter(d => d.document_csf).length;
        
        // Calcul des pourcentages
        const pourcentageRecu = totalProprietes > 0 
            ? Math.round((proprietesAvecRecu / totalProprietes) * 100) 
            : 0;
        
        const pourcentageAdv = totalProprietes > 0 
            ? Math.round((proprietesAvecAdv / totalProprietes) * 100) 
            : 0;
        
        const pourcentageCsf = totalDemandeurs > 0 
            ? Math.round((demandeursAvecCsf / totalDemandeurs) * 100) 
            : 0;
        
        const pourcentageRequisition = totalProprietes > 0 
            ? Math.round((requisitionsGenerees / totalProprietes) * 100) 
            : 0;
        
        // Calcul des manquants
        const recuManquants = totalProprietes - proprietesAvecRecu;
        const advManquants = totalProprietes - proprietesAvecAdv;
        const csfManquants = totalDemandeurs - demandeursAvecCsf;
        const requisitionsManquantes = totalProprietes - requisitionsGenerees;
        
        return {
            totalProprietes,
            proprietesAvecRecu,
            proprietesAvecAdv,
            requisitionsGenerees,
            totalDemandeurs,
            demandeursAvecCsf,
            pourcentageRecu,
            pourcentageAdv,
            pourcentageCsf,
            pourcentageRequisition,
            recuManquants,
            advManquants,
            csfManquants,
            requisitionsManquantes,
        };
    }, [proprietes, demandeurs]);
}

/**
 * Hook alternatif pour les stats par type de document
 * Utile pour afficher des métriques détaillées
 */
export function useDocumentStatsByType({ proprietes, demandeurs }: UseDocumentStatsParams) {
    
    return useMemo(() => {
        return {
            recu: {
                total: proprietes.length,
                generes: proprietes.filter(p => p.document_recu).length,
                manquants: proprietes.filter(p => !p.document_recu).length,
                pourcentage: proprietes.length > 0 
                    ? Math.round((proprietes.filter(p => p.document_recu).length / proprietes.length) * 100)
                    : 0
            },
            adv: {
                total: proprietes.length,
                generes: proprietes.filter(p => p.document_adv).length,
                manquants: proprietes.filter(p => !p.document_adv).length,
                pourcentage: proprietes.length > 0 
                    ? Math.round((proprietes.filter(p => p.document_adv).length / proprietes.length) * 100)
                    : 0
            },
            csf: {
                total: demandeurs.length,
                generes: demandeurs.filter(d => d.document_csf).length,
                manquants: demandeurs.filter(d => !d.document_csf).length,
                pourcentage: demandeurs.length > 0 
                    ? Math.round((demandeurs.filter(d => d.document_csf).length / demandeurs.length) * 100)
                    : 0
            },
            requisition: {
                total: proprietes.length,
                generes: proprietes.filter(p => p.document_requisition).length,
                manquants: proprietes.filter(p => !p.document_requisition).length,
                pourcentage: proprietes.length > 0 
                    ? Math.round((proprietes.filter(p => p.document_requisition).length / proprietes.length) * 100)
                    : 0
            }
        };
    }, [proprietes, demandeurs]);
}