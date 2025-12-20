// Statistics/components/StatCard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    title: string;
    value: string;
    subtitle?: string;
    trend?: number;
    color?: 'blue' | 'green' | 'purple' | 'orange';
    className?: string;
}

export function StatCard({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    trend, 
    color = 'blue',
    className 
}: StatCardProps) {
    const colorClasses = {
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            icon: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-800'
        },
        green: {
            bg: 'bg-green-50 dark:bg-green-900/20',
            icon: 'text-green-600 dark:text-green-400',
            border: 'border-green-200 dark:border-green-800'
        },
        purple: {
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            icon: 'text-purple-600 dark:text-purple-400',
            border: 'border-purple-200 dark:border-purple-800'
        },
        orange: {
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            icon: 'text-orange-600 dark:text-orange-400',
            border: 'border-orange-200 dark:border-orange-800'
        }
    };

    return (
        <Card className={cn("hover:shadow-lg transition-all duration-300", className)}>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn("p-2.5 rounded-lg shrink-0", colorClasses[color].bg)}>
                        <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", colorClasses[color].icon)} />
                    </div>
                    {trend !== undefined && (
                        <Badge 
                            variant={trend >= 0 ? "default" : "secondary"} 
                            className={cn(
                                "text-xs gap-1",
                                trend >= 0 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                            )}
                        >
                            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {trend > 0 ? '+' : ''}{trend}%
                        </Badge>
                    )}
                </div>
                
                <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">{title}</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{subtitle}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}