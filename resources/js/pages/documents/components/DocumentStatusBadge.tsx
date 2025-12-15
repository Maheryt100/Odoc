import { Badge } from '@/components/ui/badge';
import { FileWarning, FileCheck, AlertCircle, XCircle } from 'lucide-react';
import { DocumentGenere } from '../types';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface DocumentStatusBadgeProps {
    document: DocumentGenere | null | undefined;
    showDetails?: boolean;
}

export default function DocumentStatusBadge({ 
    document, 
    showDetails = false 
}: DocumentStatusBadgeProps) {
    
    if (!document) {
        return (
            <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Non généré
            </Badge>
        );
    }

    const needsRegeneration = document.metadata?.needs_regeneration === true;
    const regenerationCount = document.metadata?.regeneration_count ?? 0;
    const hasFailed = document.metadata?.regeneration_failed === true;
    const lastError = document.metadata?.last_error;

    if (hasFailed) {
        const badge = (
            <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                Échec régénération
            </Badge>
        );

        if (showDetails && lastError) {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {badge}
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs max-w-xs">{lastError}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return badge;
    }

    if (needsRegeneration) {
        const reason = document.metadata?.reason || 'Raison inconnue';
        const badge = (
            <Badge 
                variant="outline"
                className={cn(
                    "gap-1 border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                    "hover:bg-amber-500/20"
                )}
            >
                <FileWarning className="h-3 w-3" />
                Régénération requise
            </Badge>
        );

        if (showDetails) {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {badge}
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{reason}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return badge;
    }

    return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
            <FileCheck className="h-3 w-3" />
            Disponible
            {regenerationCount > 0 && (
                <span className="text-xs opacity-75 ml-1">
                    (×{regenerationCount})
                </span>
            )}
        </Badge>
    );
}