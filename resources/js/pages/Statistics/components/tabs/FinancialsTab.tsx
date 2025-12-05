// Statistics/components/tabs/FinancialsTab.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import type { FinancialsStats } from '../../types';

interface Props {
    financials: FinancialsStats;
}

export function FinancialsTab({ financials }: Props) {
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('fr-FR').format(num);
    };

    return (
        <div className="space-y-6">
            {/* Cards séparées actif/archive */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-2">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                            <div className="text-sm font-medium text-muted-foreground">Total Général</div>
                        </div>
                        <div className="text-3xl font-bold">
                            {formatNumber(financials.total_revenus_potentiels)} Ar
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Toutes demandes confondues
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-green-200 dark:border-green-800">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <div className="text-sm font-medium text-muted-foreground">En Cours</div>
                        </div>
                        <div className="text-3xl font-bold text-green-600">
                            {formatNumber(financials.revenus_actifs)} Ar
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {financials.pourcentage_actif}%
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                                du total
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                            <div className="text-sm font-medium text-muted-foreground">Terminés</div>
                        </div>
                        <div className="text-3xl font-bold text-blue-600">
                            {formatNumber(financials.revenus_archives)} Ar
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {financials.pourcentage_archive}%
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                                du total
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Statistiques globales */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Moyenne</div>
                        <div className="text-2xl font-bold mt-2">
                            {formatNumber(financials.revenu_moyen)} Ar
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Maximum</div>
                        <div className="text-2xl font-bold mt-2">
                            {formatNumber(financials.revenu_max)} Ar
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Minimum</div>
                        <div className="text-2xl font-bold mt-2">
                            {formatNumber(financials.revenu_min)} Ar
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenus par vocation (actifs) */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenus en cours par vocation</CardTitle>
                    <CardDescription>Demandes actives uniquement</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Object.entries(financials.par_vocation_actif).map(([vocation, montant]) => (
                            <div 
                                key={vocation} 
                                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                            >
                                <span className="font-medium capitalize">{vocation}</span>
                                <span className="text-lg font-bold text-green-600">
                                    {formatNumber(montant)} Ar
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Revenus par vocation (archivés) */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenus terminés par vocation</CardTitle>
                    <CardDescription>Demandes archivées uniquement</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Object.entries(financials.par_vocation_archive).map(([vocation, montant]) => (
                            <div 
                                key={vocation} 
                                className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                            >
                                <span className="font-medium capitalize">{vocation}</span>
                                <span className="text-lg font-bold text-blue-600">
                                    {formatNumber(montant)} Ar
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}