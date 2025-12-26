// resources/js/pages/dossiers/index.tsx - ✅ CORRECTION BOUTON DOCUMENTS

import { useState, useMemo, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { FolderPlus, Folder, Info, Sparkles, Eye, Search } from 'lucide-react';
import type { BreadcrumbItem, Dossier, District, SharedData } from '@/types';
import { hasIssues } from './helpers/statusHelpers';
import SmartDeleteDossierDialog from './components/SmartDeleteDossierDialog';
import DossierFilters from './components/DossierFilters';
import DossierTable from './components/DossierTable';
import AdvancedSearchBar from './components/AdvancedSearchBar';
import type { FiltreStatutDossierType, TriDossierType } from './components/DossierFilters';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dossiers', href: '/dossiers' }];

interface PageProps {
    dossiers: Dossier[];
    districts: District[];
    auth: {
        user: {
            id: number;
            role: string;
            id_district?: number | null;
        };
    };
    [key: string]: any;
}

export default function Index() {
    const { dossiers = [], districts = [], auth } = usePage<PageProps>().props;
    const { flash } = usePage<SharedData>().props;

    const user = auth?.user;

    // États principaux
    const [currentPage, setCurrentPage] = useState(1);
    const [filtreStatut, setFiltreStatut] = useState<FiltreStatutDossierType>('tous');
    const [recherche, setRecherche] = useState('');
    const [districtFilter, setDistrictFilter] = useState<string>('all');
    const [dateStart, setDateStart] = useState<string>('');
    const [dateEnd, setDateEnd] = useState<string>('');
    const [tri, setTri] = useState<TriDossierType>('date');
    const [ordre, setOrdre] = useState<'asc' | 'desc'>('desc');
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    
    // Suppression
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDossierToDelete, setSelectedDossierToDelete] = useState<Dossier | null>(null);

    const itemsPerPage = 10;

    // ✅ Permissions - Mémorisées pour éviter les recalculs
    const permissions = useMemo(() => {
        const canCreateDossier = user?.role === 'admin_district' || user?.role === 'user_district';
        const canShowAllDistricts = user?.role === 'super_admin' || user?.role === 'central_user';
        const isReadOnly = user?.role === 'super_admin' || user?.role === 'central_user';
        
        return {
            canCreateDossier,
            canShowAllDistricts,
            isReadOnly
        };
    }, [user?.role]);

    // Toasts
    useEffect(() => {
        if (flash?.message) toast.info(flash.message);
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // Filtrage
    const filteredDossiers = useMemo(() => {
        let filtered = [...dossiers];

        if (filtreStatut === 'ouverts') {
            filtered = filtered.filter(d => !d.is_closed);
        } else if (filtreStatut === 'fermes') {
            filtered = filtered.filter(d => d.is_closed);
        } else if (filtreStatut === 'incomplets') {
            filtered = filtered.filter(d => (d.demandeurs_count ?? 0) === 0 || (d.proprietes_count ?? 0) === 0);
        } else if (filtreStatut === 'avec_problemes') {
            filtered = filtered.filter(d => hasIssues(d));
        }

        if (recherche) {
            const searchLower = recherche.toLowerCase();
            filtered = filtered.filter(d => {
                const numeroStr = d.numero_ouverture?.toString() || '';
                return (
                    d.nom_dossier.toLowerCase().includes(searchLower) ||
                    d.commune.toLowerCase().includes(searchLower) ||
                    d.circonscription.toLowerCase().includes(searchLower) ||
                    numeroStr.includes(searchLower)
                );
            });
        }

        if (districtFilter !== 'all') {
            filtered = filtered.filter(d => d.id_district === parseInt(districtFilter));
        }

        if (dateStart) {
            const startDate = new Date(dateStart);
            startDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(d => {
                const dossierDate = new Date(d.date_ouverture);
                dossierDate.setHours(0, 0, 0, 0);
                return dossierDate >= startDate;
            });
        }

        if (dateEnd) {
            const endDate = new Date(dateEnd);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(d => {
                const dossierDate = new Date(d.date_ouverture);
                dossierDate.setHours(0, 0, 0, 0);
                return dossierDate <= endDate;
            });
        }

        return filtered;
    }, [dossiers, filtreStatut, recherche, districtFilter, dateStart, dateEnd]);

    // Tri
    const sortedDossiers = useMemo(() => {
        const sorted = [...filteredDossiers];

        sorted.sort((a, b) => {
            let compareValue = 0;

            switch (tri) {
                case 'date':
                    compareValue = new Date(a.date_ouverture).getTime() - new Date(b.date_ouverture).getTime();
                    break;
                case 'nom':
                    compareValue = a.nom_dossier.localeCompare(b.nom_dossier);
                    break;
                case 'commune':
                    compareValue = a.commune.localeCompare(b.commune);
                    break;
                case 'numero':
                    const numA = a.numero_ouverture ?? 0;
                    const numB = b.numero_ouverture ?? 0;
                    compareValue = numA - numB;
                    break;
            }

            return ordre === 'asc' ? compareValue : -compareValue;
        });

        return sorted;
    }, [filteredDossiers, tri, ordre]);

    // Handlers
    const handleFiltreStatutChange = (newFiltre: FiltreStatutDossierType) => {
        setFiltreStatut(newFiltre);
        setCurrentPage(1);
    };

    const handleRechercheChange = (newRecherche: string) => {
        setRecherche(newRecherche);
        setCurrentPage(1);
    };

    const handleDistrictFilterChange = (newDistrict: string) => {
        setDistrictFilter(newDistrict);
        setCurrentPage(1);
    };

    const handleDateStartChange = (date: string) => {
        setDateStart(date);
        setCurrentPage(1);
    };

    const handleDateEndChange = (date: string) => {
        setDateEnd(date);
        setCurrentPage(1);
    };

    const handleTriChange = (newTri: TriDossierType) => {
        setTri(newTri);
        setCurrentPage(1);
    };

    const handleOrdreToggle = () => {
        setOrdre(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const handleToggleExpand = (id: number) => {
        const newSet = new Set(expandedRows);
        newSet.has(id) ? newSet.delete(id) : newSet.add(id);
        setExpandedRows(newSet);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setExpandedRows(new Set());
    };

    const handleDeleteDossier = (dossier: Dossier) => {
        setSelectedDossierToDelete(dossier);
        setDeleteDialogOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dossiers" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-[1800px] space-y-4 sm:space-y-6">
                
                {/* Header avec bouton de recherche avancée */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                            <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 shrink-0" />
                            <span className="truncate">Liste des dossiers</span>
                        </h1>
                    </div>

                    <div className="flex flex-row gap-2">
                        <Button
                            variant={showAdvancedSearch ? "default" : "outline"}
                            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                            className="flex-1 h-9 sm:h-10"
                        >
                            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                            <span className="text-xs sm:text-sm leading-tight">
                                {showAdvancedSearch ? 'Masquer' : 'Recherche avancée'}
                            </span>
                        </Button>

                        {permissions.canCreateDossier && (
                            <Button
                                asChild
                                className="flex-1 h-9 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600"
                            >
                                <Link href={route('dossiers.create')}>
                                    <FolderPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                                    <span className="text-xs sm:text-sm leading-tight">
                                        Créer un dossier
                                    </span>
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* NOUVELLE SECTION : Recherche avancée (collapsible) */}
                {showAdvancedSearch && (
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <h3 className="text-lg font-semibold">Recherche globale avancée</h3>
                            </div>
                            <AdvancedSearchBar
                                canExport={true}
                                canAccessAllDistricts={permissions.canShowAllDistricts}
                                initialPageSize={50}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Alertes */}
                {!permissions.canCreateDossier && (
                    <Alert className="border-0 shadow-md bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg shrink-0">
                                <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <AlertDescription className="text-xs sm:text-sm text-amber-900 dark:text-amber-100">
                                <span className="font-semibold block sm:inline">
                                    Mode consultation uniquement
                                </span>
                                <span className="text-amber-700 dark:text-amber-300 block sm:inline sm:ml-1 mt-1 sm:mt-0">
                                    Vous pouvez consulter tous les dossiers mais pas les créer ou modifier.
                                </span>
                            </AlertDescription>
                        </div>
                    </Alert>
                )}

                {permissions.canCreateDossier && (
                    <Alert className="border-0 shadow-md bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                                <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <AlertDescription className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                                <span className="font-semibold flex items-center gap-1.5 sm:gap-2">
                                    <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    <span>Gérez vos dossiers facilement</span>
                                </span>
                                <span className="text-blue-700 dark:text-blue-300 block mt-1">
                                    Consultez, modifiez et générez des documents
                                </span>
                            </AlertDescription>
                        </div>
                    </Alert>
                )}

                {/* Card principale - Filtres et Table */}
                <Card className="border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 border-b">
                        <div className="flex items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="p-1 sm:p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                                    <Folder className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-base sm:text-lg font-bold leading-tight truncate">
                                        Tous les dossiers
                                    </h2>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {sortedDossiers.length} / {dossiers.length}
                                    </p>
                                </div>
                            </div>
                            
                            {permissions.isReadOnly && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-full shrink-0">
                                    <Eye className="h-3 w-3" />
                                    <span className="text-xs font-medium hidden xs:inline">Consultation</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <CardContent className="p-3 sm:p-4 space-y-4">
                        {/* Filtres locaux */}
                        <DossierFilters
                            filtreStatut={filtreStatut}
                            onFiltreStatutChange={handleFiltreStatutChange}
                            recherche={recherche}
                            onRechercheChange={handleRechercheChange}
                            districtFilter={districtFilter}
                            onDistrictFilterChange={handleDistrictFilterChange}
                            dateStart={dateStart}
                            onDateStartChange={handleDateStartChange}
                            dateEnd={dateEnd}
                            onDateEndChange={handleDateEndChange}
                            tri={tri}
                            onTriChange={handleTriChange}
                            ordre={ordre}
                            onOrdreToggle={handleOrdreToggle}
                            districts={districts}
                            totalDossiers={dossiers.length}
                            totalFiltres={sortedDossiers.length}
                            canShowAllDistricts={permissions.canShowAllDistricts}
                        />

                        {/* ✅ Table avec permissions passées */}
                        <DossierTable
                            dossiers={sortedDossiers}
                            auth={auth}
                            expandedRows={expandedRows}
                            onToggleExpand={handleToggleExpand}
                            onDelete={handleDeleteDossier}
                            currentPage={currentPage}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                        />
                    </CardContent>
                </Card>
            </div>

            <SmartDeleteDossierDialog
                dossier={selectedDossierToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </AppLayout>
    );
}