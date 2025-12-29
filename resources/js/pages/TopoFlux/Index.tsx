// resources/js/pages/TopoFlux/Index.tsx
import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
    CheckCircle, 
    XCircle, 
    Clock, 
    AlertTriangle, 
    RefreshCw,
    Filter,
    Search,
    Loader2
} from 'lucide-react';

import ImportCard from './components/ImportCard';
import ImportDetailsDialog from './components/ImportDetailsDialog';
import RejectDialog from './components/RejectDialog';
import { TopoImport, TopoFluxStats } from './types';

import TopoSimulator from './components/TopoSimulator';

// Dans le JSX principal, après les cards d'import
<TopoSimulator />


interface TopoFluxIndexProps {
    fastapi_url: string;
    jwt_token: string;
}

export default function TopoFluxIndex() {
    const { auth, fastapi_url, jwt_token } = usePage<any>().props;
    
    // États
    const [imports, setImports] = useState<TopoImport[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<TopoFluxStats>({ 
        total: 0, 
        pending: 0, 
        validated: 0, 
        rejected: 0,
        with_warnings: 0
    });
    
    // Filtres
    const [statusFilter, setStatusFilter] = useState<'pending' | 'validated' | 'rejected'>('pending');
    const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Dialogues
    const [selectedImport, setSelectedImport] = useState<TopoImport | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [rejectDialog, setRejectDialog] = useState({
        open: false,
        importId: null as number | null,
        reason: ''
    });

    // Chargement des données
    useEffect(() => {
        loadImports();
        loadStats();
    }, [statusFilter, entityTypeFilter]);

    const loadImports = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                status: statusFilter,
                ...(entityTypeFilter !== 'all' && { entity_type: entityTypeFilter }),
                limit: '50'
            });

            const response = await fetch(
                `${fastapi_url}/api/v1/staging/?${params}`,
                {
                    headers: {
                        'Authorization': `Bearer ${jwt_token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Erreur chargement imports');
            }

            const data = await response.json();
            setImports(data);
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Impossible de charger les imports');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await fetch(
                `${fastapi_url}/api/v1/staging/stats`,
                {
                    headers: {
                        'Authorization': `Bearer ${jwt_token}`
                    }
                }
            );
            const data = await response.json();
            setStats({
                total: data.total || 0,
                pending: data.pending || 0,
                validated: data.validated || 0,
                rejected: data.rejected || 0,
                with_warnings: data.with_warnings || 0
            });
        } catch (error) {
            console.error('Erreur stats:', error);
        }
    };

    // Actions
    const handleValidate = (importItem: TopoImport) => {
        if (importItem.entity_type === 'propriete') {
            const route_name = importItem.action_suggested === 'update' && importItem.matched_entity_id
                ? 'proprietes.edit'
                : 'nouveau-lot.create';
            
            const route_params = importItem.action_suggested === 'update' && importItem.matched_entity_id
                ? { id_dossier: importItem.dossier_id, id_propriete: importItem.matched_entity_id }
                : { id: importItem.dossier_id };

            router.visit(window.route(route_name, route_params), {
                data: {
                    topo_import_id: importItem.id,
                    topo_data: importItem.raw_data,
                    match_info: importItem.matched_entity_details
                }
            });
        } else if (importItem.entity_type === 'demandeur') {
            const route_name = importItem.action_suggested === 'update' && importItem.matched_entity_id
                ? 'demandeurs.edit'
                : 'demandeurs.create';
            
            const route_params = importItem.action_suggested === 'update' && importItem.matched_entity_id
                ? { id_dossier: importItem.dossier_id, id_demandeur: importItem.matched_entity_id }
                : { id: importItem.dossier_id };

            router.visit(window.route(route_name, route_params), {
                data: {
                    topo_import_id: importItem.id,
                    topo_data: importItem.raw_data,
                    match_info: importItem.matched_entity_details
                }
            });
        }
    };

    const openRejectDialog = (importId: number) => {
        setRejectDialog({
            open: true,
            importId,
            reason: ''
        });
    };

    const handleReject = async () => {
        if (!rejectDialog.importId || rejectDialog.reason.length < 10) {
            toast.error('Motif de rejet requis (minimum 10 caractères)');
            return;
        }

        try {
            const response = await fetch(
                `${fastapi_url}/api/v1/staging/${rejectDialog.importId}/validate`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${jwt_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'reject',
                        rejection_reason: rejectDialog.reason
                    })
                }
            );

            if (!response.ok) throw new Error('Erreur rejet');

            toast.success('Import rejeté');
            setRejectDialog({ open: false, importId: null, reason: '' });
            loadImports();
            loadStats();
        } catch (error) {
            toast.error('Erreur lors du rejet');
        }
    };

    const openDetails = (importItem: TopoImport) => {
        setSelectedImport(importItem);
        setShowDetailsDialog(true);
    };

    // Filtrage
    const filteredImports = imports.filter(imp => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return (
            imp.dossier_nom.toLowerCase().includes(query) ||
            imp.dossier_numero_ouverture.toString().includes(query) ||
            imp.district_nom.toLowerCase().includes(query) ||
            (imp.entity_type === 'propriete' && imp.raw_data.lot?.toLowerCase().includes(query)) ||
            (imp.entity_type === 'demandeur' && imp.raw_data.nom_demandeur?.toLowerCase().includes(query))
        );
    });

    const canValidate = auth.user.role === 'admin_district' || auth.user.role === 'user_district';

    return (
        <AppLayout>
            <Head title="Flux TopoManager" />

            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <RefreshCw className="h-8 w-8 text-primary" />
                            Flux TopoManager
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Validation des imports terrain
                        </p>
                    </div>
                    <Button onClick={() => { loadImports(); loadStats(); }} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualiser
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-orange-200 bg-orange-50 cursor-pointer hover:shadow-md transition" 
                          onClick={() => setStatusFilter('pending')}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                En attente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-green-200 bg-green-50 cursor-pointer hover:shadow-md transition" 
                          onClick={() => setStatusFilter('validated')}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Validés
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.validated}</div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-red-200 bg-red-50 cursor-pointer hover:shadow-md transition" 
                          onClick={() => setStatusFilter('rejected')}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                Rejetés
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-200 bg-amber-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Warnings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">{stats.with_warnings}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtres */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtres
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Recherche */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Rechercher (dossier, lot, nom...)"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Type d'entité */}
                            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les types</SelectItem>
                                    <SelectItem value="propriete">Propriétés</SelectItem>
                                    <SelectItem value="demandeur">Demandeurs</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Statut */}
                            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-auto">
                                <TabsList>
                                    <TabsTrigger value="pending">En attente</TabsTrigger>
                                    <TabsTrigger value="validated">Validés</TabsTrigger>
                                    <TabsTrigger value="rejected">Rejetés</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>

                {/* Liste des imports */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredImports.length === 0 ? (
                    <Alert>
                        <AlertDescription>Aucun import à afficher</AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-4">
                        {filteredImports.map(imp => (
                            <ImportCard
                                key={imp.id}
                                import={imp}
                                canValidate={canValidate && statusFilter === 'pending'}
                                onValidate={() => handleValidate(imp)}
                                onReject={() => openRejectDialog(imp.id)}
                                onViewDetails={() => openDetails(imp)}
                            />
                        ))}
                    </div>
                )}

                {/* Dialogues */}
                <RejectDialog
                    open={rejectDialog.open}
                    reason={rejectDialog.reason}
                    onReasonChange={(reason) => setRejectDialog({ ...rejectDialog, reason })}
                    onConfirm={handleReject}
                    onCancel={() => setRejectDialog({ open: false, importId: null, reason: '' })}
                />

                <ImportDetailsDialog
                    import={selectedImport}
                    open={showDetailsDialog}
                    onOpenChange={setShowDetailsDialog}
                />
            </div>
        </AppLayout>
    );
}