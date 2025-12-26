// Statistics/components/tabs/GeographicTab.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Map } from 'lucide-react';
import type { GeographicStats } from '../../types';

interface Props {
    geographic: GeographicStats;
}

export function GeographicTab({ geographic }: Props) {
    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Top communes - Responsive */}
            <Card>
                <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                        Top 10 communes
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Communes les plus actives</CardDescription>
                </CardHeader>
                <CardContent>
                    {geographic.top_communes && geographic.top_communes.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3">
                            {geographic.top_communes.map((commune, index) => (
                                <div 
                                    key={index}
                                    className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full xs:w-auto">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-xs sm:text-sm font-bold text-primary">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm sm:text-base font-medium truncate">{commune.commune}</p>
                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                                                    {commune.fokontany}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                                                    {commune.type_commune}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 xs:ml-auto shrink-0 w-full xs:w-auto justify-end">
                                        <p className="text-xl sm:text-2xl font-bold">{commune.count}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">dossiers</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-muted-foreground">
                            <Map className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 opacity-20" />
                            <p className="text-xs sm:text-sm">Aucune donnée géographique disponible</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}