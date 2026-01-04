// ============================================
// resources/js/types/topo.ts - TYPES COMPLETS
// ============================================

export interface TopoImport {
    id: number;
    batch_id: string;
    entity_type: 'propriete' | 'demandeur';
    raw_data: Record<string, any>;
    status: 'pending' | 'validated' | 'rejected';
    dossier_id: number;
    district_id: number;
    import_date: string;
    topo_user_name: string;
    files_count: number;
    rejection_reason?: string;
    processed_at?: string;
}

export interface TopoStats {
    total: number;
    pending: number;
    validated: number;
    rejected: number;
}

export interface TopoFile {
    id: number;
    name: string;
    size: number;
    mime_type: string;
    download_url: string;
}

export interface TopoImportDetailed extends TopoImport {
    files: TopoFile[];
}

// Props pour les composants
export interface TopoFluxIndexProps {
    imports: TopoImport[];
    stats: TopoStats;
    filters: {
        status: string;
        entity_type?: string;
    };
    canValidate: boolean;
}

export interface TopoFluxShowProps {
    import: TopoImportDetailed;
}