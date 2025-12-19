// pages/demandeurs/components/EditDemandeurDialog.tsx
// ✅ VERSION AMÉLIORÉE - RESPONSIVE & COHÉRENT AVEC EditProprieteDialog

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
import { 
    User, 
    CreditCard, 
    Calendar, 
    Home, 
    Heart,
    CheckCircle2,
    Loader2,
    AlertTriangle,
    Users,
    MapPin,
    Phone,
    Briefcase,
    Flag
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { DemandeurWithProperty } from '../types';

interface EditDemandeurDialogProps {
    demandeur: DemandeurWithProperty | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dossierId: number;
    dossierClosed?: boolean;
}

interface FormData {
    titre_demandeur: string;
    nom_demandeur: string;
    prenom_demandeur: string;
    date_naissance: string;
    lieu_naissance: string;
    sexe: string;
    occupation: string;
    nom_pere: string;
    nom_mere: string;
    cin: string;
    date_delivrance: string;
    lieu_delivrance: string;
    date_delivrance_duplicata: string;
    lieu_delivrance_duplicata: string;
    domiciliation: string;
    nationalite: string;
    situation_familiale: string;
    regime_matrimoniale: string;
    date_mariage: string;
    lieu_mariage: string;
    marie_a: string;
    telephone: string;
}

// ✅ Fonction utilitaire : Nettoyer les overlays résiduels
const cleanupDialogOverlays = () => {
    const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
    overlays.forEach(overlay => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    });
    
    const portals = document.querySelectorAll('[data-radix-portal]');
    portals.forEach(portal => {
        if (portal.childNodes.length === 0 && portal.parentNode) {
            portal.parentNode.removeChild(portal);
        }
    });
    
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
    document.body.removeAttribute('data-scroll-locked');
};

