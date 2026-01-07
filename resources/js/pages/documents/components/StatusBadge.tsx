// documents/components/StatusBadge.tsx
import { Badge } from '@/components/ui/badge';
import { FileWarning, FileCheck, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentGenere } from '../types';

interface StatusBadgeProps {
  document: DocumentGenere | null | undefined;
  showCount?: boolean;
  className?: string;
}

export function StatusBadge({ 
  document, 
  showCount = false,
  className 
}: StatusBadgeProps) {
  
  // Pas de document
  if (!document) {
    return (
      <Badge variant="outline" className={cn('gap-1', className)}>
        <AlertCircle className="h-3 w-3" />
        Non généré
      </Badge>
    );
  }

  const needsRegen = document.metadata?.needs_regeneration === true;
  const hasFailed = document.metadata?.regeneration_failed === true;
  const regenCount = document.metadata?.regeneration_count ?? 0;

  // Échec de régénération
  if (hasFailed) {
    return (
      <Badge variant="destructive" className={cn('gap-1', className)}>
        <XCircle className="h-3 w-3" />
        Échec
      </Badge>
    );
  }

  // Nécessite régénération
  if (needsRegen) {
    return (
      <Badge 
        variant="outline"
        className={cn(
          'gap-1 border-amber-500 bg-amber-500/10 text-amber-700',
          'dark:text-amber-400',
          className
        )}
      >
        <FileWarning className="h-3 w-3" />
        À régénérer
      </Badge>
    );
  }

  // Document valide
  return (
    <Badge 
      variant="default" 
      className={cn('bg-green-500 hover:bg-green-600 gap-1', className)}
    >
      <FileCheck className="h-3 w-3" />
      Disponible
      {showCount && regenCount > 0 && (
        <span className="text-xs opacity-75 ml-1">
          (×{regenCount})
        </span>
      )}
    </Badge>
  );
}