// components/app-sidebar-header.tsx - VERSION MODERNE
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4 bg-gradient-to-r from-background to-muted/20">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 hover:bg-primary/10 transition-colors rounded-md" />
                <div className="h-4 w-px bg-border/50"></div>
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}