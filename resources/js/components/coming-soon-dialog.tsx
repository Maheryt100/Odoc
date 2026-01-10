import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Construction, Calendar, Sparkles } from 'lucide-react';

interface ComingSoonDialogProps {
    open: boolean;
    onClose: () => void;
    featureName?: string;
    description?: string;
}

export default function ComingSoonDialog({
    open,
    onClose,
    featureName = "Flux TopoManager",
    description = "L'intégration avec TopoManager pour la synchronisation des données terrain."
}: ComingSoonDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-20 animate-pulse" />
                            <div className="relative bg-gradient-to-r from-emerald-100 to-teal-100 p-4 rounded-full">
                                <Construction className="h-8 w-8 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    
                    <DialogTitle className="text-center text-xl">
                        Fonctionnalité pas encore disponible
                    </DialogTitle>
                    
                    <DialogDescription className="text-center space-y-3 pt-2">
                        <p className="text-base font-medium text-foreground">
                            {featureName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4 space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Disponible prochainement
                            </p>
                          
                        </div>
                    </div>
                    
                    
                </div>
                
                <DialogFooter>
                    <Button 
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                        Compris
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}