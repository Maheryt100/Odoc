// pages/proprietes/components/SmartDeleteProprieteDialog.tsx
// ✅ INTERFACE ATTENDUE

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
    LandPlot,
    Users,
    Info
} from 'lucide-react';
import type { Propriete } from '@/types';

interface DeleteCheckResponse {
    can_delete: boolean;
    is_archived: boolean;
    total_demandeurs_actifs: number;
    total_demandes: number;
    propriete: {
        id: number;
        lot: string;
        titre: string | null;
        contenance: number | null;
    };
}

// ✅ INTERFACE CORRECTE - doit accepter ces props exactement
interface SmartDeleteProprieteDialogProps {
    propriete: Propriete | null;  // ✅ Singulier, nullable
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dossierId: number;  // ✅ Requis pour la route de suppression
}

export default function SmartDeleteProprieteDialog({
    propriete,
    open,
    onOpenChange,
    dossierId
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
                        <p className="text-sm text-muted-foreground">Vérification des demandeurs associés...</p>
                    </div>
                ) : checkData ? (
                    <div className="space-y-6 py-4">
                        {/* INFORMATIONS PROPRIÉTÉ */}
                        <Card className="p-4 bg-muted/30">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <LandPlot className="h-5 w-5 text-muted-foreground" />
                                        <p className="font-semibold text-lg">Lot {checkData.propriete.lot}</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        {checkData.propriete.titre && (
                                            <p className="font-mono">Titre N° {checkData.propriete.titre}</p>
                                        )}
                                        {checkData.propriete.contenance && (
                                            <p>{checkData.propriete.contenance.toLocaleString('fr-FR')} m²</p>
                                        )}
                                    </div>
                                </div>
                                {checkData.is_archived && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                        Acquise
                                    </Badge>
                                )}
                            </div>
                        </Card>

                        {/* STATISTIQUES */}
                        <div className="grid grid-cols-2 gap-3">
                            <Card className={`p-3 text-center ${
                                checkData.total_demandeurs_actifs > 0 
                                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                                    : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                            }`}>
                                <Users className={`h-5 w-5 mx-auto mb-1 ${
                                    checkData.total_demandeurs_actifs > 0 ? 'text-red-600' : 'text-green-600'
                                }`} />
                                <p className="text-xs text-muted-foreground mb-1">Demandeurs actifs</p>
                                <p className={`text-2xl font-bold ${
                                    checkData.total_demandeurs_actifs > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                    {checkData.total_demandeurs_actifs}
                                </p>
                            </Card>

                            <Card className={`p-3 text-center ${
                                checkData.total_demandes > 0 
                                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' 
                                    : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                            }`}>
                                <Users className={`h-5 w-5 mx-auto mb-1 ${
                                    checkData.total_demandes > 0 ? 'text-amber-600' : 'text-green-600'
                                }`} />
                                <p className="text-xs text-muted-foreground mb-1">Demandes totales</p>
                                <p className={`text-2xl font-bold ${
                                    checkData.total_demandes > 0 ? 'text-amber-600' : 'text-green-600'
                                }`}>
                                    {checkData.total_demandes}
                                </p>
                            </Card>
                        </div>

                        {/* RÉSULTAT */}
                        {checkData.can_delete ? (
                            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-700 dark:text-blue-300">
                                        <p className="font-medium mb-2">
                                            ✅ Cette propriété peut être supprimée
                                        </p>
                                        <p>
                                            Aucun demandeur actif n'est associé à cette propriété.
                                        </p>
                                        <p className="text-red-600 dark:text-red-400 font-medium mt-2">
                                            ⚠️ Cette action est irréversible !
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <>
                                <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                                    <div className="flex items-start gap-3">
                                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-red-700 dark:text-red-300">
                                            <p className="font-medium mb-1">
                                                Impossible de supprimer cette propriété
                                            </p>
                                            <p>
                                                {checkData.total_demandeurs_actifs} demandeur{checkData.total_demandeurs_actifs > 1 ? 's' : ''} actif{checkData.total_demandeurs_actifs > 1 ? 's' : ''} {checkData.total_demandeurs_actifs > 1 ? 'sont' : 'est'} encore associé{checkData.total_demandeurs_actifs > 1 ? 's' : ''}.
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                    <div className="flex items-start gap-2">
                                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-700 dark:text-blue-300">
                                            <p className="font-medium mb-1">💡 Actions nécessaires :</p>
                                            <ol className="list-decimal list-inside space-y-1">
                                                <li>Dissocier ou supprimer tous les demandeurs actifs</li>
                                                <li>Ou archiver la propriété (si acquise)</li>
                                                <li>Ensuite, la propriété pourra être supprimée</li>
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