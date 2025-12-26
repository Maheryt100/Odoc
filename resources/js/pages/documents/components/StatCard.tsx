// documents/components/StatCard.tsx - ✅ VERSION ULTRA-CLEAN

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/useResponsive';
import * as React from 'react';

interface StatCardProps {
    title: string;
    value: number;
    total: number;
    icon: any;
    colorScheme: 'violet' | 'green' | 'emerald' | 'blue' | 'cyan';
    label?: string;
}

export default function StatCard({
    title,
    value,
    total,
    icon: IconProp,
    colorScheme,
    label = 'éléments'
}: StatCardProps) {
    
    const isMobile = useIsMobile();
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

    const colorClasses = {
        violet: {
            gradient: 'from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20',
            iconBg: 'bg-violet-100 dark:bg-violet-900/30',
            iconColor: 'text-violet-600 dark:text-violet-400',
            textGradient: 'from-violet-600 to-purple-600',
            progressBar: 'from-violet-500 to-purple-500',
        },
        green: {
            gradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
            iconBg: 'bg-green-100 dark:bg-green-900/30',
            iconColor: 'text-green-600 dark:text-green-400',
            textGradient: 'from-green-600 to-emerald-600',
            progressBar: 'from-green-500 to-emerald-500',
        },
        emerald: {
            gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            textGradient: 'from-emerald-600 to-teal-600',
            progressBar: 'from-emerald-500 to-teal-500',
        },
        blue: {
            gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
            textGradient: 'from-blue-600 to-indigo-600',
            progressBar: 'from-blue-500 to-indigo-500',
        },
        cyan: {
            gradient: 'from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20',
            iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            textGradient: 'from-cyan-600 to-blue-600',
            progressBar: 'from-cyan-500 to-blue-500',
        },
    };

    const colors = colorClasses[colorScheme];

    return (
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className={`bg-gradient-to-br ${colors.gradient}`}>
                <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-2 px-3 pt-2' : 'pb-2 px-4 pt-3'}`}>
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold truncate pr-2`}>
                        {title}
                    </span>
                    <div className={`${colors.iconBg} rounded-lg shrink-0 ${isMobile ? 'p-1.5' : 'p-2'}`}>
                        <IconProp className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${colors.iconColor}`} />
                    </div>
                </CardHeader>
            </div>
            <CardContent className={isMobile ? 'pt-2 px-3 pb-2' : 'pt-3 px-4 pb-3'}>
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold bg-gradient-to-r ${colors.textGradient} bg-clip-text text-transparent`}>
                    {value}
                </div>
                <div className={`flex items-center gap-1.5 ${isMobile ? 'mt-1' : 'mt-2'}`}>
                    <TrendingUp className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-green-500`} />
                    <p className="text-xs text-muted-foreground truncate">
                        {isMobile ? `/${total}` : `sur ${total} ${label}`}
                    </p>
                </div>
                <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${isMobile ? 'h-1.5 mt-2' : 'h-2 mt-2'}`}>
                    <div
                        className={`bg-gradient-to-r ${colors.progressBar} ${isMobile ? 'h-1.5' : 'h-2'} rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {value > 0 && !isMobile && (
                    <Badge variant="outline" className="mt-2 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {percentage}%
                    </Badge>
                )}
            </CardContent>
        </Card>
    );
}