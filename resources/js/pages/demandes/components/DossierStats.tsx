import { Card, CardContent } from '@/components/ui/card';
import { FileText, LockOpen, Lock, MapPin } from 'lucide-react';

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
    const stats = [
        {
            label: 'Total demandes',
            value: totalDemandes,
            icon: FileText,
            color: 'blue',
            bgClass: 'bg-blue-100 dark:bg-blue-900',
            textClass: 'text-blue-600 dark:text-blue-400',
            valueClass: 'text-blue-600'
        },
        {
            label: 'Actives',
            value: activeCount,
            icon: LockOpen,
            color: 'green',
            bgClass: 'bg-green-100 dark:bg-green-900',
            textClass: 'text-green-600 dark:text-green-400',
            valueClass: 'text-green-600'
        },
        {
            label: 'Archivées',
            value: archivedCount,
            icon: Lock,
            color: 'orange',
            bgClass: 'bg-orange-100 dark:bg-orange-900',
            textClass: 'text-orange-600 dark:text-orange-400',
            valueClass: 'text-orange-600'
        },
        {
            label: 'Propriétés',
            value: proprietesCount,
            icon: MapPin,
            color: 'purple',
            bgClass: 'bg-purple-100 dark:bg-purple-900',
            textClass: 'text-purple-600 dark:text-purple-400',
            valueClass: 'text-purple-600'
        }
    ];

    return (
        <>
            {/* Vue Desktop - Grid 4 colonnes */}
            <div className="hidden md:grid grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 ${stat.bgClass} rounded-lg flex-shrink-0`}>
                                    <stat.icon className={`h-6 w-6 ${stat.textClass}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-muted-foreground font-medium truncate">
                                        {stat.label}
                                    </p>
                                    <p className={`text-2xl font-bold ${stat.valueClass}`}>
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Vue Tablette - Grid 2 colonnes */}
            <div className="hidden sm:grid md:hidden grid-cols-2 gap-3">
                {stats.map((stat, index) => (
                    <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 ${stat.bgClass} rounded-lg flex-shrink-0`}>
                                    <stat.icon className={`h-5 w-5 ${stat.textClass}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground font-medium truncate">
                                        {stat.label}
                                    </p>
                                    <p className={`text-xl font-bold ${stat.valueClass}`}>
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Vue Mobile - Cards empilées compactes */}
            <div className="sm:hidden space-y-2">
                {stats.map((stat, index) => (
                    <Card key={index} className="shadow-sm">
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 ${stat.bgClass} rounded-lg flex-shrink-0`}>
                                        <stat.icon className={`h-4 w-4 ${stat.textClass}`} />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {stat.label}
                                    </p>
                                </div>
                                <p className={`text-xl font-bold ${stat.valueClass}`}>
                                    {stat.value}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    );
}