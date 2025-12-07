// components/nav-footer.tsx - VERSION MODERNE
import { Icon } from '@/components/icon';
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { ExternalLink } from 'lucide-react';
import { type ComponentPropsWithoutRef } from 'react';

export function NavFooter({
    items,
    className,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
}) {
    return (
        <SidebarGroup {...props} className={`group-data-[collapsible=icon]:p-0 ${className || ''}`}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100 hover:bg-primary/5 transition-all duration-200"
                            >
                                <a 
                                    href={item.href} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2"
                                >
                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                    <span className="flex-1">{item.title}</span>
                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}