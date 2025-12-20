// Dashboard/components/ActivitySection.tsx - VERSION CORRIGÉE
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin } from 'lucide-react';
import type { Activity, TopCommune } from '../types';

interface Props {
    recentActivity: Activity[];
    topCommunes: TopCommune[];
}

export function ActivitySection({ recentActivity, topCommunes }: Props) {
    return (
        // ✅ CORRECTION : Grid responsive 1/2 colonnes
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Top communes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                        Top 5 Communes
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Communes avec le plus de dossiers
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {topCommunes && topCommunes.length > 0 ? (
                        <div className="space-y-3">
                            {topCommunes.map((commune: TopCommune, index: number) => (
                                <div key={index} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                        <Badge 
                                            variant="outline" 
                                            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-bold shrink-0"
                                        >
                                            {index + 1}
                                        </Badge>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-medium truncate">
                                                {commune.commune}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {commune.fokontany} • {commune.type_commune}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-950/70 text-xs shrink-0">
                                        {commune.count}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs sm:text-sm text-muted-foreground text-center py-8">
                            Aucune donnée disponible
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Activité récente */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                        Activité récente
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Dernières actions sur la plateforme
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {recentActivity && recentActivity.length > 0 ? (
                        <div className="space-y-4">
                            {recentActivity.slice(0, 5).map((activity: Activity) => (
                                <div 
                                    key={activity.id} 
                                    className="flex items-start gap-3 pb-3 border-b border-border last:border-0"
                                >
                                    <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 mt-2 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium truncate">
                                            {activity.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {activity.user} • {activity.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs sm:text-sm text-muted-foreground text-center py-8">
                            Aucune activité récente
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}