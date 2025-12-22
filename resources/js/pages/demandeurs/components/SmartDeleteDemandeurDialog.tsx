// pages/demandeurs/components/SmartDeleteDemandeurDialog.tsx - VERSION SÉCURISÉE
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
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
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
    AlertTriangle, 
    Loader2,
    CheckCircle2,
    XCircle,
    UserMinus,
    Trash2,
    Info
} from 'lucide-react';

interface DeleteMode {
    type: 'remove' | 'delete';
    label: string;
    description: string;
    icon: any;
    color: string;
}

interface DossierAssociation {
    id: number;
    nom: string;
    is_closed: boolean;
    lots_actifs: string[];
    lots_archives: string[];
}

interface DeleteCheckResponse {
    can_delete_completely: boolean;
    can_remove_from_dossier: boolean;
    total_associations: number;
    total_actives: number;
    total_archivees: number;
    dossiers: DossierAssociation[];
    demandeur: {
        id: number;
        nom_complet: string;
        cin: string;
    };
}

interface RemoveCheckResponse {
    can_remove: boolean;
    lots_actifs: string[];
    lots_archives: string[];
    total_proprietes: number;
    demandeur: {
        id: number;
        nom_complet: string;
        cin: string;
    };
}

interface SmartDeleteDemandeurDialogProps {
    demandeur: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dossierId: number;
}

