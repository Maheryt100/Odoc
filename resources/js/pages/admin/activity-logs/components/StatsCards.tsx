// admin/activity-logs/components/StatsCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Calendar, FileText, TrendingUp } from 'lucide-react';
import { ActivityStats } from '../types';

interface StatsCardsProps {
    stats: ActivityStats;
}

export const StatsCards = ({ stats }: StatsCardsProps) => {
    // Fournir des valeurs par défaut pour éviter les erreurs null
    const safeStats = {
        total_actions: stats?.total_actions ?? 0,
        today_actions: stats?.today_actions ?? 0,
        week_actions: stats?.week_actions ?? 0,
        month_actions: stats?.month_actions ?? 0,
        total_documents: stats?.total_documents ?? 0,
    };

    const calculatePercentage = (part: number, total: number): number => {
        return total > 0 ? Math.round((part / total) * 100) : 0;
    };

    const todayPercentage = calculatePercentage(safeStats.today_actions, safeStats.total_actions);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Total */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                        <div className="p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                            <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                    </CardHeader>
                </div>
                <CardContent className="pt-4">
                    <div className="text-3xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">
                        {safeStats.total_actions.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Actions totales
                    </p>
                </CardContent>
            </Card>

            {/* Aujourd'hui */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                </div>
                <CardContent className="pt-4">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {safeStats.today_actions.toLocaleString()}
                    </div>
                    {/* <div className="flex items-center gap-2 mt-2">
                        <TrendingUp className="h-3 w-3 text-blue-500" />
                        <p className="text-xs text-muted-foreground">
                            {todayPercentage}% du total
                        </p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(todayPercentage, 100)}%` }}
                        />
                    </div> */}
                </CardContent>
            </Card>

            {/* Cette semaine */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                </div>
                <CardContent className="pt-4">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {safeStats.week_actions.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        7 derniers jours
                    </p>
                </CardContent>
            </Card>

            {/* Ce mois */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                </div>
                <CardContent className="pt-4">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {safeStats.month_actions.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Mois en cours
                    </p>
                </CardContent>
            </Card>

            {/* Documents */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documents</CardTitle>
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                    </CardHeader>
                </div>
                <CardContent className="pt-4">
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        {safeStats.total_documents.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Générés/téléchargés
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};