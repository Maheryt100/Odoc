// resources/js/pages/TopoFlux/components/RejectDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { RejectDialogProps } from '../types';

export default function RejectDialog({
    open,
    reason,
    onReasonChange,
    onConfirm,
    onCancel
}: RejectDialogProps) {
    const isValid = reason.length >= 10;
    
    return (
        <Dialog open={open} onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Rejeter l'import
                    </DialogTitle>
                    <DialogDescription>
                        Veuillez indiquer le motif du rejet (minimum 10 caractères)
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-2">
                    <Textarea
                        placeholder="Exemple: Données incohérentes, informations manquantes, doublon détecté..."
                        value={reason}
                        onChange={(e) => onReasonChange(e.target.value)}
                        rows={4}
                        className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                        {reason.length} / 10 caractères minimum
                    </p>
                </div>
                
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        Annuler
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={onConfirm}
                        disabled={!isValid}
                    >
                        Confirmer le rejet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}