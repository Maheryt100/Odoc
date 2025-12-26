// Statistics/components/tabs/ProprietesTab.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandPlot, CheckCircle, Clock, MapPin, Maximize, Minimize, TrendingUp } from 'lucide-react';
import { StatCard } from '../StatCard';
import type { ProprietesStats, ChartData } from '../../types';

interface Props {
    proprietes: ProprietesStats;
    charts: ChartData;
}

export function ProprietesTab({ proprietes, charts }: Props) {
    const formatSuperficie = (superficie: number) => {
        return new Intl.NumberFormat('fr-FR').format(superficie);
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Cards avec superficie - Responsive */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    icon={LandPlot}
                    title="Total propriétés"
                    value={proprietes.total.toString()}
                    subtitle={`Superficie: ${formatSuperficie(proprietes.superficie_totale)} m²`}
                    color="blue"
                />
                <StatCard 
                    icon={Clock}
                    title="En cours"
                    value={`${proprietes.disponibles} (${proprietes.pourcentage_disponibles}%)`}
                    subtitle={`${formatSuperficie(proprietes.disponibles_superficie)} m² (${proprietes.pourcentage_disponibles_superficie}%)`}
                    color="green"
                />
                <StatCard 
                    icon={CheckCircle}
                    title="Acquises"
                    value={`${proprietes.acquises} (${proprietes.pourcentage_acquises}%)`}
                    subtitle={`${formatSuperficie(proprietes.acquises_superficie)} m² (${proprietes.pourcentage_acquises_superficie}%)`}
                    color="purple"
                />
                <StatCard 
                    icon={MapPin}
                    title="Sans demande"
                    value={proprietes.sans_demande.toString()}
                    subtitle="Aucune demande associée"
                    color="orange"
                />
            </div>

            {/* Superficie détaillée - Responsive Grid */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Moyenne */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            Moyenne
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Par propriété</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600">
                            {formatSuperficie(proprietes.superficie_moyenne)} m²
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                            Basé sur {proprietes.total} {proprietes.total > 1 ? 'propriétés' : 'propriété'}
                        </p>
                    </CardContent>
                </Card>

                {/* Maximum */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <Maximize className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                            Maximum
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Plus grande superficie</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600">
                            {formatSuperficie(proprietes.superficie_max)} m²
                        </div>
                        {proprietes.lot_max && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                                Lot: <span className="font-medium">{proprietes.lot_max}</span>
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Minimum */}
                <Card className="sm:col-span-2 lg:col-span-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <Minimize className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                            Minimum
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Plus petite superficie</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-600">
                            {formatSuperficie(proprietes.superficie_min)} m²
                        </div>
                        {proprietes.lot_min && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                                Lot: <span className="font-medium">{proprietes.lot_min}</span>
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Graphiques - Responsive */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Répartition par nature avec superficie */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-base sm:text-lg">Répartition par nature</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Distribution des types de terrains</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                            {charts.repartition_nature && charts.repartition_nature.length > 0 ? (
                                charts.repartition_nature.map((item) => {
                                    const total = charts.repartition_nature.reduce((sum, i) => sum + i.value, 0);
                                    const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                    
                                    return (
                                        <div key={item.name} className="space-y-1.5 sm:space-y-2">
                                            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 xs:gap-2">
                                                <span className="text-xs sm:text-sm font-medium capitalize truncate">{item.name}</span>
                                                <div className="flex items-center gap-2 text-right shrink-0">
                                                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                                                        {item.value} ({percentage}%)
                                                    </Badge>
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatSuperficie(item.superficie)} m²
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                                                <div 
                                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">Aucune donnée disponible</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Répartition par vocation avec superficie */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-base sm:text-lg">Répartition par vocation</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Distribution des vocations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                            {charts.repartition_vocation && charts.repartition_vocation.length > 0 ? (
                                charts.repartition_vocation.map((item) => {
                                    const total = charts.repartition_vocation.reduce((sum, i) => sum + i.value, 0);
                                    const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                    
                                    return (
                                        <div key={item.name} className="space-y-1.5 sm:space-y-2">
                                            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 xs:gap-2">
                                                <span className="text-xs sm:text-sm font-medium capitalize truncate">{item.name}</span>
                                                <div className="flex items-center gap-2 text-right shrink-0">
                                                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                                                        {item.value} ({percentage}%)
                                                    </Badge>
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatSuperficie(item.superficie)} m²
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                                                <div 
                                                    className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">Aucune donnée disponible</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}