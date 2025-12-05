// users/Index.tsx
import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Users as UsersIcon, ArrowLeft } from 'lucide-react';

// Types et config
import { UsersIndexProps, User } from './types';
import { buildSearchParams, hasActiveFilters as checkActiveFilters, clearAllFilters } from './helpers';
import { SEARCH_CONFIG } from './config';

// Composants
import { StatsCards } from './components/StatsCards';
import { FiltersCard } from './components/FiltersCard';
import { UsersTable } from './components/UsersTable';
import { ToggleStatusDialog, DeleteUserDialog } from './components/ConfirmationDialogs';
import { Pagination } from './components/Pagination';

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

    /**
     * Effectue la recherche avec les filtres actuels
     */
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

    /**
     * Réinitialise tous les filtres
     */
    const handleClearFilters = () => {
        const clearedFilters = clearAllFilters();
        setSearch(clearedFilters.search || '');
        setSelectedRole(clearedFilters.role || '');
        setSelectedDistrict(clearedFilters.district || '');
        setSelectedStatus(clearedFilters.status || '');
    };

    /**
     * Gère le changement de statut d'un utilisateur
     */
    const handleToggleStatus = (user: User) => {
        router.post(`/users/${user.id}/toggle-status`, {}, {
            onSuccess: () => {
                setToggleStatusUser(null);
            },
        });
    };

    /**
     * Gère la suppression d'un utilisateur
     */
    const handleDelete = (user: User) => {
        router.delete(`/users/${user.id}`, {
            onSuccess: () => {
                setDeleteUser(null);
            },
        });
    };

    /**
     * Change de page dans la pagination
     */
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

            <div className="container mx-auto p-6 max-w-[1600px] space-y-6">
                {/* En-tête avec bouton retour */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Gestion des utilisateurs
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Gérer les utilisateurs, leurs rôles et leurs accès
                            </p>
                        </div>
                    </div>
                    <Link href="/users/create">
                        <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
                            <UserPlus className="h-5 w-5" />
                            Nouvel utilisateur
                        </Button>
                    </Link>
                </div>

                {/* Cartes de statistiques */}
                <StatsCards stats={stats} />

                {/* Filtres */}
                <FiltersCard
                    search={search}
                    setSearch={setSearch}
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                    selectedDistrict={selectedDistrict}
                    setSelectedDistrict={setSelectedDistrict}
                    selectedStatus={selectedStatus}
                    setSelectedStatus={setSelectedStatus}
                    districts={districts}
                    roles={roles}
                    hasActiveFilters={hasFilters}
                    onClearFilters={handleClearFilters}
                    isSearching={isSearching}
                />

                {/* Table des utilisateurs */}
                <Card className="border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20 p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                <UsersIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">
                                    Liste des utilisateurs
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {users.total} utilisateur{users.total > 1 ? 's' : ''} enregistré{users.total > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-0">
                        <UsersTable
                            users={users.data}
                            onToggleStatus={setToggleStatusUser}
                            onDelete={setDeleteUser}
                        />

                        {/* Pagination améliorée */}
                        <div className="p-6 border-t">
                            <Pagination
                                currentPage={users.current_page}
                                lastPage={users.last_page}
                                total={users.total}
                                perPage={users.per_page}
                                onPageChange={handlePageChange}
                                itemName="utilisateur"
                            />
                        </div>
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