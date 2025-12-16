// Dashboard/components/KPICards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Activity } from 'lucide-react';
import type { KPI } from '../types';
import { CompletionCards } from './CompletionCards';
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Dossiers - Composant fusionné */}
            <DossiersCard 
                ouverts={safeKpis.dossiers_ouverts}
                fermes={safeKpis.dossiers_fermes}
                nouveaux={safeKpis.nouveaux_dossiers}
                enRetard={safeKpis.dossiers_en_retard}
                completion={safeKpis.completion}
                variation={variations.dossiers}
            />
            {/* Demandeurs - Composant amélioré avec barre de genre */}
            <DemandeursCard 
                details={safeKpis.demandeurs_details}
                variation={variations.demandeurs}
            />

            {/* Propriétés - Composant amélioré */}
            <ProprietesCard 
                disponibles={safeKpis.proprietes_disponibles}
                acquises={safeKpis.proprietes_acquises}
                superficie={safeKpis.superficie_details}
            />

            {/* Cards de complétion */}
            {/* <CompletionCards completion={safeKpis.completion} /> */}

            

            {/* Performance Système */}
            {/* <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Activité Système</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {safeKpis.documents_generes_aujourdhui !== undefined && (
                            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-700">Documents générés</span>
                                </div>
                                <Badge variant="secondary" className="font-semibold">
                                    {safeKpis.documents_generes_aujourdhui}
                                </Badge>
                            </div>
                        )}
                        {safeKpis.utilisateurs_actifs_24h !== undefined && (
                            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-3.5 w-3.5 text-green-600" />
                                    <span className="text-xs font-medium text-green-700">Utilisateurs actifs (24h)</span>
                                </div>
                                <Badge variant="secondary" className="font-semibold">
                                    {safeKpis.utilisateurs_actifs_24h}
                                </Badge>
                            </div>
                        )}
                        {safeKpis.temps_moyen_traitement !== undefined && (
                            <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-orange-600" />
                                    <span className="text-xs font-medium text-orange-700">Temps moyen traitement</span>
                                </div>
                                <Badge variant="secondary" className="font-semibold">
                                    {safeKpis.temps_moyen_traitement}j
                                </Badge>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card> */}

            {/* ✅ NOUVEAU : Revenus potentiels avec toggle */}
            <RevenueCard 
                revenus_potentiels={safeKpis.revenus_potentiels}
                variation={variations.revenus}
            />
        </div>
    );
}