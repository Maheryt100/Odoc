// ============================================
// 📦 pages/dossiers/types.ts
// ============================================

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
// 🔍 FILTRES
// ============================================

export interface DossierFilters {
    status?: 'all' | 'open' | 'closed';
    search?: string;
    dateDebut?: string;
    dateFin?: string;
    selectedLetter?: string | null;
    district?: string;
    type_commune?: string;
}

// ============================================
// 🎨 PROPS DES COMPOSANTS
// ============================================

export interface DossierFormProps {
    districts: import('@/types').District[];
    dossier?: import('@/types').Dossier;
    suggested_numero?: string;
    mode: 'create' | 'edit';
    onCancel?: () => void;
}

export interface DossierCardProps {
    dossier: import('@/types').Dossier;
}

export interface DossierInfoSectionProps {
    dossier: import('@/types').Dossier;
    demandeursCount: number;
    proprietesCount: number;
    onCloseToggle: () => void;
    permissions: DossierPermissions;
}

export interface CloseDossierDialogProps {
    dossier: import('@/types').Dossier;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// ============================================
// 📊 STATISTIQUES
// ============================================

export interface DossierStats {
    total: number;
    open: number;
    closed: number;
    recent: number;
}

// ============================================
// 📝 FORMULAIRE - ✅ AJOUT MANQUANT
// ============================================

export interface DossierFormData {
    nom_dossier: string;
    numero_ouverture: string;
    type_commune: string;
    commune: string;
    fokontany: string;
    date_descente_debut: string;
    date_descente_fin: string;
    date_ouverture: string;
    circonscription: string;
    id_district: number;
}