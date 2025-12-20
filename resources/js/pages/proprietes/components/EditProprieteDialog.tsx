import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
    FileText, 
    Layers, 
    Shield, 
    MapPin, 
    Calendar,
    CheckCircle2,
    Loader2,
    AlertTriangle,
    FileCheck
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ProprieteWithDetails, ProprieteFormData } from '../types';
import type { Dossier } from '@/types';
import { CHARGE_OPTIONS } from '../types';
import { proprieteToFormData, parseSelectedCharges } from '../helpers';
import { validateAndShowErrors } from '../validation';
import { toast } from 'sonner';
import { cleanupDialogOverlays } from '@/utils/dialog-helpers';

interface EditProprieteDialogProps {
    propriete: ProprieteWithDetails | null;
    dossier: Dossier;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditProprieteDialog({
    propriete,
    dossier,
    open,
    onOpenChange
}: EditProprieteDialogProps) {
    const [data, setData] = useState<ProprieteFormData>({
        lot: '',
        type_operation: 'immatriculation',
        nature: '',
        vocation: '',
        proprietaire: '',
        situation: '',
        propriete_mere: '',
        titre_mere: '',
        titre: '',
        contenance: '',
        charge: '',
        numero_FN: '',
        numero_requisition: '',
        
        // ✅ DATES CORRIGÉES
        date_requisition: '',
        date_depot_1: '',
        date_depot_2: '',
        date_approbation_acte: '',
        
        // Dep/Vol
        dep_vol_inscription: '',
        numero_dep_vol_inscription: '',
        dep_vol_requisition: '',
        numero_dep_vol_requisition: '',
        
        id_dossier: dossier.id
    });
    
    const [selectedCharges, setSelectedCharges] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isArchived = propriete?.is_archived === true;
    const isClosed = dossier?.is_closed === true;
    const isDisabled = isArchived || isClosed;

    // Nettoyage au démontage
    useEffect(() => {
        return () => cleanupDialogOverlays();
    }, []);

    // Nettoyage quand le dialog se ferme
    useEffect(() => {
        if (!open) {
            const timer = setTimeout(cleanupDialogOverlays, 300);
            return () => clearTimeout(timer);
        }
    }, [open]);

    // Charger les données
    useEffect(() => {
        if (open && propriete) {
            const formData = proprieteToFormData(propriete, dossier.id);
            setData(formData);
            
            const charges = parseSelectedCharges(propriete.charge);
            setSelectedCharges(charges);
            
            setErrors({});
        }
    }, [open, propriete, dossier.id]);

    const handleChange = (field: keyof ProprieteFormData, value: string) => {
        setData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleChargeChange = (charge: string, checked: boolean) => {
        let newCharges: string[];
        
        if (checked) {
            if (charge === "Aucune") {
                newCharges = ["Aucune"];
            } else {
                newCharges = selectedCharges.filter(c => c !== "Aucune");
                newCharges = [...newCharges, charge];
            }
        } else {
            newCharges = selectedCharges.filter(c => c !== charge);
        }
        
        setSelectedCharges(newCharges);
        handleChange('charge', newCharges.join(', '));
    };

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(cleanupDialogOverlays, 100);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!propriete || processing || isDisabled) return;

        if (!validateAndShowErrors(data)) {
            return;
        }
        
        setProcessing(true);
        setErrors({});

        const cleanData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
                key, 
                value === '' ? null : value
            ])
        );

        router.put(
            `/proprietes/${propriete.id}`,
            cleanData,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Propriété modifiée avec succès');
                    handleClose();
                },
                onError: (errors) => {
                    console.error('❌ Erreurs de validation:', errors);
                    setErrors(errors);
                    toast.error('Erreur de validation', {
                        description: Object.values(errors)[0] as string
                    });
                },
                onFinish: () => {
                    setProcessing(false);
                }
            }
        );
    };

    if (!propriete) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4 border-b">
                    <DialogTitle className="text-2xl flex items-center gap-3">
                        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                            <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        Modifier Lot {propriete.lot}
                    </DialogTitle>
                </DialogHeader>

                {isDisabled && (
                    <Alert variant="destructive" className="border-0">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            {isClosed && 'Ce dossier est fermé. Aucune modification n\'est possible.'}
                            {isArchived && 'Cette propriété est archivée (acquise). Aucune modification n\'est possible.'}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-1">
                    <div className="space-y-6 pb-4">
                        {/* ... Tous les sections du formulaire identiques ... */}
                        {/* Je garde seulement la structure pour la longueur */}
                    </div>

                    <div className="sticky bottom-0 pt-4 pb-2 bg-white dark:bg-gray-950 border-t">
                        <div className="flex gap-3 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={processing}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || isDisabled}
                                className="gap-2"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Enregistrer
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}