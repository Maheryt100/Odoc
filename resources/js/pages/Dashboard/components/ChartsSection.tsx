// Dashboard/components/ChartsSection.tsx 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, LineChart, PieChart, TrendingUp } from 'lucide-react';
import { 
    LineChart as RechartsLine, 
    Line, 
    BarChart, 
    Bar,
    PieChart as RechartsPie,
    Pie,
    Cell,
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from 'recharts';
import type { Charts } from '../types';

interface Props {
    charts: Charts;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ChartsSection({ charts }: Props) {
    // Préparer les données pour le graphique de statut des propriétés
    const proprietesData = [
        { name: 'Disponibles', value: charts.proprietes_status?.disponibles || 0, color: '#10b981' },
        { name: 'Acquises', value: charts.proprietes_status?.acquises || 0, color: '#3b82f6' },
    ].filter(item => item.value > 0);

    const evolutionData = charts.evolution_complete ?? charts.evolution_mensuelle ?? charts.dossiers_timeline ?? [];
    const revenuData = charts.revenus_par_vocation ?? [];
    const performanceData = charts.performance_trimestrielle ?? [];

    // Formattage du montant pour le tooltip
    const formatMontant = (value: number) => {
        return `${value.toLocaleString('fr-FR')} Ar`;
    };

    // Custom Tooltip pour le graphique de performance
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <p className="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <div 
                                className="w-3 h-3 rounded" 
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-gray-700 dark:text-gray-300">{entry.name}: </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{entry.value}</span>
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                            Total: {payload.reduce((sum: number, p: any) => sum + p.value, 0)}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <Tabs defaultValue="evolution" className="w-full">
                {/* TabsList scrollable horizontalement */}
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <TabsList className="grid w-full min-w-[300px] grid-cols-3 mb-4">
                        <TabsTrigger value="evolution" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                            <LineChart className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden xs:inline">Évolution</span>
                        </TabsTrigger>
                        <TabsTrigger value="repartition" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                            <PieChart className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden xs:inline">Répartition</span>
                        </TabsTrigger>
                        <TabsTrigger value="performance" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden xs:inline">Performance</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Onglet Évolution */}
                <TabsContent value="evolution" className="space-y-4 sm:space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                                Évolution mensuelle complète
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Dossiers, propriétés et demandeurs sur les 12 derniers mois
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {evolutionData && evolutionData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsLine data={evolutionData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis 
                                            dataKey="month" 
                                            tick={{ fontSize: 10 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                fontSize: '12px',
                                                backgroundColor: 'var(--background)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '6px'
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                                        <Line 
                                            type="monotone" 
                                            dataKey="dossiers" 
                                            stroke="#3b82f6" 
                                            strokeWidth={2}
                                            name="Dossiers"
                                            dot={{ fill: '#3b82f6', r: 3 }}
                                            activeDot={{ r: 5 }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="proprietes" 
                                            stroke="#10b981" 
                                            strokeWidth={2}
                                            name="Propriétés"
                                            dot={{ fill: '#10b981', r: 3 }}
                                            activeDot={{ r: 5 }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="demandeurs" 
                                            stroke="#8b5cf6" 
                                            strokeWidth={2}
                                            name="Demandeurs"
                                            dot={{ fill: '#8b5cf6', r: 3 }}
                                            activeDot={{ r: 5 }}
                                        />
                                    </RechartsLine>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-xs sm:text-sm">
                                    Aucune donnée disponible
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Onglet Répartition */}
                <TabsContent value="repartition" className="space-y-4 sm:space-y-6">
                    {/* ✅ OPTIMISATION 320px : Grid 1 colonne sur mobile */}
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                        {/* Statut des propriétés */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg">Statut des propriétés</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    Répartition disponibles vs acquises
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {proprietesData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <RechartsPie>
                                                <Pie
                                                    data={proprietesData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => 
                                                        `${name}: ${(percent * 100).toFixed(0)}%`
                                                    }
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {proprietesData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ fontSize: '12px' }} />
                                            </RechartsPie>
                                        </ResponsiveContainer>
                                        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-4">
                                            {proprietesData.map((item, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <div 
                                                        className="w-3 h-3 rounded-full" 
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                    <span className="text-xs sm:text-sm">
                                                        {item.name}: <strong>{item.value}</strong>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-muted-foreground text-xs sm:text-sm">
                                        Aucune donnée disponible
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Revenus par vocation */}
                        {revenuData.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base sm:text-lg">Revenus par vocation</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        Distribution des revenus potentiels (demandes actives)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={revenuData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis 
                                                dataKey="vocation" 
                                                tick={{ fontSize: 9 }}
                                                angle={-15}
                                                textAnchor="end"
                                                height={60}
                                            />
                                            <YAxis 
                                                tick={{ fontSize: 9 }}
                                                tickFormatter={(value) => 
                                                    `${(value / 1000000).toFixed(1)}M`
                                                }
                                            />
                                            <Tooltip 
                                                formatter={(value: number) => formatMontant(value)}
                                                contentStyle={{ fontSize: 11 }}
                                            />
                                            <Bar 
                                                dataKey="montant" 
                                                fill="#3b82f6"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Onglet Performance */}
                <TabsContent value="performance" className="space-y-4 sm:space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="space-y-3">
                                <div>
                                    <CardTitle className="text-base sm:text-lg">Statut des dossiers</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        Évolution trimestrielle (4 derniers trimestres)
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-3 sm:gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-blue-500 dark:bg-blue-400" />
                                        <span className="text-xs">Ouverts</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-green-500 dark:bg-green-400" />
                                        <span className="text-xs">Fermés</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {performanceData.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart 
                                            data={performanceData}
                                            margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis 
                                                dataKey="quarter" 
                                                tick={{ fontSize: 10 }}
                                            />
                                            <YAxis tick={{ fontSize: 10 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            <Bar 
                                                dataKey="ouverts" 
                                                stackId="a" 
                                                fill="#3b82f6"
                                                name="Dossiers ouverts"
                                                radius={[0, 0, 0, 0]}
                                            />
                                            <Bar 
                                                dataKey="fermes" 
                                                stackId="a" 
                                                fill="#10b981"
                                                name="Dossiers fermés"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    
                                    {/* Grid responsive pour stats */}
                                    <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                                        <div className="text-center p-2">
                                            <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                {performanceData.reduce((sum, q) => sum + q.ouverts, 0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Total dossiers ouverts
                                            </p>
                                        </div>
                                        <div className="text-center p-2">
                                            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                                                {performanceData.reduce((sum, q) => sum + q.fermes, 0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Total dossiers fermés
                                            </p>
                                        </div>
                                        <div className="text-center p-2">
                                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {performanceData.reduce((sum, q) => sum + q.total, 0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Total général
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                                    <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 opacity-20" />
                                    <p className="text-xs sm:text-sm">Aucune donnée de performance disponible</p>
                                    <p className="text-xs mt-2 text-center px-4">Les données s'afficheront dès qu'il y aura des dossiers</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}