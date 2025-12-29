// users/components/StatsCards.tsx - HARMONISÉ AVEC LOGS
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, UserCog, Globe } from 'lucide-react';
import { UserStats } from '../types';
import { calculateActivePercentage } from '../helpers';
import { useIsMobile } from '@/hooks/useResponsive';

interface StatsCardsProps {
    stats: UserStats;
}

export const StatsCards = ({ stats }: StatsCardsProps) => {
    const isMobile = useIsMobile();
    const activePercentage = calculateActivePercentage(stats.active, stats.total);

    const statsData = [
        {
            label: 'Total',
            value: stats.total,
            icon: Users,
            subtitle: `${stats.active} actifs (${activePercentage}%)`,
            bgColor: 'bg-slate-50/50 dark:bg-slate-950/20',
            borderColor: 'border-slate-100 dark:border-slate-900',
            iconColor: 'text-slate-600 dark:text-slate-400',
            iconBg: 'bg-slate-100 dark:bg-slate-900/30',
            gradientFrom: 'from-slate-600',
            gradientTo: 'to-gray-600',
        },
        {
            label: 'Super Admins',
            value: stats.super_admins,
            icon: Shield,
            subtitle: 'Lecture seule',
            bgColor: 'bg-red-50/50 dark:bg-red-950/20',
            borderColor: 'border-red-100 dark:border-red-900',
            iconColor: 'text-red-600 dark:text-red-400',
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            gradientFrom: 'from-red-600',
            gradientTo: 'to-rose-600',
        },
        {
            label: 'Centraux',
            value: stats.central_users,
            icon: Globe,
            subtitle: 'Lecture seule',
            bgColor: 'bg-cyan-50/50 dark:bg-cyan-950/20',
            borderColor: 'border-cyan-100 dark:border-cyan-900',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
            gradientFrom: 'from-cyan-600',
            gradientTo: 'to-blue-600',
        },
        {
            label: 'Districts',
            value: stats.admin_district + stats.user_district,
            icon: UserCog,
            subtitle: `${stats.admin_district} admin · ${stats.user_district} users`,
            bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/20',
            borderColor: 'border-emerald-100 dark:border-emerald-900',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            gradientFrom: 'from-emerald-600',
            gradientTo: 'to-teal-600',
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
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
                            {!isMobile && (
                                <p className="text-xs text-muted-foreground mt-2 truncate">
                                    {stat.subtitle}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};