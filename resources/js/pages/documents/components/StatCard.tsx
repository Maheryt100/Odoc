// documents/components/StatCard.tsx - COMPOSANT RÉUTILISABLE
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, CheckCircle2, LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number;
    total: number;
    icon: LucideIcon;
    colorScheme: 'violet' | 'green' | 'emerald' | 'blue' | 'cyan';
    label?: string;
}

/**
 * ✅ Composant de carte statistique réutilisable
 * Design cohérent avec users/Index.tsx
 */
export default function StatCard({
    title,
    value,
    total,
    icon: Icon,
    colorScheme,
    label = 'éléments'
}: StatCardProps) {
    
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
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className={`bg-gradient-to-br ${colors.gradient}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <div className={`p-2 ${colors.iconBg} rounded-lg`}>
                        <Icon className={`h-4 w-4 ${colors.iconColor}`} />
                    </div>
                </CardHeader>
            </div>
            <CardContent className="pt-4">
                <div className={`text-3xl font-bold bg-gradient-to-r ${colors.textGradient} bg-clip-text text-transparent`}>
                    {value}
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <p className="text-xs text-muted-foreground">
                        sur {total} {label}
                    </p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                    <div
                        className={`bg-gradient-to-r ${colors.progressBar} h-2 rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {value > 0 && (
                    <Badge variant="outline" className="mt-3 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {percentage}%
                    </Badge>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * ✅ EXEMPLE D'UTILISATION :
 * 
 * <StatCard
 *     title="Actes de Vente"
 *     value={stats.proprietesAvecAdv}
 *     total={stats.totalProprietes}
 *     icon={FileText}
 *     colorScheme="violet"
 *     label="propriétés"
 * />
 */