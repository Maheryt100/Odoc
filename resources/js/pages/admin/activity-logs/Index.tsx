// admin/activity-logs/Index.tsx - ✅ VERSION REDESIGNÉE
import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Download, FileText, Activity as ActivityIcon } from 'lucide-react';

// Types
import { ActivityLogsIndexProps } from './types';

// Helpers
import { buildSearchParams, hasActiveFilters as checkActiveFilters, clearAllFilters } from './helpers';

// Components
import { StatsCards } from './components/StatsCards';
import { FiltersCard } from './components/FiltersCard';
import { LogsTable } from './components/LogsTable';
import { Pagination } from './components/Pagination';

export default function ActivityLogsIndex({
    logs,
    filters,
    stats,
    users,
    actions,
    documentTypes,
}: ActivityLogsIndexProps) {
    // États pour les filtres
    const [search, setSearch] = useState(filters.search || '');
    const [selectedUser, setSelectedUser] = useState(filters.user_id || 'all');
    const [selectedAction, setSelectedAction] = useState(filters.action || 'all');
    const [selectedDocType, setSelectedDocType] = useState(filters.document_type || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    // État de chargement
    const [isSearching, setIsSearching] = useState(false);

    const handleFilter = () => {
        setIsSearching(true);
        
        const params = buildSearchParams({
            search,
            user_id: selectedUser,
            action: selectedAction,
            document_type: selectedDocType,
            date_from: dateFrom,
            date_to: dateTo,
        });

        router.get('/admin/activity-logs', params, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsSearching(false),
        });
    };

    const handleClearFilters = () => {
        const clearedFilters = clearAllFilters();
        setSearch(clearedFilters.search || '');
        setSelectedUser(clearedFilters.user_id || 'all');
        setSelectedAction(clearedFilters.action || 'all');
        setSelectedDocType(clearedFilters.document_type || 'all');
        setDateFrom(clearedFilters.date_from || '');
        setDateTo(clearedFilters.date_to || '');
        
        router.get('/admin/activity-logs');
    };

    const handlePageChange = (page: number) => {
        const params = buildSearchParams({
            search,
            user_id: selectedUser,
            action: selectedAction,
            document_type: selectedDocType,
            date_from: dateFrom,
            date_to: dateTo,
        });

        router.get(`/admin/activity-logs?page=${page}`, params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const hasFilters = checkActiveFilters({
        search,
        user_id: selectedUser,
        action: selectedAction,
        document_type: selectedDocType,
        date_from: dateFrom,
        date_to: dateTo,
    });

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Logs d\'activité', href: '' },
            ]}
        >
            <Head title="Logs d'activité" />

            <div className="container mx-auto p-6 max-w-[1800px] space-y-6">
                {/* ✅ En-tête moderne - Slate/Gray */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent flex items-center gap-3">
                                <ActivityIcon className="h-8 w-8 text-slate-600" />
                                Logs d'Activité
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Suivi complet des actions effectuées dans le système
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" asChild className="gap-2 shadow-sm hover:shadow-md transition-all">
                            <Link href="/admin/activity-logs/document-stats">
                                <FileText className="h-4 w-4" />
                                Stats Documents
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.get('/admin/activity-logs/export', filters)}
                            className="gap-2 shadow-sm hover:shadow-md transition-all"
                        >
                            <Download className="h-4 w-4" />
                            Exporter CSV
                        </Button>
                    </div>
                </div>

                {/* Cartes de statistiques */}
                <StatsCards stats={stats} />

                {/* Filtres */}
                <FiltersCard
                    search={search}
                    setSearch={setSearch}
                    selectedUser={selectedUser}
                    setSelectedUser={setSelectedUser}
                    selectedAction={selectedAction}
                    setSelectedAction={setSelectedAction}
                    selectedDocType={selectedDocType}
                    setSelectedDocType={setSelectedDocType}
                    dateFrom={dateFrom}
                    setDateFrom={setDateFrom}
                    dateTo={dateTo}
                    setDateTo={setDateTo}
                    users={users}
                    actions={actions}
                    documentTypes={documentTypes}
                    hasActiveFilters={hasFilters}
                    onClearFilters={handleClearFilters}
                    onFilter={handleFilter}
                    isSearching={isSearching}
                />

                {/* Table des logs */}
                <Card className="border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20 p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                <ActivityIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">
                                    Historique des activités
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {logs.total.toLocaleString()} log{logs.total > 1 ? 's' : ''} enregistré{logs.total > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-0">
                        <LogsTable logs={logs.data} actions={actions} />

                        {/* Pagination */}
                        {logs.last_page > 1 && (
                            <div className="p-6 border-t">
                                <Pagination
                                    currentPage={logs.current_page}
                                    lastPage={logs.last_page}
                                    total={logs.total}
                                    perPage={logs.per_page}
                                    onPageChange={handlePageChange}
                                    itemName="log"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
}