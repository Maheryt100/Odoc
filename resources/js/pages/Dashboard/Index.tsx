// Dashboard/Index.tsx 
import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { KPICards } from './components/KPICards';
import { ActivitySection } from './components/ActivitySection';
import { ChartsSection } from './components/ChartsSection';
import { QuickActions } from './components/QuickActions';
import { StatisticsLinkButton } from './components/StatisticsLinkButton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Info, LayoutDashboard, Sparkles, Search } from 'lucide-react';
import type { DashboardProps } from './types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AdvancedSearchBar from '@/pages/dossiers/components/AdvancedSearchBar';

export default function DashboardIndex({ kpis, charts, alerts, recentActivity }: DashboardProps) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    
    const canShowAllDistricts = user?.role === 'super_admin' || user?.role === 'central_user';

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: route('dashboard.index') }]}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
                {/* En-tête avec bouton recherche */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                                <LayoutDashboard className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 dark:text-indigo-400" />
                                Tableau de bord
                            </h1>
                            <Badge variant="outline" className="gap-1.5 text-xs">
                                <Calendar className="h-3 w-3" />
                                
                            </Badge>
                        </div>
                    </div>

                    {/*Bouton recherche avancée */}
                    <Button 
                        variant={showAdvancedSearch ? "default" : "outline"}
                        size="default"
                        onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                        className="w-full sm:w-auto"
                    >
                        <Search className="h-4 w-4 mr-2" />
                        {showAdvancedSearch ? 'Masquer la recherche' : 'Recherche avancée'}
                    </Button>
                </div>

                {/* Recherche avancée collapsible */}
                {showAdvancedSearch && (
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/20 dark:to-blue-950/20">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Search className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-lg font-semibold">Recherche globale</h3>
                            </div>
                            <AdvancedSearchBar
                                canExport={true}
                                canAccessAllDistricts={canShowAllDistricts}
                                initialPageSize={50}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Alerte informative */}
                <Alert className="border-0 shadow-md bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/30 dark:to-blue-950/30">
                    <div className="flex items-start sm:items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg shrink-0">
                            <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <AlertDescription className="text-sm text-indigo-900 dark:text-indigo-100">
                            <span className="font-semibold flex items-center gap-2 flex-wrap">
                                <Sparkles className="h-3 w-3" />
                                Vue d'ensemble centralisée
                            </span>
                            <span className="text-indigo-700 dark:text-indigo-300 block sm:inline">
                                — Statistique sur les 12 derniers mois
                            </span>
                        </AlertDescription>
                    </div>
                </Alert>

                {/* KPIs Principaux */}
                <KPICards kpis={kpis} />

                {/* Lien vers Statistics */}
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