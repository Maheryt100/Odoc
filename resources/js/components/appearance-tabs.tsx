// components/appearance-toggle-tab.tsx - VERSION MODERNE
import { Appearance, useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { LucideIcon, Monitor, Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function AppearanceToggleTab({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Clair' },
        { value: 'dark', icon: Moon, label: 'Sombre' },
        { value: 'system', icon: Monitor, label: 'Système' },
    ];

    return (
        <div 
            className={cn(
                'inline-flex gap-1 rounded-lg bg-gradient-to-r from-muted/50 to-muted/80 p-1 shadow-sm border border-border/50', 
                className
            )} 
            {...props}
        >
            {tabs.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    onClick={() => updateAppearance(value)}
                    className={cn(
                        'flex items-center gap-2 rounded-md px-3.5 py-1.5 transition-all duration-200',
                        appearance === value
                            ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md scale-105'
                            : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                    )}
                >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{label}</span>
                </button>
            ))}
        </div>
    );
}