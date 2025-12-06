import { Card, CardContent } from '@/components/ui/card';
import { FileText, LockOpen, Lock, MapPin, TrendingUp } from 'lucide-react';

interface DossierStatsProps {
    totalDemandes: number;
    activeCount: number;
    archivedCount: number;
    proprietesCount: number;
}

export default function DossierStats({
    totalDemandes,
    activeCount,
    archivedCount,
    proprietesCount
}: DossierStatsProps) {
    const activePercentage = totalDemandes > 0 
        ? Math.round((activeCount / totalDemandes) * 100) 
        : 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Demandes */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <CardContent className="p-0">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Demandes
                                </p>
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {totalDemandes}
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                <p className="text-xs text-muted-foreground">
                                    {activeCount} actives ({activePercentage}%)
                                </p>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                                <div
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${activePercentage}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </div>
            </Card>

            {/* Demandes Actives */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                    <CardContent className="p-0">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Demandes Actives
                                </p>
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <LockOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                {activeCount}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                En cours de traitement
                            </p>
                        </div>
                    </CardContent>
                </div>
            </Card>

            {/* Demandes Archivées */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                    <CardContent className="p-0">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Demandes Archivées
                                </p>
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                                {archivedCount}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                Propriétés acquises
                            </p>
                        </div>
                    </CardContent>
                </div>
            </Card>

            {/* Propriétés */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                    <CardContent className="p-0">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Propriétés
                                </p>
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                {proprietesCount}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                Lots disponibles
                            </p>
                        </div>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}