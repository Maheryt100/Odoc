// ============================================
// 📦 types/index.d.ts - VERSION FINALE CORRIGÉE
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

// ✅ CORRECTION : Index signature ajoutée
export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash: {
        error: string; 
        message?: string; 
        success?: string;
    };
    districts: District[];
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown; // ✅ AJOUTÉ pour compatibilité usePage
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
    status?: boolean;
    id_district?: number | null | undefined; // ✅ CORRECTION
    email_verified_at?: string | null | undefined; // ✅ CORRECTION
    created_at: string;
    updated_at: string;
    
    district?: {
        id: number;
        nom_district: string;
        nom_region?: string;
        nom_province?: string;
    } | null | undefined; // ✅ CORRECTION
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
// 🏠 PROPRIETE - TYPE COMPLET
// ============================================

export type Nature = 'Urbaine' | 'Suburbaine' | 'Rurale';
export type Vocation = 'Edilitaire' | 'Agricole' | 'Forestière' | 'Touristique';
export type TypeOperation = 'morcellement' | 'immatriculation';

export interface Propriete {
    id: number;
    lot: string;
    titre: string | undefined;  // ✅ CHANGÉ : null retiré
    contenance: number | undefined;  // ✅ CHANGÉ
    proprietaire: string | undefined;  // ✅ CHANGÉ
    propriete_mere: string | undefined;
    titre_mere: string | undefined;
    charge: string | undefined;
    situation: string | undefined;  // ✅ CHANGÉ
    nature: Nature;
    vocation: Vocation;
    numero_FN: string | undefined;
    numero_requisition: string | undefined;
    status: boolean;
    type_operation: TypeOperation;
    date_requisition: string | undefined;
    date_inscription: string | undefined;
    dep_vol: string | undefined;
    numero_dep_vol: string | undefined;
    id_dossier: number;
    
    demandes?: Demande[];
    
    is_incomplete?: boolean;
    is_archived?: boolean;
    is_empty?: boolean;
    has_active_demandes?: boolean;
    status_label?: 'Vide' | 'Active' | 'Acquise' | 'Inconnu';
}

// ============================================
// 👥 DEMANDEUR - TYPE COMPLET
// ============================================

export interface Demandeur {
    id: number;
    titre_demandeur: string;
    nom_demandeur: string;
    prenom_demandeur: string | undefined;  // ✅ CHANGÉ
    date_naissance: string;
    lieu_naissance: string | undefined;  // ✅ CHANGÉ
    sexe: string | undefined;
    occupation: string | undefined;  // ✅ CHANGÉ
    nom_pere: string | undefined;
    nom_mere: string | undefined;  // ✅ CHANGÉ
    cin: string;
    date_delivrance: string | undefined;  // ✅ CHANGÉ
    lieu_delivrance: string | undefined;  // ✅ CHANGÉ
    date_delivrance_duplicata: string | undefined;
    lieu_delivrance_duplicata: string | undefined;
    domiciliation: string | undefined;  // ✅ CHANGÉ
    situation_familiale: string | undefined;
    regime_matrimoniale: string | undefined;
    nationalite: string;
    telephone: string | undefined;
    date_mariage: string | undefined;
    lieu_mariage: string | undefined;
    marie_a: string | undefined;
    id_user: number;
    
    hasProperty?: boolean;
    proprietes_actives_count?: number;
    proprietes_acquises_count?: number;
    nom_complet?: string;
    is_incomplete?: boolean;
    
    demandes?: Demande[];
    proprietes?: Propriete[];
    
    created_at: string;
    updated_at: string;
}

// ============================================
// 🔗 DEMANDE (PIVOT TABLE)
// ============================================

export interface Demande {
    id: number;
    id_demandeur: number;
    id_propriete: number;
    total_prix: number;
    status: 'active' | 'archive';
    status_consort: boolean;
    ordre: number;
    motif_archive: string | null | undefined; // ✅ CORRECTION
    
    propriete?: Propriete;
    demandeur?: Demandeur;
    
    created_at?: string;
    updated_at?: string;
}

export type Demander = Demande;

// ============================================
// 📁 DOSSIER - TYPE COMPLET
// ============================================

export interface Dossier {
    id: number;
    nom_dossier: string;
    numero_ouverture: string | undefined;  // ✅ CHANGÉ
    numero_ouverture_display: string | undefined;
    date_descente_debut: string;
    date_descente_fin: string;
    date_ouverture: string;
    date_fermeture: string | undefined;  // ✅ CHANGÉ : null retiré
    closed_by: number | undefined;
    motif_fermeture: string | undefined;
    type_commune: string;
    commune: string;
    fokontany: string;
    circonscription: string;
    id_district: number;
    id_user: number;
    demandeurs_count: number;
    proprietes_count: number;
    
    is_closed: boolean;
    is_open: boolean;
    can_close?: boolean;
    can_modify?: boolean;
    status_label?: string;
    
    closedBy?: User;
    demandeurs?: Demandeur[];
    proprietes?: Propriete[];
    district?: District;
    user?: User;
    pieces_jointes_count?: number;
    
    created_at: string;
    updated_at: string;
}

// ============================================
// 📄 PAGE PROPS - CORRIGÉE
// ============================================

// ✅ CORRECTION : Index signature ajoutée
export interface PageProps {
    dossier?: Dossier;
    demandeurs?: Demandeur[];
    proprietes?: Propriete[];
    documents?: Paginated<Demande>;
    districts?: District[];
    suggested_numero?: string;
    [key: string]: unknown; // ✅ AJOUTÉ
}

export interface Paginated<T> {
    last_page: number;
    current_page: number;
    data: T[];
    links: Link[];
}

export interface Link {
    active: boolean;
    label: string;
    url: string | null | undefined; // ✅ CORRECTION
}

// ============================================
// 🌐 GLOBAL DECLARATIONS
// ============================================

declare global {
    interface Window {
        route: (name: string, params?: any) => string;
    }
}

export type Proprietes = Propriete[];
export type Demandeurs = Demandeur[];