// resources/js/pages/TopoFlux/components/RejectDialog.tsx
// ✅ VERSION COMPLÈTE AVEC DialogDescription

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { XCircle, Loader2 } from 'lucide-react';

interface RejectDialogProps {
    open: boolean;
    reason: string;
    onReasonChange: (reason: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
    processing: boolean;
}

export default function RejectDialog({
    open,
    reason,
    onReasonChange,
    onConfirm,
    onCancel,
    processing
}: RejectDialogProps) {
    const isValid = reason.trim().length >= 10;
    
    return (
        <Dialog open={open} onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        Rejeter l'import
                    </DialogTitle>
                    <DialogDescription>
                        Indiquez le motif du rejet. Cette action est irréversible et l'import sera définitivement marqué comme rejeté.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="reason">Motif du rejet *</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => onReasonChange(e.target.value)}
                            placeholder="Expliquez pourquoi cet import est rejeté (minimum 10 caractères)..."
                            rows={4}
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {reason.length}/10 caractères minimum
                        </p>
                    </div>
                </div>
                
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={processing}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={!isValid || processing}
                        className="gap-2"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Rejet...
                            </>
                        ) : (
                            <>
                                <XCircle className="h-4 w-4" />
                                Confirmer le rejet
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}