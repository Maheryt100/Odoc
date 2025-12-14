// users/Index.tsx
import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Users as UsersIcon, Filter, X, Search, Loader2, Info, Sparkles } from 'lucide-react';

// Types et config
import { UsersIndexProps, User } from './types';
import { buildSearchParams, hasActiveFilters as checkActiveFilters, clearAllFilters } from './helpers';
import { SEARCH_CONFIG } from './config';

// Composants
import { StatsCards } from './components/StatsCards';
import { UsersTable } from './components/UsersTable';
import { ToggleStatusDialog, DeleteUserDialog } from './components/ConfirmationDialogs';
import { Pagination } from './components/Pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UsersIndex({ users, stats, districts, filters, roles }: UsersIndexProps) {
    // États pour les filtres
    const [search, setSearch] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [selectedDistrict, setSelectedDistrict] = useState(filters.district || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    
    // États pour les dialogues
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [toggleStatusUser, setToggleStatusUser] = useState<User | null>(null);
    
    // État de chargement
    const [isSearching, setIsSearching] = useState(false);

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

    const hasFilters = checkActiveFilters({ search, role: selectedRole, district: selectedDistrict, status: selectedStatus });

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Utilisateurs', href: '' },
            ]}
        >
            <Head title="Gestion des utilisateurs" />

            <div className="container mx-auto p-4 max-w-[1600px] space-y-4">
                {/* En-tête */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                            <UsersIcon className="h-6 w-6 text-rose-600" />
                            Gestion des utilisateurs
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gérer les utilisateurs, leurs rôles et leurs accès
                        </p>
                    </div>
                    <Button size="default" asChild className="gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700">
                        <Link href="/users/create">
                            <UserPlus className="h-4 w-4" />
                            Nouvel utilisateur
                        </Link>
                    </Button>
                </div>

                {/* Cartes de statistiques */}
                <StatsCards stats={stats} />

                <Alert className="border-0 shadow-md bg-gradient-to-r from-rose-50/50 to-pink-50/50 dark:from-rose-950/20 dark:to-pink-950/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg shrink-0">
                            <Info className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <AlertDescription className="text-sm text-rose-900 dark:text-rose-100">
                            <span className="font-semibold flex items-center gap-2">
                                <Sparkles className="h-3 w-3" />
                                Gestion centralisée des accès
                            </span>
                            <span className="text-rose-700 dark:text-rose-300">
                                — Créez, modifiez et contrôlez les permissions de votre équipe facilement
                            </span>
                        </AlertDescription>
                    </div>
                </Alert>

                {/* Card principale avec filtres et table */}
                <Card className="border-0 shadow-lg">
                    {/* Header avec filtres */}
                    <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 border-b">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Filter className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="font-semibold">Recherche et filtres</h2>
                                    <p className="text-xs text-muted-foreground">
                                        {users.total} utilisateur{users.total > 1 ? 's' : ''} trouvé{users.total > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            {isSearching && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="hidden sm:inline">Recherche...</span>
                                </div>
                            )}
                        </div>

                        {/* Filtres en grille compacte */}
                        <div className="grid gap-3 md:grid-cols-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Nom ou email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8 h-9"
                                />
                            </div>

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

                            <div className="flex gap-2">
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
                                        variant="ghost"
                                        onClick={handleClearFilters}
                                        size="sm"
                                        className="h-9 px-2"
                                        title="Réinitialiser les filtres"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <CardContent className="p-0">
                        <UsersTable
                            users={users.data}
                            onToggleStatus={setToggleStatusUser}
                            onDelete={setDeleteUser}
                        />

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="p-4 border-t">
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