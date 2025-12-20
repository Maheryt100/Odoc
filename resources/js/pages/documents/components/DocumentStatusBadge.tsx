// documents/components/DocumentStatusBadge.tsx - ✅ VERSION RESPONSIVE

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
import { useIsMobile } from '@/hooks/useResponsive';

interface DocumentStatusBadgeProps {
    document: DocumentGenere | null | undefined;
    showDetails?: boolean;
}

export default function DocumentStatusBadge({ 
    document, 
    showDetails = false 
}: DocumentStatusBadgeProps) {
    
    const isMobile = useIsMobile();
    const iconSize = isMobile ? 'h-3 w-3' : 'h-3 w-3';
    const badgeSize = isMobile ? 'text-xs px-2 py-0.5' : 'text-xs';

    if (!document) {
        return (
            <Badge variant="outline" className={cn('gap-1', badgeSize)}>
                <AlertCircle className={iconSize} />
                {isMobile ? 'Non généré' : 'Non généré'}
            </Badge>
        );
    }

    const needsRegeneration = document.metadata?.needs_regeneration === true;
    const regenerationCount = document.metadata?.regeneration_count ?? 0;
    const hasFailed = document.metadata?.regeneration_failed === true;
    const lastError = document.metadata?.last_error;

    if (hasFailed) {
        const badge = (
            <Badge variant="destructive" className={cn('gap-1', badgeSize)}>
                <XCircle className={iconSize} />
                {isMobile ? 'Échec' : 'Échec régénération'}
            </Badge>
        );

        if (showDetails && lastError && !isMobile) {
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
                    "hover:bg-amber-500/20",
                    badgeSize
                )}
            >
                <FileWarning className={iconSize} />
                {isMobile ? 'À régénérer' : 'Régénération requise'}
            </Badge>
        );

        if (showDetails && !isMobile) {
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
        <Badge variant="default" className={cn('bg-green-500 hover:bg-green-600 gap-1', badgeSize)}>
            <FileCheck className={iconSize} />
            {isMobile ? 'OK' : 'Disponible'}
            {regenerationCount > 0 && !isMobile && (
                <span className="text-xs opacity-75 ml-1">
                    (×{regenerationCount})
                </span>
            )}
        </Badge>
    );
}