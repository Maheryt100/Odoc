// resources/js/pages/TopoFlux/types.ts

export interface TopoImport {
    id: number;
    batch_id: string;
    entity_type: 'propriete' | 'demandeur';
    action_suggested: 'create' | 'update';
    raw_data: any;
    has_warnings: boolean;
    warnings: string[] | null;
    matched_entity_id: number | null;
    matched_entity_details: any;
    match_confidence: number | null;
    match_method: string | null;
    import_date: string;
    dossier_id: number;
    dossier_nom: string;
    dossier_numero_ouverture: number;
    district_id: number;
    district_nom: string;
    files_count: number;
    files: TopoFile[];
    topo_user_name: string;
    status: 'pending' | 'validated' | 'rejected';
    processed_at?: string;
    rejection_reason?: string;
}

export interface TopoFile {
    name: string;
    size: number;
    extension: string;
    category: string;
    mime_type?: string;
    path?: string;
}

export interface TopoFluxStats {
    total: number;
    pending: number;
    validated: number;
    rejected: number;
    with_warnings: number;
}

export interface ImportCardProps {
    import: TopoImport;
    canValidate: boolean;
    onValidate: () => void;
    onReject: () => void;
    onViewDetails: () => void;
}

export interface RejectDialogProps {
    open: boolean;
    reason: string;
    onReasonChange: (reason: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export interface ImportDetailsDialogProps {
    import: TopoImport | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}