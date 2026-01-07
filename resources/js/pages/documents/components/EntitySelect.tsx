// documents/components/EntitySelect.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Option {
  id: number;
  label: string;
  sublabel?: string;
  badges?: Array<{ label: string; variant?: any }>;
}

interface EntitySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function EntitySelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner',
  disabled,
  className
}: EntitySelectProps) {
  const selected = options.find(o => o.id === Number(value));

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn('h-11', className)}>
        <SelectValue>
          {selected ? (
            <div className="flex items-center gap-2">
              <span className="font-medium">{selected.label}</span>
              {selected.sublabel && (
                <span className="text-xs text-muted-foreground">
                  {selected.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      
      <SelectContent className="max-h-[300px]">
        {options.map((option) => (
          <SelectItem key={option.id} value={String(option.id)} className="py-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{option.label}</span>
                {option.badges?.map((badge, i) => (
                  <Badge key={i} variant={badge.variant} className="text-xs">
                    {badge.label}
                  </Badge>
                ))}
              </div>
              {option.sublabel && (
                <span className="text-xs text-muted-foreground">
                  {option.sublabel}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}