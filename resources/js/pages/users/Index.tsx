// pages/users/Index.tsx - SOLUTION FINALE
import { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Users as UsersIcon, Info, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types
import type { UsersIndexProps, User } from './types';

// Hooks et helpers
import { useUserFilters, clearAllFilters } from './hooks/useUserFilters';

// Components
import { StatsCards } from './components/StatsCards';
import UserFilters from './components/UserFilters';
import { UsersTable } from './components/UsersTable';
import { ToggleStatusDialog, DeleteUserDialog } from './components/ConfirmationDialogs';
import { Pagination } from './components/Pagination';

export default function UsersIndex({ 
    users: initialUsers, 
    stats, 
    districts, 
    filters: serverFilters, 
    roles 
}: UsersIndexProps) {
    // États locaux pour filtrage côté client
    const [recherche, setRecherche] = useState('');
    const [filtreRole, setFiltreRole] = useState('');
    const [filtreDistrict, setFiltreDistrict] = useState('');
    const [filtreStatut, setFiltreStatut] = useState('');
    
    // Pagination locale
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    
    // ✅ Dialogues - Simplifié sans isProcessing
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [toggleStatusUser, setToggleStatusUser] = useState<User | null>(null);

    // Filtrage côté client
    const utilisateursFiltres = useUserFilters(initialUsers.data, {
        search: recherche,
        role: filtreRole,
        district: filtreDistrict,
        status: filtreStatut,
    });

    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = utilisateursFiltres.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(utilisateursFiltres.length / itemsPerPage);

    // Réinitialiser la page lors du changement de filtres
    useEffect(() => {
        setCurrentPage(1);
    }, [recherche, filtreRole, filtreDistrict, filtreStatut]);

    // Handler de réinitialisation des filtres
    const handleResetFilters = useCallback(() => {
        const cleared = clearAllFilters();
        setRecherche(cleared.search);
        setFiltreRole(cleared.role);
        setFiltreDistrict(cleared.district);
        setFiltreStatut(cleared.status);
        setCurrentPage(1);
    }, []);

    // ✅ Handler pour toggle status - NE PAS fermer le dialog ici
    // Laisser Inertia recharger la page ce qui fermera automatiquement le dialog
    const handleToggleStatus = useCallback((user: User) => {
        router.post(`/users/${user.id}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                // ✅ Fermer après le succès d'Inertia
                setToggleStatusUser(null);
            },
        });
    }, []);

    // ✅ Handler pour suppression
    const handleDelete = useCallback((user: User) => {
        router.delete(`/users/${user.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                // ✅ Fermer après le succès d'Inertia
                setDeleteUser(null);
            },
        });
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Utilisateurs', href: '' },
            ]}
        >
            <Head title="Gestion des utilisateurs" />

            <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-[1600px] space-y-3 sm:space-y-4">
                {/* En-tête */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                            <span>Nouvel utilisateur</span>
                        </Link>
                    </Button>
                </div>

                {/* Stats */}
                <StatsCards stats={stats} />

                {/* Alert Info */}
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

                {/* Card principale */}
                <Card className="border-0 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-50/50 to-pink-50/50 dark:from-rose-950/20 dark:to-pink-950/20 px-4 py-3 border-b">
                        <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex-shrink-0">
                                    <UsersIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold leading-tight">Utilisateurs</h2>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {utilisateursFiltres.length} / {initialUsers.data.length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <UserFilters
                            recherche={recherche}
                            onRechercheChange={setRecherche}
                            filtreRole={filtreRole}
                            onFiltreRoleChange={setFiltreRole}
                            filtreDistrict={filtreDistrict}
                            onFiltreDistrictChange={setFiltreDistrict}
                            filtreStatut={filtreStatut}
                            onFiltreStatutChange={setFiltreStatut}
                            districts={districts}
                            roles={roles}
                            totalUtilisateurs={initialUsers.data.length}
                            totalFiltres={utilisateursFiltres.length}
                            onResetFilters={handleResetFilters}
                        />
                    </div>

                    <CardContent className="p-0">
                        <UsersTable
                            users={paginatedUsers}
                            onToggleStatus={setToggleStatusUser}
                            onDelete={setDeleteUser}
                        />

                        {totalPages > 1 && (
                            <div className="p-4 border-t">
                                <Pagination
                                    currentPage={currentPage}
                                    lastPage={totalPages}
                                    total={utilisateursFiltres.length}
                                    perPage={itemsPerPage}
                                    onPageChange={handlePageChange}
                                    itemName="utilisateur"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ✅ Dialogues - Laisser Inertia gérer la fermeture après succès */}
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