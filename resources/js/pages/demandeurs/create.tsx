// pages/demandeurs/create.tsx
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Search, AlertCircle, CheckCircle2, User, CreditCard, Calendar, Home, Phone, Heart, Info } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/useResponsive';

export function DemandeurExistantAlert({ 
    cinSearchStatus, 
    searchMessage 
}: { 
    cinSearchStatus: 'idle' | 'searching' | 'found' | 'not-found';
    searchMessage: string;
}) {
    const isMobile = useIsMobile();
    
    if (cinSearchStatus === 'idle' || !searchMessage) return null;

    if (cinSearchStatus === 'found') {
        return (
            <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-300 dark:border-green-700 shadow-md">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <AlertDescription className="ml-2">
                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-green-900 dark:text-green-100 text-sm sm:text-base">
                                Demandeur existant trouvé
                            </p>
                        </div>

                        <p className="text-xs sm:text-sm text-green-800 dark:text-green-200">
                            Les informations ont été chargées automatiquement.
                        </p>

                        <div className="bg-green-100/60 dark:bg-green-900/30 p-3 sm:p-4 rounded-lg border border-green-200 dark:border-green-800 space-y-2">
                            <div className="flex items-start gap-2">
                                <Info className="h-3 w-3 sm:h-4 sm:w-4 text-green-700 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <div className="space-y-2 text-xs text-green-900 dark:text-green-200 min-w-0 flex-1">
                                    <p className="font-semibold">Que pouvez-vous faire ?</p>
                                    <ul className="space-y-1 pl-3 sm:pl-4">
                                        <li className="flex items-start gap-1 sm:gap-2">
                                            <span className="text-green-600 dark:text-green-400 flex-shrink-0">•</span>
                                            <span className="break-words"><strong>Modifier</strong> les informations si nécessaire</span>
                                        </li>
                                        <li className="flex items-start gap-1 sm:gap-2">
                                            <span className="text-green-600 dark:text-green-400 flex-shrink-0">•</span>
                                            <span className="break-words"><strong>Garder</strong> les informations telles quelles</span>
                                        </li>
                                        <li className="flex items-start gap-1 sm:gap-2">
                                            <span className="text-green-600 dark:text-green-400 flex-shrink-0">•</span>
                                            <span className="break-words">Le demandeur sera automatiquement <strong>lié</strong> à cette propriété</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-amber-50/80 dark:bg-amber-900/20 p-2 sm:p-3 rounded border border-amber-200 dark:border-amber-800 mt-2 sm:mt-3">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-900 dark:text-amber-200 break-words min-w-0 flex-1">
                                        <strong>Important :</strong> Si vous modifiez les informations, 
                                        elles seront mises à jour pour <strong>toutes</strong> les propriétés.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Alert variant="destructive" className="shadow-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <AlertDescription className="ml-2 min-w-0 flex-1">
                <p className="font-semibold text-sm break-words">{searchMessage}</p>
                <p className="text-xs mt-1">
                    Un nouveau demandeur sera créé.
                </p>
            </AlertDescription>
        </Alert>
    );
}

export interface DemandeurFormData {
    _tempId?: number;
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
    _is_update?: boolean;
    _existing_id?: number;
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
    const isMobile = useIsMobile();
    
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
            const url = window.route('search.demandeur.cin', { cin });
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Session expirée. Veuillez vous reconnecter.');
                }
                if (response.status === 403) {
                    throw new Error('Accès refusé. Permissions insuffisantes.');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();

            if (result.found) {
                setCinSearchStatus('found');
                
                let displayMessage = result.message || 'Demandeur trouvé';
                
                if (result.meta && !result.meta.same_district) {
                    displayMessage += '\nAttention : Ce demandeur provient d\'un autre district.';
                }
                
                setSearchMessage(displayMessage);
                
                const demandeur = result.demandeur;
                
                Object.keys(demandeur).forEach((key) => {
                    if (key !== 'cin') {
                        const value = demandeur[key];
                        onChange(key as keyof DemandeurFormData, value ?? '');
                    }
                });
            } else {
                setCinSearchStatus('not-found');
                setSearchMessage(result.message || 'Nouveau demandeur');
            }
        } catch (error) {
            console.error('Erreur recherche CIN:', error);
            setCinSearchStatus('idle');
            
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la recherche';
            setSearchMessage(errorMessage);
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
        <div className="space-y-6 sm:space-y-8">
            {showRemoveButton && onRemove && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-4 sm:pb-6 border-b-2 border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm sm:text-base px-2 sm:px-3 py-1 flex-shrink-0">
                            #{typeof index !== 'undefined' ? index + 1 : ''}
                        </Badge>
                        <h3 className="text-lg sm:text-xl font-bold truncate">
                            Demandeur {typeof index !== 'undefined' ? index + 1 : ''}
                        </h3>
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={onRemove}
                        className="h-8 sm:h-9 gap-2 shadow-md w-full sm:w-auto"
                    >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        Retirer
                    </Button>
                </div>
            )}

            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b-2 border-violet-200 dark:border-violet-800">
                    <div className="p-1.5 sm:p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex-shrink-0">
                        <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-violet-900 dark:text-violet-100 truncate">
                            Identification
                        </h4>
                        <p className="text-xs text-muted-foreground">Recherche automatique par CIN</p>
                    </div>
                </div>

                <div className="w-full">
                    <Label className="text-xs sm:text-sm font-medium text-red-600">CIN (12 chiffres) *</Label>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start mt-2">
                        <div className="flex-1 w-full p-3 sm:p-4 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-lg border-2 border-violet-200 dark:border-violet-800">
                            <Input
                                type="text"
                                value={data.cin}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                                    handleCinChange(value);
                                }}
                                placeholder="123456789012"
                                maxLength={12}
                                className="text-center font-mono text-base sm:text-lg tracking-wider h-11 sm:h-12"
                            />
                            <p className="text-xs text-center text-muted-foreground mt-2">
                                Format: {data.cin ? data.cin.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4') : '--- --- --- ---'}
                            </p>
                            {data.cin && data.cin.length < 12 && (
                                <p className="text-xs text-red-500 mt-2 flex items-center gap-1 justify-center">
                                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                    <span>{12 - data.cin.length} chiffre(s) manquant(s)</span>
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
                                className="h-auto min-h-[56px] sm:min-h-[64px] gap-2 shadow-md w-full sm:w-auto px-4"
                            >
                                <Search className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">Rechercher</span>
                            </Button>
                        )}
                    </div>
                </div>

                {cinSearchStatus !== 'idle' && searchMessage && (
                    <DemandeurExistantAlert 
                        cinSearchStatus={cinSearchStatus}
                        searchMessage={searchMessage}
                    />
                )}
            </div>

            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b-2 border-blue-200 dark:border-blue-800">
                    <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100 truncate">
                            Identité
                        </h4>
                        <p className="text-xs text-muted-foreground">Informations personnelles</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium text-red-600">Titre de civilité *</Label>
                        <Select
                            value={data.titre_demandeur || ''}
                            onValueChange={handleTitreChange}
                        >
                            <SelectTrigger className={`h-10 sm:h-11 text-sm sm:text-base ${!data.titre_demandeur ? 'text-muted-foreground' : ''}`}>
                                <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Monsieur">Monsieur</SelectItem>
                                <SelectItem value="Madame">Madame</SelectItem>
                                <SelectItem value="Mademoiselle">Mademoiselle</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium text-red-600">Nom *</Label>
                        <Input
                            type="text"
                            value={data.nom_demandeur}
                            onChange={(e) => onChange('nom_demandeur', e.target.value.toUpperCase())}
                            placeholder=""
                            className="uppercase h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium text-red-600">Prénom *</Label>
                        <Input
                            type="text"
                            value={data.prenom_demandeur}
                            onChange={(e) => onChange('prenom_demandeur', e.target.value)}
                            placeholder=""
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium text-red-600">Date de naissance *</Label>
                        <Input
                            type="date"
                            value={data.date_naissance}
                            onChange={(e) => onChange('date_naissance', e.target.value)}
                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Lieu de naissance</Label>
                        <Input
                            type="text"
                            value={data.lieu_naissance}
                            onChange={(e) => onChange('lieu_naissance', e.target.value)}
                            placeholder=""
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Nom complet Père</Label>
                        <Input
                            type="text"
                            value={data.nom_pere}
                            onChange={(e) => onChange('nom_pere', e.target.value)}
                            placeholder=""
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Nom complet Mère</Label>
                        <Input
                            type="text"
                            value={data.nom_mere}
                            onChange={(e) => onChange('nom_mere', e.target.value)}
                            placeholder=""
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b-2 border-indigo-200 dark:border-indigo-800">
                    <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex-shrink-0">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-indigo-900 dark:text-indigo-100 truncate">
                            Délivrance CIN
                        </h4>
                        <p className="text-xs text-muted-foreground">Informations de délivrance</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Date Délivrance</Label>
                        <Input
                            type="date"
                            value={data.date_delivrance}
                            onChange={(e) => onChange('date_delivrance', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Lieu Délivrance</Label>
                        <Input
                            type="text"
                            value={data.lieu_delivrance}
                            onChange={(e) => onChange('lieu_delivrance', e.target.value)}
                            placeholder=""
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Date Duplicata</Label>
                        <Input
                            type="date"
                            value={data.date_delivrance_duplicata}
                            onChange={(e) => onChange('date_delivrance_duplicata', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Lieu Duplicata</Label>
                        <Input
                            type="text"
                            value={data.lieu_delivrance_duplicata}
                            onChange={(e) => onChange('lieu_delivrance_duplicata', e.target.value)}
                            placeholder=""
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b-2 border-green-200 dark:border-green-800">
                    <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                        <Home className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-green-900 dark:text-green-100 truncate">
                            Contact & Résidence
                        </h4>
                        <p className="text-xs text-muted-foreground">Coordonnées et domiciliation</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Occupation</Label>
                        <Input
                            type="text"
                            value={data.occupation}
                            onChange={(e) => onChange('occupation', e.target.value)}
                            placeholder=""
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Domiciliation</Label>
                        <Input
                            type="text"
                            value={data.domiciliation}
                            onChange={(e) => onChange('domiciliation', e.target.value)}
                            placeholder=""
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            Téléphone
                        </Label>
                        <Input
                            type="tel"
                            value={data.telephone}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                onChange('telephone', value);
                            }}
                            placeholder=""
                            maxLength={10}
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Situation Familiale</Label>
                        <Select
                            value={data.situation_familiale}
                            onValueChange={(value) => onChange('situation_familiale', value)}
                        >
                            <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
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
                        <Label className="text-xs sm:text-sm font-medium">Régime matrimonial</Label>
                        <Select
                            value={data.regime_matrimoniale}
                            onValueChange={(value) => onChange('regime_matrimoniale', value)}
                        >
                            <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
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
                        <Label className="text-xs sm:text-sm font-medium">Nationalité</Label>
                        <Input
                            type="text"
                            value={data.nationalite}
                            onChange={(e) => onChange('nationalite', e.target.value)}
                            placeholder="Malagasy"
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                </div>
            </div>

            {data.situation_familiale === 'Marié(e)' && (
                <div className="space-y-3 sm:space-y-4 p-4 sm:p-6 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 rounded-xl border-2 border-pink-200 dark:border-pink-800 shadow-md">
                    <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b-2 border-pink-300 dark:border-pink-700">
                        <div className="p-1.5 sm:p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex-shrink-0">
                            <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-base sm:text-lg font-semibold text-pink-900 dark:text-pink-100 truncate">
                                Informations de Mariage
                            </h4>
                            <p className="text-xs text-muted-foreground">Détails du conjoint</p>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label className="text-xs sm:text-sm font-medium">Marié(e) à</Label>
                            <Input
                                type="text"
                                value={data.marie_a}
                                onChange={(e) => onChange('marie_a', e.target.value)}
                                placeholder="Nom du conjoint"
                                className="h-10 sm:h-11 text-sm sm:text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs sm:text-sm font-medium">Date de Mariage</Label>
                            <Input
                                type="date"
                                value={data.date_mariage}
                                onChange={(e) => onChange('date_mariage', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="h-10 sm:h-11 text-sm sm:text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs sm:text-sm font-medium">Lieu de Mariage</Label>
                            <Input
                                type="text"
                                value={data.lieu_mariage}
                                onChange={(e) => onChange('lieu_mariage', e.target.value)}
                                placeholder=""
                                className="h-10 sm:h-11 text-sm sm:text-base"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}