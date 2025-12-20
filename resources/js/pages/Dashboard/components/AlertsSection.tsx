// Dashboard/components/AlertsSection.tsx - VERSION OPTIMISÉE
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { Alert as AlertType } from '../types';

interface Props {
    alerts: AlertType[];
}

export function AlertsSection({ alerts }: Props) {
    if (!alerts || alerts.length === 0) {
        return null;
    }

    const getAlertIcon = (type: AlertType['type']) => {
        switch (type) {
            case 'error':
                return <AlertCircle className="h-4 w-4" />;
            case 'warning':
                return <AlertTriangle className="h-4 w-4" />;
            case 'info':
                return <Info className="h-4 w-4" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    return (
        <div className="grid gap-3">
            {alerts.slice(0, 3).map((alert, index) => (
                <Alert 
                    key={index}
                    variant={alert.type === 'error' ? 'destructive' : 'default'}
                    className={cn(
                        "transition-colors",
                        alert.type === 'warning' && 'border-orange-500 dark:border-orange-600 bg-orange-50 dark:bg-orange-950/30',
                        alert.type === 'info' && 'border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/30'
                    )}
                >
                    <div className="flex items-start gap-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1 min-w-0 space-y-1">
                            <AlertTitle className="text-sm sm:text-base">{alert.title}</AlertTitle>
                            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <span className="text-xs sm:text-sm">{alert.message}</span>
                                {alert.action && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        asChild 
                                        className="w-full sm:w-auto shrink-0"
                                    >
                                        <Link href={alert.action}>
                                            <span className="text-xs">Voir</span>
                                            <ArrowRight className="ml-1 h-3 w-3" />
                                        </Link>
                                    </Button>
                                )}
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>
            ))}
        </div>
    );
}