import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { BarChart3, ArrowRight, TrendingUp, Filter } from 'lucide-react';

export function StatisticsLinkButton() {
    return (
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:border-primary/60 transition-all">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                            <BarChart3 className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                Analyse statistique détaillée
                                <TrendingUp className="h-4 w-4 text-primary" />
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Explorez vos données en profondeur avec des filtres avancés par période et district
                            </p>
                            <div className="flex items-center gap-4 pt-2">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Filter className="h-3 w-3" />
                                    <span>Filtres personnalisés</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <BarChart3 className="h-3 w-3" />
                                    <span>Graphiques avancés</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>Analyses temporelles</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <Button asChild size="lg" className="gap-2">
                        <Link href={route('statistiques.index')}>
                            Voir l'analyse complète
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}