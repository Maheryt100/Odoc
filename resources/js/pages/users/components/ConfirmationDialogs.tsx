// users/components/ConfirmationDialogs.tsx - AVEC NETTOYAGE
import { useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User } from '../types';
import { AlertTriangle } from 'lucide-react';
import { useDialogCleanup, useForceDialogCleanup } from '@/hooks/useDialogCleanup';

interface ToggleStatusDialogProps {
    user: User | null;
    onClose: () => void;
    onConfirm: (user: User) => void;
}

export const ToggleStatusDialog = ({ user, onClose, onConfirm }: ToggleStatusDialogProps) => {
    const isOpen = !!user;
    
    // ✅ Nettoyage automatique à la fermeture
    useDialogCleanup(isOpen);
    
    // ✅ Nettoyage manuel pour les handlers
    const forceCleanup = useForceDialogCleanup();
    
    // ✅ Nettoyage au démontage du composant
    useEffect(() => {
        return () => {
            if (!isOpen) {
                forceCleanup();
            }
        };
    }, [isOpen, forceCleanup]);
    
    if (!user) return null;

    const handleConfirm = () => {
        onConfirm(user);
        // ✅ Nettoyage immédiat + fermeture
        forceCleanup();
        onClose();
    };

    const handleCancel = () => {
        // ✅ Nettoyage immédiat + fermeture
        forceCleanup();
        onClose();
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            forceCleanup();
            onClose();
        }
    };

    return (
        <AlertDialog open={true} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-base sm:text-lg">
                        {user.status ? 'Désactiver' : 'Activer'} l'utilisateur
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-2 sm:space-y-3">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Voulez-vous vraiment {user.status ? 'désactiver' : 'activer'} l'utilisateur{' '}
                                <span className="font-medium text-foreground break-words">{user.name}</span> ?
                            </p>
                            {user.status && (
                                <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                                    <div className="flex gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                        <AlertDescription className="text-amber-800 dark:text-amber-200">
                                            <span className="font-medium block mb-1 text-xs sm:text-sm">Attention</span>
                                            <span className="text-xs sm:text-sm">
                                                L'utilisateur ne pourra plus se connecter ni accéder aux dossiers.
                                            </span>
                                        </AlertDescription>
                                    </div>
                                </Alert>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <AlertDialogCancel 
                        onClick={handleCancel}
                        className="w-full sm:w-auto order-2 sm:order-1 mt-0"
                    >
                        Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={`w-full sm:w-auto order-1 sm:order-2 ${
                            user.status ? 'bg-amber-600 hover:bg-amber-700' : ''
                        }`}
                    >
                        Confirmer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

interface DeleteUserDialogProps {
    user: User | null;
    onClose: () => void;
    onConfirm: (user: User) => void;
}

export const DeleteUserDialog = ({ user, onClose, onConfirm }: DeleteUserDialogProps) => {
    const isOpen = !!user;
    
    // ✅ Nettoyage automatique à la fermeture
    useDialogCleanup(isOpen);
    
    // ✅ Nettoyage manuel pour les handlers
    const forceCleanup = useForceDialogCleanup();
    
    // ✅ Nettoyage au démontage du composant
    useEffect(() => {
        return () => {
            if (!isOpen) {
                forceCleanup();
            }
        };
    }, [isOpen, forceCleanup]);
    
    if (!user) return null;

    const handleConfirm = () => {
        onConfirm(user);
        // ✅ Nettoyage immédiat + fermeture
        forceCleanup();
        onClose();
    };

    const handleCancel = () => {
        // ✅ Nettoyage immédiat + fermeture
        forceCleanup();
        onClose();
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            forceCleanup();
            onClose();
        }
    };

    return (
        <AlertDialog open={true} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive shrink-0" />
                        <span className="truncate">Supprimer l'utilisateur</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-2 sm:space-y-3">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Voulez-vous vraiment supprimer l'utilisateur{' '}
                                <span className="font-medium text-foreground break-words">{user.name}</span> ?
                            </p>
                            <Alert variant="destructive" className="bg-destructive/10">
                                <AlertDescription>
                                    <span className="font-medium block mb-1.5 sm:mb-2 text-xs sm:text-sm">
                                        ⚠️ Cette action est irréversible
                                    </span>
                                    <ul className="text-xs sm:text-sm space-y-0.5 sm:space-y-1 list-disc list-inside">
                                        <li>Toutes les données seront supprimées</li>
                                        <li>L'accès aux dossiers sera révoqué</li>
                                        <li>Cette opération ne peut pas être annulée</li>
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <AlertDialogCancel 
                        onClick={handleCancel}
                        className="w-full sm:w-auto order-2 sm:order-1 mt-0"
                    >
                        Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className="w-full sm:w-auto order-1 sm:order-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Supprimer définitivement
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};