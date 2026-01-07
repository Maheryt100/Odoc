// documents/components/EntityCard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatters } from '../utils/formatters';

interface Field {
  label: string;
  value: any;
  icon?: React.ReactNode;
  format?: 'montant' | 'contenance' | 'date' | 'text';
}

interface EntityCardProps {
  title: string;
  icon: React.ReactNode;
  badges?: Array<{ label: string; variant?: any; icon?: React.ReactNode }>;
  fields: Field[];
  colorScheme?: 'violet' | 'emerald' | 'blue';
  className?: string;
}

export function EntityCard({
  title,
  icon,
  badges = [],
  fields,
  colorScheme = 'blue',
  className
}: EntityCardProps) {
  const colors = {
    violet: 'border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/20',
    emerald: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20',
    blue: 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20'
  };

  const formatValue = (field: Field) => {
    if (!field.value) return '-';
    
    switch (field.format) {
      case 'montant':
        return formatters.montant(field.value);
      case 'contenance':
        return formatters.contenance(field.value);
      case 'date':
        return formatters.date(field.value);
      default:
        return field.value;
    }
  };

  return (
    <Card className={cn('border-2', colors[colorScheme], className)}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold text-sm">{title}</span>
          </div>
          {badges.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {badges.map((badge, i) => (
                <Badge key={i} variant={badge.variant} className="text-xs">
                  {badge.icon}
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {fields.map((field, i) => (
            <div key={i} className="p-2 bg-white/60 dark:bg-gray-900/60 rounded-lg">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                {field.icon}
                <span>{field.label}</span>
              </div>
              <div className="font-medium text-sm truncate">
                {formatValue(field)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}