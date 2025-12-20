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

            <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                        <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-600" />
                        <span>Statistiques</span>
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
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
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg shrink-0 mt-0.5">
                            <Info className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <AlertDescription className="text-xs sm:text-sm text-cyan-900 dark:text-cyan-100">
                            <span className="font-semibold flex items-center gap-1.5 sm:gap-2 mb-1">
                                <Sparkles className="h-3 w-3" />
                                Analyses approfondies
                            </span>
                            <span className="text-cyan-700 dark:text-cyan-300">
                                Explorez vos données par catégorie et visualisez les tendances
                            </span>
                        </AlertDescription>
                    </div>
                </Alert>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    {/* Tabs list responsive */}
                    <div className="w-full overflow-x-auto pb-2">
                        <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 h-auto flex-nowrap">
                            <TabsTrigger value="overview" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                                Vue d'ensemble
                            </TabsTrigger>
                            <TabsTrigger value="dossiers" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                                Dossiers
                            </TabsTrigger>
                            <TabsTrigger value="proprietes" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                                Propriétés
                            </TabsTrigger>
                            <TabsTrigger value="demandeurs" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                                Demandeurs
                            </TabsTrigger>
                            <TabsTrigger value="financials" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                                Finances
                            </TabsTrigger>
                            <TabsTrigger value="geographic" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                                Géographie
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4">
                        <OverviewTab stats={stats} charts={charts} />
                    </TabsContent>

                    <TabsContent value="dossiers" className="mt-4">
                        <DossiersTab dossiers={stats.dossiers} charts={charts} />
                    </TabsContent>

                    <TabsContent value="proprietes" className="mt-4">
                        <ProprietesTab proprietes={stats.proprietes} charts={charts} />
                    </TabsContent>

                    <TabsContent value="demandeurs" className="space-y-4 sm:space-y-6 mt-4">
                        <DemandeursTab 
                            demandeurs={stats.demandeurs} 
                            demographics={stats.demographics}
                        />
                    </TabsContent>

                    <TabsContent value="financials" className="space-y-4 sm:space-y-6 mt-4">
                        <FinancialsTab financials={stats.financials} />
                    </TabsContent>

                    <TabsContent value="geographic" className="mt-4">
                        <GeographicTab geographic={stats.geographic} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}