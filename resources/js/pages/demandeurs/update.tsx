// demandeurs/update.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { 
    ArrowLeft, 
    Save, 
    AlertTriangle, 
    User, 
    CreditCard, 
    Calendar, 
    Home, 
    Phone, 
    Heart,
    UserCircle,
    CheckCircle2
} from 'lucide-react';

// Types
interface DemandeurFormData {
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

interface Demandeur extends DemandeurFormData {
    id: number;
}

interface Dossier {
    id: number;
    nom_dossier: string;
    is_closed: boolean;
}

export default function DemandeurUpdate() {
    // Données simulées pour la démo
    const demandeur: Demandeur = {
        id: 1,
        titre_demandeur: 'Monsieur',
        nom_demandeur: 'RAKOTO',
        prenom_demandeur: 'Jean',
        date_naissance: '1980-05-15',
        lieu_naissance: 'Antananarivo',
        sexe: 'Homme',
        occupation: 'Agriculteur',
        nom_pere: 'RANDRIA Pierre',
        nom_mere: 'RABE Marie',
        cin: '101234567890',
        date_delivrance: '2010-03-20',
        lieu_delivrance: 'Antananarivo',
        date_delivrance_duplicata: '',
        lieu_delivrance_duplicata: '',
        domiciliation: 'Lot II 25 Antananarivo',
        nationalite: 'Malagasy',
        situation_familiale: 'Marié(e)',
        regime_matrimoniale: 'zara-mira',
        date_mariage: '2005-12-10',
        lieu_mariage: 'Antananarivo',
        marie_a: 'RASOA Hélène',
        telephone: '0340000000',
    };

    const dossier: Dossier = {
        id: 1,
        nom_dossier: 'DOSSIER-2024-001',
        is_closed: false,
    };

    const [data, setData] = useState<DemandeurFormData>({ ...demandeur });
    const [processing, setProcessing] = useState(false);

    const handleChange = (field: keyof DemandeurFormData, value: string) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handleTitreChange = (value: string) => {
        const sexe = value === 'Monsieur' ? 'Homme' : 
                     value === 'Madame' || value === 'Mademoiselle' ? 'Femme' : '';
        
        handleChange('titre_demandeur', value);
        handleChange('sexe', sexe);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        
        // Simulation
        setTimeout(() => {
            setProcessing(false);
            alert('Demandeur modifié avec succès !');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950 dark:to-gray-900">
            <div className="container mx-auto p-6 max-w-6xl">
                {/* ✅ HEADER MODERNE - Style Emerald/Teal */}
                <div className="mb-8">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mb-6 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour au dossier
                    </Button>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl shadow-lg">
                                <UserCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                    Modifier le demandeur
                                </h1>
                                <div className="flex items-center gap-3 mt-2">
                                    <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md">
                                        {demandeur.titre_demandeur} {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
                                    </Badge>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-muted-foreground">{dossier.nom_dossier}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ✅ ALERTE SI DOSSIER FERMÉ */}
                {dossier.is_closed && (
                    <Alert variant="destructive" className="mb-6 border-0 shadow-lg">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Ce dossier est fermé. Aucune modification n'est possible.
                        </AlertDescription>
                    </Alert>
                )}

                {/* ✅ FORMULAIRE PRINCIPAL */}
                <form onSubmit={handleSubmit}>
                    <Card className="border-0 shadow-xl">
                        {/* <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Informations du demandeur</CardTitle>
                                    <CardDescription className="mt-1">
                                        Modifiez les informations et cliquez sur "Enregistrer"
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader> */}
                        
                        <CardContent className="p-8 space-y-8">
                            {/* SECTION CIN */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b-2 border-violet-200 dark:border-violet-800">
                                    <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                        <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-violet-900 dark:text-violet-100">
                                            Identification
                                        </h4>
                                        <p className="text-xs text-muted-foreground">Numéro CIN unique</p>
                                    </div>
                                </div>

                                <div className="w-full max-w-2xl">
                                    <Label className="text-sm font-medium text-red-600 mb-2 block">
                                        CIN (12 chiffres) *
                                    </Label>
                                    <div className="bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 p-4 rounded-lg border-2 border-violet-200 dark:border-violet-800">
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
                                    </div>
                                </div>
                            </div>

                            {/* SECTION IDENTITÉ */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-200 dark:border-blue-800">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                            Identité
                                        </h4>
                                        <p className="text-xs text-muted-foreground">Informations personnelles</p>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-red-600">Titre de civilité *</Label>
                                        <Select value={data.titre_demandeur} onValueChange={handleTitreChange}>
                                            <SelectTrigger className="h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Monsieur">Monsieur</SelectItem>
                                                <SelectItem value="Madame">Madame</SelectItem>
                                                <SelectItem value="Mademoiselle">Mademoiselle</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-red-600">Nom *</Label>
                                        <Input
                                            value={data.nom_demandeur}
                                            onChange={(e) => handleChange('nom_demandeur', e.target.value.toUpperCase())}
                                            className="uppercase h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-red-600">Prénom *</Label>
                                        <Input
                                            value={data.prenom_demandeur}
                                            onChange={(e) => handleChange('prenom_demandeur', e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-red-600">Date de naissance *</Label>
                                        <Input
                                            type="date"
                                            value={data.date_naissance}
                                            onChange={(e) => handleChange('date_naissance', e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Lieu de naissance</Label>
                                        <Input
                                            value={data.lieu_naissance}
                                            onChange={(e) => handleChange('lieu_naissance', e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Nom complet Père</Label>
                                        <Input
                                            value={data.nom_pere}
                                            onChange={(e) => handleChange('nom_pere', e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Nom complet Mère</Label>
                                        <Input
                                            value={data.nom_mere}
                                            onChange={(e) => handleChange('nom_mere', e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION DÉLIVRANCE CIN */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b-2 border-indigo-200 dark:border-indigo-800">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                        <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                                            Délivrance CIN
                                        </h4>
                                        <p className="text-xs text-muted-foreground">Informations de délivrance</p>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Date Délivrance</Label>
                                        <Input
                                            type="date"
                                            value={data.date_delivrance}
                                            onChange={(e) => handleChange('date_delivrance', e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Lieu Délivrance</Label>
                                        <Input
                                            value={data.lieu_delivrance}
                                            onChange={(e) => handleChange('lieu_delivrance', e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Date Duplicata</Label>
                                        <Input
                                            type="date"
                                            value={data.date_delivrance_duplicata}
                                            onChange={(e) => handleChange('date_delivrance_duplicata', e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Lieu Duplicata</Label>
                                        <Input
                                            value={data.lieu_delivrance_duplicata}
                                            onChange={(e) => handleChange('lieu_delivrance_duplicata', e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION CONTACT */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b-2 border-green-200 dark:border-green-800">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <Home className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
                                            Contact & Résidence
                                        </h4>
                                        <p className="text-xs text-muted-foreground">Coordonnées et domiciliation</p>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Occupation</Label>
                                        <Input
                                            value={data.occupation}
                                            onChange={(e) => handleChange('occupation', e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Domiciliation</Label>
                                        <Input
                                            value={data.domiciliation}
                                            onChange={(e) => handleChange('domiciliation', e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <Phone className="h-3 w-3" />
                                            Téléphone
                                        </Label>
                                        <Input
                                            type="tel"
                                            value={data.telephone}
                                            onChange={(e) => handleChange('telephone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            className="h-11"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Situation Familiale</Label>
                                        <Select value={data.situation_familiale} onValueChange={(v) => handleChange('situation_familiale', v)}>
                                            <SelectTrigger className="h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Célibataire">Célibataire</SelectItem>
                                                <SelectItem value="Marié(e)">Marié(e)</SelectItem>
                                                <SelectItem value="Veuf/Veuve">Veuf/Veuve</SelectItem>
                                                <SelectItem value="Divorcé(e)">Divorcé(e)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Régime matrimonial</Label>
                                        <Select value={data.regime_matrimoniale} onValueChange={(v) => handleChange('regime_matrimoniale', v)}>
                                            <SelectTrigger className="h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="zara-mira">Zara-Mira</SelectItem>
                                                <SelectItem value="kitay telo an-dalana">Kitay telo an-dalana</SelectItem>
                                                <SelectItem value="Séparations des biens">Séparations des biens</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Nationalité</Label>
                                        <Input
                                            value={data.nationalite}
                                            onChange={(e) => handleChange('nationalite', e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION MARIAGE (si marié) */}
                            {data.situation_familiale === 'Marié(e)' && (
                                <div className="space-y-4 p-6 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 rounded-xl border-2 border-pink-200 dark:border-pink-800 shadow-md">
                                    <div className="flex items-center gap-3 pb-3 border-b-2 border-pink-300 dark:border-pink-700">
                                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                            <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-pink-900 dark:text-pink-100">
                                                Informations de Mariage
                                            </h4>
                                            <p className="text-xs text-muted-foreground">Détails du conjoint</p>
                                        </div>
                                    </div>
                                    <div className="grid gap-6 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Marié(e) à</Label>
                                            <Input
                                                value={data.marie_a}
                                                onChange={(e) => handleChange('marie_a', e.target.value)}
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Date de Mariage</Label>
                                            <Input
                                                type="date"
                                                value={data.date_mariage}
                                                onChange={(e) => handleChange('date_mariage', e.target.value)}
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Lieu de Mariage</Label>
                                            <Input
                                                value={data.lieu_mariage}
                                                onChange={(e) => handleChange('lieu_mariage', e.target.value)}
                                                className="h-11"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ✅ ACTIONS - Fixed en bas */}
                    <div className="sticky bottom-0 mt-6 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t-2 border-emerald-200 dark:border-emerald-800 rounded-lg shadow-xl">
                        <div className="flex gap-4 justify-end max-w-6xl mx-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                                disabled={processing}
                                className="h-11 px-6"
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || dossier.is_closed}
                                className="h-11 px-8 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all"
                            >
                                {processing ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-5 w-5" />
                                        Enregistrer les modifications
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}