// Dashboard/Index.tsx - ✅ VERSION REDESIGNÉE
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import GlobalSearch from '@/components/GlobalSearch';
import { KPICards } from './components/KPICards';
import { ActivitySection } from './components/ActivitySection';
import { ChartsSection } from './components/ChartsSection';
import { QuickActions } from './components/QuickActions';
import { AlertsSection } from './components/AlertsSection';
import { StatisticsLinkButton } from './components/StatisticsLinkButton';
import { Badge } from '@/components/ui/badge';
import { Calendar, LayoutDashboard } from 'lucide-react';
import type { DashboardProps } from './types';

export default function DashboardIndex({ kpis, charts, alerts, recentActivity }: DashboardProps) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: route('dashboard.index') }]}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 p-6">
                {/* ✅ En-tête moderne avec recherche - Indigo/Blue */}
                <div className="max-w-2xl space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
                                <LayoutDashboard className="h-8 w-8 text-indigo-600" />
                                Tableau de bord
                            </h1>
                            <Badge variant="outline" className="gap-1.5 text-xs">
                                <Calendar className="h-3 w-3" />
                                12 derniers mois
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Vue d'ensemble de vos activités et statistiques des 12 derniers mois
                        </p>
                    </div>
                    {/* <GlobalSearch className="w-full" /> */}
                </div>

                {/* Alertes */}
                <AlertsSection alerts={alerts} />

                {/* KPIs Principaux */}
                <KPICards kpis={kpis} />

                {/* ✨ Lien vers Statistics */}
                <StatisticsLinkButton />

                {/* Graphiques */}
                <ChartsSection charts={charts} />

                {/* Activité récente et Top communes */}
                <ActivitySection 
                    recentActivity={recentActivity}
                    topCommunes={charts.top_communes}
                />

                {/* Actions rapides */}
                <QuickActions />
            </div>
        </AppLayout>
    );
}