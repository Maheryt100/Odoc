// Statistics/components/tabs/DemographicsTab.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DemographicsBarChart } from '../charts/DemographicsBarChart';
import type { DemographicsStats } from '../../types';

interface Props {
    demographics: DemographicsStats;
}

export function DemographicsTab({ demographics }: Props) {
    const totalPersonnes = demographics.total_hommes + demographics.total_femmes;

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Graphique barres horizontales */}
                <Card>
                    <CardHeader>
                        <CardTitle>Répartition par genre et statut</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Hommes */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Hommes</span>
                                <span className="text-sm text-muted-foreground">
                                    {demographics.total_hommes} ({demographics.pourcentage_hommes}%)
                                </span>
                            </div>
                            <div className="flex w-full h-8 rounded-lg overflow-hidden border">
                                {demographics.total_hommes > 0 ? (
                                    <>
                                        <div 
                                            className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                                            style={{ 
                                                width: `${(demographics.hommes_acquis / demographics.total_hommes) * 100}%` 
                                            }}
                                        >
                                            {demographics.hommes_acquis > 0 && (
                                                <span>Acquis: {demographics.hommes_acquis}</span>
                                            )}
                                        </div>
                                        <div 
                                            className="bg-blue-300 flex items-center justify-center text-xs text-gray-700 font-medium"
                                            style={{ 
                                                width: `${(demographics.hommes_actifs / demographics.total_hommes) * 100}%` 
                                            }}
                                        >
                                            {demographics.hommes_actifs > 0 && (
                                                <span>En cours: {demographics.hommes_actifs}</span>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                        Aucune donnée
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Femmes */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Femmes</span>
                                <span className="text-sm text-muted-foreground">
                                    {demographics.total_femmes} ({demographics.pourcentage_femmes}%)
                                </span>
                            </div>
                            <div className="flex w-full h-8 rounded-lg overflow-hidden border">
                                {demographics.total_femmes > 0 ? (
                                    <>
                                        <div 
                                            className="bg-pink-500 flex items-center justify-center text-xs text-white font-medium"
                                            style={{ 
                                                width: `${(demographics.femmes_acquis / demographics.total_femmes) * 100}%` 
                                            }}
                                        >
                                            {demographics.femmes_acquis > 0 && (
                                                <span>Acquis: {demographics.femmes_acquis}</span>
                                            )}
                                        </div>
                                        <div 
                                            className="bg-pink-300 flex items-center justify-center text-xs text-gray-700 font-medium"
                                            style={{ 
                                                width: `${(demographics.femmes_actifs / demographics.total_femmes) * 100}%` 
                                            }}
                                        >
                                            {demographics.femmes_actifs > 0 && (
                                                <span>En cours: {demographics.femmes_actifs}</span>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                        Aucune donnée
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Légende */}
                        <div className="flex items-center justify-center gap-6 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-blue-500"></div>
                                <span className="text-xs text-muted-foreground">Acquis (Hommes)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-blue-300"></div>
                                <span className="text-xs text-muted-foreground">En cours (Hommes)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-pink-500"></div>
                                <span className="text-xs text-muted-foreground">Acquis (Femmes)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-pink-300"></div>
                                <span className="text-xs text-muted-foreground">En cours (Femmes)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tranches d'âge avec pourcentages */}
                <Card>
                    <CardHeader>
                        <CardTitle>Répartition par âge</CardTitle>
                        <CardDescription>
                            Âge moyen: {demographics.age_moyen} ans
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(demographics.tranches_age).map(([tranche, count]) => {
                                const percentage = totalPersonnes > 0 
                                    ? Math.round((count / totalPersonnes) * 100)
                                    : 0;
                                
                                return (
                                    <div key={tranche}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">{tranche} ans</span>
                                            <span className="text-sm text-muted-foreground">
                                                {count} personnes ({percentage}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div 
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}