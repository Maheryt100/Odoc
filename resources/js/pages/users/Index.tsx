// users/Index.tsx - VERSION MOBILE-OPTIMIZED
import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Users as UsersIcon, Filter, X, Search, Loader2, Info, Sparkles, ChevronDown } from 'lucide-react';
import { UsersIndexProps, User } from './types';
import { buildSearchParams, hasActiveFilters as checkActiveFilters, clearAllFilters } from './helpers';
import { SEARCH_CONFIG } from './config';
import { StatsCards } from './components/StatsCards';
import { UsersTable } from './components/UsersTable';
import { ToggleStatusDialog, DeleteUserDialog } from './components/ConfirmationDialogs';
import { Pagination } from './components/Pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function UsersIndex({ users, stats, districts, filters, roles }: UsersIndexProps) {
    // États pour les filtres
    const [search, setSearch] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [selectedDistrict, setSelectedDistrict] = useState(filters.district || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    
    // États pour les dialogues
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [toggleStatusUser, setToggleStatusUser] = useState<User | null>(null);
    
    // État de chargement et filtres mobiles
    const [isSearching, setIsSearching] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Recherche automatique avec debounce
    useEffect(() => {
        setIsSearching(true);
        
        const timer = setTimeout(() => {
            performSearch();
        }, SEARCH_CONFIG.debounceDelay);

        return () => clearTimeout(timer);
    }, [search, selectedRole, selectedDistrict, selectedStatus]);

    const performSearch = () => {
        const params = buildSearchParams({
            search,
            role: selectedRole,
            district: selectedDistrict,
            status: selectedStatus,
        });
        
        router.get('/users', params, { 
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => setIsSearching(false),
        });
    };

    const handleClearFilters = () => {
        const clearedFilters = clearAllFilters();
        setSearch(clearedFilters.search || '');
        setSelectedRole(clearedFilters.role || '');
        setSelectedDistrict(clearedFilters.district || '');
        setSelectedStatus(clearedFilters.status || '');
    };

    const handleToggleStatus = (user: User) => {
        router.post(`/users/${user.id}/toggle-status`, {}, {
            onSuccess: () => {
                setToggleStatusUser(null);
            },
            preserveScroll: true,
        });
    };

    const handleDelete = (user: User) => {
        router.delete(`/users/${user.id}`, {
            onSuccess: () => {
                setDeleteUser(null);
            },
            preserveScroll: true,
        });
    };

    const handlePageChange = (page: number) => {
        const params = buildSearchParams({
            search,
            role: selectedRole,
            district: selectedDistrict,
            status: selectedStatus,
        });
        
        router.get(`/users?page=${page}`, params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const hasFilters = checkActiveFilters({ 
        search, 
        role: selectedRole, 
        district: selectedDistrict, 
        status: selectedStatus 
    });

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Utilisateurs', href: '' },
            ]}
        >
            <Head title="Gestion des utilisateurs" />

            <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-[1600px] space-y-3 sm:space-y-4">
                {/* En-tête - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                            <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600 shrink-0" />
                            <span className="truncate">Gestion des utilisateurs</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Gérer les utilisateurs, leurs rôles et leurs accès
                        </p>
                    </div>
                    <Button 
                        size="sm" 
                        asChild 
                        className="gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 w-full sm:w-auto shrink-0"
                    >
                        <Link href="/users/create">
                            <UserPlus className="h-4 w-4" />
                            <span className="sm:inline">Nouvel utilisateur</span>
                        </Link>
                    </Button>
                </div>

                {/* Cartes de statistiques - Mobile Grid */}
                <StatsCards stats={stats} />

                {/* Alert Info - Mobile Optimized */}
                <Alert className="border-0 shadow-md bg-gradient-to-r from-rose-50/50 to-pink-50/50 dark:from-rose-950/20 dark:to-pink-950/20">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg shrink-0">
                            <Info className="h-3 w-3 sm:h-4 sm:w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <AlertDescription className="text-xs sm:text-sm text-rose-900 dark:text-rose-100">
                            <span className="font-semibold flex items-center gap-1.5 sm:gap-2">
                                <Sparkles className="h-3 w-3" />
                                Gestion centralisée
                            </span>
                            <span className="text-rose-700 dark:text-rose-300 block sm:inline">
                                <span className="hidden sm:inline"> — </span>
                                Contrôlez les permissions facilement
                            </span>
                        </AlertDescription>
                    </div>
                </Alert>

                {/* Card principale avec filtres et table */}
                <Card className="border-0 shadow-lg overflow-hidden">
                    {/* Header avec filtres - Mobile Collapsible */}
                    <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-b">
                        <div className="p-3 sm:p-4">
                            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0">
                                            <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-sm sm:text-base truncate">
                                                Recherche et filtres
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                {users.total} résultat{users.total > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 shrink-0">
                                        {isSearching && (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                        <CollapsibleTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="lg:hidden h-8 w-8 p-0"
                                            >
                                                <ChevronDown 
                                                    className={`h-4 w-4 transition-transform ${
                                                        filtersOpen ? 'rotate-180' : ''
                                                    }`} 
                                                />
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                </div>

                                {/* Filtres - Desktop Always Visible, Mobile Collapsible */}
                                <div className="lg:block">
                                    <CollapsibleContent className="lg:!block">
                                        <div className="space-y-2 sm:space-y-3">
                                            {/* Recherche - Full Width on Mobile */}
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                <Input
                                                    placeholder="Nom ou email..."
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    className="pl-8 h-9 w-full"
                                                />
                                            </div>

                                            {/* Selects Grid - Mobile Stack, Desktop Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Tous les rôles" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(roles).map(([key, label]) => (
                                                            <SelectItem key={key} value={key}>
                                                                {label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Tous les districts" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {districts.map((district) => (
                                                            <SelectItem key={district.id} value={district.id.toString()}>
                                                                {district.nom_district}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Tous" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">Actif</SelectItem>
                                                        <SelectItem value="inactive">Inactif</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                {hasFilters && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={handleClearFilters}
                                                        size="sm"
                                                        className="h-9 gap-2 w-full sm:col-span-2 lg:col-span-1"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        <span>Réinitialiser</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </div>
                            </Collapsible>
                        </div>
                    </div>

                    {/* Table - Mobile Optimized in UsersTable component */}
                    <CardContent className="p-0">
                        <UsersTable
                            users={users.data}
                            onToggleStatus={setToggleStatusUser}
                            onDelete={setDeleteUser}
                        />

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="p-3 sm:p-4 border-t">
                                <Pagination
                                    currentPage={users.current_page}
                                    lastPage={users.last_page}
                                    total={users.total}
                                    perPage={users.per_page}
                                    onPageChange={handlePageChange}
                                    itemName="utilisateur"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialogues de confirmation */}
            <ToggleStatusDialog
                user={toggleStatusUser}
                onClose={() => setToggleStatusUser(null)}
                onConfirm={handleToggleStatus}
            />

            <DeleteUserDialog
                user={deleteUser}
                onClose={() => setDeleteUser(null)}
                onConfirm={handleDelete}
            />
        </AppSidebarLayout>
    );
}