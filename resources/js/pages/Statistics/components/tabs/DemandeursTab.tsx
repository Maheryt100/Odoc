// Statistics/components/tabs/DemandeursTab.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, Activity, TrendingUp } from 'lucide-react';
import { StatCard } from '../StatCard';
import { Separator } from '@/components/ui/separator';
import type { DemandeursStats, DemographicsStats, ChartData } from '../../types';

interface Props {
    demandeurs: DemandeursStats;
    demographics: DemographicsStats;
    charts: ChartData;
}

export function DemandeursTab({ demandeurs, demographics, charts }: Props) {
    const totalPersonnes = demographics.total_hommes + demographics.total_femmes;
    
    // Calculer les pourcentages avec gestion des valeurs nulles
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
                        subtitle="À traiter"
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
                                <span className="text-2xl">👨</span>
                                Hommes
                            </CardTitle>
                            <CardDescription>
                                {demographics.total_hommes} demandeurs ({demographics.pourcentage_hommes}%)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Statistiques hommes */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Actifs</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {demographics.hommes_actifs}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {calculatePercentage(demographics.hommes_actifs, demographics.total_hommes)}% des hommes
                                    </p>
                                </div>
                                <div className="p-4 bg-blue-100 dark:bg-blue-800/20 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Acquis</p>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {demographics.hommes_acquis}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {calculatePercentage(demographics.hommes_acquis, demographics.total_hommes)}% des hommes
                                    </p>
                                </div>
                            </div>

                            {/* Barre de progression hommes */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Progression</span>
                                    <div className="flex gap-4 text-xs">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-blue-600" />
                                            <span>Acquis: {demographics.hommes_acquis}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-blue-400" />
                                            <span>En cours: {demographics.hommes_actifs}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex w-full h-8 rounded-full overflow-hidden border border-border">
                                    {demographics.total_hommes > 0 ? (
                                        <>
                                            <div 
                                                className="bg-blue-600 flex items-center justify-center text-xs text-white font-medium transition-all"
                                                style={{ 
                                                    width: `${calculatePercentage(demographics.hommes_acquis, demographics.total_hommes)}%` 
                                                }}
                                            >
                                                {demographics.hommes_acquis > 0 && (
                                                    <span className="px-2">
                                                        {calculatePercentage(demographics.hommes_acquis, demographics.total_hommes)}%
                                                    </span>
                                                )}
                                            </div>
                                            <div 
                                                className="bg-blue-400 flex items-center justify-center text-xs text-white font-medium transition-all"
                                                style={{ 
                                                    width: `${calculatePercentage(demographics.hommes_actifs, demographics.total_hommes)}%` 
                                                }}
                                            >
                                                {demographics.hommes_actifs > 0 && (
                                                    <span className="px-2">
                                                        {calculatePercentage(demographics.hommes_actifs, demographics.total_hommes)}%
                                                    </span>
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
                        </CardContent>
                    </Card>

                    {/* Femmes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-2xl">👩</span>
                                Femmes
                            </CardTitle>
                            <CardDescription>
                                {demographics.total_femmes} demandeuses ({demographics.pourcentage_femmes}%)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Statistiques femmes */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Actives</p>
                                    <p className="text-2xl font-bold text-pink-600">
                                        {demographics.femmes_actifs}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {calculatePercentage(demographics.femmes_actifs, demographics.total_femmes)}% des femmes
                                    </p>
                                </div>
                                <div className="p-4 bg-pink-100 dark:bg-pink-800/20 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Acquises</p>
                                    <p className="text-2xl font-bold text-pink-700">
                                        {demographics.femmes_acquis}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {calculatePercentage(demographics.femmes_acquis, demographics.total_femmes)}% des femmes
                                    </p>
                                </div>
                            </div>

                            {/* Barre de progression femmes */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Progression</span>
                                    <div className="flex gap-4 text-xs">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-pink-600" />
                                            <span>Acquises: {demographics.femmes_acquis}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-pink-400" />
                                            <span>En cours: {demographics.femmes_actifs}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex w-full h-8 rounded-full overflow-hidden border border-border">
                                    {demographics.total_femmes > 0 ? (
                                        <>
                                            <div 
                                                className="bg-pink-600 flex items-center justify-center text-xs text-white font-medium transition-all"
                                                style={{ 
                                                    width: `${calculatePercentage(demographics.femmes_acquis, demographics.total_femmes)}%` 
                                                }}
                                            >
                                                {demographics.femmes_acquis > 0 && (
                                                    <span className="px-2">
                                                        {calculatePercentage(demographics.femmes_acquis, demographics.total_femmes)}%
                                                    </span>
                                                )}
                                            </div>
                                            <div 
                                                className="bg-pink-400 flex items-center justify-center text-xs text-white font-medium transition-all"
                                                style={{ 
                                                    width: `${calculatePercentage(demographics.femmes_actifs, demographics.total_femmes)}%` 
                                                }}
                                            >
                                                {demographics.femmes_actifs > 0 && (
                                                    <span className="px-2">
                                                        {calculatePercentage(demographics.femmes_actifs, demographics.total_femmes)}%
                                                    </span>
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

                        {/* Message si aucune donnée d'âge */}
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