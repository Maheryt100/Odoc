// pages/demandeurs/components/EditDemandeurDialog.tsx
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
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { 
    User, 
    CreditCard, 
    Calendar, 
    Home, 
    Heart,
    CheckCircle2,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

    // ✅ CORRECTION : Charger les données quand le dialogue s'ouvre
    useEffect(() => {
        if (open && demandeur) {
            console.log('📋 Chargement des données du demandeur:', demandeur);
            
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
            
            console.log('✅ Données chargées dans le formulaire');
            setErrors({});
        }
    }, [open, demandeur]);

    const handleChange = (field: keyof FormData, value: string) => {
        setData(prev => ({ ...prev, [field]: value }));
        // Effacer l'erreur du champ modifié
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
                    console.log('✅ Modification réussie');
                    onOpenChange(false);
                },
                onError: (errors) => {
                    console.error('❌ Erreurs de validation:', errors);
                    setErrors(errors);
                },
                onFinish: () => {
                    setProcessing(false);
                }
            }
        );
    };

    if (!demandeur) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4 border-b">
                    <DialogTitle className="text-2xl flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        Modifier le demandeur
                    </DialogTitle>
                </DialogHeader>

                {dossierClosed && (
                    <Alert variant="destructive" className="border-0">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Ce dossier est fermé. Aucune modification n'est possible.
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-1">
                    <div className="space-y-6 pb-4">
                        {/* CIN */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <CreditCard className="h-4 w-4 text-violet-600" />
                                <h4 className="font-semibold">Identification</h4>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-red-600">CIN *</Label>
                                <div className="mt-2 bg-violet-50/50 dark:bg-violet-950/20 p-3 rounded-lg border">
                                    <InputOTP
                                        maxLength={12}
                                        value={data.cin}
                                        onChange={(value) => handleChange('cin', value)}
                                        pattern="[0-9]*"
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                        </InputOTPGroup>
                                        <InputOTPSeparator />
                                        <InputOTPGroup>
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                        <InputOTPSeparator />
                                        <InputOTPGroup>
                                            <InputOTPSlot index={6} />
                                            <InputOTPSlot index={7} />
                                            <InputOTPSlot index={8} />
                                        </InputOTPGroup>
                                        <InputOTPSeparator />
                                        <InputOTPGroup>
                                            <InputOTPSlot index={9} />
                                            <InputOTPSlot index={10} />
                                            <InputOTPSlot index={11} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                    {errors.cin && (
                                        <p className="text-xs text-red-500 mt-1">{errors.cin}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Identité */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <User className="h-4 w-4 text-blue-600" />
                                <h4 className="font-semibold">Identité</h4>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label className="text-sm font-medium text-red-600">Titre *</Label>
                                    <Select value={data.titre_demandeur} onValueChange={handleTitreChange}>
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
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-red-600">Prénom *</Label>
                                    <Input
                                        value={data.prenom_demandeur}
                                        onChange={(e) => handleChange('prenom_demandeur', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                    <Label className="text-sm font-medium text-red-600">Date naissance *</Label>
                                    <Input
                                        type="date"
                                        value={data.date_naissance}
                                        onChange={(e) => handleChange('date_naissance', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Lieu naissance</Label>
                                    <Input
                                        value={data.lieu_naissance}
                                        onChange={(e) => handleChange('lieu_naissance', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Nom père</Label>
                                    <Input
                                        value={data.nom_pere}
                                        onChange={(e) => handleChange('nom_pere', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Nom mère</Label>
                                    <Input
                                        value={data.nom_mere}
                                        onChange={(e) => handleChange('nom_mere', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Délivrance CIN */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Calendar className="h-4 w-4 text-indigo-600" />
                                <h4 className="font-semibold">Délivrance CIN</h4>
                            </div>
                            <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                    <Label className="text-sm font-medium">Date délivrance</Label>
                                    <Input
                                        type="date"
                                        value={data.date_delivrance}
                                        onChange={(e) => handleChange('date_delivrance', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Lieu délivrance</Label>
                                    <Input
                                        value={data.lieu_delivrance}
                                        onChange={(e) => handleChange('lieu_delivrance', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Date duplicata</Label>
                                    <Input
                                        type="date"
                                        value={data.date_delivrance_duplicata}
                                        onChange={(e) => handleChange('date_delivrance_duplicata', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Lieu duplicata</Label>
                                    <Input
                                        value={data.lieu_delivrance_duplicata}
                                        onChange={(e) => handleChange('lieu_delivrance_duplicata', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Home className="h-4 w-4 text-green-600" />
                                <h4 className="font-semibold">Contact & Résidence</h4>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label className="text-sm font-medium">Occupation</Label>
                                    <Input
                                        value={data.occupation}
                                        onChange={(e) => handleChange('occupation', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Domiciliation</Label>
                                    <Input
                                        value={data.domiciliation}
                                        onChange={(e) => handleChange('domiciliation', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Téléphone</Label>
                                    <Input
                                        type="tel"
                                        value={data.telephone}
                                        onChange={(e) => handleChange('telephone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="mt-1"
                                        maxLength={10}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label className="text-sm font-medium">Situation familiale</Label>
                                    <Select value={data.situation_familiale} onValueChange={(v) => handleChange('situation_familiale', v)}>
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
                                    <Select value={data.regime_matrimoniale} onValueChange={(v) => handleChange('regime_matrimoniale', v)}>
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
                                <div>
                                    <Label className="text-sm font-medium">Nationalité</Label>
                                    <Input
                                        value={data.nationalite}
                                        onChange={(e) => handleChange('nationalite', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mariage (si marié) */}
                        {data.situation_familiale === 'Marié(e)' && (
                            <div className="space-y-4 p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200">
                                <div className="flex items-center gap-2 pb-2 border-b border-pink-300">
                                    <Heart className="h-4 w-4 text-pink-600" />
                                    <h4 className="font-semibold">Informations de mariage</h4>
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <Label className="text-sm font-medium">Marié(e) à</Label>
                                        <Input
                                            value={data.marie_a}
                                            onChange={(e) => handleChange('marie_a', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Date mariage</Label>
                                        <Input
                                            type="date"
                                            value={data.date_mariage}
                                            onChange={(e) => handleChange('date_mariage', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Lieu mariage</Label>
                                        <Input
                                            value={data.lieu_mariage}
                                            onChange={(e) => handleChange('lieu_mariage', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="sticky bottom-0 pt-4 pb-2 bg-white dark:bg-gray-950 border-t">
                        <div className="flex gap-3 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={processing}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || dossierClosed}
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