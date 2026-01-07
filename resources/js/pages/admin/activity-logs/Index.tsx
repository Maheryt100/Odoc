// pages/admin/activity-logs/Index.tsx
import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Activity as ActivityIcon, Info, Sparkles, Settings, ArrowLeft } from 'lucide-react';
import { ActivityLogsIndexProps } from './types';
import { StatsCards } from './components/StatsCards';
import ActivityFilters from './components/ActivityFilters';
import { LogsTable } from './components/LogsTable';
import { Pagination } from './components/Pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User } from '@/types';

export default function ActivityLogsIndex({
    logs,
    filters: initialFilters,
    stats,
    users,
    actions,
    documentTypes,
    auth,
}: ActivityLogsIndexProps & { auth: { user: User } }) {
    // États pour les filtres (synchronisés avec l'URL)
    const [search, setSearch] = useState(initialFilters.search || '');
    const [userId, setUserId] = useState(initialFilters.user_id || 'all');
    const [action, setAction] = useState(initialFilters.action || 'all');
    const [documentType, setDocumentType] = useState(initialFilters.document_type || 'all');
    const [dateFrom, setDateFrom] = useState(initialFilters.date_from || '');
    const [dateTo, setDateTo] = useState(initialFilters.date_to || '');

    const applyFilters = (resetPage: boolean = true) => {
        const params: Record<string, any> = {};

        // Ajouter la page seulement si on ne reset pas
        if (!resetPage && logs.current_page > 1) {
            params.page = logs.current_page;
        }

        // Ajouter les filtres actifs
        if (search.trim()) params.search = search.trim();
        if (userId !== 'all') params.user_id = userId;
        if (action !== 'all') params.action = action;
        if (documentType !== 'all') params.document_type = documentType;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        router.get('/admin/activity-logs', params, {
            preserveState: true,
            preserveScroll: true,
            only: ['logs', 'filters'], // Ne recharger que les données nécessaires
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setUserId('all');
        setAction('all');
        setDocumentType('all');
        setDateFrom('');
        setDateTo('');
        
        // Requête sans paramètres
        router.get('/admin/activity-logs', {}, {
            preserveState: false,
        });
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, any> = {
            page,
        };

        // Conserver tous les filtres actifs
        if (search.trim()) params.search = search.trim();
        if (userId !== 'all') params.user_id = userId;
        if (action !== 'all') params.action = action;
        if (documentType !== 'all') params.document_type = documentType;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        router.get('/admin/activity-logs', params, {
            preserveState: true,
            preserveScroll: true,
            only: ['logs'], // Ne recharger que les logs
        });
    };

    const hasActiveFilters = !!(
        search ||
        (userId && userId !== 'all') ||
        (action && action !== 'all') ||
        (documentType && documentType !== 'all') ||
        dateFrom ||
        dateTo
    );

    const isSuperAdmin = auth.user.role === 'super_admin';

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Logs d\'activité', href: '' },
            ]}
        >
            <Head title="Logs d'activité" />

            <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-[1800px] space-y-3 sm:space-y-4">
                
                {/* ✅ En-tête avec bouton retour et paramètres */}
                <div className="flex flex-col gap-3">
                    {/* Boutons d'action en haut à droite */}
                    <div className="flex items-center justify-end gap-2">
                        {/* Bouton paramètres (super_admin uniquement) */}
                        {isSuperAdmin && (
                            <Button asChild variant="outline" size="sm" className="gap-2">
                                <Link href="/admin/activity-logs/settings">
                                    <Settings className="h-4 w-4" />
                                    <span className="hidden sm:inline">Paramètres</span>
                                </Link>
                            </Button>
                        )}

                        {/* Bouton retour */}
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <Link href={route('dashboard.index')}>
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Retour au Dashboard</span>
                                <span className="sm:hidden">Retour</span>
                            </Link>
                        </Button>
                    </div>

                    {/* Titre et description */}
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent flex items-center gap-3">
                            <ActivityIcon className="h-6 w-6 sm:h-8 sm:w-8 text-slate-600" />
                            Logs d'Activité
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Suivi complet des actions effectuées dans le système
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <StatsCards stats={stats} />

                {/* Alert Info avec résumé des filtres */}
                <Alert className="border-0 shadow-md bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg shrink-0">
                            <Info className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <AlertDescription className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            <span className="font-semibold flex items-center gap-1.5 sm:gap-2">
                                <Sparkles className="h-3 w-3" />
                                {hasActiveFilters ? 'Résultats filtrés' : 'Traçabilité complète du système'}
                            </span>
                            <span className="text-slate-700 dark:text-slate-300 block sm:inline">
                                <span className="hidden sm:inline"> — </span>
                                Affichage de {logs.from} à {logs.to} sur {logs.total} log{logs.total > 1 ? 's' : ''}
                                {hasActiveFilters && ' (filtrés)'}
                            </span>
                        </AlertDescription>
                    </div>
                </Alert>

                {/* Card principale */}
                <Card className="border-0 shadow-lg">
                    {/* Header avec filtres */}
                    <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20 px-4 py-3 border-b">
                        <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                    <ActivityIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg leading-tight">
                                        Historique des activités
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        Page {logs.current_page} sur {logs.last_page}
                                        {hasActiveFilters && ' • Filtres actifs'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Filtres avec onApplyFilters correctement passé */}
                        <ActivityFilters
                            search={search}
                            onSearchChange={setSearch}
                            userId={userId}
                            onUserIdChange={setUserId}
                            action={action}
                            onActionChange={setAction}
                            documentType={documentType}
                            onDocumentTypeChange={setDocumentType}
                            dateFrom={dateFrom}
                            onDateFromChange={setDateFrom}
                            dateTo={dateTo}
                            onDateToChange={setDateTo}
                            users={users}
                            actions={actions}
                            documentTypes={documentTypes}
                            totalLogs={logs.total}
                            filteredCount={logs.total}
                            onClearFilters={handleClearFilters}
                            onApplyFilters={() => applyFilters(true)}
                        />
                    </div>

                    {/* Table */}
                    <CardContent className="p-0">
                        <LogsTable logs={logs.data} actions={actions} />

                        {/* Pagination serveur avec conservation des filtres */}
                        {logs.last_page > 1 && (
                            <div className="p-4 border-t">
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