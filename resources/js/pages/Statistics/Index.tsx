// Statistics/Index.tsx
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, Info, Sparkles } from 'lucide-react';
import { StatisticsFilters } from './components/StatisticsFilters';
import { OverviewTab } from './components/tabs/OverviewTab';
import { DossiersTab } from './components/tabs/DossiersTab';
import { ProprietesTab } from './components/tabs/ProprietesTab';
import { DemandeursTab } from './components/tabs/DemandeursTab';
import { FinancialsTab } from './components/tabs/FinancialsTab';
import { GeographicTab } from './components/tabs/GeographicTab';
import type { StatisticsProps } from './types';

export default function StatisticsIndex({ 
    stats, 
    charts, 
    filters, 
    provinces,
    regions,
    districts, 
    canFilterGeography,
    userDistrict,
    auth 
}: StatisticsProps) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Statistiques', href: '#' }
        ]}>
            <Head title="Statistiques" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-cyan-600" />
                        Statistiques et Analyses
                    </h1>
                    <p className="text-muted-foreground">
                        Tableau de bord analytique complet
                    </p>
                </div>
                
                {/* Filtres */}
                <StatisticsFilters 
                    filters={filters} 
                    provinces={provinces}
                    regions={regions}
                    districts={districts} 
                    canFilterGeography={canFilterGeography}
                    userDistrict={userDistrict}
                />

                {/* Info Alert */}
                <Alert className="border-0 shadow-md bg-gradient-to-r from-cyan-50/50 to-sky-50/50 dark:from-cyan-950/20 dark:to-sky-950/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg shrink-0">
                            <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <AlertDescription className="text-sm text-cyan-900 dark:text-cyan-100">
                            <span className="font-semibold flex items-center gap-2">
                                <Sparkles className="h-3 w-3" />
                                Analyses approfondies
                            </span>
                            <span className="text-cyan-700 dark:text-cyan-300">
                                — Explorez vos données par catégorie et visualisez les tendances détaillées
                            </span>
                        </AlertDescription>
                    </div>
                </Alert>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-6">
                        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                        <TabsTrigger value="dossiers">Dossiers</TabsTrigger>
                        <TabsTrigger value="proprietes">Propriétés</TabsTrigger>
                        <TabsTrigger value="demandeurs">Demandeurs</TabsTrigger>
                        <TabsTrigger value="financials">Finances</TabsTrigger>
                        <TabsTrigger value="geographic">Géographie</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <OverviewTab stats={stats} charts={charts} />
                    </TabsContent>

                    <TabsContent value="dossiers">
                        <DossiersTab dossiers={stats.dossiers} charts={charts} />
                    </TabsContent>

                    <TabsContent value="proprietes">
                        <ProprietesTab proprietes={stats.proprietes} charts={charts} />
                    </TabsContent>

                    <TabsContent value="demandeurs" className="space-y-6">
                        <DemandeursTab 
                            demandeurs={stats.demandeurs} 
                            demographics={stats.demographics}
                            charts={charts} 
                        />
                    </TabsContent>

                    <TabsContent value="financials" className="space-y-6">
                        <FinancialsTab financials={stats.financials} />
                    </TabsContent>

                    <TabsContent value="geographic">
                        <GeographicTab geographic={stats.geographic} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}