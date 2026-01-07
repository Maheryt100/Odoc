// resources/js/pages/TopoFlux/types.ts

export interface TopoImport {
    id: number;
    batch_id: string;
    entity_type: 'propriete' | 'demandeur';
    raw_data: Record<string, any>;
    status: 'pending' | 'archived' | 'validated' | 'rejected';
    
    // Informations dossier et district
    dossier_id: number;
    dossier_nom: string;
    dossier_numero_ouverture: number;
    district_id: number;
    district_nom: string;
    
    // Informations opérateur
    import_date: string;
    topo_user_name: string;
    
    // Fichiers
    files_count: number;
    files?: TopoFile[];
    
    // CHAMPS REQUIS PAR ImportCard
    can_import: boolean;
    is_archived: boolean;
    has_errors: boolean;
    error_summary?: string | null;
    is_duplicate: boolean;
    duplicate_action: string;
    
    // Informations de rejet/traitement
    rejection_reason?: string;
    processed_at?: string;
    
    // Validation détaillée (optionnelle)
    validation?: {
        can_proceed: boolean;
        errors: string[];
        warnings: string[];
        duplicate_info?: {
            is_duplicate: boolean;
            existing_entity?: any;
            match_confidence?: number;
            match_method?: string;
            action?: string;
        };
    };
}

export interface TopoFile {
    id: number;
    name: string;
    size: number;
    mime_type: string;
    category: string;
    download_url?: string;
}

export interface TopoStats {
    total: number;
    pending: number;
    archived: number;
    validated: number;
    rejected: number;
}

// ============================================
// PROPS POUR LES PAGES
// ============================================

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
    import: TopoImport;
    files: TopoFile[];
}

// ============================================
// PROPS POUR LES COMPOSANTS
// ============================================

export interface ImportCardProps {
    import: TopoImport;
    canValidate: boolean;
    onImport: () => void;
    onReject: () => void;
    onArchive: () => void;
    onUnarchive: () => void;
    onViewDetails: () => void;
    onPreviewFiles: () => void;
}

export interface RejectDialogProps {
    open: boolean;
    reason: string;
    onReasonChange: (reason: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
    processing: boolean;
}

export interface FilePreviewDialogProps {
    open: boolean;
    import: TopoImport | null;
    selectedFiles: number[];
    onSelectionChange: (fileIds: number[]) => void;
    onClose: () => void;
}

export interface StatsCardsProps {
    stats: TopoStats;
}