// Dashboard/components/StatisticsLinkButton.tsx - VERSION CORRIGÉE
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { BarChart3, ArrowRight, TrendingUp, Filter } from 'lucide-react';

export function StatisticsLinkButton() {
    return (
        <Card className="border-2 border-dashed border-primary/30 dark:border-primary/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:border-primary/60 dark:hover:border-primary/70 transition-all">
            <CardContent className="p-4 sm:p-6">
                {/* ✅ CORRECTION : Layout responsive avec flex-col sur mobile */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="p-2 sm:p-3 rounded-lg bg-primary/10 dark:bg-primary/20 shrink-0">
                            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 flex-wrap">
                                Analyse statistique détaillée
                                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Explorez vos données en profondeur avec des filtres avancés par période et district
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-2">
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
                    
                    {/* ✅ CORRECTION : Bouton pleine largeur sur mobile */}
                    <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
                        <Link href={route('statistiques.index')}>
                            <span className="hidden sm:inline">Voir l'analyse complète</span>
                            <span className="sm:hidden">Voir les statistiques</span>
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}