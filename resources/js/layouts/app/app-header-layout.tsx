// layouts/app-header-layout.tsx - VERSION MODERNE
import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { type BreadcrumbItem } from '@/types';
import type { PropsWithChildren } from 'react';

export default function AppHeaderLayout({ 
    children, 
    breadcrumbs 
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell>
            <AppHeader breadcrumbs={breadcrumbs} />
            <AppContent className="bg-gradient-to-br from-background via-background to-muted/10">
                {children}
            </AppContent>
        </AppShell>
    );
}