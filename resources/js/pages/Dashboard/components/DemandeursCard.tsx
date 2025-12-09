// Dashboard/components/DemandeursCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DemandeurDetails } from '../types';

interface Props {
    details: DemandeurDetails;
    variation?: string;
}

export function DemandeursCard({ details, variation = '+15%' }: Props) {
    // Calculer les pourcentages
    const pourcentageHommes = details.total > 0 
        ? ((details.hommes / details.total) * 100).toFixed(0) 
        : 0;
    
    const pourcentageFemmes = details.total > 0 
        ? ((details.femmes / details.total) * 100).toFixed(0) 
        : 0;
    
    // ✅ NOUVEAU : Calculs pour la barre par statut
    const hommesSansPropriete = details.hommes - details.hommes_actifs - details.hommes_acquis;
    const femmesSansPropriete = details.femmes - details.femmes_actifs - details.femmes_acquis;
    
    const pourcentageHommesAcquis = details.total > 0 ? (details.hommes_acquis / details.total) * 100 : 0;
    const pourcentageHommesActifs = details.total > 0 ? (details.hommes_actifs / details.total) * 100 : 0;
    const pourcentageHommesSans = details.total > 0 ? (hommesSansPropriete / details.total) * 100 : 0;
    
    const pourcentageFemmesAcquis = details.total > 0 ? (details.femmes_acquis / details.total) * 100 : 0;
    const pourcentageFemmesActifs = details.total > 0 ? (details.femmes_actifs / details.total) * 100 : 0;
    const pourcentageFemmesSans = details.total > 0 ? (femmesSansPropriete / details.total) * 100 : 0;

    return (
        <Card className="hover:shadow-lg transition-shadow lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Demandeurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {/* Total */}
                <div className="flex items-baseline gap-2 mb-3">
                    <div className="text-2xl font-bold">{details.total}</div>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                        Total
                    </Badge>
                </div>

                {/* Statuts - Alignés horizontalement */}
                <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b">
                    {/* En cours */}
                    <div className="p-2 bg-green-50 rounded-lg text-center">
                        <p className="text-xs font-medium text-green-700 mb-1">En cours</p>
                        <p className="text-lg font-bold text-green-700">{details.actifs}</p>
                    </div>

                    {/* Acquis */}
                    <div className="p-2 bg-blue-50 rounded-lg text-center">
                        <p className="text-xs font-medium text-blue-700 mb-1">Acquis</p>
                        <p className="text-lg font-bold text-blue-700">{details.acquis}</p>
                    </div>

                    {/* Sans propriété */}
                    <div className="p-2 bg-orange-50 rounded-lg text-center">
                        <p className="text-xs font-medium text-orange-700 mb-1">Sans propriété</p>
                        <p className="text-lg font-bold text-orange-700">{details.sans_propriete}</p>
                    </div>
                </div>

                {/* ✅ NOUVEAU : Répartition par genre avec barre avancée */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Répartition par genre et statut</span>
                    </div>

                    {/* Statistiques par genre et statut */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        {/* Hommes */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <span className="text-sm font-semibold">Hommes</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {pourcentageHommes}%
                                </Badge>
                            </div>
                            
                            <div className="space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-700 font-medium">Acquis:</span>
                                    <span className="font-semibold">{details.hommes_acquis}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-600" style={{ opacity: 0.7 }}>En cours:</span>
                                    <span className="font-semibold">{details.hommes_actifs}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-400" style={{ opacity: 0.5 }}>Sans prop.:</span>
                                    <span className="font-semibold">{hommesSansPropriete}</span>
                                </div>
                            </div>
                        </div>

                        {/* Femmes */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-pink-500" />
                                    <span className="text-sm font-semibold">Femmes</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {pourcentageFemmes}%
                                </Badge>
                            </div>
                            
                            <div className="space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-pink-700 font-medium">Acquis:</span>
                                    <span className="font-semibold">{details.femmes_acquis}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-pink-600" style={{ opacity: 0.7 }}>En cours:</span>
                                    <span className="font-semibold">{details.femmes_actifs}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-pink-400" style={{ opacity: 0.5 }}>Sans prop.:</span>
                                    <span className="font-semibold">{femmesSansPropriete}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ NOUVELLE BARRE : Par genre ET statut */}
                    <div className="space-y-2">
                        <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden flex">
                            {/* Hommes - Acquis (opacity 1) */}
                            <div 
                                className="bg-blue-500 transition-all duration-500 flex items-center justify-center"
                                style={{ 
                                    width: `${pourcentageHommesAcquis}%`,
                                    opacity: 1 
                                }}
                                title={`Hommes acquis: ${details.hommes_acquis}`}
                            >
                                {pourcentageHommesAcquis > 5 && (
                                    <span className="text-xs font-bold text-white">
                                        {details.hommes_acquis}
                                    </span>
                                )}
                            </div>
                            
                            {/* Hommes - En cours (opacity 0.7) */}
                            <div 
                                className="bg-blue-500 transition-all duration-500 flex items-center justify-center"
                                style={{ 
                                    width: `${pourcentageHommesActifs}%`,
                                    opacity: 0.7 
                                }}
                                title={`Hommes en cours: ${details.hommes_actifs}`}
                            >
                                {pourcentageHommesActifs > 5 && (
                                    <span className="text-xs font-bold text-white">
                                        {details.hommes_actifs}
                                    </span>
                                )}
                            </div>
                            
                            {/* Hommes - Sans propriété (opacity 0.3) */}
                            <div 
                                className="bg-blue-500 transition-all duration-500 flex items-center justify-center"
                                style={{ 
                                    width: `${pourcentageHommesSans}%`,
                                    opacity: 0.3 
                                }}
                                title={`Hommes sans propriété: ${hommesSansPropriete}`}
                            >
                                {pourcentageHommesSans > 5 && (
                                    <span className="text-xs font-bold text-white">
                                        {hommesSansPropriete}
                                    </span>
                                )}
                            </div>
                            
                            {/* Femmes - Acquis (opacity 1) */}
                            <div 
                                className="bg-pink-500 transition-all duration-500 flex items-center justify-center"
                                style={{ 
                                    width: `${pourcentageFemmesAcquis}%`,
                                    opacity: 1 
                                }}
                                title={`Femmes acquis: ${details.femmes_acquis}`}
                            >
                                {pourcentageFemmesAcquis > 5 && (
                                    <span className="text-xs font-bold text-white">
                                        {details.femmes_acquis}
                                    </span>
                                )}
                            </div>
                            
                            {/* Femmes - En cours (opacity 0.7) */}
                            <div 
                                className="bg-pink-500 transition-all duration-500 flex items-center justify-center"
                                style={{ 
                                    width: `${pourcentageFemmesActifs}%`,
                                    opacity: 0.7 
                                }}
                                title={`Femmes en cours: ${details.femmes_actifs}`}
                            >
                                {pourcentageFemmesActifs > 5 && (
                                    <span className="text-xs font-bold text-white">
                                        {details.femmes_actifs}
                                    </span>
                                )}
                            </div>
                            
                            {/* Femmes - Sans propriété (opacity 0.3) */}
                            <div 
                                className="bg-pink-500 transition-all duration-500 flex items-center justify-center"
                                style={{ 
                                    width: `${pourcentageFemmesSans}%`,
                                    opacity: 0.3 
                                }}
                                title={`Femmes sans propriété: ${femmesSansPropriete}`}
                            >
                                {pourcentageFemmesSans > 5 && (
                                    <span className="text-xs font-bold text-white">
                                        {femmesSansPropriete}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Légende de la barre */}
                        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500" style={{ opacity: 1 }} />
                                <span>Acquis</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500" style={{ opacity: 0.7 }} />
                                <span>En cours</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500" style={{ opacity: 0.3 }} />
                                <span>Sans prop.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tendance */}
                <div className="flex items-center gap-1 mt-4 pt-4 border-t">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">{variation} ce mois</span>
                </div>
            </CardContent>
        </Card>
    );
}