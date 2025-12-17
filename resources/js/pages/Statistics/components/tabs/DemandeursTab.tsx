// Statistics/components/DemandeursTab.tsx
// ✅ VERSION AVEC OPACITÉS COHÉRENTES (opacity=1 acquis, 0.5 actifs, 0.2 sans propriété)

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, Activity, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface DemandeursStats {
    total: number;
    avec_propriete: number;
    sans_propriete: number;
    actifs: number;
    age_moyen: number;
}

interface DemographicsStats {
    total_hommes: number;
    total_femmes: number;
    pourcentage_hommes: number;
    pourcentage_femmes: number;
    hommes_actifs: number;
    femmes_actifs: number;
    hommes_acquis: number;
    femmes_acquis: number;
    hommes_sans_propriete: number;
    femmes_sans_propriete: number;
    age_moyen: number;
    tranches_age: {
        [key: string]: number;
    };
}

interface ChartData {
    // Ajoutez les types de graphiques si nécessaire
}

interface Props {
    demandeurs: DemandeursStats;
    demographics: DemographicsStats;
    charts: ChartData;
}

function StatCard({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color 
}: { 
    icon: any; 
    title: string; 
    value: string; 
    subtitle: string; 
    color: string; 
}) {
    const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'
    };

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
                <div className={`p-3 rounded-lg w-fit ${colorClasses[color as keyof typeof colorClasses]}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="mt-4">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export function DemandeursTab({ demandeurs, demographics, charts }: Props) {
    const totalPersonnes = demographics.total_hommes + demographics.total_femmes;
    
    const calculatePercentage = (value: number, total: number): number => {
        return total > 0 ? Math.round((value / total) * 100) : 0;
    };

    return (
        <div className="space-y-6">
            {/* ========== SECTION 1 : STATISTIQUES GÉNÉRALES ========== */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Vue d'ensemble</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard 
                        icon={Users}
                        title="Total demandeurs"
                        value={demandeurs.total.toString()}
                        subtitle={demographics.age_moyen > 0 
                            ? `Âge moyen: ${demographics.age_moyen} ans` 
                            : 'Âge non renseigné'}
                        color="blue"
                    />
                    <StatCard 
                        icon={Activity}
                        title="Demandeurs actifs"
                        value={demandeurs.actifs.toString()}
                        subtitle="Avec demandes en cours"
                        color="green"
                    />
                    <StatCard 
                        icon={UserCheck}
                        title="Avec propriété"
                        value={demandeurs.avec_propriete.toString()}
                        subtitle={`${calculatePercentage(demandeurs.avec_propriete, demandeurs.total)}% du total`}
                        color="purple"
                    />
                    <StatCard 
                        icon={UserX}
                        title="Sans propriété"
                        value={demandeurs.sans_propriete.toString()}
                        subtitle={`${calculatePercentage(demandeurs.sans_propriete, demandeurs.total)}% du total`}
                        color="orange"
                    />
                </div>
            </div>

            <Separator />

            {/* ========== SECTION 2 : RÉPARTITION PAR GENRE ========== */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Répartition par genre</h2>
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Hommes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">           
                                Hommes
                            </CardTitle>
                            <CardDescription>
                                {demographics.total_hommes} demandeurs ({demographics.pourcentage_hommes}%)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Statistiques hommes */}
                            <div className="grid grid-cols-3 gap-3">
                                 <div className="p-3 bg-blue-600 dark:bg-blue-600 rounded-lg">
                                    <p className="text-xs text-white/90">Acquis</p>
                                    <p className="text-xl font-bold text-white">
                                        {demographics.hommes_acquis}
                                    </p>
                                    <p className="text-xs text-white/80 mt-1">
                                        {calculatePercentage(demographics.hommes_acquis, demographics.total_hommes)}%
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-600/50 dark:bg-blue-600/50 rounded-lg">
                                    <p className="text-xs text-white/90">En cours</p>
                                    <p className="text-xl font-bold text-white">
                                        {demographics.hommes_actifs}
                                    </p>
                                    <p className="text-xs text-white/80 mt-1">
                                        {calculatePercentage(demographics.hommes_actifs, demographics.total_hommes)}%
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-600/20 dark:bg-blue-600/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Sans prop.</p>
                                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                        {demographics.hommes_sans_propriete}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {calculatePercentage(demographics.hommes_sans_propriete, demographics.total_hommes)}%
                                    </p>
                                </div>
                                
                               
                            </div>

                            {/* Barre de progression hommes avec 3 sections */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Progression</span>
                                    <div className="flex gap-3 text-xs flex-wrap">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-blue-600" />
                                            <span>Acquis</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-blue-600/50" />
                                            <span>En cours</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-blue-600/20" />
                                            <span>Sans prop.</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex w-full h-8 rounded-full overflow-hidden border border-border">
                                    {demographics.total_hommes > 0 ? (
                                        <>
                                            {/* Acquis (opacity=1) */}
                                            {demographics.hommes_acquis > 0 && (
                                                <div 
                                                    className="bg-blue-600 flex items-center justify-center text-xs text-white font-medium transition-all"
                                                    style={{ 
                                                        width: `${calculatePercentage(demographics.hommes_acquis, demographics.total_hommes)}%` 
                                                    }}
                                                >
                                                    {calculatePercentage(demographics.hommes_acquis, demographics.total_hommes) > 10 && (
                                                        <span className="px-2">{demographics.hommes_acquis}</span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* En cours (opacity=0.5) */}
                                            {demographics.hommes_actifs > 0 && (
                                                <div 
                                                    className="bg-blue-600/50 flex items-center justify-center text-xs text-white font-medium transition-all"
                                                    style={{ 
                                                        width: `${calculatePercentage(demographics.hommes_actifs, demographics.total_hommes)}%` 
                                                    }}
                                                >
                                                    {calculatePercentage(demographics.hommes_actifs, demographics.total_hommes) > 10 && (
                                                        <span className="px-2">{demographics.hommes_actifs}</span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Sans propriété (opacity=0.2) */}
                                            {demographics.hommes_sans_propriete > 0 && (
                                                <div 
                                                    className="bg-blue-600/20 flex items-center justify-center text-xs text-blue-900 dark:text-blue-100 font-medium transition-all"
                                                    style={{ 
                                                        width: `${calculatePercentage(demographics.hommes_sans_propriete, demographics.total_hommes)}%` 
                                                    }}
                                                >
                                                    {calculatePercentage(demographics.hommes_sans_propriete, demographics.total_hommes) > 10 && (
                                                        <span className="px-2">{demographics.hommes_sans_propriete}</span>
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
                        </CardContent>
                    </Card>

                    {/* Femmes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Femmes
                            </CardTitle>
                            <CardDescription>
                                {demographics.total_femmes} demandeuses ({demographics.pourcentage_femmes}%)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Statistiques femmes */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-pink-600 dark:bg-pink-600 rounded-lg">
                                    <p className="text-xs text-white/90">Acquises</p>
                                    <p className="text-xl font-bold text-white">
                                        {demographics.femmes_acquis}
                                    </p>
                                    <p className="text-xs text-white/80 mt-1">
                                        {calculatePercentage(demographics.femmes_acquis, demographics.total_femmes)}%
                                    </p>
                                </div>
                                <div className="p-3 bg-pink-600/50 dark:bg-pink-600/50 rounded-lg">
                                    <p className="text-xs text-white/90">En cours</p>
                                    <p className="text-xl font-bold text-white">
                                        {demographics.femmes_actifs}
                                    </p>
                                    <p className="text-xs text-white/80 mt-1">
                                        {calculatePercentage(demographics.femmes_actifs, demographics.total_femmes)}%
                                    </p>
                                </div>
                                <div className="p-3 bg-pink-600/20 dark:bg-pink-600/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Sans prop.</p>
                                    <p className="text-xl font-bold text-pink-900 dark:text-pink-100">
                                        {demographics.femmes_sans_propriete}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {calculatePercentage(demographics.femmes_sans_propriete, demographics.total_femmes)}%
                                    </p>
                                </div>
                            </div>

                            {/* Barre de progression femmes avec 3 sections */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Progression</span>
                                    <div className="flex gap-3 text-xs flex-wrap">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-pink-600" />
                                            <span>Acquises</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-pink-600/50" />
                                            <span>En cours</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-pink-600/20" />
                                            <span>Sans prop.</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex w-full h-8 rounded-full overflow-hidden border border-border">
                                    {demographics.total_femmes > 0 ? (
                                        <>
                                            {/* Acquises (opacity=1) */}
                                            {demographics.femmes_acquis > 0 && (
                                                <div 
                                                    className="bg-pink-600 flex items-center justify-center text-xs text-white font-medium transition-all"
                                                    style={{ 
                                                        width: `${calculatePercentage(demographics.femmes_acquis, demographics.total_femmes)}%` 
                                                    }}
                                                >
                                                    {calculatePercentage(demographics.femmes_acquis, demographics.total_femmes) > 10 && (
                                                        <span className="px-2">{demographics.femmes_acquis}</span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* En cours (opacity=0.5) */}
                                            {demographics.femmes_actifs > 0 && (
                                                <div 
                                                    className="bg-pink-600/50 flex items-center justify-center text-xs text-white font-medium transition-all"
                                                    style={{ 
                                                        width: `${calculatePercentage(demographics.femmes_actifs, demographics.total_femmes)}%` 
                                                    }}
                                                >
                                                    {calculatePercentage(demographics.femmes_actifs, demographics.total_femmes) > 10 && (
                                                        <span className="px-2">{demographics.femmes_actifs}</span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Sans propriété (opacity=0.2) */}
                                            {demographics.femmes_sans_propriete > 0 && (
                                                <div 
                                                    className="bg-pink-600/20 flex items-center justify-center text-xs text-pink-900 dark:text-pink-100 font-medium transition-all"
                                                    style={{ 
                                                        width: `${calculatePercentage(demographics.femmes_sans_propriete, demographics.total_femmes)}%` 
                                                    }}
                                                >
                                                    {calculatePercentage(demographics.femmes_sans_propriete, demographics.total_femmes) > 10 && (
                                                        <span className="px-2">{demographics.femmes_sans_propriete}</span>
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
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Separator />

            {/* ========== SECTION 3 : TRANCHES D'ÂGE ========== */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Répartition par âge</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Tranches d'âge</CardTitle>
                        <CardDescription>
                            {demographics.age_moyen > 0 
                                ? `Âge moyen: ${demographics.age_moyen} ans`
                                : 'Données d\'âge insuffisantes'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(demographics.tranches_age).map(([tranche, count]) => {
                                const percentage = totalPersonnes > 0 
                                    ? calculatePercentage(count, totalPersonnes)
                                    : 0;
                                
                                return (
                                    <div key={tranche}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">{tranche} ans</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">
                                                    {count} {count > 1 ? 'personnes' : 'personne'}
                                                </span>
                                                <Badge variant="secondary">
                                                    {percentage}%
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-3">
                                            <div 
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {Object.values(demographics.tranches_age).every(count => count === 0) && (
                            <div className="text-center py-8 text-muted-foreground">
                                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">
                                    Aucune donnée d'âge disponible pour cette période.
                                </p>
                                <p className="text-xs mt-1">
                                    Complétez les dates de naissance des demandeurs.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Separator />

            {/* ========== SECTION 4 : INFORMATIONS COMPLÉMENTAIRES ========== */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Informations complémentaires</h2>
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                    Taux d'activation
                                </p>
                                <p className="text-4xl font-bold">
                                    {calculatePercentage(demandeurs.actifs, demandeurs.total)}%
                                </p>
                                <div className="w-full bg-muted rounded-full h-2 mt-4">
                                    <div 
                                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                                        style={{ 
                                            width: `${calculatePercentage(demandeurs.actifs, demandeurs.total)}%` 
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                    Taux avec propriété
                                </p>
                                <p className="text-4xl font-bold">
                                    {calculatePercentage(demandeurs.avec_propriete, demandeurs.total)}%
                                </p>
                                <div className="w-full bg-muted rounded-full h-2 mt-4">
                                    <div 
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                                        style={{ 
                                            width: `${calculatePercentage(demandeurs.avec_propriete, demandeurs.total)}%` 
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                    Ratio Hommes/Femmes
                                </p>
                                <p className="text-4xl font-bold">
                                    {demographics.total_femmes > 0 
                                        ? (demographics.total_hommes / demographics.total_femmes).toFixed(2)
                                        : 'N/A'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {demographics.total_hommes}H / {demographics.total_femmes}F
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}