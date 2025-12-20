// Dashboard/components/DemandeursCard.tsx - VERSION CORRIGÉE
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, User } from 'lucide-react';
import type { DemandeurDetails } from '../types';

interface Props {
    details: DemandeurDetails;
    variation?: string;
}

export function DemandeursCard({ details, variation = '+15%' }: Props) {
    // ✅ OPTIMISATION : Calculs mémorisés pour éviter les re-renders
    const stats = useMemo(() => {
        const pourcentageHommes = details.total > 0 
            ? ((details.hommes / details.total) * 100).toFixed(0) 
            : 0;
        
        const pourcentageFemmes = details.total > 0 
            ? ((details.femmes / details.total) * 100).toFixed(0) 
            : 0;
        
        const hommesSansPropriete = details.hommes - details.hommes_actifs - details.hommes_acquis;
        const femmesSansPropriete = details.femmes - details.femmes_actifs - details.femmes_acquis;
        
        return {
            pourcentageHommes,
            pourcentageFemmes,
            hommesSansPropriete,
            femmesSansPropriete,
            pourcentageHommesAcquis: details.total > 0 ? (details.hommes_acquis / details.total) * 100 : 0,
            pourcentageHommesActifs: details.total > 0 ? (details.hommes_actifs / details.total) * 100 : 0,
            pourcentageHommesSans: details.total > 0 ? (hommesSansPropriete / details.total) * 100 : 0,
            pourcentageFemmesAcquis: details.total > 0 ? (details.femmes_acquis / details.total) * 100 : 0,
            pourcentageFemmesActifs: details.total > 0 ? (details.femmes_actifs / details.total) * 100 : 0,
            pourcentageFemmesSans: details.total > 0 ? (femmesSansPropriete / details.total) * 100 : 0,
        };
    }, [details]);

    return (
        <Card className="hover:shadow-lg transition-shadow lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg sm:text-2xl font-bold">Demandeurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {/* Total */}
                <div className="flex items-baseline gap-2 mb-3 flex-wrap">
                    <div className="text-xl sm:text-2xl font-bold">{details.total}</div>
                    <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                        Total
                    </Badge>
                </div>

                {/* Statuts - Responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 pb-4 border-b border-border">
                    <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                        <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">En cours</p>
                        <p className="text-lg font-bold text-green-700 dark:text-green-300">{details.actifs}</p>
                    </div>

                    <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Acquis</p>
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{details.acquis}</p>
                    </div>

                    <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-center">
                        <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">Sans propriété</p>
                        <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{details.sans_propriete}</p>
                    </div>
                </div>

                {/* Répartition par genre */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Répartition par genre et statut
                        </span>
                    </div>

                    {/* Stats par genre - Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                        {/* Hommes */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400" />
                                    <span className="text-sm font-semibold">Hommes</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {stats.pourcentageHommes}%
                                </Badge>
                            </div>
                            
                            <div className="space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-700 dark:text-blue-400 font-medium">Acquis:</span>
                                    <span className="font-semibold">{details.hommes_acquis}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-600 dark:text-blue-400/70">En cours:</span>
                                    <span className="font-semibold">{details.hommes_actifs}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-400 dark:text-blue-400/50">Sans prop.:</span>
                                    <span className="font-semibold">{stats.hommesSansPropriete}</span>
                                </div>
                            </div>
                        </div>

                        {/* Femmes */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-pink-500 dark:bg-pink-400" />
                                    <span className="text-sm font-semibold">Femmes</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {stats.pourcentageFemmes}%
                                </Badge>
                            </div>
                            
                            <div className="space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-pink-700 dark:text-pink-400 font-medium">Acquis:</span>
                                    <span className="font-semibold">{details.femmes_acquis}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-pink-600 dark:text-pink-400/70">En cours:</span>
                                    <span className="font-semibold">{details.femmes_actifs}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-pink-400 dark:text-pink-400/50">Sans prop.:</span>
                                    <span className="font-semibold">{stats.femmesSansPropriete}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Barre de progression par genre et statut */}
                    <div className="space-y-2">
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-6 overflow-hidden flex">
                            {/* Hommes - Acquis */}
                            <div 
                                className="bg-blue-500 dark:bg-blue-400 transition-all duration-500 flex items-center justify-center"
                                style={{ width: `${stats.pourcentageHommesAcquis}%` }}
                                title={`Hommes acquis: ${details.hommes_acquis}`}
                            >
                                {stats.pourcentageHommesAcquis > 5 && (
                                    <span className="text-xs font-bold text-white">
                                        {details.hommes_acquis}
                                    </span>
                                )}
                            </div>
                            
                            {/* Hommes - En cours */}
                            <div 
                                className="bg-blue-500 dark:bg-blue-400 transition-all duration-500 flex items-center justify-center opacity-70"
                                style={{ width: `${stats.pourcentageHommesActifs}%` }}
                                title={`Hommes en cours: ${details.hommes_actifs}`}
                            >
                                {stats.pourcentageHommesActifs > 5 && (
                                    <span className="text-xs font-bold text-white">
                                        {details.hommes_actifs}
                                    </span>
                                )}
                            </div>
                            
                            {/* Hommes - Sans propriété */}
                            <div 
                                className="bg-blue-500 dark:bg-blue-400 transition-all duration-500 flex items-center justify-center opacity-30"
                                style={{ width: `${stats.pourcentageHommesSans}%` }}
                                title={`Hommes sans propriété: ${stats.hommesSansPropriete}`}
                            >
                                {stats.pourcentageHommesSans > 5 && (
                                    <span className="text-xs font-bold text-white">
                                        {stats.hommesSansPropriete}
                                    </span>
                                )}
                            </div>
                            
                            {/* Femmes - Acquis */}
                            <div 
                                className="bg-pink-500 dark:bg-pink-400 transition-all duration-500 flex items-center justify-center"
                                style={{ width: `${stats.pourcentageFemmesAcquis}%` }}
                                title={`Femmes acquis: ${details.femmes_acquis}`}
                            >
                                {stats.pourcentageFemmesAcquis > 5 && (
                                    <span className="text-xs font-bold text-white">
                                        {details.femmes_acquis}
                                    </span>
                                )}
                            </div>
                            
                            {/* Femmes - En cours */}
                            <div 
                                className="bg-pink-500 dark:bg-pink-400 transition-all duration-500 flex items-center justify-center opacity-70"
                                style={{ width: `${stats.pourcentageFemmesActifs}%` }}
                                title={`Femmes en cours: ${details.femmes_actifs}`}
                            >
                                {stats.pourcentageFemmesActifs > 5 && (
                                    <span className="text-xs font-bold text-white">
                                        {details.femmes_actifs}
                                    </span>
                                )}
                            </div>
                            
                            {/* Femmes - Sans propriété */}
                            <div 
                                className="bg-pink-500 dark:bg-pink-400 transition-all duration-500 flex items-center justify-center opacity-30"
                                style={{ width: `${stats.pourcentageFemmesSans}%` }}
                                title={`Femmes sans propriété: ${stats.femmesSansPropriete}`}
                            >
                                {stats.pourcentageFemmesSans > 5 && (
                                    <span className="text-xs font-bold text-white">
                                        {stats.femmesSansPropriete}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Légende */}
                        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-muted-foreground pt-1">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                                <span>Acquis</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 opacity-70" />
                                <span>En cours</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 opacity-30" />
                                <span>Sans prop.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}