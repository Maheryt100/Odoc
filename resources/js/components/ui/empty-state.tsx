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
        <div className={`flex flex-col items-center justify-center py-8 sm:py-12 px-4 ${className}`}>
            <div className="flex justify-center mb-3 sm:mb-4">
                <div className="rounded-full bg-gradient-to-br from-muted to-muted/60 p-3 sm:p-4 shadow-sm">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
            </div>
            
            <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-center">
                {title}
            </h3>
            
            {description && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 max-w-md mx-auto text-center px-4">
                    {description}
                </p>
            )}
            
            {actionLabel && onAction && (
                <Button 
                    onClick={onAction} 
                    variant="outline"
                    size="sm"
                    className="mt-2"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};