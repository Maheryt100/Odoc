// resources/js/pages/dossiers/types.ts - ✅ VERSION COMPLÈTE

import { Demandeur, Dossier, Propriete } from '@/types';

// ✅ Réexporter les types centraux
export type { Dossier, Demandeur, Propriete, District, User } from '@/types';

// ============================================
// 🔐 PERMISSIONS DÉTAILLÉES
// ============================================

export interface DossierPermissions {
    canEdit: boolean;
    canDelete: boolean;
    canClose: boolean;
    canArchive: boolean;
    canExport: boolean;
    canGenerateDocuments: boolean;
}

// ============================================
// 🔍 FILTRES - ✅ NOUVEAUX TYPES
// ============================================

export type FiltreStatutDossierType = 'tous' | 'ouverts' | 'fermes' | 'incomplets' | 'avec_problemes';
export type TriDossierType = 'date' | 'nom' | 'commune' | 'numero';

export interface DossierFilters {
    status: FiltreStatutDossierType;
    search: string;
    districtId?: string;
    yearStart?: string;
    yearEnd?: string;
}

// ============================================
// 🎨 PROPS DES COMPOSANTS
// ============================================

export interface DossierFormProps {
    districts: import('@/types').District[];
    dossier?: import('@/types').Dossier;
    suggested_numero?: number;
    mode: 'create' | 'edit';
    onCancel?: () => void;
}

export interface DossierCardProps {
    dossier: import('@/types').Dossier;
}

export interface DossierInfoSectionProps {
    dossier: Dossier;              // plus de &
    demandeursCount: number;
    proprietesCount: number;
    onCloseToggle: () => void;
    permissions: DossierPermissions;
    userRole?: string;
}

export interface CloseDossierDialogProps {
    dossier: import('@/types').Dossier;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export interface DossierTableProps {
    dossiers: import('@/types').Dossier[];
    auth: {
        user: {
            id: number;
            role: string;
            id_district?: number | null;
        };
    };
    expandedRows: Set<number>;
    onToggleExpand: (id: number) => void;
    onDelete: (dossier: import('@/types').Dossier) => void;
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export interface DossierFiltersProps {
    filtreStatut: FiltreStatutDossierType;
    onFiltreStatutChange: (filtre: FiltreStatutDossierType) => void;
    recherche: string;
    onRechercheChange: (recherche: string) => void;
    districtFilter: string;
    onDistrictFilterChange: (district: string) => void;
    yearStart: string;
    onYearStartChange: (year: string) => void;
    yearEnd: string;
    onYearEndChange: (year: string) => void;
    tri: TriDossierType;
    onTriChange: (tri: TriDossierType) => void;
    ordre: 'asc' | 'desc';
    onOrdreToggle: () => void;
    districts: import('@/types').District[];
    availableYears: number[];
    totalDossiers: number;
    totalFiltres: number;
    canShowAllDistricts: boolean;
}

// ============================================
// 📊 STATISTIQUES
// ============================================

export interface DossierStats {
    total: number;
    open: number;
    closed: number;
    recent: number;
    incomplete: number;
    withIssues: number;
}

// ============================================
// 📝 FORMULAIRE
// ============================================

export interface DossierFormData {
    nom_dossier: string;
    numero_ouverture: number;
    type_commune: string;
    commune: string;
    fokontany: string;
    date_descente_debut: string;
    date_descente_fin: string;
    date_ouverture: string;
    circonscription: string;
    id_district: number;
}



// ============================================
// 🎯 STATUS BADGES
// ============================================

export interface StatusBadge {
    type: 'warning' | 'error' | 'info' | 'success';
    label: string;
    icon: any;
    tooltip: string;
}

// ============================================
// 📄 VALIDATION
// ============================================

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}