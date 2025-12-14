// Statistics/components/charts/DemographicsBarChart.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Props {
    totalHommes: number;
    totalFemmes: number;
    hommesActifs: number;
    femmesActifs: number;
    hommesAcquis: number;
    femmesAcquis: number;
    pourcentageHommes: number;
    pourcentageFemmes: number;
}

export function DemographicsBarChart({
    totalHommes,
    totalFemmes,
    hommesActifs,
    femmesActifs,
    hommesAcquis,
    femmesAcquis,
    pourcentageHommes,
    pourcentageFemmes,
}: Props) {
    // Calculer les sans propriété
    const hommesSansPropriete = totalHommes - hommesActifs - hommesAcquis;
    const femmesSansPropriete = totalFemmes - femmesActifs - femmesAcquis;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Répartition par genre</CardTitle>
                <CardDescription>Statut des demandeurs</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Hommes */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                    <span className="text-xl">👨</span>
                                </div>
                                <div>
                                    <p className="font-medium">Hommes</p>
                                    <p className="text-sm text-muted-foreground">
                                        {totalHommes} total
                                    </p>
                                </div>
                            </div>
                            <Badge variant="secondary">
                                {pourcentageHommes}%
                            </Badge>
                        </div>

                        {/* Légende */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-600" />
                                        <span className="text-muted-foreground">Acquis: {hommesAcquis}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-600/50" />
                                        <span className="text-muted-foreground">En cours: {hommesActifs}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-600/20" />
                                        <span className="text-muted-foreground">Sans propriété: {hommesSansPropriete}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Barre avec 3 sections */}
                            <div className="flex w-full h-8 rounded-full overflow-hidden border border-border">
                                {totalHommes > 0 ? (
                                    <>
                                        {/* Section Acquis (opacity=1) */}
                                        {hommesAcquis > 0 && (
                                            <div 
                                                className="bg-blue-600 flex items-center justify-center text-xs text-white font-medium transition-all"
                                                style={{ 
                                                    width: `${(hommesAcquis / totalHommes) * 100}%`,
                                                }}
                                            >
                                                {hommesAcquis > 0 && (
                                                    <span className="px-2">{hommesAcquis}</span>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Section En cours (opacity=0.5) */}
                                        {hommesActifs > 0 && (
                                            <div 
                                                className="bg-blue-600/50 flex items-center justify-center text-xs text-white font-medium transition-all"
                                                style={{ 
                                                    width: `${(hommesActifs / totalHommes) * 100}%`,
                                                }}
                                            >
                                                {hommesActifs > 0 && (
                                                    <span className="px-2">{hommesActifs}</span>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Section Sans propriété (opacity=0.2) */}
                                        {hommesSansPropriete > 0 && (
                                            <div 
                                                className="bg-blue-600/20 flex items-center justify-center text-xs text-blue-900 dark:text-blue-100 font-medium transition-all"
                                                style={{ 
                                                    width: `${(hommesSansPropriete / totalHommes) * 100}%`,
                                                }}
                                            >
                                                {hommesSansPropriete > 0 && (
                                                    <span className="px-2">{hommesSansPropriete}</span>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                        Aucune donnée
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Femmes */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                                    <span className="text-xl">👩</span>
                                </div>
                                <div>
                                    <p className="font-medium">Femmes</p>
                                    <p className="text-sm text-muted-foreground">
                                        {totalFemmes} total
                                    </p>
                                </div>
                            </div>
                            <Badge variant="secondary">
                                {pourcentageFemmes}%
                            </Badge>
                        </div>

                        {/* Légende */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-pink-600" />
                                        <span className="text-muted-foreground">Acquis: {femmesAcquis}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-pink-600/50" />
                                        <span className="text-muted-foreground">En cours: {femmesActifs}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-pink-600/20" />
                                        <span className="text-muted-foreground">Sans propriété: {femmesSansPropriete}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Barre avec 3 sections */}
                            <div className="flex w-full h-8 rounded-full overflow-hidden border border-border">
                                {totalFemmes > 0 ? (
                                    <>
                                        {/* Section Acquis (opacity=1) */}
                                        {femmesAcquis > 0 && (
                                            <div 
                                                className="bg-pink-600 flex items-center justify-center text-xs text-white font-medium transition-all"
                                                style={{ 
                                                    width: `${(femmesAcquis / totalFemmes) * 100}%`,
                                                }}
                                            >
                                                {femmesAcquis > 0 && (
                                                    <span className="px-2">{femmesAcquis}</span>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Section En cours (opacity=0.5) */}
                                        {femmesActifs > 0 && (
                                            <div 
                                                className="bg-pink-600/50 flex items-center justify-center text-xs text-white font-medium transition-all"
                                                style={{ 
                                                    width: `${(femmesActifs / totalFemmes) * 100}%`,
                                                }}
                                            >
                                                {femmesActifs > 0 && (
                                                    <span className="px-2">{femmesActifs}</span>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Section Sans propriété (opacity=0.2) */}
                                        {femmesSansPropriete > 0 && (
                                            <div 
                                                className="bg-pink-600/20 flex items-center justify-center text-xs text-pink-900 dark:text-pink-100 font-medium transition-all"
                                                style={{ 
                                                    width: `${(femmesSansPropriete / totalFemmes) * 100}%`,
                                                }}
                                            >
                                                {femmesSansPropriete > 0 && (
                                                    <span className="px-2">{femmesSansPropriete}</span>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                        Aucune donnée
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}