// Statistics/Index.tsx
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, RefreshCw } from 'lucide-react';
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
    
    // ✅ NOUVEAU : Hook temps réel
    const { lastUpdate, isConnected, updateCount, forceRefresh } = useRealtimeStatistics({
        districtId: auth.user.id_district,
        autoRefresh: false, // Manuel pour que l'utilisateur contrôle
        onUpdate: (update) => {
            // Afficher une alerte quand une mise à jour arrive
            setShowUpdateAlert(true);
            
            // Masquer après 10 secondes
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
                <StatisticsHeader filters={filters} />
                
                {/* ✅ NOUVEAU : Indicateur de connexion WebSocket */}
                <div className="flex items-center justify-between">
                    {/* <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Radio 
                                className={`h-4 w-4 ${isConnected ? 'text-green-500 animate-pulse' : 'text-gray-400'}`}
                            />
                            <span className="text-sm text-muted-foreground">
                                {isConnected ? 'Temps réel activé' : 'Hors ligne'}
                            </span>
                        </div>
                        
                        {updateCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {updateCount} {updateCount > 1 ? 'mises à jour' : 'mise à jour'}
                            </Badge>
                        )}
                    </div> */}
                </div>
                
                {/* ✅ NOUVEAU : Alerte de mise à jour disponible */}
                {showUpdateAlert && lastUpdate && (
                    <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                        <Radio className="h-4 w-4 text-blue-500" />
                        <AlertDescription className="flex items-center justify-between">
                            <div>
                                <span className="font-medium">Nouvelles données disponibles !</span>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {lastUpdate.type === 'dossier' && 'Un dossier a été modifié'}
                                    {lastUpdate.type === 'propriete' && 'Une propriété a été modifiée'}
                                    {lastUpdate.type === 'demandeur' && 'Un demandeur a été modifié'}
                                    {lastUpdate.type === 'demande' && 'Une demande a été modifiée'}
                                </p>
                            </div>
                            <Button 
                                size="sm" 
                                onClick={forceRefresh}
                                className="ml-4"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Actualiser
                            </Button>
                        </AlertDescription>
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