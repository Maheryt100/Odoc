// components/nav-main.tsx - VERSION MODERNE
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Navigation
            </SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const isActive = page.url.startsWith(item.href);
                    
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton 
                                asChild 
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                                className={`
                                    transition-all duration-200
                                    ${isActive 
                                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold shadow-sm' 
                                        : 'hover:bg-primary/5'
                                    }
                                `}
                            >
                                <Link href={item.href} prefetch className="flex items-center gap-3">
                                    {item.icon && (
                                        <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                                    )}
                                    <span>{item.title}</span>
                                    {isActive && (
                                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
                                    )}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}