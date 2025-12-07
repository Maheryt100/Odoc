// resources/js/pages/dossiers/index.tsx - ✅ VERSION REDESIGNÉE
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Dossier } from './types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FolderPlus, Search, Calendar, SlidersHorizontal, Eye, Pencil, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, LockOpen, Lock as LockIcon, FileText, FileOutput, Folder } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { LandPlot, EllipsisVertical, Archive } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { filterDossiers, sortDossiers, calculateDossierPermissions, getDisabledDocumentButtonTooltip } from './helpers';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dossiers', href: '/dossiers' },
];

const ITEMS_PER_PAGE = 10;

interface PageProps {
    dossiers: Dossier[];
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
    const { dossiers = [], auth } = usePage<PageProps>().props;
    const { flash } = usePage<SharedData>().props;

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'nom'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    useEffect(() => {
        if (flash.message != null) {
            toast.info(flash.message);
        }
        if (flash.success) {
            toast.success(flash.success);
        }
        if (flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const filteredDossiers = useMemo(() => {
        const filtered = filterDossiers(dossiers, {
            search,
            status: statusFilter,
            dateDebut,
            dateFin,
            selectedLetter
        });

        return sortDossiers(filtered, sortBy, sortOrder);
    }, [dossiers, search, dateDebut, dateFin, selectedLetter, sortBy, sortOrder, statusFilter]);

    const clearFilters = () => {
        setSearch('');
        setDateDebut('');
        setDateFin('');
        setSelectedLetter(null);
        setSortBy('date');
        setSortOrder('desc');
        setStatusFilter('all');
    };

    const toggleExpand = (id: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const hasActiveFilters = search || dateDebut || dateFin || selectedLetter || statusFilter !== 'all';
    const showAlphabet = sortBy === 'nom';

    // Pagination
    const totalPages = Math.ceil(filteredDossiers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentDossiers = filteredDossiers.slice(startIndex, endIndex);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dossiers" />
            <Toaster position="top-right" />

            <div className="container mx-auto p-6 max-w-[1600px] space-y-6">
                {/* ✅ HEADER MODERNE - Style Generate.tsx */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                            <Folder className="h-8 w-8 text-blue-600" />
                            Liste des dossiers
                        </h1>
                        <p className="text-muted-foreground">
                            {filteredDossiers.length} dossier{filteredDossiers.length > 1 ? 's' : ''} enregistré{filteredDossiers.length > 1 ? 's' : ''}
                        </p>
                    </div>

                    <Button size="lg" asChild className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
                        <Link href={route('dossiers.create')}>
                            <FolderPlus className="h-5 w-5" />
                            Créer un dossier
                        </Link>
                    </Button>
                </div>

                {/* ✅ BARRE DE RECHERCHE ET FILTRES */}
                <Card className="border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20 border-b">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                {/* Barre de recherche */}
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Rechercher un dossier..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10 h-11 border-2"
                                    />
                                </div>

                                {/* Bouton filtres */}
                                <Popover open={showFilters} onOpenChange={setShowFilters}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="relative gap-2 h-11 shadow-sm">
                                            <SlidersHorizontal className="h-4 w-4" />
                                            Filtres
                                            {hasActiveFilters && (
                                                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs" variant="destructive">
                                                    !
                                                </Badge>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80" align="end">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-semibold mb-3">Filtres avancés</h4>
                                            </div>

                                            {/* Filtre par statut */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Statut du dossier</Label>
                                                <Select value={statusFilter} onValueChange={(value: 'all' | 'open' | 'closed') => setStatusFilter(value)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Tous les dossiers</SelectItem>
                                                        <SelectItem value="open">Dossiers ouverts</SelectItem>
                                                        <SelectItem value="closed">Dossiers fermés</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Filtres par date */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Période de descente</Label>
                                                <div className="grid gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            type="date"
                                                            value={dateDebut}
                                                            onChange={(e) => setDateDebut(e.target.value)}
                                                            placeholder="Date début"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            type="date"
                                                            value={dateFin}
                                                            onChange={(e) => setDateFin(e.target.value)}
                                                            placeholder="Date fin"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tri */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Trier par</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Select value={sortBy} onValueChange={(value: 'date' | 'nom') => setSortBy(value)}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="date">Date</SelectItem>
                                                            <SelectItem value="nom">Nom</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="asc">↑ A-Z / Ancien</SelectItem>
                                                            <SelectItem value="desc">↓ Z-A / Récent</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {hasActiveFilters && (
                                                <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                                                    <X className="mr-2 h-4 w-4" />
                                                    Réinitialiser les filtres
                                                </Button>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Filtres actifs */}
                            {hasActiveFilters && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {search && (
                                        <Badge variant="secondary" className="gap-1">
                                            Recherche: {search}
                                            <X className="h-3 w-3 cursor-pointer" onClick={() => setSearch('')} />
                                        </Badge>
                                    )}
                                    {dateDebut && (
                                        <Badge variant="secondary" className="gap-1">
                                            Début: {dateDebut}
                                            <X className="h-3 w-3 cursor-pointer" onClick={() => setDateDebut('')} />
                                        </Badge>
                                    )}
                                    {dateFin && (
                                        <Badge variant="secondary" className="gap-1">
                                            Fin: {dateFin}
                                            <X className="h-3 w-3 cursor-pointer" onClick={() => setDateFin('')} />
                                        </Badge>
                                    )}
                                    {selectedLetter && (
                                        <Badge variant="secondary" className="gap-1">
                                            Lettre: {selectedLetter}
                                            <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedLetter(null)} />
                                        </Badge>
                                    )}
                                    {statusFilter !== 'all' && (
                                        <Badge variant="secondary" className="gap-1">
                                            Statut: {statusFilter === 'open' ? 'Ouvert' : 'Fermé'}
                                            <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </div>
                </Card>

                <div className="flex gap-3">
                    {/* Liste des dossiers */}
                    <div className="flex-1 space-y-3">
                        {currentDossiers.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Folder className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                                    <p className="text-lg font-medium text-muted-foreground mb-2">
                                        {hasActiveFilters
                                            ? 'Aucun dossier ne correspond à vos critères'
                                            : 'Aucun dossier enregistré'}
                                    </p>
                                    {hasActiveFilters ? (
                                        <Button variant="link" onClick={clearFilters} className="mt-2">
                                            Réinitialiser les filtres
                                        </Button>
                                    ) : (
                                        <Button asChild className="mt-4">
                                            <Link href={route('dossiers.create')}>
                                                <FolderPlus className="mr-2 h-4 w-4" />
                                                Créer votre premier dossier
                                            </Link>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                {currentDossiers.map((dossier) => {
                                    const isExpanded = expandedRows.has(dossier.id);
                                    
                                    const permissions = calculateDossierPermissions(dossier, {
                                        role: auth.user.role,
                                        id_district: auth.user.id_district
                                    });

                                    const documentTooltip = getDisabledDocumentButtonTooltip(dossier, {
                                        role: auth.user.role,
                                        id_district: auth.user.id_district
                                    });

                                    return (
                                        <Card key={dossier.id} className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => toggleExpand(dossier.id)}
                                                        className="h-8 w-8 shrink-0"
                                                    >
                                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </Button>

                                                    <div
                                                        className="flex-1 cursor-pointer flex items-center gap-3"
                                                        onClick={() => router.visit(route('dossiers.show', dossier.id))}
                                                    >
                                                        <h3 className="font-semibold text-lg truncate max-w-[250px]">
                                                            {dossier.nom_dossier}
                                                        </h3>

                                                        {dossier.is_closed ? (
                                                            <Badge variant="outline" className="flex items-center gap-1 bg-orange-100 text-orange-700 border-orange-300">
                                                                <LockIcon className="h-3 w-3" />
                                                                Fermé
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-300">
                                                                <LockOpen className="h-3 w-3" />
                                                                Ouvert
                                                            </Badge>
                                                        )}

                                                        {dossier.proprietes?.some((p) => p.is_archived === true) && (
                                                            <Badge variant="outline" className="flex items-center gap-1">
                                                                <Archive className="h-3 w-3" />
                                                                Propriétés acquises
                                                            </Badge>
                                                        )}

                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-muted-foreground truncate max-w-[200px]">
                                                            {dossier.commune}
                                                        </span>

                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-muted-foreground whitespace-nowrap text-sm">
                                                            {dossier.demandeurs_count} demandeur(s), {dossier.proprietes_count} propriété(s)
                                                        </span>
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                                                <EllipsisVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route("dossiers.show", dossier.id)} className="flex items-center">
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Voir Détails
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            
                                                            {permissions.canEdit && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route("dossiers.edit", dossier.id)} className="flex items-center">
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        Modifier
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuLabel>Ajouter</DropdownMenuLabel>
                                                            
                                                            {!dossier.is_closed && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route("nouveau-lot.create", dossier.id)} className="flex items-center">
                                                                        <LandPlot className="mr-2 h-4 w-4" />
                                                                        Nouvelles entrées
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            
                                                            <DropdownMenuSeparator />
                                                            
                                                            {permissions.canGenerateDocuments ? (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('documents.generate', dossier.id)}>
                                                                        <FileOutput className="mr-2 h-4 w-4" />
                                                                        Générer documents
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="relative flex cursor-not-allowed select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none opacity-50">
                                                                                <FileOutput className="mr-2 h-4 w-4" />
                                                                                Générer documents
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="max-w-xs">
                                                                            <p>{documentTooltip}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                            
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('demandes.resume', dossier.id)}>
                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                    Résumé des demandes
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {isExpanded && (
                                                    <div className="mt-4 pt-4 border-t ml-11 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-muted-foreground">Type Commune</p>
                                                            <p className="font-medium">{dossier.type_commune}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-muted-foreground">Circonscription</p>
                                                            <p className="font-medium">{dossier.circonscription}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-muted-foreground">Fokontany</p>
                                                            <p className="font-medium">{dossier.fokontany}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-muted-foreground">Date descente</p>
                                                            <p className="font-medium text-sm">
                                                                {new Date(dossier.date_descente_debut).toLocaleDateString('fr-FR')} – 
                                                                {new Date(dossier.date_descente_fin).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-muted-foreground">Date d'ouverture</p>
                                                            <p className="font-medium">
                                                                {new Date(dossier.date_ouverture).toLocaleDateString('fr-FR')}
                                                            </p>
                                                        </div>
                                                        
                                                        {dossier.is_closed && dossier.date_fermeture && (
                                                            <div className="space-y-1">
                                                                <p className="text-xs text-muted-foreground">Date de fermeture</p>
                                                                <p className="font-medium text-orange-700">
                                                                    {new Date(dossier.date_fermeture).toLocaleDateString('fr-FR')}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-6">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                if (
                                                    page === 1 ||
                                                    page === totalPages ||
                                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <Button
                                                            key={page}
                                                            variant={currentPage === page ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setCurrentPage(page)}
                                                        >
                                                            {page}
                                                        </Button>
                                                    );
                                                } else if (
                                                    page === currentPage - 2 ||
                                                    page === currentPage + 2
                                                ) {
                                                    return <span key={page} className="px-1">...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Navigation alphabétique */}
                    {showAlphabet && (
                        <div className="hidden lg:block">
                            <div className="sticky top-20">
                                <Card className="w-12 border-0 shadow-lg">
                                    <CardContent className="p-2">
                                        <div className="flex flex-col items-center gap-1">
                                            {alphabet.map((letter) => {
                                                const hasResults = dossiers.some(d =>
                                                    d.nom_dossier.toUpperCase().startsWith(letter)
                                                );
                                                return (
                                                    <button
                                                        key={letter}
                                                        onClick={() =>
                                                            setSelectedLetter(selectedLetter === letter ? null : letter)
                                                        }
                                                        className={`
                                                            w-8 h-8 rounded text-xs font-medium transition-colors
                                                            ${selectedLetter === letter
                                                                ? 'bg-primary text-primary-foreground'
                                                                : hasResults
                                                                ? 'hover:bg-muted text-foreground'
                                                                : 'text-muted-foreground/30 cursor-default'
                                                            }
                                                        `}
                                                        disabled={!hasResults}
                                                    >
                                                        {letter}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}