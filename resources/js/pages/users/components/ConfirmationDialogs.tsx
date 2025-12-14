// users/components/ConfirmationDialogs.tsx
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

interface ToggleStatusDialogProps {
    user: User | null;
    onClose: () => void;
    onConfirm: (user: User) => void;
}

export const ToggleStatusDialog = ({ user, onClose, onConfirm }: ToggleStatusDialogProps) => {
    if (!user) return null;

    const handleConfirm = () => {
        onConfirm(user);
    };

    return (
        <AlertDialog open={!!user} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {user.status ? 'Désactiver' : 'Activer'} l'utilisateur
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Voulez-vous vraiment {user.status ? 'désactiver' : 'activer'} l'utilisateur{' '}
                                <span className="font-medium text-foreground">{user.name}</span> ?
                            </p>
                            {user.status && (
                                <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                                        <span className="font-medium block mb-1">Attention</span>
                                        <span className="text-sm">L'utilisateur ne pourra plus se connecter ni accéder aux dossiers.</span>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={user.status ? 'bg-amber-600 hover:bg-amber-700' : ''}
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
    if (!user) return null;

    const handleConfirm = () => {
        onConfirm(user);
    };

    return (
        <AlertDialog open={!!user} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Supprimer l'utilisateur
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Voulez-vous vraiment supprimer l'utilisateur{' '}
                                <span className="font-medium text-foreground">{user.name}</span> ?
                            </p>
                            <Alert variant="destructive" className="bg-destructive/10">
                                <AlertDescription>
                                    <span className="font-medium block mb-2">⚠️ Cette action est irréversible</span>
                                    <ul className="text-sm space-y-1 list-disc list-inside">
                                        <li>Toutes les données de l'utilisateur seront supprimées</li>
                                        <li>L'accès aux dossiers sera révoqué</li>
                                        <li>Cette opération ne peut pas être annulée</li>
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Supprimer définitivement
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};