// pages/demandeurs/create.tsx
// ✅ VERSION REDESIGNÉE FINALE - Labels rouges sans badge "Obligatoire"

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Trash2, Search, AlertCircle, CheckCircle2, User, CreditCard, Calendar, Home, Phone, FileText, Heart } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export interface DemandeurFormData {
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
    [key: string]: any;
}

export interface DemandeurFormProps {
    data: DemandeurFormData;
    onChange: (field: keyof DemandeurFormData, value: string) => void;
    onRemove?: () => void;
    index?: number;
    showRemoveButton?: boolean;
}

export const emptyDemandeur: DemandeurFormData = {
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
};

export default function DemandeurCreate({
    data,
    onChange,
    onRemove,
    index = 0,
    showRemoveButton = false
}: DemandeurFormProps) {
    
    const [cinSearchStatus, setCinSearchStatus] = useState<'idle' | 'searching' | 'found' | 'not-found'>('idle');
    const [searchMessage, setSearchMessage] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleTitreChange = useCallback((value: string) => {
        const sexe = value === 'Monsieur' ? 'Homme' : 
                     value === 'Madame' || value === 'Mademoiselle' ? 'Femme' : '';
        
        onChange('titre_demandeur', value);
        onChange('sexe', sexe);
    }, [onChange]);

    const handleCinChange = useCallback(async (value: string) => {
        onChange('cin', value);
        
        if (value.length === 12 && /^\d{12}$/.test(value)) {
            await searchDemandeurByCin(value);
        } else if (value.length < 12) {
            setCinSearchStatus('idle');
            setSearchMessage('');
        }
    }, [onChange]);

    const searchDemandeurByCin = async (cin: string) => {
        if (isSearching) return;
        
        setIsSearching(true);
        setCinSearchStatus('searching');
        setSearchMessage('Recherche en cours...');

        try {
            const response = await fetch(window.route('api.demandeur.search-by-cin', { cin }), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const result = await response.json();

            if (result.found) {
                setCinSearchStatus('found');
                setSearchMessage(result.message);
                
                const demandeur = result.demandeur;
                Object.keys(demandeur).forEach((key) => {
                    if (key !== 'cin') {
                        onChange(key as keyof DemandeurFormData, demandeur[key] || '');
                    }
                });
            } else {
                setCinSearchStatus('not-found');
                setSearchMessage(result.message || 'Nouveau demandeur - Remplissez les informations');
            }
        } catch (error) {
            console.error('Erreur recherche CIN:', error);
            setCinSearchStatus('idle');
            setSearchMessage('Erreur lors de la recherche');
        } finally {
            setIsSearching(false);
        }
    };

    const handleManualSearch = () => {
        if (data.cin.length === 12) {
            searchDemandeurByCin(data.cin);
        }
    };

    return (
        <div className="space-y-8">
            {/* ✅ HEADER avec badge numéro */}
            {showRemoveButton && onRemove && (
                <div className="flex justify-between items-center pb-6 border-b-2 border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3">
                        <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-base px-3 py-1">
                            #{typeof index !== 'undefined' ? index + 1 : ''}
                        </Badge>
                        <h3 className="text-xl font-bold">
                            Demandeur {typeof index !== 'undefined' ? index + 1 : ''}
                        </h3>
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={onRemove}
                        className="h-9 gap-2 shadow-md"
                    >
                        <Trash2 className="h-4 w-4" />
                        Retirer
                    </Button>
                </div>
            )}

            {/* ✅ SECTION CIN - Style violet */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-violet-200 dark:border-violet-800">
                    <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                        <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-violet-900 dark:text-violet-100">
                            Identification
                        </h4>
                        <p className="text-xs text-muted-foreground">Recherche automatique par CIN</p>
                    </div>
                </div>

                <div className="w-full max-w-2xl">
                    <Label className="text-sm font-medium text-red-600">CIN (12 chiffres) *</Label>
                    <div className="flex gap-3 items-start mt-2">
                        <div className="flex-1 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 p-4 rounded-lg border-2 border-violet-200 dark:border-violet-800">
                            <InputOTP
                                maxLength={12}
                                value={data.cin}
                                onChange={handleCinChange}
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
                            {data.cin && data.cin.length < 12 && (
                                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {12 - data.cin.length} chiffre(s) manquant(s)
                                </p>
                            )}
                        </div>
                        
                        {data.cin.length === 12 && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleManualSearch}
                                disabled={isSearching}
                                className="h-[72px] gap-2 shadow-md"
                            >
                                <Search className="h-4 w-4" />
                                Rechercher
                            </Button>
                        )}
                    </div>
                </div>

                {cinSearchStatus !== 'idle' && searchMessage && (
                    <Alert 
                        variant={cinSearchStatus === 'found' ? 'default' : 'destructive'} 
                        className={cinSearchStatus === 'found' 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800' 
                            : ''}
                    >
                        {cinSearchStatus === 'found' ? (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <AlertDescription className="ml-2">
                                    <div className="space-y-2">
                                        <p className="font-semibold text-green-900 dark:text-green-100">
                                            ✓ Demandeur existant trouvé
                                        </p>
                                        <p className="text-sm text-green-800 dark:text-green-200">
                                            Les informations ont été chargées automatiquement.
                                        </p>
                                        <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                                            <p>• Vous pouvez modifier les informations si nécessaire</p>
                                            <p>• Les modifications seront sauvegardées</p>
                                        </div>
                                    </div>
                                </AlertDescription>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="ml-2">
                                    {searchMessage}
                                </AlertDescription>
                            </>
                        )}
                    </Alert>
                )}
            </div>

            {/* ✅ SECTION IDENTITÉ - Style bleu */}
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
                        <Select
                            value={data.titre_demandeur || ''}
                            onValueChange={handleTitreChange}
                        >
                            <SelectTrigger className={`h-11 ${!data.titre_demandeur ? 'text-muted-foreground' : ''}`}>
                                <SelectValue placeholder="Sélectionner un titre" />
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
                            type="text"
                            value={data.nom_demandeur}
                            onChange={(e) => onChange('nom_demandeur', e.target.value.toUpperCase())}
                            placeholder="RAKOTO"
                            className="uppercase h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-red-600">Prénom *</Label>
                        <Input
                            type="text"
                            value={data.prenom_demandeur}
                            onChange={(e) => onChange('prenom_demandeur', e.target.value)}
                            placeholder="Jean"
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
                            onChange={(e) => onChange('date_naissance', e.target.value)}
                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Lieu de naissance</Label>
                        <Input
                            type="text"
                            value={data.lieu_naissance}
                            onChange={(e) => onChange('lieu_naissance', e.target.value)}
                            placeholder="Antananarivo"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Nom complet Père</Label>
                        <Input
                            type="text"
                            value={data.nom_pere}
                            onChange={(e) => onChange('nom_pere', e.target.value)}
                            placeholder="RANDRIA Jean"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Nom complet Mère</Label>
                        <Input
                            type="text"
                            value={data.nom_mere}
                            onChange={(e) => onChange('nom_mere', e.target.value)}
                            placeholder="RABE Marie"
                            className="h-11"
                        />
                    </div>
                </div>
            </div>

            {/* ✅ SECTION DÉLIVRANCE CIN - Style indigo */}
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
                        <Label className="text-sm font-medium">Date Délivrance CIN</Label>
                        <Input
                            type="date"
                            value={data.date_delivrance}
                            onChange={(e) => onChange('date_delivrance', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Lieu Délivrance</Label>
                        <Input
                            type="text"
                            value={data.lieu_delivrance}
                            onChange={(e) => onChange('lieu_delivrance', e.target.value)}
                            placeholder="Antananarivo"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Date Duplicata</Label>
                        <Input
                            type="date"
                            value={data.date_delivrance_duplicata}
                            onChange={(e) => onChange('date_delivrance_duplicata', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Lieu Duplicata</Label>
                        <Input
                            type="text"
                            value={data.lieu_delivrance_duplicata}
                            onChange={(e) => onChange('lieu_delivrance_duplicata', e.target.value)}
                            placeholder="Toliara"
                            className="h-11"
                        />
                    </div>
                </div>
            </div>

            {/* ✅ SECTION CONTACT - Style vert */}
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
                            type="text"
                            value={data.occupation}
                            onChange={(e) => onChange('occupation', e.target.value)}
                            placeholder="Agriculteur"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Domiciliation</Label>
                        <Input
                            type="text"
                            value={data.domiciliation}
                            onChange={(e) => onChange('domiciliation', e.target.value)}
                            placeholder="Antananarivo"
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
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                onChange('telephone', value);
                            }}
                            placeholder="0340000000"
                            maxLength={10}
                            className="h-11"
                        />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Situation Familiale</Label>
                        <Select
                            value={data.situation_familiale}
                            onValueChange={(value) => onChange('situation_familiale', value)}
                        >
                            <SelectTrigger className="h-11">
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
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Régime matrimonial</Label>
                        <Select
                            value={data.regime_matrimoniale}
                            onValueChange={(value) => onChange('regime_matrimoniale', value)}
                        >
                            <SelectTrigger className="h-11">
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
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Nationalité</Label>
                        <Input
                            type="text"
                            value={data.nationalite}
                            onChange={(e) => onChange('nationalite', e.target.value)}
                            placeholder="Malagasy"
                            className="h-11"
                        />
                    </div>
                </div>
            </div>

            {/* ✅ SECTION MARIAGE - Style rose (conditionnel) */}
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
                                type="text"
                                value={data.marie_a}
                                onChange={(e) => onChange('marie_a', e.target.value)}
                                placeholder="Nom du conjoint"
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Date de Mariage</Label>
                            <Input
                                type="date"
                                value={data.date_mariage}
                                onChange={(e) => onChange('date_mariage', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Lieu de Mariage</Label>
                            <Input
                                type="text"
                                value={data.lieu_mariage}
                                onChange={(e) => onChange('lieu_mariage', e.target.value)}
                                placeholder="Antananarivo"
                                className="h-11"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ INFO PIÈCES JOINTES */}
            {index === 0 && (
                <Alert className="border-0 shadow-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <AlertDescription>
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                    Documents justificatifs
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-400">
                                    Les pièces jointes (CIN, actes, etc.) pourront être ajoutées après création
                                </p>
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>
            )}
        </div>
    );
}