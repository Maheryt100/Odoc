// ===== FICHIER 2: resources/js/components/app-sidebar.tsx =====
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    BookOpen,
    Folder,
    Folders,
    MapPin,
    LayoutGrid,
    UserCog,
    Activity,
    Shield,
    RefreshCw
} from 'lucide-react';
import AppLogo from './app-logo';
import ComingSoonDialog from './coming-soon-dialog';

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);

    // Intercepter les clics sur les liens TopoFlux
    useEffect(() => {
        const handleTopoFluxClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a[href*="topo-flux"]');
            
            if (link) {
                e.preventDefault();
                e.stopPropagation();
                setShowComingSoonDialog(true);
            }
        };

        document.addEventListener('click', handleTopoFluxClick, true);
        
        return () => {
            document.removeEventListener('click', handleTopoFluxClick, true);
        };
    }, []);

    // Navigation principale
    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Dossiers',
            href: '/dossiers',
            icon: Folders,
        },
    ];

    // Flux TopoManager - pour Admin District et User District
    if (user && (user.role === 'admin_district' || user.role === 'user_district')) {
        mainNavItems.push({
            title: 'Flux TopoManager',
            href: '/topo-flux',
            icon: RefreshCw,
        });
    }

    // Configuration
    const configNavItems: NavItem[] = [];

    if (user && (user.role === 'super_admin' || user.role === 'admin_district' || user.role === 'central_user')) {
        configNavItems.push({
            title: 'Localisations',
            href: '/location',
            icon: MapPin,
        });
    }

    if (user && (user.role === 'super_admin' || user.role === 'admin_district' || user.role === 'central_user')) {
        configNavItems.push({
            title: 'Logs d\'activité',
            href: '/admin/activity-logs',
            icon: Activity,
        });
    }

    if (user && (user.role === 'super_admin' || user.role === 'admin_district')) {
        configNavItems.push({
            title: 'Utilisateurs',
            href: '/users',
            icon: UserCog,
        });
    }

    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: Folder,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },
    ];

    const getRoleBadge = () => {
        if (!user) return null;
        
        const roleConfig = {
            super_admin: { 
                label: 'Super Admin', 
                color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20' 
            },
            central_user: { 
                label: 'Utilisateur Central', 
                color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20' 
            },
            admin_district: { 
                label: 'Admin District', 
                color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' 
            },
            user_district: { 
                label: 'Utilisateur District', 
                color: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20' 
            },
        };

        const config = roleConfig[user.role as keyof typeof roleConfig];
        if (!config) return null;

        return (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${config.color}`}>
                <Shield className="h-3 w-3" />
                {config.label}
            </div>
        );
    };

    return (
        <>
            <Sidebar collapsible="icon" variant="inset">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link href="/dashboard" prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    
                    <div className="px-3 pt-2 pb-1 group-data-[collapsible=icon]:hidden">
                        {getRoleBadge()}
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <NavMain items={mainNavItems} />
                    
                    {configNavItems.length > 0 && (
                        <div className="px-3 py-3">
                            <Separator />
                        </div>
                    )}
                    
                    {configNavItems.length > 0 && (
                        <div>
                            <NavMain items={configNavItems} />
                        </div>
                    )}
                </SidebarContent>

                <SidebarFooter>
                    <NavUser />
                </SidebarFooter>
            </Sidebar>

            <ComingSoonDialog
                open={showComingSoonDialog}
                onClose={() => setShowComingSoonDialog(false)}
                featureName="Flux TopoManager"
                description="L'intégration avec TopoManager pour la synchronisation des données terrain est en cours de développement."
            />
        </>
    );
}