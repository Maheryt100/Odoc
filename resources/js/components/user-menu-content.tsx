// components/user-menu-content.tsx - VERSION MODERNE
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { LogOut, Settings, Sparkles } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={route('settings.profile.edit')} className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span>Paramètres</span>
                        <Sparkles className="h-3 w-3 ml-auto text-muted-foreground" />
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
                <Link 
                    className="flex items-center gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400" 
                    method="post" 
                    href={route('logout')} 
                    as="button" 
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    <span>Déconnexion</span>
                </Link>
            </DropdownMenuItem>
        </>
    );
}