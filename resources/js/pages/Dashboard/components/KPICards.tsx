// Dashboard/components/KPICards.tsx - VERSION CORRIGÉE
import type { KPI } from '../types';
import { ProprietesCard } from './ProprietesCard';
import { DemandeursCard } from './DemandeursCard';
import { DossiersCard } from './DossiersCard';
import { RevenueCard } from './RevenueCard';

interface Props {
    kpis: KPI;
}

export function KPICards({ kpis }: Props) {
    const variations = {
        dossiers: '+12%',
        proprietes: '+8%',
        demandeurs: '+15%',
        revenus: '+25%'
    };

    const safeKpis = {
        dossiers_ouverts: kpis.dossiers_ouverts ?? 0,
        dossiers_fermes: kpis.dossiers_fermes ?? 0,
        proprietes_disponibles: kpis.proprietes_disponibles ?? 0,
        proprietes_acquises: kpis.proprietes_acquises ?? 0,
        completion: kpis.completion ?? {
            taux: 0,
            dossiers_complets: 0,
            dossiers_incomplets: 0,
            total_dossiers: 0,
            proprietes_incompletes: 0,
            demandeurs_incomplets: 0,
        },
        superficie_details: kpis.superficie_details ?? {
            totale: 0,
            acquise: 0,
            disponible: 0,
        },
        demandeurs_details: kpis.demandeurs_details ?? {
            total: 0,
            actifs: 0,
            acquis: 0,
            sans_propriete: 0,
            hommes: 0,
            femmes: 0,
            hommes_actifs: 0,
            femmes_actifs: 0,
            hommes_acquis: 0,
            femmes_acquis: 0,
        },
        demandeurs_actifs: kpis.demandeurs_actifs ?? 0,
        revenus_potentiels: kpis.revenus_potentiels ?? 0,
        nouveaux_dossiers: kpis.nouveaux_dossiers ?? 0,
        dossiers_en_retard: kpis.dossiers_en_retard ?? 0,
        temps_moyen_traitement: kpis.temps_moyen_traitement ?? 0,
        demandeurs_sans_propriete: kpis.demandeurs_sans_propriete ?? 0,
        documents_generes_aujourdhui: kpis.documents_generes_aujourdhui ?? 0,
        utilisateurs_actifs_24h: kpis.utilisateurs_actifs_24h ?? 0,
    };

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Dossiers - 1 colonne sur mobile, 1 sur tablet, 1 sur desktop */}
            <DossiersCard 
                ouverts={safeKpis.dossiers_ouverts}
                fermes={safeKpis.dossiers_fermes}
                nouveaux={safeKpis.nouveaux_dossiers}
                enRetard={safeKpis.dossiers_en_retard}
                completion={safeKpis.completion}
                variation={variations.dossiers}
            />
            
            {/* Demandeurs - 1 col mobile, 2 cols tablet+, 2 cols desktop */}
            <DemandeursCard 
                details={safeKpis.demandeurs_details}
                variation={variations.demandeurs}
            />

            {/* Propriétés - 1 col mobile, 2 cols tablet, 1 col desktop (retour à la ligne) */}
            <ProprietesCard 
                disponibles={safeKpis.proprietes_disponibles}
                acquises={safeKpis.proprietes_acquises}
                superficie={safeKpis.superficie_details}
            />

            {/* Revenus - 1 col mobile, 2 cols tablet+, 2 cols desktop */}
            <RevenueCard 
                revenus_potentiels={safeKpis.revenus_potentiels}
                variation={variations.revenus}
            />
        </div>
    );
}