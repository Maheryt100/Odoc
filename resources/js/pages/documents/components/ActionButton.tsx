// documents/components/ActionButton.tsx
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function ActionButton({
  loading,
  icon,
  children,
  disabled,
  className,
  ...props
}: ActionButtonProps) {
  return (
    <Button
      disabled={loading || disabled}
      className={cn('min-w-[200px]', className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Chargement...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </Button>
  );
}