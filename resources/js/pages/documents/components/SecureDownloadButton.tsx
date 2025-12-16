import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentGenere } from '../types';
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

interface SecureDownloadButtonProps {
    document: DocumentGenere;
    downloadRoute: string;
    regenerateRoute: string;
    typeName: string;
    variant?: 'default' | 'outline';
    size?: 'default' | 'sm' | 'lg';
    onSuccess?: () => void;
    className?: string;
}

export default function SecureDownloadButton({
    document,
    downloadRoute,
    regenerateRoute,
    typeName,
    variant = 'default',
    size = 'lg',
    onSuccess,
    className = 'w-full',
}: SecureDownloadButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
    const [errorDetails, setErrorDetails] = useState<{
        message: string;
        details: string | null;
        canRegenerate: boolean;
    } | null>(null);

    /**
     * ✅ Téléchargement sécurisé avec détection d'erreur
     */
    const handleDownload = async () => {
        if (isDownloading || isRegenerating) return;

        setIsDownloading(true);
        setErrorDetails(null);

        try {
            const response = await fetch(downloadRoute, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json, application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                },
                credentials: 'same-origin',
            });

            const contentType = response.headers.get('content-type') || '';

            // ❌ Vérifier si c'est une erreur JSON
            if (contentType.includes('application/json')) {
                const errorData = await response.json();

                // ✅ CORRECTION : Stocker AVANT de désactiver le loader
                setErrorDetails({
                    message: errorData.message || 'Fichier introuvable',
                    details: errorData.details || null,
                    canRegenerate: errorData.can_regenerate === true,
                });

                // ✅ Afficher le dialog IMMÉDIATEMENT si régénération possible
                if (errorData.error === 'file_missing' && errorData.can_regenerate) {
                    setIsDownloading(false); // ✅ Désactiver AVANT d'ouvrir le dialog
                    setShowRegenerateDialog(true);
                    return; // ✅ SORTIR pour ne pas continuer
                }

                // Autre erreur non récupérable
                toast.error(errorData.message || 'Erreur lors du téléchargement', {
                    description: errorData.details || undefined,
                });
                setIsDownloading(false);
                return;
            }

            // ✅ C'est un fichier Word, télécharger
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = document.nom_fichier;
            window.document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            window.document.body.removeChild(a);

            toast.success(`${typeName} téléchargé avec succès`);

            // Recharger les données
            setTimeout(() => {
                router.reload({
                    only: ['proprietes', 'demandeurs'],
                    preserveUrl: true,
                    onFinish: () => {
                        setIsDownloading(false);
                        onSuccess?.();
                    },
                });
            }, 500);

        } catch (error: any) {
            console.error('❌ Erreur téléchargement:', error);
            toast.error('Erreur réseau lors du téléchargement', {
                description: error.message,
            });
            setIsDownloading(false);
        }
    };

    /**
     * ✅ Régénération manuelle avec confirmation
     */
    const handleRegenerate = async () => {
        setShowRegenerateDialog(false);
        setIsRegenerating(true);

        try {
            const csrfToken = window.document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

            if (!csrfToken) {
                throw new Error('Token CSRF manquant dans la page');
            }

            const response = await fetch(regenerateRoute, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json, application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                },
                credentials: 'same-origin',
            });

            const contentType = response.headers.get('content-type') || '';

            // Si c'est un JSON, vérifier le succès
            if (contentType.includes('application/json')) {
                const data = await response.json();

                if (!data.success && !response.ok) {
                    throw new Error(data.message || 'Erreur de régénération');
                }

                toast.success(`${typeName} régénéré avec succès`);
            } else {
                // C'est un fichier Word, télécharger directement
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = window.document.createElement('a');
                a.href = url;
                a.download = document.nom_fichier;
                window.document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                window.document.body.removeChild(a);

                toast.success(`${typeName} régénéré et téléchargé avec succès`);
            }

            // Recharger les données
            setTimeout(() => {
                router.reload({
                    only: ['proprietes', 'demandeurs'],
                    preserveUrl: true,
                    onFinish: () => {
                        setIsRegenerating(false);
                    },
                });
            }, 1000);

        } catch (error: any) {
            console.error('❌ Erreur régénération:', error);
            toast.error('Erreur lors de la régénération', {
                description: error.message,
            });
            setIsRegenerating(false);
        }
    };

    return (
        <>
            <Button
                onClick={handleDownload}
                disabled={isDownloading || isRegenerating}
                variant={variant}
                size={size}
                className={className}
            >
                {isDownloading ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Téléchargement...
                    </>
                ) : isRegenerating ? (
                    <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Régénération...
                    </>
                ) : (
                    <>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger {typeName}
                    </>
                )}
            </Button>

            {/* ✅ Dialog de confirmation - HTML CORRIGÉ */}
            <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Fichier introuvable
                        </AlertDialogTitle>
                        {/* ✅ CORRECTION : Utiliser asChild pour éviter le <p> wrapper */}
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-left text-sm text-muted-foreground">
                                <p>
                                    Le fichier <strong className="text-foreground font-mono">{document.nom_fichier}</strong> n'a pas été trouvé sur le serveur.
                                </p>
                                
                                {errorDetails?.details && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                                        <p className="text-xs text-amber-800 dark:text-amber-200">
                                            <strong>Cause :</strong> {errorDetails.details}
                                        </p>
                                    </div>
                                )}

                                <p className="font-medium text-foreground">
                                    Voulez-vous régénérer ce document ?
                                </p>
                                
                                <p className="text-xs">
                                    ℹ️ Le document sera recréé automatiquement avec les mêmes données et téléchargé immédiatement.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRegenerating}>
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isRegenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Régénération...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Régénérer maintenant
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}