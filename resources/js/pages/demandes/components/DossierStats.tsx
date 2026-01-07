// pages/demandes/components/DossierStats.tsx 

import { Card } from '@/components/ui/card';
import { FileText, CheckCircle2, Archive, LandPlot } from 'lucide-react';
import { useIsMobile } from '@/hooks/useResponsive';

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
    proprietesCount,
}: DossierStatsProps) {
    const isMobile = useIsMobile();

    const stats = [
        {
            label: 'Total demandes',
            value: totalDemandes,
            icon: FileText,
            color: 'blue',
            bgColor: 'bg-blue-50/50 dark:bg-blue-950/20',
            borderColor: 'border-blue-100 dark:border-blue-900',
            iconColor: 'text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            label: 'Actives',
            value: activeCount,
            icon: CheckCircle2,
            color: 'green',
            bgColor: 'bg-green-50/50 dark:bg-green-950/20',
            borderColor: 'border-green-100 dark:border-green-900',
            iconColor: 'text-green-600 dark:text-green-400',
            iconBg: 'bg-green-100 dark:bg-green-900/30',
        },
        {
            label: 'Archivées',
            value: archivedCount,
            icon: Archive,
            color: 'orange',
            bgColor: 'bg-orange-50/50 dark:bg-orange-950/20',
            borderColor: 'border-orange-100 dark:border-orange-900',
            iconColor: 'text-orange-600 dark:text-orange-400',
            iconBg: 'bg-orange-100 dark:bg-orange-900/30',
        },
        {
            label: 'Propriétés',
            value: proprietesCount,
            icon: LandPlot,
            color: 'purple',
            bgColor: 'bg-purple-50/50 dark:bg-purple-950/20',
            borderColor: 'border-purple-100 dark:border-purple-900',
            iconColor: 'text-purple-600 dark:text-purple-400',
            iconBg: 'bg-purple-100 dark:bg-purple-900/30',
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                
                return (
                    <Card
                        key={stat.label}
                        className={`border-0 shadow-md ${stat.bgColor} ${stat.borderColor} border overflow-hidden`}
                    >
                        <div className="p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-2">
                                {/* Contenu principal */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">
                                        {stat.label}
                                    </p>
                                    <p className="text-2xl sm:text-3xl font-bold tracking-tight">
                                        {stat.value}
                                    </p>
                                    {!isMobile && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {stat.label === 'Total demandes' && 'Toutes les demandes'}
                                            {stat.label === 'Actives' && 'En cours de traitement'}
                                            {stat.label === 'Archivées' && 'Propriétés acquises'}
                                            {stat.label === 'Propriétés' && 'Lots concernés'}
                                        </p>
                                    )}
                                </div>

                                {/* Icône */}
                                <div className={`p-2 sm:p-2.5 ${stat.iconBg} rounded-lg flex-shrink-0`}>
                                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColor}`} />
                                </div>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}