// documents/hooks/useDocumentStats.ts - ✅ SANS REÇU

import { useMemo } from 'react';
import { ProprieteWithDemandeurs, DemandeurWithCSF } from '../types';

interface UseDocumentStatsParams {
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: DemandeurWithCSF[];
}

interface DocumentStats {
    // Propriétés
    totalProprietes: number;
    proprietesAvecRecuReference: number; // ✅ NOUVEAU : Référence reçu externe
    proprietesAvecAdv: number;
    requisitionsGenerees: number;
    
    // Demandeurs
    totalDemandeurs: number;
    demandeursAvecCsf: number;
    
    // Pourcentages
    pourcentageRecuReference: number; // ✅ CHANGÉ
    pourcentageAdv: number;
    pourcentageCsf: number;
    pourcentageRequisition: number;
    
    // Manquants
    recuReferencesManquantes: number; // ✅ CHANGÉ
    advManquants: number;
    csfManquants: number;
    requisitionsManquantes: number;
}

/**
 * Hook pour calculer les statistiques de génération de documents
 */
export function useDocumentStats({ 
    proprietes, 
    demandeurs 
}: UseDocumentStatsParams): DocumentStats {
    
    return useMemo(() => {
        // Compteurs propriétés
        const totalProprietes = proprietes.length;
        
        // ✅ CHANGÉ : Compter les références de reçu au lieu des reçus générés
        const proprietesAvecRecuReference = proprietes.filter(p => p.recu_reference).length;
        
        const proprietesAvecAdv = proprietes.filter(p => p.document_adv).length;
        const requisitionsGenerees = proprietes.filter(p => p.document_requisition).length;
        
        // Compteurs demandeurs
        const totalDemandeurs = demandeurs.length;
        const demandeursAvecCsf = demandeurs.filter(d => d.document_csf).length;
        
        // Calcul des pourcentages
        const pourcentageRecuReference = totalProprietes > 0 
            ? Math.round((proprietesAvecRecuReference / totalProprietes) * 100) 
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
        const recuReferencesManquantes = totalProprietes - proprietesAvecRecuReference;
        const advManquants = totalProprietes - proprietesAvecAdv;
        const csfManquants = totalDemandeurs - demandeursAvecCsf;
        const requisitionsManquantes = totalProprietes - requisitionsGenerees;
        
        return {
            totalProprietes,
            proprietesAvecRecuReference,
            proprietesAvecAdv,
            requisitionsGenerees,
            totalDemandeurs,
            demandeursAvecCsf,
            pourcentageRecuReference,
            pourcentageAdv,
            pourcentageCsf,
            pourcentageRequisition,
            recuReferencesManquantes,
            advManquants,
            csfManquants,
            requisitionsManquantes,
        };
    }, [proprietes, demandeurs]);
}

/**
 * Hook alternatif pour les stats par type de document
 */
export function useDocumentStatsByType({ proprietes, demandeurs }: UseDocumentStatsParams) {
    
    return useMemo(() => {
        return {
            recu_reference: { // ✅ CHANGÉ
                total: proprietes.length,
                generes: proprietes.filter(p => p.recu_reference).length,
                manquants: proprietes.filter(p => !p.recu_reference).length,
                pourcentage: proprietes.length > 0 
                    ? Math.round((proprietes.filter(p => p.recu_reference).length / proprietes.length) * 100)
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