export default function EditDemandeurDialog({
    demandeur,
    open,
    onOpenChange,
    dossierId,
    dossierClosed = false
}: EditDemandeurDialogProps) {
    const [data, setData] = useState<FormData>({
        titre_demandeur: '',
        nom_demandeur: '',
        prenom_demandeur: '',
        date_naissance: '',
        lieu_naissance: '',
        sexe: '',
        occupation: '',
        nom_pere: '',
        nom_mere: '',
        cin: '',
        date_delivrance: '',
        lieu_delivrance: '',
        date_delivrance_duplicata: '',
        lieu_delivrance_duplicata: '',
        domiciliation: '',
        nationalite: 'Malagasy',
        situation_familiale: 'Non spécifiée',
        regime_matrimoniale: 'Non spécifié',
        date_mariage: '',
        lieu_mariage: '',
        marie_a: '',
        telephone: ''
    });
    
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Nettoyage au démontage
    useEffect(() => {
        return () => {
            cleanupDialogOverlays();
        };
    }, []);

    // Nettoyage quand le dialog se ferme
    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                cleanupDialogOverlays();
            }, 300);
            
            return () => clearTimeout(timer);
        }
    }, [open]);

    // ✅ Charger les données quand le dialogue s'ouvre
    useEffect(() => {
        if (open && demandeur) {
            // ✅ Fonction helper pour formater les dates
            const formatDate = (date: string | null | undefined): string => {
                if (!date) return '';
                try {
                    // Si c'est déjà au format YYYY-MM-DD, on le retourne tel quel
                    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                        return date;
                    }
                    // Sinon on parse et reformate
                    const d = new Date(date);
                    if (isNaN(d.getTime())) return '';
                    return d.toISOString().split('T')[0];
                } catch {
                    return '';
                }
            };

            setData({
                titre_demandeur: demandeur.titre_demandeur || '',
                nom_demandeur: demandeur.nom_demandeur || '',
                prenom_demandeur: demandeur.prenom_demandeur || '',
                date_naissance: formatDate(demandeur.date_naissance),
                lieu_naissance: demandeur.lieu_naissance || '',
                sexe: demandeur.sexe || '',
                occupation: demandeur.occupation || '',
                nom_pere: demandeur.nom_pere || '',
                nom_mere: demandeur.nom_mere || '',
                cin: demandeur.cin || '',
                date_delivrance: formatDate(demandeur.date_delivrance),
                lieu_delivrance: demandeur.lieu_delivrance || '',
                date_delivrance_duplicata: formatDate(demandeur.date_delivrance_duplicata),
                lieu_delivrance_duplicata: demandeur.lieu_delivrance_duplicata || '',
                domiciliation: demandeur.domiciliation || '',
                nationalite: demandeur.nationalite || 'Malagasy',
                situation_familiale: demandeur.situation_familiale || 'Non spécifiée',
                regime_matrimoniale: demandeur.regime_matrimoniale || 'Non spécifié',
                date_mariage: formatDate(demandeur.date_mariage),
                lieu_mariage: demandeur.lieu_mariage || '',
                marie_a: demandeur.marie_a || '',
                telephone: demandeur.telephone || ''
            });
            
            setErrors({});
        }
    }, [open, demandeur]);

    const handleChange = (field: keyof FormData, value: string) => {
        setData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleTitreChange = (value: string) => {
        const sexe = value === 'Monsieur' ? 'Homme' : 
                     value === 'Madame' || value === 'Mademoiselle' ? 'Femme' : '';
        handleChange('titre_demandeur', value);
        handleChange('sexe', sexe);
    };

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            cleanupDialogOverlays();
        }, 100);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!demandeur || processing || dossierClosed) return;
        
        setProcessing(true);
        setErrors({});

        // ✅ Nettoyer les données (convertir chaînes vides en null)
        const cleanData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
                key, 
                value === '' ? null : value
            ])
        );

        router.put(
            `/demandeurs/${demandeur.id}`,
            {
                ...cleanData,
                id_dossier: dossierId
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Demandeur modifié avec succès');
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

    if (!demandeur) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <DialogHeader className="pb-4 border-b">
                    <DialogTitle className="text-xl sm:text-2xl flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                            <User className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="truncate">Modifier le demandeur</span>
                    </DialogTitle>
                </DialogHeader>

                {dossierClosed && (
                    <Alert variant="destructive" className="border-0">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <AlertDescription>
                                Ce dossier est fermé. Aucune modification n'est possible.
                            </AlertDescription>
                        </div>
                    </Alert>
                )}

                <div className="flex-1 overflow-y-auto px-1">
                    <div className="space-y-6 pb-4">
                        
                        {/* CIN & IDENTITÉ */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <CreditCard className="h-4 w-4 text-violet-600 flex-shrink-0" />
                                <h4 className="font-semibold text-sm sm:text-base">CIN & Identité</h4>
                            </div>
                            
                            {/* CIN - Version responsive simple */}
                            <div>
                                <Label className="text-sm font-medium text-red-600">CIN *</Label>
                                <div className="mt-2 p-4 bg-violet-50/50 dark:bg-violet-950/20 rounded-lg border border-violet-200">
                                    <Input
                                        type="text"
                                        value={data.cin}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                                            handleChange('cin', value);
                                        }}
                                        placeholder="123456789012"
                                        maxLength={12}
                                        className="text-center font-mono text-lg tracking-wider"
                                        disabled={dossierClosed}
                                    />
                                    <p className="text-xs text-center text-muted-foreground mt-2">
                                        12 chiffres • Format: {data.cin.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4') || '--- --- --- ---'}
                                    </p>
                                    {errors.cin && (
                                        <p className="text-xs text-red-500 mt-1 text-center">{errors.cin}</p>
                                    )}
                                </div>
                            </div>

                            {/* Titre, Nom, Prénom */}
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <Label className="text-sm font-medium text-red-600">Titre *</Label>
                                    <Select value={data.titre_demandeur} onValueChange={handleTitreChange} disabled={dossierClosed}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Monsieur">Monsieur</SelectItem>
                                            <SelectItem value="Madame">Madame</SelectItem>
                                            <SelectItem value="Mademoiselle">Mademoiselle</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-red-600">Nom *</Label>
                                    <Input
                                        value={data.nom_demandeur}
                                        onChange={(e) => handleChange('nom_demandeur', e.target.value.toUpperCase())}
                                        className="mt-1 uppercase"
                                        disabled={dossierClosed}
                                    />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <Label className="text-sm font-medium text-red-600">Prénom *</Label>
                                    <Input
                                        value={data.prenom_demandeur}
                                        onChange={(e) => handleChange('prenom_demandeur', e.target.value)}
                                        className="mt-1"
                                        disabled={dossierClosed}
                                    />
                                </div>
                            </div>

                            {/* Date et Lieu de naissance, Parents */}
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                <div>
                                    <Label className="text-sm font-medium text-red-600">Date de naissance *</Label>
                                    <Input
                                        type="date"
                                        value={data.date_naissance}
                                        onChange={(e) => handleChange('date_naissance', e.target.value)}
                                        className="mt-1"
                                        max={new Date().toISOString().split('T')[0]}
                                        disabled={dossierClosed}
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Lieu de naissance</Label>
                                    <Input
                                        value={data.lieu_naissance}
                                        onChange={(e) => handleChange('lieu_naissance', e.target.value)}
                                        className="mt-1"
                                        disabled={dossierClosed}
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Nom du père</Label>
                                    <Input
                                        value={data.nom_pere}
                                        onChange={(e) => handleChange('nom_pere', e.target.value)}
                                        className="mt-1"
                                        disabled={dossierClosed}
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Nom de la mère</Label>
                                    <Input
                                        value={data.nom_mere}
                                        onChange={(e) => handleChange('nom_mere', e.target.value)}
                                        className="mt-1"
                                        disabled={dossierClosed}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* DÉLIVRANCE CIN */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Calendar className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                                <h4 className="font-semibold text-sm sm:text-base">Délivrance CIN</h4>
                            </div>
                            
                            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                                {/* CIN Original */}
                                <div className="p-4 border-2 rounded-xl bg-gradient-to-br from-blue-50/70 to-cyan-50/70 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                                    <div className="mb-3">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded border border-blue-300">
                                            <CreditCard className="h-3 w-3" />
                                            CIN Original
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-sm font-medium">Date de délivrance</Label>
                                            <Input
                                                type="date"
                                                value={data.date_delivrance}
                                                onChange={(e) => handleChange('date_delivrance', e.target.value)}
                                                className="mt-1"
                                                disabled={dossierClosed}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Lieu de délivrance</Label>
                                            <Input
                                                value={data.lieu_delivrance}
                                                onChange={(e) => handleChange('lieu_delivrance', e.target.value)}
                                                className="mt-1"
                                                disabled={dossierClosed}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Duplicata */}
                                <div className="p-4 border-2 rounded-xl bg-gradient-to-br from-orange-50/70 to-amber-50/70 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
                                    <div className="mb-3">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded border border-orange-300">
                                            <CreditCard className="h-3 w-3" />
                                            Duplicata (optionnel)
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-sm font-medium">Date de délivrance</Label>
                                            <Input
                                                type="date"
                                                value={data.date_delivrance_duplicata}
                                                onChange={(e) => handleChange('date_delivrance_duplicata', e.target.value)}
                                                className="mt-1"
                                                disabled={dossierClosed}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Lieu de délivrance</Label>
                                            <Input
                                                value={data.lieu_delivrance_duplicata}
                                                onChange={(e) => handleChange('lieu_delivrance_duplicata', e.target.value)}
                                                className="mt-1"
                                                disabled={dossierClosed}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CONTACT & RÉSIDENCE */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Home className="h-4 w-4 text-green-600 flex-shrink-0" />
                                <h4 className="font-semibold text-sm sm:text-base">Contact & Résidence</h4>
                            </div>
                            
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <Label className="text-sm font-medium flex items-center gap-1.5">
                                        <Briefcase className="h-3.5 w-3.5" />
                                        Profession
                                    </Label>
                                    <Input
                                        value={data.occupation}
                                        onChange={(e) => handleChange('occupation', e.target.value)}
                                        className="mt-1"
                                        disabled={dossierClosed}
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5" />
                                        Téléphone
                                    </Label>
                                    <Input
                                        type="tel"
                                        value={data.telephone}
                                        onChange={(e) => handleChange('telephone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="mt-1"
                                        placeholder="0340123456"
                                        maxLength={10}
                                        disabled={dossierClosed}
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium flex items-center gap-1.5">
                                        <Flag className="h-3.5 w-3.5" />
                                        Nationalité
                                    </Label>
                                    <Input
                                        value={data.nationalite}
                                        onChange={(e) => handleChange('nationalite', e.target.value)}
                                        className="mt-1"
                                        disabled={dossierClosed}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-medium flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                    Domiciliation
                                </Label>
                                <Input
                                    value={data.domiciliation}
                                    onChange={(e) => handleChange('domiciliation', e.target.value)}
                                    className="mt-1"
                                    placeholder="Adresse complète"
                                    disabled={dossierClosed}
                                />
                            </div>

                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                <div>
                                    <Label className="text-sm font-medium">Situation familiale</Label>
                                    <Select value={data.situation_familiale} onValueChange={(v) => handleChange('situation_familiale', v)} disabled={dossierClosed}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Non spécifiée">Non spécifiée</SelectItem>
                                            <SelectItem value="Célibataire">Célibataire</SelectItem>
                                            <SelectItem value="Marié(e)">Marié(e)</SelectItem>
                                            <SelectItem value="Veuf/Veuve">Veuf/Veuve</SelectItem>
                                            <SelectItem value="Divorcé(e)">Divorcé(e)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Régime matrimonial</Label>
                                    <Select value={data.regime_matrimoniale} onValueChange={(v) => handleChange('regime_matrimoniale', v)} disabled={dossierClosed}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Non spécifié">Non spécifié</SelectItem>
                                            <SelectItem value="zara-mira">Zara-Mira</SelectItem>
                                            <SelectItem value="kitay telo an-dalana">Kitay telo an-dalana</SelectItem>
                                            <SelectItem value="Séparations des biens">Séparations des biens</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* MARIAGE (conditionnel) */}
                        {data.situation_familiale === 'Marié(e)' && (
                            <div className="space-y-4 p-4 bg-pink-50/70 dark:bg-pink-950/20 rounded-xl border-2 border-pink-200 dark:border-pink-800">
                                <div className="flex items-center gap-2 pb-2 border-b border-pink-300 dark:border-pink-700">
                                    <Heart className="h-4 w-4 text-pink-600 flex-shrink-0" />
                                    <h4 className="font-semibold text-sm sm:text-base">Informations de mariage</h4>
                                </div>
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                    <div className="sm:col-span-2 lg:col-span-1">
                                        <Label className="text-sm font-medium flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5" />
                                            Marié(e) à
                                        </Label>
                                        <Input
                                            value={data.marie_a}
                                            onChange={(e) => handleChange('marie_a', e.target.value)}
                                            className="mt-1"
                                            disabled={dossierClosed}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Date mariage
                                        </Label>
                                        <Input
                                            type="date"
                                            value={data.date_mariage}
                                            onChange={(e) => handleChange('date_mariage', e.target.value)}
                                            className="mt-1"
                                            disabled={dossierClosed}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5" />
                                            Lieu mariage
                                        </Label>
                                        <Input
                                            value={data.lieu_mariage}
                                            onChange={(e) => handleChange('lieu_mariage', e.target.value)}
                                            className="mt-1"
                                            disabled={dossierClosed}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="sticky bottom-0 pt-4 pb-2 bg-white dark:bg-gray-950 border-t">
                        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={processing}
                                className="w-full sm:w-auto"
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={processing || dossierClosed}
                                className="w-full sm:w-auto gap-2"
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
                </div>
            </DialogContent>
        </Dialog>
    );
}