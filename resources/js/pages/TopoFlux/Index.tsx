// resources/js/pages/TopoFlux/Index.tsx
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Search, Filter, RefreshCw, AlertTriangle, WifiOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { BreadcrumbItem, PageProps } from '@/types';

// Import des types TopoFlux centralisés
import type {
  TopoImport,
  TopoStats,
  TopoFluxIndexProps,
} from './types';

// Components
import ImportCard from './components/ImportCard';
import StatsCards from './components/StatsCards';
import RejectDialog from './components/RejectDialog';


export default function Index() {
    const { imports, stats, filters, canValidate, fastapiAvailable } =
    usePage<PageProps & TopoFluxIndexProps>().props;
    const { flash } = usePage<{ flash: any }>().props;
    
    // États locaux
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(filters.status);
    const [typeFilter, setTypeFilter] = useState(filters.entity_type || 'all');
    const [processing, setProcessing] = useState(false);
    
    const [filePreviewOpen, setFilePreviewOpen] = useState(false);
    const [filePreviewImport, setFilePreviewImport] = useState<TopoImport | null>(null);

    //  Cache local des imports pour utilisation même si FastAPI down
    const [cachedImports, setCachedImports] = useState<TopoImport[]>([]);
    
    // Dialogue de rejet
    const [rejectDialog, setRejectDialog] = useState<{
        open: boolean;
        import: TopoImport | null;
        reason: string;
    }>({ open: false, import: null, reason: '' });
    
    // Notifications flash avec type spécifique
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
    if (flash?.warning) toast.warning(flash.warning); //  Support des warnings
    
    // Mise en cache des imports quand disponibles
    useEffect(() => {
        if (imports && imports.length > 0) {
            setCachedImports(imports);
            
            // Sauvegarder dans sessionStorage pour persistance
            try {
                sessionStorage.setItem('topo_imports_cache', JSON.stringify({
                    imports,
                    stats,
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.warn('Impossible de sauvegarder dans sessionStorage:', e);
            }
        } else if (fastapiAvailable === false && cachedImports.length === 0) {
            // Essayer de récupérer depuis sessionStorage
            try {
                const cached = sessionStorage.getItem('topo_imports_cache');
                if (cached) {
                    const data = JSON.parse(cached);
                    // Utiliser le cache s'il a moins de 30 minutes
                    if (Date.now() - data.timestamp < 30 * 60 * 1000) {
                        setCachedImports(data.imports);
                    }
                }
            } catch (e) {
                console.warn('Impossible de récupérer depuis sessionStorage:', e);
            }
        }
    }, [imports, fastapiAvailable]);
    
    // Utiliser les imports disponibles (live ou cache)
    const availableImports = imports.length > 0 ? imports : cachedImports;
    const hasDataToDisplay = availableImports.length > 0;
    
    // Filtrage local
    const filteredImports = useMemo(() => {
        return availableImports.filter(imp => {
            if (!searchQuery) return true;
            
            const query = searchQuery.toLowerCase();
            return (
                imp.batch_id.toLowerCase().includes(query) ||
                imp.dossier_nom.toLowerCase().includes(query) ||
                imp.topo_user_name.toLowerCase().includes(query) ||
                (imp.entity_type === 'demandeur' && 
                    (imp.raw_data.nom_demandeur?.toLowerCase().includes(query) ||
                     imp.raw_data.cin?.includes(query))) ||
                (imp.entity_type === 'propriete' && 
                    imp.raw_data.lot?.toLowerCase().includes(query))
            );
        });
    }, [availableImports, searchQuery]);
    
    // Handlers
    const handleApplyFilters = () => {
        router.get(route('topo-flux.index'), {
            status: statusFilter,
            entity_type: typeFilter === 'all' ? undefined : typeFilter
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };
    
    const handleRefresh = () => {
        router.reload({ 
            only: ['imports', 'stats', 'fastapiAvailable'],
            // preserveScroll: true // Optionnel : conserver la position de scroll
        });
    };
    
    const handleImport = (imp: TopoImport) => {
        if (imp.status !== 'pending' && imp.status !== 'archived') {
            toast.error('Cet import ne peut pas être traité');
            return;
        }
        
        // Cacher l'import dans la session pour utilisation offline
        try {
            sessionStorage.setItem(`topo_import_${imp.id}`, JSON.stringify(imp));
        } catch (e) {
            console.warn('Cache session impossible:', e);
        }
        
        setProcessing(true);
        
        router.post(
            route('topo-flux.import', imp.id),
            {},
            {
                preserveScroll: true,
                onError: (errors) => {
                    toast.error('Erreur', {
                        description: Object.values(errors).join(', ')
                    });
                },
                onFinish: () => setProcessing(false)
            }
        );
    };
    
    const handleArchive = (imp: TopoImport) => {
        setProcessing(true);
        
        router.post(
            route('topo-flux.archive', imp.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Import archivé'),
                onError: (errors) => {
                    toast.error('Erreur', {
                        description: Object.values(errors).join(', ')
                    });
                },
                onFinish: () => setProcessing(false)
            }
        );
    };
    
    const handleUnarchive = (imp: TopoImport) => {
        setProcessing(true);
        
        router.post(
            route('topo-flux.unarchive', imp.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Import restauré'),
                onError: (errors) => {
                    toast.error('Erreur', {
                        description: Object.values(errors).join(', ')
                    });
                },
                onFinish: () => setProcessing(false)
            }
        );
    };
    
    const handleReject = (imp: TopoImport) => {
        setRejectDialog({ open: true, import: imp, reason: '' });
    };
    
    const handleConfirmReject = () => {
        if (!rejectDialog.import || !rejectDialog.reason) return;
        
        setProcessing(true);
        
        router.post(
            route('topo-flux.reject', rejectDialog.import.id),
            { rejection_reason: rejectDialog.reason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Import rejeté');
                    setRejectDialog({ open: false, import: null, reason: '' });
                },
                onError: (errors) => {
                    toast.error('Erreur', {
                        description: Object.values(errors).join(', ')
                    });
                },
                onFinish: () => setProcessing(false)
            }
        );
    };
    
    const handleViewDetails = (imp: TopoImport) => {
        router.visit(route('topo-flux.show', imp.id));
    };
    
    const handlePreviewFiles = (imp: TopoImport) => {
        setFilePreviewImport(imp);
        setFilePreviewOpen(true);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'TopoFlux', href: '#' },
        { title: 'Imports terrain', href: '#' }
    ];
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="TopoFlux - Imports Terrain" />
            
            <div className="container mx-auto p-6 max-w-[1600px] space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            TopoFlux
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gestion des imports terrain
                        </p>
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={handleRefresh}
                    >
                        <RefreshCw className="h-4 w-4" />
                        Actualiser
                    </Button>
                </div>
                
                {/* ALERTE CONTEXTUELLE */}
                {fastapiAvailable === false && (
                    <Alert className={hasDataToDisplay ? "border-orange-200 bg-orange-50" : "border-red-200 bg-red-50"}>
                        <WifiOff className="h-4 w-4" />
                        <AlertTitle>Service TopoFlux temporairement indisponible</AlertTitle>
                        <AlertDescription className="flex items-center justify-between">
                            <span>
                                {hasDataToDisplay ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 inline mr-1 text-green-600" />
                                        Les imports affichés restent utilisables. 
                                        Seules les actions de changement de statut (archiver, rejeter) sont temporairement indisponibles.
                                    </>
                                ) : (
                                    "Impossible de récupérer les imports. Veuillez réessayer dans quelques instants."
                                )}
                            </span>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleRefresh}
                                className="ml-4"
                            >
                                Réessayer
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}
                
                {/* Info cache si données en cache */}
                {fastapiAvailable === false && hasDataToDisplay && cachedImports.length > 0 && (
                    <Alert className="border-blue-200 bg-blue-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Affichage des données en cache. Vous pouvez toujours importer ces données dans le système.
                        </AlertDescription>
                    </Alert>
                )}
                
                {/* Stats */}
                <StatsCards stats={stats} />
                
                {/* Filtres */}
                <Card className="p-4">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher par lot, CIN, batch..."
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">En attente</SelectItem>
                                    <SelectItem value="archived">Archivés</SelectItem>
                                    <SelectItem value="validated">Validés</SelectItem>
                                    <SelectItem value="rejected">Rejetés</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tous les types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les types</SelectItem>
                                    <SelectItem value="demandeur">Demandeurs</SelectItem>
                                    <SelectItem value="propriete">Propriétés</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearchQuery('');
                                setTypeFilter('all');
                            }}
                        >
                            Réinitialiser
                        </Button>
                        <Button 
                            size="sm" 
                            onClick={handleApplyFilters} 
                            className="gap-2"
                            disabled={fastapiAvailable === false}
                        >
                            <Filter className="h-4 w-4" />
                            Appliquer
                        </Button>
                    </div>
                </Card>
                
                {/* Résultats */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {filteredImports.length} import{filteredImports.length > 1 ? 's' : ''} trouvé{filteredImports.length > 1 ? 's' : ''}
                        {fastapiAvailable === false && hasDataToDisplay && (
                            <span className="ml-2 text-blue-600">(données en cache)</span>
                        )}
                    </p>
                </div>
                
                {/* Liste */}
                {filteredImports.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                            {fastapiAvailable === false && !hasDataToDisplay ? (
                                <>
                                    <WifiOff className="h-12 w-12 text-orange-500" />
                                    <div>
                                        <p className="font-medium text-lg">Service indisponible</p>
                                        <p className="text-muted-foreground mt-1">
                                            Impossible de récupérer les imports
                                        </p>
                                    </div>
                                    <Button onClick={handleRefresh} className="gap-2">
                                        <RefreshCw className="h-4 w-4" />
                                        Réessayer
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium text-lg">Aucun import trouvé</p>
                                        <p className="text-muted-foreground mt-1">
                                            Essayez de modifier vos filtres ou critères de recherche
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredImports.map((imp) => (
                            <ImportCard
                                key={imp.id}
                                import={imp}
                                canValidate={canValidate}
                                onImport={() => handleImport(imp)}
                                onReject={() => handleReject(imp)}
                                onArchive={() => handleArchive(imp)}
                                onUnarchive={() => handleUnarchive(imp)}
                                onViewDetails={() => handleViewDetails(imp)}
                                onPreviewFiles={() => handlePreviewFiles(imp)}
                            />
                        ))}
                    </div>
                )}
            </div>
            
            {/* Dialogue de rejet */}
            <RejectDialog
                open={rejectDialog.open}
                reason={rejectDialog.reason}
                onReasonChange={(reason) => setRejectDialog(prev => ({ ...prev, reason }))}
                onConfirm={handleConfirmReject}
                onCancel={() => setRejectDialog({ open: false, import: null, reason: '' })}
                processing={processing}
            />
        </AppLayout>
    );
}