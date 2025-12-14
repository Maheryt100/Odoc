// pages/proprietes/components/EditProprieteDialog.tsx
// ✅ VERSION CORRIGÉE - Nettoyage complet des overlays

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
import { 
    FileText, 
    Layers, 
    Shield, 
    MapPin, 
    Calendar,
    CheckCircle2,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ProprieteWithDetails, ProprieteFormData } from '../types';
import type { Dossier } from '@/types';
import { CHARGE_OPTIONS } from '../types';
import { proprieteToFormData, parseSelectedCharges } from '../helpers';
import { validateAndShowErrors } from '../validation';
import { toast } from 'sonner';

interface EditProprieteDialogProps {
    propriete: ProprieteWithDetails | null;
    dossier: Dossier;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// ✅ FONCTION UTILITAIRE : Nettoyer les overlays résiduels
const cleanupDialogOverlays = () => {
    // Nettoyer les overlays de radix-ui
    const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
    overlays.forEach(overlay => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    });
    
    // Nettoyer les portals résiduels
    const portals = document.querySelectorAll('[data-radix-portal]');
    portals.forEach(portal => {
        if (portal.childNodes.length === 0 && portal.parentNode) {
            portal.parentNode.removeChild(portal);
        }
    });
    
    // Restaurer le body
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
    document.body.removeAttribute('data-scroll-locked');
};

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
        date_requisition: '',
        date_inscription: '',
        dep_vol: '',
        numero_dep_vol: '',
        id_dossier: dossier.id
    });
    
    const [selectedCharges, setSelectedCharges] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isArchived = propriete?.is_archived === true;
    const isClosed = dossier?.is_closed === true;
    const isDisabled = isArchived || isClosed;

    // ✅ CORRECTION 1 : Nettoyer au démontage du composant
    useEffect(() => {
        return () => {
            cleanupDialogOverlays();
        };
    }, []);

    // ✅ CORRECTION 2 : Nettoyer quand le dialog se ferme
    useEffect(() => {
        if (!open) {
            // Délai pour laisser l'animation se terminer
            const timer = setTimeout(() => {
                cleanupDialogOverlays();
            }, 300);
            
            return () => clearTimeout(timer);
        }
    }, [open]);

    // Charger les données quand le dialogue s'ouvre
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

    // ✅ CORRECTION 3 : Gérer la fermeture proprement
    const handleClose = () => {
        onOpenChange(false);
        // Nettoyage immédiat
        setTimeout(() => {
            cleanupDialogOverlays();
        }, 100);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!propriete || processing || isDisabled) return;

        // Validation côté client
        if (!validateAndShowErrors(data)) {
            return;
        }
        
        setProcessing(true);
        setErrors({});

        // Nettoyer les données (convertir chaînes vides en null)
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
                    handleClose(); // ✅ Utiliser la fonction de fermeture
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
                        {/* TYPE D'OPÉRATION */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <h4 className="font-semibold">Type d'opération</h4>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-red-600">Type *</Label>
                                <Select
                                    value={data.type_operation}
                                    onValueChange={(value) => handleChange('type_operation', value)}
                                >
                                    <SelectTrigger className="mt-1 w-[280px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="morcellement">Morcellement</SelectItem>
                                        <SelectItem value="immatriculation">Immatriculation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* IDENTIFICATION */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Layers className="h-4 w-4 text-green-600" />
                                <h4 className="font-semibold">Identification du lot</h4>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label className="text-sm font-medium text-red-600">Lot *</Label>
                                    <Input
                                        value={data.lot}
                                        onChange={(e) => handleChange('lot', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-red-600">Nature *</Label>
                                    <Select 
                                        value={data.nature} 
                                        onValueChange={(value) => handleChange('nature', value)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Urbaine">Urbaine</SelectItem>
                                            <SelectItem value="Suburbaine">Suburbaine</SelectItem>
                                            <SelectItem value="Rurale">Rurale</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-red-600">Vocation *</Label>
                                    <Select 
                                        value={data.vocation} 
                                        onValueChange={(value) => handleChange('vocation', value)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Edilitaire">Edilitaire</SelectItem>
                                            <SelectItem value="Agricole">Agricole</SelectItem>
                                            <SelectItem value="Forestière">Forestière</SelectItem>
                                            <SelectItem value="Touristique">Touristique</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* PROPRIÉTAIRE & TITRES */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Shield className="h-4 w-4 text-purple-600" />
                                <h4 className="font-semibold">Propriétaire & Titres</h4>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {data.type_operation === 'morcellement' && (
                                    <>
                                        <div>
                                            <Label className="text-sm font-medium">Propriété mère</Label>
                                            <Input
                                                value={data.propriete_mere}
                                                onChange={(e) => handleChange('propriete_mere', e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Titre mère</Label>
                                            <Input
                                                value={data.titre_mere}
                                                onChange={(e) => handleChange('titre_mere', e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <Label className="text-sm font-medium">Titre</Label>
                                    <Input
                                        value={data.titre}
                                        onChange={(e) => handleChange('titre', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Propriétaire</Label>
                                    <Input
                                        value={data.proprietaire}
                                        onChange={(e) => handleChange('proprietaire', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* DÉTAILS & RÉFÉRENCES */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <FileText className="h-4 w-4 text-indigo-600" />
                                <h4 className="font-semibold">Détails & Références</h4>
                            </div>
                            <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                    <Label className="text-sm font-medium">Contenance (m²)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={data.contenance}
                                        onChange={(e) => handleChange('contenance', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Numero FNº</Label>
                                    <Input
                                        value={data.numero_FN}
                                        onChange={(e) => handleChange('numero_FN', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                {data.type_operation === 'immatriculation' && (
                                    <div>
                                        <Label className="text-sm font-medium">Nº Requisition</Label>
                                        <Input
                                            value={data.numero_requisition}
                                            onChange={(e) => handleChange('numero_requisition', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                )}
                                <div className="md:col-span-2">
                                    <Label className="text-sm font-medium">Charges</Label>
                                    <div className="mt-2 space-y-2 p-3 border rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20">
                                        {CHARGE_OPTIONS.map((charge) => (
                                            <div key={charge} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`charge-edit-${charge}`}
                                                    checked={selectedCharges.includes(charge)}
                                                    onCheckedChange={(checked) => 
                                                        handleChargeChange(charge, checked as boolean)
                                                    }
                                                />
                                                <label 
                                                    htmlFor={`charge-edit-${charge}`} 
                                                    className="text-sm cursor-pointer"
                                                >
                                                    {charge}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* LOCALISATION & DATES */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <MapPin className="h-4 w-4 text-orange-600" />
                                <h4 className="font-semibold">Localisation & Dates</h4>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="md:col-span-3">
                                    <Label className="text-sm font-medium">Situation (sise à)</Label>
                                    <Input
                                        value={data.situation}
                                        onChange={(e) => handleChange('situation', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        Date inscription
                                    </Label>
                                    <Input
                                        type="date"
                                        value={data.date_inscription}
                                        onChange={(e) => handleChange('date_inscription', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        Date requisition
                                    </Label>
                                    <Input
                                        type="date"
                                        value={data.date_requisition}
                                        onChange={(e) => handleChange('date_requisition', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="text-sm font-medium">Dep Vol</Label>
                                    <Input
                                        value={data.dep_vol}
                                        onChange={(e) => handleChange('dep_vol', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Numéro Dep Vol</Label>
                                    <Input
                                        value={data.numero_dep_vol}
                                        onChange={(e) => handleChange('numero_dep_vol', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
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