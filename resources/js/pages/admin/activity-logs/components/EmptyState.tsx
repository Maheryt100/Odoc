// admin/activity-logs/components/EmptyState.tsx
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className = '',
}: EmptyStateProps) => {
    return (
        <div className={`text-center py-16 ${className}`}>
            <div className="flex justify-center mb-4">
                <div className="rounded-full bg-gradient-to-br from-muted to-muted/50 p-4">
                    <Icon className="h-10 w-10 text-muted-foreground" />
                </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="outline" className="mt-4">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};