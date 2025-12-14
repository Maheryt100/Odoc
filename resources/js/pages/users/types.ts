// users/types.ts
export type { User, UserRole, District } from '@/types';

// ============================================
// TYPES SPÉCIFIQUES AU MODULE USERS
// ============================================

export type UserStatus = 'active' | 'inactive';

export interface UserStats {
    total: number;
    super_admins: number;
    central_users: number;
    admin_district: number;
    user_district: number;
    active: number;
    inactive: number;
}

export interface UserFilters {
    role?: string;
    district?: string;
    status?: string;
    search?: string;
}

export interface PaginatedUsers {
    data: import('@/types').User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface UsersIndexProps {
    users: PaginatedUsers;
    stats: UserStats;
    districts: import('@/types').District[];
    filters: UserFilters;
    roles: Record<import('@/types').UserRole, string>;
}

// ============================================
// PERMISSIONS
// ============================================

export interface UserPermission {
    id: number;
    id_user: number;
    permission: string;
    granted: boolean;
}

export const AVAILABLE_PERMISSIONS = {
    VIEW_STATISTICS: 'view_statistics',
    EXPORT_DATA: 'export_data',
    MANAGE_PRICES: 'manage_prices',
    ARCHIVE_DOCUMENTS: 'archive_documents',
    DELETE_DOCUMENTS: 'delete_documents',
    MANAGE_CONSORTS: 'manage_consorts',
} as const;

export type PermissionKey = typeof AVAILABLE_PERMISSIONS[keyof typeof AVAILABLE_PERMISSIONS];