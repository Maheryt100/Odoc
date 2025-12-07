// components/appearance-toggle-dropdown.tsx - VERSION MODERNE
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';
import { Monitor, Moon, Sun, Check } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function AppearanceToggleDropdown({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const getCurrentIcon = () => {
        switch (appearance) {
            case 'dark':
                return <Moon className="h-5 w-5" />;
            case 'light':
                return <Sun className="h-5 w-5" />;
            default:
                return <Monitor className="h-5 w-5" />;
        }
    };

    const themes = [
        { value: 'light' as const, icon: Sun, label: 'Clair' },
        { value: 'dark' as const, icon: Moon, label: 'Sombre' },
        { value: 'system' as const, icon: Monitor, label: 'Système' },
    ];

    return (
        <div className={className} {...props}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-md hover:bg-primary/10 transition-colors"
                    >
                        {getCurrentIcon()}
                        <span className="sr-only">Changer le thème</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    {themes.map(({ value, icon: Icon, label }) => (
                        <DropdownMenuItem 
                            key={value}
                            onClick={() => updateAppearance(value)}
                            className="cursor-pointer"
                        >
                            <div className="flex items-center gap-2 w-full">
                                <Icon className="h-4 w-4" />
                                <span className="flex-1">{label}</span>
                                {appearance === value && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}