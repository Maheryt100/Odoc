// admin/activity-logs/components/StatsCards.tsx 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Calendar, FileText, TrendingUp } from 'lucide-react';
import { ActivityStats } from '../types';
import { useIsMobile } from '@/hooks/useResponsive';

interface StatsCardsProps {
    stats: ActivityStats;
}

export const StatsCards = ({ stats }: StatsCardsProps) => {
    const isMobile = useIsMobile();

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

    const statsData = [
        {
            label: 'Total',
            value: safeStats.total_actions,
            icon: Activity,
            subtitle: 'Actions totales',
            bgColor: 'bg-slate-50/50 dark:bg-slate-950/20',
            borderColor: 'border-slate-100 dark:border-slate-900',
            iconColor: 'text-slate-600 dark:text-slate-400',
            iconBg: 'bg-slate-100 dark:bg-slate-900/30',
            gradientFrom: 'from-slate-600',
            gradientTo: 'to-gray-600',
        },
        {
            label: 'Aujourd\'hui',
            value: safeStats.today_actions,
            icon: Calendar,
            subtitle: null,
            bgColor: 'bg-blue-50/50 dark:bg-blue-950/20',
            borderColor: 'border-blue-100 dark:border-blue-900',
            iconColor: 'text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            gradientFrom: 'from-blue-600',
            gradientTo: 'to-indigo-600',
        },
        {
            label: 'Cette semaine',
            value: safeStats.week_actions,
            icon: Calendar,
            subtitle: '7 derniers jours',
            bgColor: 'bg-green-50/50 dark:bg-green-950/20',
            borderColor: 'border-green-100 dark:border-green-900',
            iconColor: 'text-green-600 dark:text-green-400',
            iconBg: 'bg-green-100 dark:bg-green-900/30',
            gradientFrom: 'from-green-600',
            gradientTo: 'to-emerald-600',
        },
        {
            label: 'Ce mois',
            value: safeStats.month_actions,
            icon: Calendar,
            subtitle: 'Mois en cours',
            bgColor: 'bg-purple-50/50 dark:bg-purple-950/20',
            borderColor: 'border-purple-100 dark:border-purple-900',
            iconColor: 'text-purple-600 dark:text-purple-400',
            iconBg: 'bg-purple-100 dark:bg-purple-900/30',
            gradientFrom: 'from-purple-600',
            gradientTo: 'to-pink-600',
        },
        {
            label: 'Documents',
            value: safeStats.total_documents,
            icon: FileText,
            subtitle: 'Générés/téléchargés',
            bgColor: 'bg-orange-50/50 dark:bg-orange-950/20',
            borderColor: 'border-orange-100 dark:border-orange-900',
            iconColor: 'text-orange-600 dark:text-orange-400',
            iconBg: 'bg-orange-100 dark:bg-orange-900/30',
            gradientFrom: 'from-orange-600',
            gradientTo: 'to-amber-600',
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {statsData.map((stat) => {
                const Icon = stat.icon;
                
                return (
                    <Card
                        key={stat.label}
                        className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${stat.borderColor} border`}
                    >
                        <div className={`${stat.bgColor}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
                                    {stat.label}
                                </CardTitle>
                                <div className={`p-2 ${stat.iconBg} rounded-lg flex-shrink-0`}>
                                    <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                                </div>
                            </CardHeader>
                        </div>
                        <CardContent className="pt-4">
                            <div className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${stat.gradientFrom} ${stat.gradientTo} bg-clip-text text-transparent`}>
                                {stat.value.toLocaleString()}
                            </div>
                            {!isMobile && stat.subtitle && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    {stat.subtitle}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}