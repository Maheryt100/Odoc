// ============================================
// 📦 types/index.d.ts - VERSION HARMONISÉE FINALE
// ============================================

import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';
import { ReactNode } from 'react';

// ============================================
// 🔐 AUTHENTIFICATION & NAVIGATION
// ============================================

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: ReactNode;
    href: string;
    label?: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    children?: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash: {
        error?: string; 
        message?: string; 
        success?: string;
    };
    districts: District[];
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

// ============================================
// 👤 USER - TYPE GLOBAL UNIFIÉ
// ============================================

export type UserRole = 'super_admin' | 'central_user' | 'admin_district' | 'user_district';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    role_name?: string;
    id_district: number | null;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    
    // Relations
    district?: {
        id: number;
        nom_district: string;
        nom_region?: string;
        nom_province?: string;
    } | null;
    
    location?: string;
    can_edit?: boolean;
    can_delete?: boolean;
}

// ============================================
// 🏢 DISTRICT
// ============================================

export interface District {
    id: number;
    nom_district: string;
    edilitaire: number;
    agricole: number;
    forestiere: number;
    touristique: number;
    
    region?: {
        id: number;
        nom_region: string;
        province?: {
            id: number;
            nom_province: string;
        };
    };
}

// ============================================
// 🏠 PROPRIETE - ✅ HARMONISÉ AVEC LARAVEL
// ============================================

export type Nature = 'Urbaine' | 'Suburbaine' | 'Rurale';
export type Vocation = 'Edilitaire' | 'Agricole' | 'Forestière' | 'Touristique';
export type TypeOperation = 'morcellement' | 'immatriculation';

export interface Propriete {
    id: number;
    lot: string;
    titre: string | null;
    contenance: number | null;
    proprietaire: string | null;
    propriete_mere: string | null;
    titre_mere: string | null;
    charge: string | null;
    situation: string | null;
    nature: Nature;
    vocation: Vocation | null;
    numero_FN: string | null;
    numero_requisition: string | null;
    type_operation: TypeOperation;
    date_requisition: string | null;
    date_inscription: string | null;
    dep_vol: string | null;
    numero_dep_vol: string | null;
    id_dossier: number;
    id_user: number;
    created_at: string;
    updated_at: string;
    
    // Relations (chargées via Eloquent)
    dossier?: Dossier;
    demandes?: Demande[];
    demandeurs?: Demandeur[];
    
    // Accessors (calculés côté serveur)
    dep_vol_complet?: string;
    titre_complet?: string;
    is_incomplete?: boolean;
    is_archived?: boolean;
    is_empty?: boolean;
    has_active_demandes?: boolean;
    status_label?: 'Vide' | 'Active' | 'Acquise' | 'Inconnu';
    
    // ✅ AJOUT: Propriété calculée côté client
    _computed?: {
        isIncomplete: boolean;
        hasDemandeurs: boolean;
        isArchived: boolean;
    };
}

// ============================================
// 👥 DEMANDEUR - ✅ HARMONISÉ AVEC LARAVEL
// ============================================

export interface Demandeur {
    id: number;
    titre_demandeur: string;
    nom_demandeur: string;
    prenom_demandeur: string | null;
    date_naissance: string;
    lieu_naissance: string | null;
    sexe: string | null;
    occupation: string | null;
    nom_pere: string | null;
    nom_mere: string | null;
    cin: string;
    date_delivrance: string | null;
    lieu_delivrance: string | null;
    date_delivrance_duplicata: string | null;
    lieu_delivrance_duplicata: string | null;
    domiciliation: string | null;
    situation_familiale: string | null;
    regime_matrimoniale: string | null;
    nationalite: string | null;
    telephone: string | null;
    date_mariage: string | null;
    lieu_mariage: string | null;
    marie_a: string | null;
    id_user: number;
    created_at: string;
    updated_at: string;
    
    // Relations
    demandes?: Demande[];
    proprietes?: Propriete[];
    dossiers?: Dossier[];
    
    // Accessors
    nom_complet?: string;
    is_incomplete?: boolean;
    hasProperty?: boolean;
    proprietes_actives_count?: number;
    proprietes_acquises_count?: number;
}

// ============================================
// 🔗 DEMANDE (PIVOT TABLE)
// ============================================

export type DemandeStatus = 'active' | 'archive';

export interface Demande {
    id: number;
    id_demandeur: number;
    id_propriete: number;
    total_prix: number;
    status: DemandeStatus;
    status_consort: boolean;
    ordre: number;
    motif_archive: string | null;
    id_user: number;
    created_at: string;
    updated_at: string;
    
    // Relations
    propriete?: Propriete;
    demandeur?: Demandeur;
    
    // Accessors
    is_principal?: boolean;
    is_consort?: boolean;
    is_active?: boolean;
    is_archived?: boolean;
}

// Alias pour compatibilité
export type Demander = Demande;

// ============================================
// 📁 DOSSIER
// ============================================

export interface Dossier {
    id: number;
    nom_dossier: string;
    numero_ouverture: string | null;
    numero_ouverture_display?: string;
    date_descente_debut: string;
    date_descente_fin: string;
    date_ouverture: string;
    date_fermeture: string | null;
    closed_by: number | null;
    motif_fermeture: string | null;
    type_commune: string;
    commune: string;
    fokontany: string;
    circonscription: string;
    id_district: number;
    id_user: number;
    created_at: string;
    updated_at: string;
    
    // Counts
    demandeurs_count?: number;
    proprietes_count?: number;
    pieces_jointes_count?: number;
    
    // Relations
    closedBy?: User;
    demandeurs?: Demandeur[];
    proprietes?: Propriete[];
    district?: District;
    user?: User;
    
    // Accessors
    is_closed?: boolean;
    is_open?: boolean;
    can_close?: boolean;
    can_modify?: boolean;
    status_label?: string;
}

// ============================================
// 📄 PAGINATION
// ============================================

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links?: Link[];
}

export interface Link {
    active: boolean;
    label: string;
    url: string | null;
}

// ============================================
// 📄 PAGE PROPS
// ============================================

export interface PageProps {
    auth: Auth;
    flash?: {
        error?: string;
        message?: string;
        success?: string;
    };
    dossier?: Dossier;
    demandeurs?: Demandeur[];
    proprietes?: Propriete[];
    documents?: Paginated<Demande>;
    districts?: District[];
    suggested_numero?: string;
    [key: string]: unknown;
}

// ============================================
// 🌐 GLOBAL DECLARATIONS
// ============================================

declare global {
    interface Window {
        route: (name: string, params?: any) => string;
    }
}

// ============================================
// 📦 EXPORTS UTILITAIRES
// ============================================

export type Proprietes = Propriete[];
export type Demandeurs = Demandeur[];
export type Demandes = Demande[];