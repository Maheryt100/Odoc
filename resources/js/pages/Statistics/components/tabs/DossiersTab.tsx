// Statistics/components/tabs/DossiersTab.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Folder, FolderOpen, Clock, AlertCircle } from 'lucide-react';
import { StatCard } from '../StatCard';
import { OuverturesFermeturesChart } from '../charts/OuverturesFermeturesChart';
import { TopCommunesChart } from '../charts/TopCommunesChart';
import type { DossiersStats, ChartData } from '../../types';

interface Props {
    dossiers: DossiersStats;
    charts: ChartData;
}

export function DossiersTab({ dossiers, charts }: Props) {
    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Cards de statistiques - Responsive */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    icon={Folder}
                    title="Total dossiers"
                    value={dossiers.total.toString()}
                    subtitle="Période sélectionnée"
                    color="blue"
                />
                <StatCard 
                    icon={FolderOpen}
                    title="Dossiers ouverts"
                    value={dossiers.ouverts.toString()}
                    subtitle={`${Math.round((dossiers.ouverts / dossiers.total) * 100)}% du total`}
                    color="green"
                />
                <StatCard 
                    icon={Clock}
                    title="Durée moyenne"
                    value={`${dossiers.duree_moyenne} jours`}
                    subtitle="Temps de traitement"
                    color="purple"
                />
                <StatCard 
                    icon={AlertCircle}
                    title="En retard"
                    value={dossiers.en_retard.toString()}
                    subtitle="> 90 jours"
                    color="orange"
                />
            </div>

            {/* Répartition par statut - Responsive */}
            <Card>
                <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Répartition par statut</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">État actuel des dossiers</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm sm:text-base font-medium truncate">Dossiers ouverts</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">En cours de traitement</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 xs:ml-auto shrink-0">
                                <p className="text-2xl sm:text-3xl font-bold">{dossiers.ouverts}</p>
                                <Badge variant="secondary" className="text-xs">
                                    {Math.round((dossiers.ouverts / dossiers.total) * 100)}%
                                </Badge>
                            </div>
                        </div>

                        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm sm:text-base font-medium truncate">Dossiers fermés</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Traitement terminé</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 xs:ml-auto shrink-0">
                                <p className="text-2xl sm:text-3xl font-bold">{dossiers.fermes}</p>
                                <Badge variant="secondary" className="text-xs">
                                    {Math.round((dossiers.fermes / dossiers.total) * 100)}%
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Graphiques - Responsive */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                <OuverturesFermeturesChart data={charts.ouvertures_fermetures} />
                <TopCommunesChart data={charts.top_communes} />
            </div>
        </div>
    );
}