export default function SmartDeleteDemandeurDialog({
    demandeur,
    open,
    onOpenChange,
    dossierId
}: SmartDeleteDemandeurDialogProps) {
    const [loading, setLoading] = useState(false);
    const [checkData, setCheckData] = useState<DeleteCheckResponse | null>(null);
    const [removeCheckData, setRemoveCheckData] = useState<RemoveCheckResponse | null>(null);
    const [selectedMode, setSelectedMode] = useState<'remove' | 'delete' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const modes: Record<'remove' | 'delete', DeleteMode> = {
        remove: {
            type: 'remove',
            label: 'Retirer du dossier actuel',
            description: 'Le demandeur sera retiré de ce dossier uniquement',
            icon: UserMinus,
            color: 'blue'
        },
        delete: {
            type: 'delete',
            label: 'Supprimer définitivement',
            description: 'Le demandeur sera supprimé de tous les dossiers',
            icon: Trash2,
            color: 'red'
        }
    };

    useEffect(() => {
        if (open && demandeur) {
            loadCheckData();
        } else {
            resetState();
        }
    }, [open, demandeur]);

    const resetState = () => {
        setCheckData(null);
        setRemoveCheckData(null);
        setSelectedMode(null);
        setError(null);
    };

    const loadCheckData = async () => {
        if (!demandeur) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // ✅ CORRECTION 1 : Vérification suppression complète
            const deleteUrl = window.route('api.demandeur.check-delete', { id: demandeur.id });
            
            const deleteResponse = await fetch(deleteUrl, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
            
            if (!deleteResponse.ok) {
                throw new Error(`Erreur HTTP ${deleteResponse.status}`);
            }
            
            const deleteData = await deleteResponse.json();
            
            // ✅ Validation des données reçues
            const safeDeleteData: DeleteCheckResponse = {
                can_delete_completely: deleteData.can_delete_completely || false,
                can_remove_from_dossier: deleteData.can_remove_from_dossier || false,
                total_associations: deleteData.total_associations || 0,
                total_actives: deleteData.total_actives || 0,
                total_archivees: deleteData.total_archivees || 0,
                dossiers: Array.isArray(deleteData.dossiers) ? deleteData.dossiers.map((d: any) => ({
                    id: d.id,
                    nom: d.nom || 'Inconnu',
                    is_closed: d.is_closed || false,
                    lots_actifs: Array.isArray(d.lots_actifs) ? d.lots_actifs : [],
                    lots_archives: Array.isArray(d.lots_archives) ? d.lots_archives : []
                })) : [],
                demandeur: {
                    id: deleteData.demandeur?.id || demandeur.id,
                    nom_complet: deleteData.demandeur?.nom_complet || 'Inconnu',
                    cin: deleteData.demandeur?.cin || ''
                }
            };
            
            setCheckData(safeDeleteData);

            // ✅ CORRECTION 2 : Vérification retrait du dossier actuel
            const removeUrl = window.route('api.demandeur.check-remove', { 
                id: demandeur.id 
            }) + `?dossierId=${dossierId}`;
            
            const removeResponse = await fetch(removeUrl, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
            
            if (!removeResponse.ok) {
                throw new Error('Erreur lors de la vérification de retrait');
            }
            
            const removeData = await removeResponse.json();
            
            const safeRemoveData: RemoveCheckResponse = {
                can_remove: removeData.can_remove || false,
                lots_actifs: Array.isArray(removeData.lots_actifs) ? removeData.lots_actifs : [],
                lots_archives: Array.isArray(removeData.lots_archives) ? removeData.lots_archives : [],
                total_proprietes: removeData.total_proprietes || 0,
                demandeur: {
                    id: removeData.demandeur?.id || demandeur.id,
                    nom_complet: removeData.demandeur?.nom_complet || 'Inconnu',
                    cin: removeData.demandeur?.cin || ''
                }
            };
            
            setRemoveCheckData(safeRemoveData);

        } catch (error: any) {
            console.error('Erreur chargement vérification:', error);
            setError(error.message || 'Erreur lors de la vérification');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!demandeur || !selectedMode || isProcessing) return;

        setIsProcessing(true);

        if (selectedMode === 'remove') {
            router.delete(
                route('demandeurs.destroy', {
                    id_dossier: dossierId,
                    id_demandeur: demandeur.id
                }),
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setIsProcessing(false);
                        onOpenChange(false);
                    }
                }
            );
        } else {
            router.delete(
                route('demandeurs.destroyDefinitive', demandeur.id),
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setIsProcessing(false);
                        onOpenChange(false);
                    }
                }
            );
        }
    };

    if (!demandeur) return null;

    const nomComplet = checkData?.demandeur.nom_complet || 
        `${demandeur.titre_demandeur || ''} ${demandeur.nom_demandeur || ''} ${demandeur.prenom_demandeur || ''}`.trim() ||
        'Demandeur';

    const totalDossiers = checkData?.dossiers?.length || 0;
    const totalActives = checkData?.total_actives || 0;
    const totalArchivees = checkData?.total_archivees || 0;
    const totalAssociations = checkData?.total_associations || 0;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-xl">
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                        Supprimer un demandeur
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Sélectionnez le type de suppression pour <strong>{nomComplet}</strong>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {loading ? (
                    <div className="py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Vérification des associations...</p>
                    </div>
                ) : error ? (
                    <div className="py-8 text-center">
                        <XCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                        <p className="text-sm text-red-600">{error}</p>
                        <button 
                            onClick={loadCheckData}
                            className="mt-4 text-sm text-blue-600 hover:underline"
                        >
                            Réessayer
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* INFORMATIONS DEMANDEUR */}
                        <Card className="p-4 bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">{nomComplet}</p>
                                    <p className="text-sm text-muted-foreground font-mono">
                                        CIN: {demandeur.cin || 'N/A'}
                                    </p>
                                </div>
                                {totalAssociations > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                        {totalAssociations} association(s)
                                    </Badge>
                                )}
                            </div>
                        </Card>

                        {/* STATISTIQUES */}
                        <div className="grid grid-cols-3 gap-3">
                            <Card className="p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Dossiers</p>
                                <p className="text-2xl font-bold">{totalDossiers}</p>
                            </Card>
                            <Card className="p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Actives</p>
                                <p className="text-2xl font-bold text-blue-600">{totalActives}</p>
                            </Card>
                            <Card className="p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Archivées</p>
                                <p className="text-2xl font-bold text-green-600">{totalArchivees}</p>
                            </Card>
                        </div>

                        <Separator />

                        {/* CHOIX DU MODE */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm">Choisissez une action :</h4>

                            {/* MODE 1: RETIRER */}
                            <button
                                onClick={() => setSelectedMode('remove')}
                                disabled={!removeCheckData?.can_remove}
                                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                                    selectedMode === 'remove'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                        : 'border-gray-200 hover:border-blue-300'
                                } ${
                                    !removeCheckData?.can_remove 
                                        ? 'opacity-50 cursor-not-allowed' 
                                        : 'cursor-pointer'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${
                                        selectedMode === 'remove' 
                                            ? 'bg-blue-100 dark:bg-blue-900' 
                                            : 'bg-gray-100 dark:bg-gray-800'
                                    }`}>
                                        <UserMinus className={`h-5 w-5 ${
                                            selectedMode === 'remove' 
                                                ? 'text-blue-600' 
                                                : 'text-gray-600'
                                        }`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold">Retirer du dossier actuel</p>
                                            {removeCheckData?.can_remove ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Le demandeur sera retiré de ce dossier uniquement
                                        </p>
                                        
                                        {removeCheckData && !removeCheckData.can_remove && (
                                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                                                <p className="text-xs text-red-700 dark:text-red-400 font-medium mb-1">
                                                    ❌ Impossible de retirer :
                                                </p>
                                                {removeCheckData.lots_actifs.length > 0 && (
                                                    <p className="text-xs text-red-600 dark:text-red-400">
                                                        • {removeCheckData.lots_actifs.length} propriété(s) active(s) : 
                                                        Lot(s) {removeCheckData.lots_actifs.join(', ')}
                                                    </p>
                                                )}
                                                {removeCheckData.lots_archives.length > 0 && (
                                                    <p className="text-xs text-red-600 dark:text-red-400">
                                                        • {removeCheckData.lots_archives.length} propriété(s) archivée(s) : 
                                                        Lot(s) {removeCheckData.lots_archives.join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>

                            {/* MODE 2: SUPPRIMER */}
                            <button
                                onClick={() => setSelectedMode('delete')}
                                disabled={!checkData?.can_delete_completely}
                                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                                    selectedMode === 'delete'
                                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                                        : 'border-gray-200 hover:border-red-300'
                                } ${
                                    !checkData?.can_delete_completely 
                                        ? 'opacity-50 cursor-not-allowed' 
                                        : 'cursor-pointer'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${
                                        selectedMode === 'delete' 
                                            ? 'bg-red-100 dark:bg-red-900' 
                                            : 'bg-gray-100 dark:bg-gray-800'
                                    }`}>
                                        <Trash2 className={`h-5 w-5 ${
                                            selectedMode === 'delete' 
                                                ? 'text-red-600' 
                                                : 'text-gray-600'
                                        }`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold text-red-600">Supprimer définitivement</p>
                                            {checkData?.can_delete_completely ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Suppression définitive de la base de données
                                        </p>
                                        <p className="text-xs text-red-600 font-medium">
                                            ⚠️ Cette action est irréversible !
                                        </p>

                                        {checkData && !checkData.can_delete_completely && checkData.dossiers.length > 0 && (
                                            <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                                                <p className="text-xs text-red-700 dark:text-red-400 font-medium mb-2">
                                                    ❌ Impossible de supprimer définitivement :
                                                </p>
                                                <div className="space-y-2">
                                                    {checkData.dossiers.map((dossier, idx) => (
                                                        <div key={idx} className="text-xs">
                                                            <p className="font-medium text-red-600">
                                                                📁 {dossier.nom}
                                                            </p>
                                                            {dossier.lots_actifs.length > 0 && (
                                                                <p className="text-red-600 ml-3">
                                                                    • {dossier.lots_actifs.length} actif(s) : 
                                                                    Lot(s) {dossier.lots_actifs.join(', ')}
                                                                </p>
                                                            )}
                                                            {dossier.lots_archives.length > 0 && (
                                                                <p className="text-red-600 ml-3">
                                                                    • {dossier.lots_archives.length} archivé(s) : 
                                                                    Lot(s) {dossier.lots_archives.join(', ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* ACTIONS SUGGÉRÉES */}
                        {checkData && !checkData.can_delete_completely && (
                            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2">
                                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-700 dark:text-blue-300">
                                        <p className="font-medium mb-1">💡 Actions possibles :</p>
                                        <ol className="list-decimal list-inside space-y-1">
                                            <li>Dissociez d'abord le demandeur de toutes les propriétés</li>
                                            <li>Ou utilisez "Retirer du dossier" pour un retrait partiel</li>
                                        </ol>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isProcessing}>
                        Annuler
                    </AlertDialogCancel>
                    {selectedMode && !error && (
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={isProcessing || loading}
                            className={selectedMode === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Traitement...
                                </>
                            ) : (
                                <>
                                    {selectedMode === 'remove' ? (
                                        <>
                                            <UserMinus className="mr-2 h-4 w-4" />
                                            Retirer du dossier
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Supprimer définitivement
                                        </>
                                    )}
                                </>
                            )}
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}