// pages/proprietes/components/SmartDeleteProprieteDialog.tsx
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
import { 
    AlertTriangle, 
    Archive, 
    Users, 
    Trash2, 
    Info, 
    Loader2,
    CheckCircle2,
    XCircle,
    Home,
    Lock
} from 'lucide-react';
import type { Propriete } from '@/types';

interface DemandeurInfo {
    id: number;
    nom_complet: string;
    cin: string;
    ordre: number;
}

interface DeleteCheckResponse {
    can_delete: boolean;
    is_archived: boolean;
    is_dossier_closed: boolean;
    total_demandeurs_actifs: number;
    total_demandeurs_archives: number;
    demandeurs_actifs: DemandeurInfo[];
    demandeurs_archives: DemandeurInfo[];
    propriete: {
        id: number;
        lot: string;
        titre: string;
        contenance: number;
    };
}

interface SmartDeleteProprieteDialogProps {
    propriete: Propriete | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SmartDeleteProprieteDialog({
    propriete,
    open,
    onOpenChange
}: SmartDeleteProprieteDialogProps) {
    const [loading, setLoading] = useState(false);
    const [checkData, setCheckData] = useState<DeleteCheckResponse | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (open && propriete) {
            loadCheckData();
        } else {
            setCheckData(null);
        }
    }, [open, propriete]);

    const loadCheckData = async () => {
        if (!propriete) return;
        
        setLoading(true);
        try {
            const response = await fetch(
                route('api.propriete.check-delete', { id: propriete.id })
            );
            const data = await response.json();
            setCheckData(data);
        } catch (error) {
            console.error('Erreur chargement vérification:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!propriete || !checkData?.can_delete || isDeleting) return;

        setIsDeleting(true);
        router.delete(route('proprietes.destroy', propriete.id), {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                onOpenChange(false);
            }
        });
    };

    if (!propriete) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-xl">
                        {checkData?.can_delete ? (
                            <>
                                <Trash2 className="h-6 w-6 text-red-500" />
                                Supprimer la propriété
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="h-6 w-6 text-amber-500" />
                                Suppression impossible
                            </>
                        )}
                    </AlertDialogTitle>
                </AlertDialogHeader>

                {loading ? (
                    <div className="py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Vérification des associations...</p>
                    </div>
                ) : checkData ? (
                    <div className="space-y-6 py-4">
                        {/* ✅ INFORMATIONS PROPRIÉTÉ */}
                        <Card className="p-4 bg-muted/30">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Home className="h-5 w-5 text-muted-foreground" />
                                        <p className="font-semibold text-lg">Lot {checkData.propriete.lot}</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        {checkData.propriete.titre && (
                                            <p>Titre : TNº{checkData.propriete.titre}</p>
                                        )}
                                        {checkData.propriete.contenance && (
                                            <p>Contenance : {new Intl.NumberFormat('fr-FR').format(checkData.propriete.contenance)} m²</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {checkData.is_archived && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                            <Archive className="mr-1 h-3 w-3" />
                                            Acquise
                                        </Badge>
                                    )}
                                    {checkData.is_dossier_closed && (
                                        <Badge variant="outline" className="bg-gray-100 text-gray-700">
                                            <Lock className="mr-1 h-3 w-3" />
                                            Dossier fermé
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* ✅ STATISTIQUES */}
                        <div className="grid grid-cols-2 gap-3">
                            <Card className="p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Demandeurs actifs</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {checkData.total_demandeurs_actifs}
                                </p>
                            </Card>
                            <Card className="p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Demandeurs archivés</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {checkData.total_demandeurs_archives}
                                </p>
                            </Card>
                        </div>

                        {/* ✅ RÉSULTAT DE LA VÉRIFICATION */}
                        {checkData.can_delete ? (
                            // ✅ SUPPRESSION AUTORISÉE
                            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-700 dark:text-blue-300">
                                        <p className="font-medium mb-2">
                                            ✅ Cette propriété peut être supprimée
                                        </p>
                                        <p>
                                            Aucun demandeur n'est associé à cette propriété.
                                        </p>
                                        <p className="text-red-600 dark:text-red-400 font-medium mt-2">
                                            ⚠️ Cette action est irréversible !
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            // ❌ SUPPRESSION BLOQUÉE
                            <>
                                <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                                    <div className="flex items-start gap-3">
                                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-red-700 dark:text-red-300">
                                            <p className="font-medium mb-1">
                                                ❌ Impossible de supprimer cette propriété
                                            </p>
                                            <p>
                                                Des demandeurs sont associés à cette propriété.
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                {/* ✅ LISTE DES DEMANDEURS ACTIFS */}
                                {checkData.demandeurs_actifs.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Demandeurs actifs ({checkData.demandeurs_actifs.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {checkData.demandeurs_actifs.map((dem) => (
                                                <Card 
                                                    key={dem.id}
                                                    className="p-3 bg-muted"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-sm">
                                                                    {dem.nom_complet}
                                                                </p>
                                                                {dem.ordre === 1 ? (
                                                                    <Badge variant="default" className="text-xs">
                                                                        Principal
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Consort #{dem.ordre}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground font-mono">
                                                                CIN: {dem.cin}
                                                            </p>
                                                        </div>
                                                        <Badge variant="default" className="text-xs">
                                                            Actif
                                                        </Badge>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ✅ LISTE DES DEMANDEURS ARCHIVÉS */}
                                {checkData.demandeurs_archives.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm flex items-center gap-2">
                                            <Archive className="h-4 w-4" />
                                            Demandeurs ayant acquis ({checkData.demandeurs_archives.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {checkData.demandeurs_archives.map((dem) => (
                                                <Card 
                                                    key={dem.id}
                                                    className="p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-sm">
                                                                    {dem.nom_complet}
                                                                </p>
                                                                {dem.ordre === 1 && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        Principal
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground font-mono">
                                                                CIN: {dem.cin}
                                                            </p>
                                                        </div>
                                                        <Badge 
                                                            variant="outline" 
                                                            className="text-xs bg-green-100 text-green-700 border-green-300"
                                                        >
                                                            <Archive className="mr-1 h-3 w-3" />
                                                            Acquis
                                                        </Badge>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ✅ ACTIONS SUGGÉRÉES */}
                                <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                    <div className="flex items-start gap-2">
                                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-700 dark:text-blue-300">
                                            <p className="font-medium mb-1">💡 Actions possibles :</p>
                                            <ol className="list-decimal list-inside space-y-1">
                                                {checkData.demandeurs_actifs.length > 0 && (
                                                    <li>Dissociez d'abord tous les demandeurs actifs</li>
                                                )}
                                                {checkData.demandeurs_archives.length > 0 && (
                                                    <li>Les acquisitions archivées doivent être conservées pour l'historique</li>
                                                )}
                                                {checkData.demandeurs_actifs.length === 0 && checkData.demandeurs_archives.length > 0 && (
                                                    <li>Utilisez "Archiver (acquise)" si la propriété est définitivement acquise</li>
                                                )}
                                            </ol>
                                        </div>
                                    </div>
                                </Card>
                            </>
                        )}
                    </div>
                ) : null}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Annuler
                    </AlertDialogCancel>
                    {checkData?.can_delete && (
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Suppression...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer la propriété
                                </>
                            )}
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}