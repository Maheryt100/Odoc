// pages/Statistics/types.ts

import { Auth } from '@/types';

// ✅ NOUVEAUX TYPES GÉOGRAPHIQUES
export interface Province {
    id: number;
    nom_province: string;
}

export interface Region {
    id: number;
    nom_region: string;
    id_province: number;
    province?: Province;
}

export interface District {
    id: number;
    nom_district: string;
    id_region: number;
    region?: Region;
}

// ✅ FILTRES GÉOGRAPHIQUES HIÉRARCHIQUES
export interface StatisticsFilters {
    period: string;
    date_from: string | null;
    date_to: string | null;
    province_id: number | null;  // ✅ Nouveau
    region_id: number | null;     // ✅ Nouveau
    district_id: number | null;
}

export interface OverviewStats {
    total_dossiers: number;
    dossiers_ouverts: number;
    dossiers_fermes: number;
    taux_croissance: number;
}

export interface DossiersStats {
    total: number;
    ouverts: number;
    fermes: number;
    duree_moyenne: number;
    en_retard: number;
}

export interface ProprietesStats {
    total: number;
    disponibles: number;
    disponibles_superficie: number;
    acquises: number;
    acquises_superficie: number;
    sans_demande: number;
    superficie_totale: number;
    superficie_moyenne: number;
    pourcentage_disponibles: number;
    pourcentage_disponibles_superficie: number;
    pourcentage_acquises: number;
    pourcentage_acquises_superficie: number;
}

export interface DemandeursStats {
    total: number;
    avec_propriete: number;
    sans_propriete: number;
    actifs: number;
    age_moyen: number;
}

export interface DemographicsStats {
    total_hommes: number;
    total_femmes: number;
    pourcentage_hommes: number;
    pourcentage_femmes: number;
    hommes_avec_propriete: number;
    femmes_avec_propriete: number;
    hommes_actifs: number;
    femmes_actifs: number;
    hommes_acquis: number;
    femmes_acquis: number;
    hommes_sans_propriete: number;
    femmes_sans_propriete: number;
    age_moyen: number;
    tranches_age: {
        [key: string]: number;
    };
}

export interface FinancialsStats {
    total_revenus_potentiels: number;
    revenus_actifs: number;
    revenus_archives: number;
    pourcentage_actif: number;
    pourcentage_archive: number;
    revenu_moyen: number;
    revenu_max: number;
    revenu_min: number;
    par_vocation_actif: {
        [key: string]: number;
    };
    par_vocation_archive: {
        [key: string]: number;
    };
}

export interface GeographicStats {
    top_communes: Array<{
        commune: string;
        fokontany: string;
        type_commune: string;
        count: number;
    }>;
}

export interface PerformanceStats {
    taux_completion: number;
    temps_moyen_traitement: number;
    dossiers_en_retard: number;
}

export interface Stats {
    overview: OverviewStats;
    dossiers: DossiersStats;
    proprietes: ProprietesStats;
    demandeurs: DemandeursStats;
    demographics: DemographicsStats;
    financials: FinancialsStats;
    geographic: GeographicStats;
    performance: PerformanceStats;
}

export interface ChartData {
    evolution_complete: Array<{
        month: string;
        dossiers: number;
        proprietes: number;
        demandeurs: number;
    }>;
    ouvertures_fermetures: Array<{
        month: string;
        ouvertures: number;
        fermetures: number;
    }>;
    repartition_nature: Array<{
        name: string;
        value: number;
        superficie: number;
    }>;
    repartition_vocation: Array<{
        name: string;
        value: number;
        superficie: number;
    }>;
    top_communes: Array<{
        commune: string;
        count: number;
    }>;
    top_districts: Array<{
        nom_district: string;
        count: number;
    }>;
    age_pyramid: {
        [key: string]: {
            hommes: number;
            femmes: number;
        };
    };
    completion_rate: {
        rate: number;
        complets: number;
        incomplets: number;
    };
}

// ✅ Props avec données géographiques
export interface StatisticsProps {
    auth: Auth;
    stats: Stats;
    charts: ChartData;
    filters: StatisticsFilters;
    provinces: Province[];
    regions: Region[];
    districts: District[];
    canFilterGeography: boolean;
    userDistrict: District | null;
}