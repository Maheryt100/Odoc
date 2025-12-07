// pages/demandes/ResumeDossier.tsx - VERSION REDESIGNÉE AVEC EXPAND
import { useState, useEffect } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    FileText, Search, ArrowLeft, FileOutput, Filter, X,
    Users, MapPin, DollarSign, Info, Sparkles,
    AlertCircle, Lock, LockOpen, Home, Eye,
    MoreVertical, Archive, ArchiveRestore, Loader2,
    ChevronDown, ChevronUp, Briefcase, Phone
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Dossier, BreadcrumbItem } from '@/types';
import DemandeDetailDialog from '@/pages/demandes/components/DemandeDetailDialog';
import DemandeurDetailDialog from '@/pages/demandeurs/components/DemandeurDetailDialog';
import ProprieteDetailDialog from '@/pages/proprietes/components/ProprieteDetailDialog';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Composant StatCard réutilisable
interface StatCardProps {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    colorScheme: 'blue' | 'green' | 'orange' | 'purple';
    description?: string;
    percentage?: number;
}

const StatCard = ({ title, value, icon: Icon, colorScheme, description, percentage }: StatCardProps) => {
    const colorClasses = {
        blue: {
            gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
            textGradient: 'from-blue-600 to-indigo-600',
            progressBar: 'from-blue-500 to-indigo-500',
        },
        green: {
            gradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
            iconBg: 'bg-green-100 dark:bg-green-900/30',
            iconColor: 'text-green-600 dark:text-green-400',
            textGradient: 'from-green-600 to-emerald-600',
            progressBar: 'from-green-500 to-emerald-500',
        },
        orange: {
            gradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
            iconBg: 'bg-orange-100 dark:bg-orange-900/30',
            iconColor: 'text-orange-600 dark:text-orange-400',
            textGradient: 'from-orange-600 to-amber-600',
            progressBar: 'from-orange-500 to-amber-500',
        },
        purple: {
            gradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
            iconBg: 'bg-purple-100 dark:bg-purple-900/30',
            iconColor: 'text-purple-600 dark:text-purple-400',
            textGradient: 'from-purple-600 to-pink-600',
            progressBar: 'from-purple-500 to-pink-500',
        },
    };

    const colors = colorClasses[colorScheme];

    return (
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className={`bg-gradient-to-br ${colors.gradient}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <div className={`p-2 ${colors.iconBg} rounded-lg`}>
                        <Icon className={`h-4 w-4 ${colors.iconColor}`} />
                    </div>
                </CardHeader>
            </div>
            <CardContent className="pt-4">
                <div className={`text-3xl font-bold bg-gradient-to-r ${colors.textGradient} bg-clip-text text-transparent`}>
                    {value}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-2">{description}</p>
                )}
                {percentage !== undefined && (
                    <>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                            <div
                                className={`bg-gradient-to-r ${colors.progressBar} h-2 rounded-full transition-all duration-500 ease-out`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {percentage}% du total
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

interface ResumeDossierProps {
    dossier: Dossier;
    documents: {
        data: Array<{
            id: number;
            id_propriete: number;
            propriete: any;
            demandeurs: any[];
            total_prix: number;
            status: string;
            status_consort: boolean;
            nombre_demandeurs: number;
        }>;
        current_page: number;
        last_page: number;
        total: number;
    };
}

export default function ResumeDossier({ dossier, documents }: ResumeDossierProps) {
    const { flash } = usePage<{ flash?: { message?: string; success?: string; error?: string } }>().props;
    
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archive'>('all');
    const [isSearching, setIsSearching] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    
    // Dialogs
    const [selectedDemande, setSelectedDemande] = useState<any>(null);
    const [showDemandeDetail, setShowDemandeDetail] = useState(false);
    const [selectedDemandeur, setSelectedDemandeur] = useState<any>(null);
    const [showDemandeurDetail, setShowDemandeurDetail] = useState(false);
    const [selectedPropriete, setSelectedPropriete] = useState<any>(null);
    const [showProprieteDetail, setShowProprieteDetail] = useState(false);
    
    // Archive dialogs
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
    const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false);
    const [selectedDemandeForAction, setSelectedDemandeForAction] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Toast notifications
    useEffect(() => {
        if (flash?.message) toast.info(flash.message);
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.message, flash?.success, flash?.error]);

    // Debounced search
    useEffect(() => {
        setIsSearching(true);
        const timer = setTimeout(() => {
            setIsSearching(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, filterStatus]);

    // Toggle expand
    const toggleExpand = (id: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // Stats calculations
    const activeCount = documents.data.filter(d => d.status === 'active').length;
    const archivedCount = documents.data.filter(d => d.status === 'archive').length;
    const activePercentage = documents.total > 0 ? Math.round((activeCount / documents.total) * 100) : 0;

    // Filtrage
    const filteredDocuments = documents.data.filter(doc => {
        const matchesSearch = search === '' || 
            doc.propriete?.lot.toLowerCase().includes(search.toLowerCase()) ||
            doc.demandeurs.some(d => 
                d.demandeur?.nom_demandeur?.toLowerCase().includes(search.toLowerCase()) ||
                d.demandeur?.cin?.includes(search)
            );
        
        const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    // Handlers
    const handleSelectDemande = (doc: any) => {
        const demandeData = {
            ...doc.demandeurs[0],
            propriete: doc.propriete,
            nombre_demandeurs: doc.nombre_demandeurs,
            demandeurs: doc.demandeurs
        };
        setSelectedDemande(demandeData);
        setShowDemandeDetail(true);
    };

    const handleArchiveClick = (doc: any) => {
        setSelectedDemandeForAction(doc);
        setArchiveDialogOpen(true);
    };

    const handleUnarchiveClick = (doc: any) => {
        setSelectedDemandeForAction(doc);
        setUnarchiveDialogOpen(true);
    };

    const confirmArchive = () => {
        if (!selectedDemandeForAction || isProcessing) return;
        setIsProcessing(true);
        router.post(route('proprietes.archive'), 
            { id: selectedDemandeForAction.id_propriete },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Propriété archivée avec succès');
                    setArchiveDialogOpen(false);
                    setSelectedDemandeForAction(null);
                },
                onError: (errors) => toast.error(Object.values(errors).join('\n')),
                onFinish: () => setIsProcessing(false)
            }
        );
    };

    const confirmUnarchive = () => {
        if (!selectedDemandeForAction || isProcessing) return;
        setIsProcessing(true);
        router.post(route('proprietes.unarchive'), 
            { id: selectedDemandeForAction.id_propriete },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Propriété désarchivée avec succès');
                    setUnarchiveDialogOpen(false);
                    setSelectedDemandeForAction(null);
                },
                onError: (errors) => toast.error(Object.values(errors).join('\n')),
                onFinish: () => setIsProcessing(false)
            }
        );
    };

    const handleClearFilters = () => {
        setSearch('');
        setFilterStatus('all');
    };

    const hasActiveFilters = search !== '' || filterStatus !== 'all';

    const formatNomComplet = (demandeur: any): string => {
        if (!demandeur) return 'N/A';
        return [demandeur.titre_demandeur, demandeur.nom_demandeur, demandeur.prenom_demandeur]
            .filter(Boolean).join(' ');
    };

    const isDemandeurIncomplete = (demandeur: any): boolean => {
        if (!demandeur) return true;
        const champsRequis = ['date_naissance', 'lieu_naissance', 'date_delivrance', 
                             'lieu_delivrance', 'domiciliation', 'occupation', 'nom_mere'];
        return champsRequis.some(champ => !demandeur[champ]);
    };

    const isProprieteIncomplete = (prop: any): boolean => {
        return !prop?.titre || !prop?.contenance || !prop?.proprietaire || 
               !prop?.nature || !prop?.vocation || !prop?.situation;
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Résumé', href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Résumé - ${dossier.nom_dossier}`} />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-[1600px] space-y-6">
                {/* En-tête moderne */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Résumé des demandes
                            </h1>
                            <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                                <span className="font-medium">{dossier.nom_dossier}</span>
                                <span className="text-gray-400">•</span>
                                <span>{dossier.commune}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('dossiers.show', dossier.id)}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Retour
                            </Link>
                        </Button>
                        <Button size="sm" asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                            <Link href={route('documents.generate', dossier.id)}>
                                <FileOutput className="h-4 w-4 mr-2" />
                                Générer documents
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Statistiques */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Demandes"
                        value={documents.total}
                        icon={FileText}
                        colorScheme="blue"
                        description={`${activeCount} actives`}
                        percentage={activePercentage}
                    />
                    <StatCard
                        title="Demandes Actives"
                        value={activeCount}
                        icon={LockOpen}
                        colorScheme="green"
                        description="En cours"
                    />
                    <StatCard
                        title="Demandes Archivées"
                        value={archivedCount}
                        icon={Lock}
                        colorScheme="orange"
                        description="Propriétés acquises"
                    />
                    <StatCard
                        title="Propriétés"
                        value={dossier.proprietes_count || 0}
                        icon={MapPin}
                        colorScheme="purple"
                        description="Lots disponibles"
                    />
                </div>

                {/* Alerte info */}
                <Alert className="border-0 shadow-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <AlertDescription className="text-blue-900 dark:text-blue-100">
                            <p className="font-semibold flex items-center gap-2 mb-1">
                                <Sparkles className="h-4 w-4" />
                                Vue consolidée
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Retrouvez ici toutes les demandes du dossier. Cliquez sur une ligne pour voir les détails ou utilisez le bouton expand pour plus d'informations.
                            </p>
                        </AlertDescription>
                    </div>
                </Alert>

                {/* Filtres */}
                <Card className="border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-b">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Filter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Filtres de recherche</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {filteredDocuments.length} demande{filteredDocuments.length > 1 ? 's' : ''} trouvée{filteredDocuments.length > 1 ? 's' : ''}
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
                        </CardHeader>
                    </div>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Rechercher par lot, nom ou CIN..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10 h-11 border-2 focus:border-purple-500 transition-colors"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant={filterStatus === 'all' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setFilterStatus('all')}
                                        className="h-11"
                                    >
                                        Toutes
                                    </Button>
                                    <Button
                                        variant={filterStatus === 'active' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setFilterStatus('active')}
                                        className="h-11"
                                    >
                                        Actives
                                    </Button>
                                    <Button
                                        variant={filterStatus === 'archive' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setFilterStatus('archive')}
                                        className="h-11"
                                    >
                                        Archivées
                                    </Button>
                                </div>
                            </div>
                            {hasActiveFilters && (
                                <div className="flex justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClearFilters}
                                        className="gap-2"
                                    >
                                        <X className="h-4 w-4" />
                                        Réinitialiser
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Liste des demandes */}
                <Card className="border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20 p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Liste des demandes</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {filteredDocuments.length} demande{filteredDocuments.length > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-6 space-y-3">
                        {filteredDocuments.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="max-w-md mx-auto space-y-4">
                                    <div className="p-4 bg-muted/30 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                                        <Search className="h-10 w-10 text-muted-foreground opacity-50" />
                                    </div>
                                    <h3 className="text-xl font-semibold">Aucune demande trouvée</h3>
                                    <p className="text-muted-foreground">
                                        {hasActiveFilters 
                                            ? 'Essayez d\'ajuster vos critères de recherche'
                                            : 'Aucune demande n\'a encore été enregistrée'
                                        }
                                    </p>
                                </div>
                            </div>
                        ) : (
                            filteredDocuments.map((doc) => {
                                const isExpanded = expandedRows.has(doc.id);
                                const isArchived = doc.status === 'archive';
                                const hasValidDemandeurs = doc.demandeurs?.length > 0;
                                const premierDemandeur = hasValidDemandeurs ? doc.demandeurs[0]?.demandeur : null;
                                const hasIncompleteData = hasValidDemandeurs
                                    ? doc.demandeurs.some(d => isDemandeurIncomplete(d.demandeur)) || isProprieteIncomplete(doc.propriete)
                                    : isProprieteIncomplete(doc.propriete);

                                const cardClassName = isArchived 
                                    ? 'bg-gray-50 dark:bg-gray-900/50' 
                                    : hasIncompleteData 
                                        ? 'bg-red-50 dark:bg-red-950/20'
                                        : 'hover:shadow-md';

                                return (
                                    <Card key={doc.id} className={`${cardClassName} transition-all duration-200`}>
                                        <CardContent className="p-5">
                                            <div className="flex items-start gap-3">
                                                {/* Bouton expand/collapse */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => toggleExpand(doc.id)}
                                                    className="h-9 w-9 shrink-0 hover:bg-primary/10"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-5 w-5" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5" />
                                                    )}
                                                </Button>

                                                {/* Contenu principal - cliquable */}
                                                <div 
                                                    className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center cursor-pointer"
                                                    onClick={() => handleSelectDemande(doc)}
                                                >
                                                    {/* Propriété */}
                                                    <div className="md:col-span-3 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Home className="h-4 w-4 text-green-600" />
                                                            <p className="text-xs text-muted-foreground font-medium">Propriété</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-lg">Lot {doc.propriete?.lot || 'N/A'}</p>
                                                            {isProprieteIncomplete(doc.propriete) && (
                                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {doc.propriete?.titre ? `TNº${doc.propriete.titre}` : 'Sans titre'}
                                                        </p>
                                                    </div>

                                                    {/* Demandeurs */}
                                                    <div className="md:col-span-4 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4 text-blue-600" />
                                                            <p className="text-xs text-muted-foreground font-medium">
                                                                Demandeur{doc.nombre_demandeurs > 1 ? 's' : ''}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {premierDemandeur ? (
                                                                <>
                                                                    <p className="font-medium">
                                                                        {formatNomComplet(premierDemandeur)}
                                                                    </p>
                                                                    {hasIncompleteData && (
                                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <p className="font-medium text-muted-foreground italic">
                                                                    Aucun demandeur
                                                                </p>
                                                            )}
                                                        </div>
                                                        {doc.nombre_demandeurs > 1 && (
                                                            <Badge variant="secondary" className="text-xs w-fit">
                                                                +{doc.nombre_demandeurs - 1} autre{doc.nombre_demandeurs > 2 ? 's' : ''}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Prix */}
                                                    <div className="md:col-span-3 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <DollarSign className="h-4 w-4 text-purple-600" />
                                                            <p className="text-xs text-muted-foreground font-medium">Prix total</p>
                                                        </div>
                                                        <p className="font-bold text-primary text-lg">
                                                            {doc.total_prix 
                                                                ? new Intl.NumberFormat('fr-FR').format(doc.total_prix) 
                                                                : '0'
                                                            } Ar
                                                        </p>
                                                    </div>

                                                    {/* Statut */}
                                                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                                                        {isArchived ? (
                                                            <Badge variant="outline" className="bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                                <Lock className="h-3 w-3 mr-1" />
                                                                Archivée
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                <LockOpen className="h-3 w-3 mr-1" />
                                                                Active
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Menu Actions */}
                                                <DropdownMenu modal={false}>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-9 w-9 shrink-0"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleSelectDemande(doc)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Voir détails
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {isArchived ? (
                                                            <DropdownMenuItem 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUnarchiveClick(doc);
                                                                }}
                                                                className="text-blue-600"
                                                            >
                                                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                                                Désarchiver
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleArchiveClick(doc);
                                                                }}
                                                                className="text-orange-600"
                                                            >
                                                                <Archive className="mr-2 h-4 w-4" />
                                                                Archiver
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* Section expandée */}
                                            {isExpanded && (
                                                <div className="mt-4 pt-4 border-t space-y-4">
                                                    {/* Détails Propriété */}
                                                    <div className="bg-muted/30 rounded-lg p-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Home className="h-5 w-5 text-green-600" />
                                                            <p className="font-semibold text-green-900 dark:text-green-100">
                                                                Détails de la propriété
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                            <div>
                                                                <span className="font-medium text-muted-foreground">Contenance:</span>
                                                                <p className="font-semibold">
                                                                    {doc.propriete?.contenance 
                                                                        ? `${new Intl.NumberFormat('fr-FR').format(doc.propriete.contenance)} m²` 
                                                                        : 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-muted-foreground">Nature:</span>
                                                                <p className="font-semibold">{doc.propriete?.nature || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-muted-foreground">Vocation:</span>
                                                                <p className="font-semibold">{doc.propriete?.vocation || '-'}</p>
                                                            </div>
                                                            {doc.propriete?.proprietaire && (
                                                                <div className="col-span-2 md:col-span-3">
                                                                    <span className="font-medium text-muted-foreground">Propriétaire:</span>
                                                                    <p className="font-semibold">{doc.propriete.proprietaire}</p>
                                                                </div>
                                                            )}
                                                            {doc.propriete?.situation && (
                                                                <div className="col-span-2 md:col-span-3">
                                                                    <span className="font-medium text-muted-foreground">Situation:</span>
                                                                    <p className="font-semibold">{doc.propriete.situation}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Liste complète des demandeurs */}
                                                    {hasValidDemandeurs ? (
                                                        <div className="bg-muted/30 rounded-lg p-4">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Users className="h-5 w-5 text-blue-600" />
                                                                <p className="font-semibold text-blue-900 dark:text-blue-100">
                                                                    {doc.nombre_demandeurs > 1 
                                                                        ? `Liste complète des demandeurs (${doc.nombre_demandeurs})`
                                                                        : 'Informations du demandeur'
                                                                    }
                                                                </p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {doc.demandeurs.map((dem: any, idx: number) => {
                                                                    if (!dem?.demandeur) return null;
                                                                    return (
                                                                        <div 
                                                                            key={dem.id || idx}
                                                                            className="flex items-center justify-between p-3 bg-background rounded-lg text-sm"
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                                                    {idx + 1}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-medium">
                                                                                        {formatNomComplet(dem.demandeur)}
                                                                                    </p>
                                                                                    <p className="text-xs text-muted-foreground font-mono">
                                                                                        CIN: {dem.demandeur?.cin || 'N/A'}
                                                                                    </p>
                                                                                    {dem.demandeur?.domiciliation && (
                                                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                                                            <MapPin className="h-3 w-3" />
                                                                                            {dem.demandeur.domiciliation}
                                                                                        </div>
                                                                                    )}
                                                                                    {dem.demandeur?.telephone && (
                                                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                                                            <Phone className="h-3 w-3" />
                                                                                            {dem.demandeur.telephone}
                                                                                        </div>
                                                                                    )}
                                                                                    {dem.demandeur?.occupation && (
                                                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                                                            <Briefcase className="h-3 w-3" />
                                                                                            {dem.demandeur.occupation}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {isDemandeurIncomplete(dem.demandeur) && (
                                                                                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-300 dark:bg-red-950/20 dark:text-red-400">
                                                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                                                    Incomplet
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-muted/30 rounded-lg p-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <AlertCircle className="h-5 w-5 text-orange-600" />
                                                                <p className="font-semibold text-orange-900 dark:text-orange-100">
                                                                    Aucun demandeur associé
                                                                </p>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                Cette propriété n'a pas encore de demandeur lié.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modals */}
            <DemandeDetailDialog
                demande={selectedDemande}
                open={showDemandeDetail}
                onOpenChange={setShowDemandeDetail}
                onSelectDemandeur={(dem) => {
                    setSelectedDemandeur(dem);
                    setShowDemandeurDetail(true);
                }}
                onSelectPropriete={(prop) => {
                    setSelectedPropriete(prop);
                    setShowProprieteDetail(true);
                }}
            />

            <DemandeurDetailDialog
                demandeur={selectedDemandeur}
                open={showDemandeurDetail}
                onOpenChange={setShowDemandeurDetail}
                proprietes={dossier.proprietes || []}
                onSelectPropriete={(prop) => {
                    setSelectedPropriete(prop);
                    setShowProprieteDetail(true);
                }}
                dossierId={dossier.id}
                dossierClosed={dossier.is_closed}
            />

            <ProprieteDetailDialog
                propriete={selectedPropriete}
                open={showProprieteDetail}
                onOpenChange={setShowProprieteDetail}
                onSelectDemandeur={(dem) => {
                    setSelectedDemandeur(dem);
                    setShowDemandeurDetail(true);
                }}
                dossierClosed={dossier.is_closed}
            />

            {/* Archive Dialog */}
            <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                            Archiver la propriété
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <div className="space-y-3">
                                <p>Voulez-vous vraiment archiver cette propriété ?</p>
                                <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                                    <p><strong>Lot:</strong> {selectedDemandeForAction?.propriete?.lot}</p>
                                    <p><strong>Demandeurs:</strong> {selectedDemandeForAction?.nombre_demandeurs} personne(s)</p>
                                </div>
                                <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md">
                                    <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-orange-800 dark:text-orange-200">
                                        Toutes les demandes associées seront archivées
                                    </p>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmArchive}
                            disabled={isProcessing}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isProcessing ? 'Archivage...' : 'Archiver'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Unarchive Dialog */}
            <AlertDialog open={unarchiveDialogOpen} onOpenChange={setUnarchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ArchiveRestore className="h-5 w-5 text-blue-600" />
                            Désarchiver la propriété
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <div className="space-y-3">
                                <p>Voulez-vous vraiment désarchiver cette propriété ?</p>
                                <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                                    <p><strong>Lot:</strong> {selectedDemandeForAction?.propriete?.lot}</p>
                                    <p><strong>Demandeurs:</strong> {selectedDemandeForAction?.nombre_demandeurs} personne(s)</p>
                                </div>
                                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                    <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        Toutes les demandes associées seront réactivées
                                    </p>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmUnarchive}
                            disabled={isProcessing}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isProcessing ? 'Désarchivage...' : 'Désarchiver'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}