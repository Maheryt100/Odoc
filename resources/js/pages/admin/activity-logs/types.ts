// pages/admin/activity-logs/types.ts - VERSION COMPLÈTE

export interface ActivityLog {
    id: number;
    
    // Utilisateur
    user: { 
        id: number; 
        name: string; 
        email: string;
    };
    
    // District
    district: { 
        id: number; 
        nom_district: string;
    } | null;
    
    // Action
    action: string;
    action_label: string;
    
    // Entité
    entity_type: string;
    entity_label: string;
    entity_id: number | null;
    
    // Document
    document_type: string | null;
    
    // Description et détails
    description: string;
    details: string;
    
    // Métadonnées
    metadata: Record<string, any> | null;
    
    // Informations techniques
    ip_address: string;
    user_agent: string | null;
    
    // Dates
    created_at: string;
    updated_at?: string;
}

export interface ActivityStats {
    total_actions: number;
    total_documents: number;
    today_actions: number;
    week_actions: number;
    month_actions: number;
    by_action?: Record<string, number>;
    by_entity?: Record<string, number>;
}

export interface ActivityFilters {
    user_id?: string;
    action?: string;
    document_type?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    [key: string]: any;
}

export interface PaginatedLogs {
    data: ActivityLog[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number;
    to: number;
}

export interface ActivityLogsIndexProps {
    logs: PaginatedLogs;
    filters: ActivityFilters;
    stats: ActivityStats;
    users: Array<{ id: number; name: string; email: string }>;
    actions: Record<string, string>;
    documentTypes: Record<string, string>;
}

// Types d'actions
export enum ActionType {
    LOGIN = 'login',
    LOGOUT = 'logout',
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    ARCHIVE = 'archive',
    UNARCHIVE = 'unarchive',
    GENERATE = 'generate',
    DOWNLOAD = 'download',
    EXPORT = 'export',
    CLOSE = 'close',
    REOPEN = 'reopen',
    UPLOAD = 'upload',
    VERIFY = 'verify',
}

// Types d'entités
export enum EntityType {
    AUTH = 'auth',
    USER = 'user',
    DOSSIER = 'dossier',
    PROPRIETE = 'propriete',
    DEMANDEUR = 'demandeur',
    DOCUMENT = 'document',
    PIECE_JOINTE = 'piece_jointe',
    DISTRICT = 'district',
}

// Types de documents
export enum DocumentType {
    RECU = 'recu',
    ACTE_VENTE = 'acte_vente',
    CSF = 'csf',
    REQUISITION = 'requisition',
}