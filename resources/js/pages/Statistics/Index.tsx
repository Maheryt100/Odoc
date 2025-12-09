// Statistics/Index.tsx - ✅ VERSION REDESIGNÉE
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, RefreshCw, BarChart3 } from 'lucide-react';
import { StatisticsHeader } from './components/StatisticsHeader';
import { StatisticsFilters } from './components/StatisticsFilters';
import { OverviewTab } from './components/tabs/OverviewTab';
import { DossiersTab } from './components/tabs/DossiersTab';
import { ProprietesTab } from './components/tabs/ProprietesTab';
import { DemandeursTab } from './components/tabs/DemandeursTab';
import { FinancialsTab } from './components/tabs/FinancialsTab';
import { GeographicTab } from './components/tabs/GeographicTab';
import { PerformanceTab } from './components/tabs/PerformanceTab';
import { useRealtimeStatistics } from '@/hooks/useRealtimeStatistics';
import type { StatisticsProps } from './types';

export default function StatisticsIndex({ stats, charts, filters, districts, auth }: StatisticsProps) {
    const [showUpdateAlert, setShowUpdateAlert] = useState(false);
    
    // ✅ Hook temps réel
    const { lastUpdate, isConnected, updateCount, forceRefresh } = useRealtimeStatistics({
        districtId: auth.user.id_district,
        autoRefresh: false,
        onUpdate: (update) => {
            setShowUpdateAlert(true);
            setTimeout(() => setShowUpdateAlert(false), 10000);
        }
    });
    
    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Statistiques', href: '#' }
        ]}>
            <Head title="Statistiques" />

            <div className="flex flex-col gap-6 p-6">
                {/* ✅ Header moderne - Cyan/Sky */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-cyan-600" />
                        Statistiques et Analyses
                    </h1>
                    <p className="text-muted-foreground">
                        Tableau de bord analytique complet avec suivi en temps réel
                    </p>
                </div>
                
                {/* ✅ Indicateur de connexion WebSocket */}
                <div className="flex items-center justify-between">
                    {/* Section désactivée temporairement */}
                </div>
                
                {/* ✅ Alerte de mise à jour disponible */}
                {showUpdateAlert && lastUpdate && (
                    <Alert className="border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 border-0 shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg shrink-0">
                                <Radio className="h-4 w-4 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                            </div>
                            <AlertDescription className="flex-1 text-sm text-cyan-900 dark:text-cyan-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="font-semibold">Nouvelles données disponibles !</span>
                                        <p className="text-cyan-700 dark:text-cyan-300 mt-1">
                                            {lastUpdate.type === 'dossier' && 'Un dossier a été modifié'}
                                            {lastUpdate.type === 'propriete' && 'Une propriété a été modifiée'}
                                            {lastUpdate.type === 'demandeur' && 'Un demandeur a été modifié'}
                                            {lastUpdate.type === 'demande' && 'Une demande a été modifiée'}
                                        </p>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        onClick={forceRefresh}
                                        className="ml-4 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Actualiser
                                    </Button>
                                </div>
                            </AlertDescription>
                        </div>
                    </Alert>
                )}
                
                <StatisticsFilters filters={filters} districts={districts} />

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-7">
                        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                        <TabsTrigger value="dossiers">Dossiers</TabsTrigger>
                        <TabsTrigger value="proprietes">Propriétés</TabsTrigger>
                        <TabsTrigger value="demandeurs">Demandeurs</TabsTrigger>
                        <TabsTrigger value="financials">Finances</TabsTrigger>
                        <TabsTrigger value="geographic">Géographie</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
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

                    <TabsContent value="performance">
                        <PerformanceTab performance={stats.performance} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}