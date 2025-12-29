// resources/js/hooks/useTopoImport.ts
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';

interface TopoImportData {
    import_id: number;
    data: any;
    match_info: any;
    files?: Array<{
        original_name: string;
        stored_name: string;
        path: string;
        size: number;
        extension: string;
        category: string;
    }>;
}

interface UseTopoImportReturn {
    hasTopoData: boolean;
    topoData: any | null;
    matchInfo: any | null;
    importId: number | null;
    isUpdate: boolean;
    files: any[];
}

/**
 * ✅ Hook pour gérer les données importées depuis TopoManager
 * 
 * Les données sont injectées par le middleware HandleTopoImport
 * via Inertia::share() depuis la session Laravel
 * 
 * Usage:
 * ```tsx
 * const { hasTopoData, topoData, isUpdate, files } = useTopoImport();
 * 
 * useEffect(() => {
 *   if (hasTopoData && topoData) {
 *     // Pré-remplir le formulaire
 *     const formData = topoDataToProprieteForm(topoData);
 *     setFormData(formData);
 *   }
 * }, [hasTopoData, topoData]);
 * ```
 */
export function useTopoImport(): UseTopoImportReturn {
    // ✅ Récupérer depuis les props Inertia (injectées par HandleTopoImport)
    const { topo_import } = usePage<{ topo_import?: TopoImportData }>().props;
    
    const hasTopoData = !!topo_import?.data;
    const topoData = topo_import?.data || null;
    const matchInfo = topo_import?.match_info || null;
    const importId = topo_import?.import_id || null;
    const isUpdate = !!matchInfo;
    const files = topo_import?.files || [];
    
    useEffect(() => {
        if (hasTopoData) {
            const entityType = topoData.entity_type || 
                              (topoData.lot ? 'propriété' : 'demandeur');
            
            const message = isUpdate 
                ? `Mise à jour ${entityType} - Entité existante détectée`
                : `Nouvelle ${entityType} - Formulaire pré-rempli`;
            
            toast.info('📱 Données TopoManager chargées', {
                description: message,
                duration: 5000,
                action: files.length > 0 ? {
                    label: `${files.length} fichier(s)`,
                    onClick: () => console.log('Fichiers:', files)
                } : undefined
            });
        }
    }, [hasTopoData, isUpdate, files.length]);
    
    return {
        hasTopoData,
        topoData,
        matchInfo,
        importId,
        isUpdate,
        files
    };
}

/**
 * ✅ Convertit les données TopoManager au format du formulaire Propriété
 */
export function topoDataToProprieteForm(topoData: any): any {
    return {
        lot: topoData.lot || '',
        type_operation: topoData.type_operation || 'immatriculation',
        nature: topoData.nature || '',
        vocation: topoData.vocation || '',
        proprietaire: topoData.proprietaire || '',
        situation: topoData.situation || '',
        propriete_mere: topoData.propriete_mere || '',
        titre_mere: topoData.titre_mere || '',
        titre: topoData.titre || '',
        contenance: topoData.contenance?.toString() || '',
        charge: topoData.charge || '',
        numero_FN: topoData.numero_FN || '',
        numero_requisition: topoData.numero_requisition || '',
        date_requisition: topoData.date_requisition || '',
        date_depot_1: topoData.date_depot_1 || '',
        date_depot_2: topoData.date_depot_2 || '',
        date_approbation_acte: topoData.date_approbation_acte || '',
        dep_vol_inscription: topoData.dep_vol_inscription || '',
        numero_dep_vol_inscription: topoData.numero_dep_vol_inscription || '',
        dep_vol_requisition: topoData.dep_vol_requisition || '',
        numero_dep_vol_requisition: topoData.numero_dep_vol_requisition || ''
    };
}

/**
 * ✅ Convertit les données TopoManager au format du formulaire Demandeur
 */
export function topoDataToDemandeurForm(topoData: any): any {
    return {
        titre_demandeur: topoData.titre_demandeur || '',
        nom_demandeur: topoData.nom_demandeur || '',
        prenom_demandeur: topoData.prenom_demandeur || '',
        date_naissance: topoData.date_naissance || '',
        lieu_naissance: topoData.lieu_naissance || '',
        sexe: topoData.sexe || '',
        occupation: topoData.occupation || '',
        nom_pere: topoData.nom_pere || '',
        nom_mere: topoData.nom_mere || '',
        cin: topoData.cin || '',
        date_delivrance: topoData.date_delivrance || '',
        lieu_delivrance: topoData.lieu_delivrance || '',
        date_delivrance_duplicata: topoData.date_delivrance_duplicata || '',
        lieu_delivrance_duplicata: topoData.lieu_delivrance_duplicata || '',
        domiciliation: topoData.domiciliation || '',
        nationalite: topoData.nationalite || 'Malagasy',
        situation_familiale: topoData.situation_familiale || 'Non spécifiée',
        regime_matrimoniale: topoData.regime_matrimoniale || 'Non spécifié',
        date_mariage: topoData.date_mariage || '',
        lieu_mariage: topoData.lieu_mariage || '',
        marie_a: topoData.marie_a || '',
        telephone: topoData.telephone || ''
    };
}

/**
 * ✅ Comparaison données anciennes vs nouvelles (pour UPDATE)
 */
export function getDiff(oldData: any, newData: any): string[] {
    const changes: string[] = [];
    
    Object.keys(newData).forEach(key => {
        if (oldData[key] !== newData[key]) {
            changes.push(`${key}: "${oldData[key]}" → "${newData[key]}"`);
        }
    });
    
    return changes;
}