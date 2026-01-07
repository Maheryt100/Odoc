// pages/dossiers/components/SmartDeleteDossierDialog.tsx
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
    Trash2, 
    Loader2,
    CheckCircle2,
    XCircle,
    Folder,
    Users,
    LandPlot,
    Paperclip,
    Info
} from 'lucide-react';
import type { Dossier } from '@/types';

interface DeleteCheckResponse {
    can_delete: boolean;
    is_closed: boolean;
    total_demandeurs: number;
    total_proprietes: number;
    total_pieces_jointes: number;
    dossier: {
        id: number;
        nom_dossier: string;
        numero_ouverture: number | string;
        commune: string;
    };
}

interface SmartDeleteDossierDialogProps {
    dossier: Dossier | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SmartDeleteDossierDialog({
    dossier,
    open,
    onOpenChange
}: SmartDeleteDossierDialogProps) {
    const [loading, setLoading] = useState(false);
    const [checkData, setCheckData] = useState<DeleteCheckResponse | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (open && dossier) {
            loadCheckData();
        } else {
            setCheckData(null);
        }
    }, [open, dossier]);

    const loadCheckData = async () => {
        if (!dossier) return;
        
        setLoading(true);
        try {
            const response = await fetch(
                route('api.dossier.check-delete', { id: dossier.id })
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
        if (!dossier || !checkData?.can_delete || isDeleting) return;

        setIsDeleting(true);
        router.delete(route('dossiers.destroy', dossier.id), {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                onOpenChange(false);
            }
        });
    };

    if (!dossier) return null;

    const displayNumero = typeof checkData?.dossier.numero_ouverture === 'number'
        ? `N° ${checkData.dossier.numero_ouverture}`
        : checkData?.dossier.numero_ouverture || 'N/A';

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-xl">
                        {checkData?.can_delete ? (
                            <>
                                <Trash2 className="h-6 w-6 text-red-500" />
                                Supprimer le dossier
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
                        <p className="text-sm text-muted-foreground">Vérification du contenu du dossier...</p>
                    </div>
                ) : checkData ? (
                    <div className="space-y-6 py-4">
                        {/* INFORMATIONS DOSSIER */}
                        <Card className="p-4 bg-muted/30">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Folder className="h-5 w-5 text-muted-foreground" />
                                        <p className="font-semibold text-lg">{checkData.dossier.nom_dossier}</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p className="font-mono">{displayNumero}</p>
                                        <p>{checkData.dossier.commune}</p>
                                    </div>
                                </div>
                                {checkData.is_closed && (
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                        Fermé
                                    </Badge>
                                )}
                            </div>
                        </Card>

                        {/* STATISTIQUES DU CONTENU */}
                        <div className="grid grid-cols-3 gap-3">
                            <Card className={`p-3 text-center ${
                                checkData.total_demandeurs > 0 
                                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                                    : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                            }`}>
                                <Users className={`h-5 w-5 mx-auto mb-1 ${
                                    checkData.total_demandeurs > 0 ? 'text-red-600' : 'text-green-600'
                                }`} />
                                <p className="text-xs text-muted-foreground mb-1">Demandeurs</p>
                                <p className={`text-2xl font-bold ${
                                    checkData.total_demandeurs > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                    {checkData.total_demandeurs}
                                </p>
                            </Card>

                            <Card className={`p-3 text-center ${
                                checkData.total_proprietes > 0 
                                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                                    : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                            }`}>
                                <LandPlot className={`h-5 w-5 mx-auto mb-1 ${
                                    checkData.total_proprietes > 0 ? 'text-red-600' : 'text-green-600'
                                }`} />
                                <p className="text-xs text-muted-foreground mb-1">Propriétés</p>
                                <p className={`text-2xl font-bold ${
                                    checkData.total_proprietes > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                    {checkData.total_proprietes}
                                </p>
                            </Card>

                            <Card className={`p-3 text-center ${
                                checkData.total_pieces_jointes > 0 
                                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                                    : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                            }`}>
                                <Paperclip className={`h-5 w-5 mx-auto mb-1 ${
                                    checkData.total_pieces_jointes > 0 ? 'text-red-600' : 'text-green-600'
                                }`} />
                                <p className="text-xs text-muted-foreground mb-1">Pièces jointes</p>
                                <p className={`text-2xl font-bold ${
                                    checkData.total_pieces_jointes > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                    {checkData.total_pieces_jointes}
                                </p>
                            </Card>
                        </div>

                        {/* RÉSULTAT DE LA VÉRIFICATION */}
                        {checkData.can_delete ? (
                            // SUPPRESSION AUTORISÉE
                            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-700 dark:text-blue-300">
                                        <p className="font-medium mb-2">
                                            Ce dossier peut être supprimé
                                        </p>
                                        <p>
                                            Le dossier est vide (aucun demandeur, propriété ou pièce jointe).
                                        </p>
                                        <p className="text-red-600 dark:text-red-400 font-medium mt-2">
                                            Cette action est irréversible !
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            // SUPPRESSION BLOQUÉE
                            <>
                                <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                                    <div className="flex items-start gap-3">
                                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-red-700 dark:text-red-300">
                                            <p className="font-medium mb-1">
                                                Impossible de supprimer ce dossier
                                            </p>
                                            <p>
                                                Le dossier contient des données qui doivent être supprimées d'abord.
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                {/*  DÉTAILS DES BLOCAGES */}
                                <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-amber-700 dark:text-amber-300">
                                            <p className="font-medium mb-2">🔒 Éléments bloquants :</p>
                                            <ul className="space-y-1">
                                                {checkData.total_demandeurs > 0 && (
                                                    <li className="flex items-center gap-2">
                                                        <Users className="h-4 w-4" />
                                                        <span>{checkData.total_demandeurs} demandeur{checkData.total_demandeurs > 1 ? 's' : ''}</span>
                                                    </li>
                                                )}
                                                {checkData.total_proprietes > 0 && (
                                                    <li className="flex items-center gap-2">
                                                        <LandPlot className="h-4 w-4" />
                                                        <span>{checkData.total_proprietes} propriété{checkData.total_proprietes > 1 ? 's' : ''}</span>
                                                    </li>
                                                )}
                                                {checkData.total_pieces_jointes > 0 && (
                                                    <li className="flex items-center gap-2">
                                                        <Paperclip className="h-4 w-4" />
                                                        <span>{checkData.total_pieces_jointes} pièce{checkData.total_pieces_jointes > 1 ? 's' : ''} jointe{checkData.total_pieces_jointes > 1 ? 's' : ''}</span>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </Card>

                                {/* ACTIONS SUGGÉRÉES */}
                                <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                    <div className="flex items-start gap-2">
                                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-700 dark:text-blue-300">
                                            <p className="font-medium mb-1">💡 Actions nécessaires :</p>
                                            <ol className="list-decimal list-inside space-y-1">
                                                {checkData.total_demandeurs > 0 && (
                                                    <li>Supprimer ou dissocier tous les demandeurs</li>
                                                )}
                                                {checkData.total_proprietes > 0 && (
                                                    <li>Supprimer toutes les propriétés</li>
                                                )}
                                                {checkData.total_pieces_jointes > 0 && (
                                                    <li>Supprimer toutes les pièces jointes</li>
                                                )}
                                                <li>Une fois vide, le dossier pourra être supprimé</li>
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
                                    Supprimer le dossier
                                </>
                            )}
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}