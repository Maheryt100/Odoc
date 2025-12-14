// resources/js/pages/dossiers/index.tsx - ✅ VERSION AVEC FILTRAGE PAR DATES COMPLÈTES
import { useState, useMemo, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { FolderPlus, Folder, Info, Sparkles } from 'lucide-react';
import type { BreadcrumbItem, Dossier, District, SharedData } from '@/types';
import { hasIssues } from './helpers/statusHelpers';
import SmartDeleteDossierDialog from './components/SmartDeleteDossierDialog';
import DossierFilters from './components/DossierFilters';
import DossierTable from './components/DossierTable';
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
    
    // Suppression
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDossierToDelete, setSelectedDossierToDelete] = useState<Dossier | null>(null);

    const itemsPerPage = 10;

    // Toasts
    useEffect(() => {
        if (flash?.message) toast.info(flash.message);
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // ✅ Filtrage avec dates complètes
    const filteredDossiers = useMemo(() => {
        let filtered = [...dossiers];

        // Filtre par statut
        if (filtreStatut === 'ouverts') {
            filtered = filtered.filter(d => !d.is_closed);
        } else if (filtreStatut === 'fermes') {
            filtered = filtered.filter(d => d.is_closed);
        } else if (filtreStatut === 'incomplets') {
            filtered = filtered.filter(d => (d.demandeurs_count ?? 0) === 0 || (d.proprietes_count ?? 0) === 0);
        } else if (filtreStatut === 'avec_problemes') {
            filtered = filtered.filter(d => hasIssues(d));
        }

        // Recherche
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

        // District
        if (districtFilter !== 'all') {
            filtered = filtered.filter(d => d.id_district === parseInt(districtFilter));
        }

        // ✅ NOUVEAU : Filtrage par dates complètes (date_ouverture)
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

    // ✅ Tri amélioré
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

    const canShowAllDistricts = auth.user.role === 'super_admin' || auth.user.role === 'central_user';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dossiers" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-[1800px] space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                            <Folder className="h-8 w-8 text-blue-600" />
                            Liste des dossiers
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {sortedDossiers.length} dossier{sortedDossiers.length > 1 ? 's' : ''}
                            {sortedDossiers.length !== dossiers.length && ` (filtré${sortedDossiers.length > 1 ? 's' : ''} sur ${dossiers.length})`}
                        </p>
                    </div>

                    {/* Bouton Créer */}
                    <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                        <Link href={route('dossiers.create')}>
                            <FolderPlus className="h-5 w-5 mr-2" />
                            Créer un dossier
                        </Link>
                    </Button>
                </div>

                {/* Alerte */}
                <Alert className="border-0 shadow-md bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                            <span className="font-semibold flex items-center gap-2">
                                <Sparkles className="h-3 w-3" />
                                Gérez vos dossiers facilement
                            </span>
                            <span className="text-blue-700 dark:text-blue-300">
                                — Consultez, modifiez et générez des documents 
                            </span>
                        </AlertDescription>
                    </div>
                </Alert>

                {/* Card principale */}
                <Card className="border-0 shadow-lg">
                    {/* Header compact */}
                    <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 px-6 py-3 border-b">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                                    <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold leading-tight">Tous les dossiers</h2>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {sortedDossiers.length} / {dossiers.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-4">
                        {/* Filtres */}
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
                            canShowAllDistricts={canShowAllDistricts}
                        />

                        {/* Table */}
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

            {/* Dialog de suppression */}
            <SmartDeleteDossierDialog
                dossier={selectedDossierToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </AppLayout>
    );
}