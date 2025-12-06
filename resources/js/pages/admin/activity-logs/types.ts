// pages/admin/activity-logs/types.ts

export interface ActivityLog {
    id: number;
    user: { 
        id: number; 
        name: string; 
        email: string;
    };
    district: { 
        id: number; 
        nom_district: string;
    } | null;
    action: string;
    action_label: string;
    entity_type: string;
    entity_label: string;
    document_type: string | null;
    description: string;
    metadata: any;
    created_at: string;
    ip_address: string;
}

export interface ActivityStats {
    total_actions: number;
    total_documents: number;
    today_actions: number;
    week_actions: number;
    month_actions: number;
    by_action: Record<string, number>;
    by_entity: Record<string, number>;
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
}

export interface ActivityLogsIndexProps {
    logs: PaginatedLogs;
    filters: ActivityFilters;
    stats: ActivityStats;
    users: Array<{ id: number; name: string; email: string }>;
    actions: Record<string, string>;
    documentTypes: Record<string, string>;
}
