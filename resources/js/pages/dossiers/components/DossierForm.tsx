// DossierForm.tsx - ✅ VERSION CORRIGÉE
import { useForm } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Save, Calendar, Hash, MapPin, AlertCircle, Info } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { District, Dossier } from '@/types';
import { useState, useMemo, useEffect } from 'react';

import communesData from '@/data/liste_commune_par_district.json';
import districtsData from '@/data/liste_district_par_region.json';

interface DossierFormProps {
    districts: District[];
    dossier?: Dossier;
    suggested_numero?: number;
    last_numero?: number | null;
    mode: 'create' | 'edit';
    onCancel?: () => void;
}

type CommunesStructure = {
    [region: string]: {
        [district: string]: string[];
    };
};

type DistrictsStructure = {
    [region: string]: string[];
};

export default function DossierForm({ 
    districts, 
    dossier, 
    suggested_numero,
    last_numero,
    mode,
    onCancel 
}: DossierFormProps) {
    const [openDistrict, setOpenDistrict] = useState(false);
    const [openCirconscription, setOpenCirconscription] = useState(false);
    const [openCommune, setOpenCommune] = useState(false);
    const [numeroWarning, setNumeroWarning] = useState<string | null>(null);

    // ✅ Initialisation sécurisée du numéro
    const initialNumero = useMemo(() => {
        if (mode === 'create') {
            return suggested_numero || 1;
        }
        
        if (dossier?.numero_ouverture) {
            if (typeof dossier.numero_ouverture === 'number') {
                return dossier.numero_ouverture;
            }
            const parsed = parseInt(String(dossier.numero_ouverture));
            return isNaN(parsed) ? 1 : parsed;
        }
        
        return 1;
    }, [mode, dossier, suggested_numero]);

    const { data, setData, post, put, processing, errors } = useForm({
        nom_dossier: dossier?.nom_dossier || '',
        numero_ouverture: initialNumero,
        type_commune: dossier?.type_commune || '',
        commune: dossier?.commune || '',
        fokontany: dossier?.fokontany || '',
        date_descente_debut: dossier?.date_descente_debut || '',
        date_descente_fin: dossier?.date_descente_fin || '',
        date_ouverture: dossier?.date_ouverture || '',
        circonscription: dossier?.circonscription || '',
        id_district: dossier?.id_district || 0,
    });

    // ✅ Validation du numéro avec messages détaillés
    useEffect(() => {
        if (mode === 'create' && data.numero_ouverture) {
            const num = data.numero_ouverture;
            
            if (num < 1) {
                setNumeroWarning('⚠️ Le numéro doit être supérieur à 0');
            } else if (suggested_numero && num < suggested_numero) {
                const diff = suggested_numero - num;
                const lastInfo = last_numero ? ` (dernier utilisé : ${last_numero})` : '';
                setNumeroWarning(`⚠️ Attention : vous utilisez un numéro ${diff} ${diff > 1 ? 'positions' : 'position'} plus bas que le prochain suggéré (${suggested_numero})${lastInfo}. Ce numéro sera accepté s'il n'est pas déjà utilisé.`);
            } else if (suggested_numero && num > suggested_numero) {
                const skipped = num - suggested_numero;
                const plural = skipped > 1 ? 's' : '';
                setNumeroWarning(`ℹ️ Information : vous sautez ${skipped} numéro${plural}. Les numéros ${suggested_numero} à ${num - 1} resteront disponibles pour de futurs dossiers.`);
            } else {
                setNumeroWarning(null);
            }
        }
    }, [data.numero_ouverture, suggested_numero, last_numero, mode]);

    const allDistrictsFromJson = useMemo(() => {
        const typedData = districtsData as DistrictsStructure;
        const districtList: string[] = [];
        
        Object.entries(typedData).forEach(([region, districts]) => {
            if (region === 'Region') return;
            districtList.push(...districts);
        });
        
        return [...new Set(districtList)].sort();
    }, []);

    const filteredCirconscriptionSuggestions = useMemo(() => {
        if (!data.circonscription) return allDistrictsFromJson.slice(0, 50);
        
        const search = data.circonscription.toLowerCase();
        return allDistrictsFromJson.filter(d => 
            d.toLowerCase().includes(search)
        );
    }, [data.circonscription, allDistrictsFromJson]);

    const availableCommunes = useMemo(() => {
        if (!data.circonscription) return [];

        const search = data.circonscription.toLowerCase();
        const communes: string[] = [];
        const typedData = communesData as CommunesStructure;
        
        Object.entries(typedData).forEach(([region, districtsObj]) => {
            if (region === 'Region') return;

            Object.entries(districtsObj).forEach(([district, communesList]) => {
                if (district.toLowerCase().includes(search) || 
                    search.includes(district.toLowerCase())) {
                    communes.push(...communesList);
                }
            });
        });

        return [...new Set(communes)].sort();
    }, [data.circonscription]);

    const filteredCommunes = useMemo(() => {
        if (!data.commune) return availableCommunes;
        
        const search = data.commune.toLowerCase();
        return availableCommunes.filter(c => 
            c.toLowerCase().includes(search)
        );
    }, [availableCommunes, data.commune]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ Validation côté client
        if (!data.nom_dossier?.trim()) {
            toast.error('Le nom du dossier est obligatoire');
            return;
        }

        if (!data.commune?.trim() || !data.fokontany?.trim() || !data.circonscription?.trim()) {
            toast.error('Veuillez remplir tous les champs de localisation');
            return;
        }

        if (data.id_district === 0) {
            toast.error('Veuillez sélectionner un district');
            return;
        }

        if (!data.date_descente_debut || !data.date_descente_fin || !data.date_ouverture) {
            toast.error('Toutes les dates sont obligatoires');
            return;
        }

        if (mode === 'create' && (!data.numero_ouverture || data.numero_ouverture < 1)) {
            toast.error("Le numéro d'ouverture doit être supérieur à 0");
            return;
        }

        const dateDebut = new Date(data.date_descente_debut);
        const dateFin = new Date(data.date_descente_fin);

        if (dateDebut > dateFin) {
            toast.error('La date de fin doit être postérieure à la date de début');
            return;
        }

        // ✅ Soumission
        if (mode === 'create') {
            post(route('dossiers.store'), {
                onError: (errors) => {
                    if (errors.numero_ouverture) {
                        toast.error('Numéro d\'ouverture déjà utilisé', {
                            description: errors.numero_ouverture,
                            duration: 6000,
                        });
                    } else {
                        const messages = Object.values(errors).flat();
                        toast.error('Erreur de validation', {
                            description: messages.join('\n'),
                        });
                    }
                },
                onSuccess: () => {
                    toast.success('Dossier créé avec succès !', {
                        description: `Numéro d'ouverture : ${data.numero_ouverture}`
                    });
                },
            });
        } else {
            put(route('dossiers.update', dossier!.id), {
                onError: (errors) => {
                    if (errors.numero_ouverture) {
                        toast.error('Numéro d\'ouverture déjà utilisé', {
                            description: errors.numero_ouverture,
                            duration: 6000,
                        });
                    } else {
                        const messages = Object.values(errors).flat();
                        toast.error('Erreur de validation', {
                            description: messages.join('\n'),
                        });
                    }
                },
                onSuccess: () => {
                    toast.success('Dossier modifié avec succès !');
                },
            });
        }
    };

    const handleDateDebutChange = (value: string) => {
        setData('date_descente_debut', value);
        if (!data.date_ouverture && value) {
            setData('date_ouverture', value);
        }
    };

    const selectedDistrict = districts.find(d => d.id === data.id_district);

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                <CardTitle className="text-lg sm:text-xl">
                    {mode === 'create' ? 'Informations du Dossier' : 'Modifier le Dossier'}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                    {/* Section Identification */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 pb-3 border-b-2 border-blue-100 dark:border-blue-900">
                            <Hash className="h-4 w-4" />
                            <span>Identification</span>
                        </div>

                        {/* Nom dossier - Full width */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                Nom du dossier <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                value={data.nom_dossier}
                                onChange={(e) => setData('nom_dossier', e.target.value)}
                                placeholder="Ex: Ambohimanarina 2025"
                                required
                                className="h-11"
                            />
                            {errors.nom_dossier && (
                                <p className="text-sm text-red-500">{errors.nom_dossier}</p>
                            )}
                        </div>

                        {/* Numéro d'ouverture + Date d'ouverture */}
                        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                            {/* ✅ Numéro d'ouverture avec validation visuelle */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Numéro d'ouverture <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={data.numero_ouverture}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setData('numero_ouverture', isNaN(val) ? 1 : val);
                                    }}
                                    placeholder={mode === 'create' ? `Suggéré: ${suggested_numero}` : ''}
                                    required
                                    className={cn(
                                        "h-11",
                                        errors.numero_ouverture && "border-red-500 focus-visible:ring-red-500",
                                        numeroWarning?.includes('⚠️') && !errors.numero_ouverture && "border-yellow-500",
                                        numeroWarning?.includes('ℹ️') && !errors.numero_ouverture && "border-blue-500"
                                    )}
                                    disabled={mode === 'edit'}
                                />
                                
                                {/* Informations contextuelles */}
                                {mode === 'create' && (last_numero !== null || suggested_numero) && (
                                    <div className="text-xs space-y-1">
                                        {last_numero !== null && (
                                            <p className="text-muted-foreground flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                Dernier numéro utilisé : <strong className="text-blue-600">{last_numero}</strong>
                                            </p>
                                        )}
                                        {suggested_numero && (
                                            <p className="text-emerald-600 font-medium flex items-center gap-1">
                                                <Check className="h-3 w-3" />
                                                Prochain suggéré : <strong>{suggested_numero}</strong>
                                                <span className="text-muted-foreground font-normal">(modifiable)</span>
                                            </p>
                                        )}
                                    </div>
                                )}
                                
                                {mode === 'edit' && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Le numéro d'ouverture ne peut pas être modifié
                                    </p>
                                )}

                                {/* ✅ Avertissements contextuels */}
                                {numeroWarning && mode === 'create' && (
                                    <Alert 
                                        variant="default" 
                                        className={cn(
                                            "border",
                                            numeroWarning.includes('⚠️') && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
                                            numeroWarning.includes('ℹ️') && "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                                        )}
                                    >
                                        <AlertCircle className={cn(
                                            "h-4 w-4",
                                            numeroWarning.includes('⚠️') && "text-yellow-600 dark:text-yellow-400",
                                            numeroWarning.includes('ℹ️') && "text-blue-600 dark:text-blue-400"
                                        )} />
                                        <AlertDescription className={cn(
                                            "text-xs",
                                            numeroWarning.includes('⚠️') && "text-yellow-800 dark:text-yellow-200",
                                            numeroWarning.includes('ℹ️') && "text-blue-800 dark:text-blue-200"
                                        )}>
                                            {numeroWarning}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                
                                {/* Erreur serveur */}
                                {errors.numero_ouverture && (
                                    <Alert variant="destructive" className="border-red-500">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-sm">
                                            {errors.numero_ouverture}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            {/* Date d'ouverture */}
                            <DateField
                                label="Date d'ouverture"
                                value={data.date_ouverture}
                                onChange={(val) => setData('date_ouverture', val)}
                                error={errors.date_ouverture}
                                helperText="Date officielle d'ouverture du dossier"
                            />
                        </div>
                    </div>

                    {/* Section Localisation */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400 pb-3 border-b-2 border-green-100 dark:border-green-900">
                            <MapPin className="h-4 w-4" />
                            <span>Localisation</span>
                        </div>

                        {/* District + Circonscription */}
                        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                            <DistrictSelector 
                                districts={districts}
                                selectedId={data.id_district}
                                onSelect={(id: number) => setData('id_district', id)}
                                open={openDistrict}
                                onOpenChange={setOpenDistrict}
                                error={errors.id_district}
                            />

                            <CirconscriptionSelector
                                value={data.circonscription}
                                onChange={(val: string) => setData('circonscription', val)}
                                suggestions={filteredCirconscriptionSuggestions}
                                open={openCirconscription}
                                onOpenChange={setOpenCirconscription}
                                error={errors.circonscription}
                            />
                        </div>

                        {/* Type commune + Commune */}
                        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                            <TypeCommuneSelector
                                value={data.type_commune}
                                onChange={(val: string) => setData('type_commune', val)}
                                error={errors.type_commune}
                            />

                            <CommuneSelector
                                value={data.commune}
                                onChange={(val) => setData('commune', val)}
                                availableCommunes={availableCommunes}
                                filteredCommunes={filteredCommunes}
                                open={openCommune}
                                onOpenChange={setOpenCommune}
                                error={errors.commune}
                            />
                        </div>

                        {/* Fokontany */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                Fokontany <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                value={data.fokontany}
                                onChange={(e) => setData('fokontany', e.target.value)}
                                placeholder="Ex: Ambohimanarina Centre"
                                required
                                className="h-11"
                            />
                            {errors.fokontany && (
                                <p className="text-sm text-red-500">{errors.fokontany}</p>
                            )}
                        </div>
                    </div>

                    {/* Section Dates de descente */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400 pb-3 border-b-2 border-orange-100 dark:border-orange-900">
                            <Calendar className="h-4 w-4" />
                            <span>Dates de descente</span>
                        </div>

                        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                            <DateField
                                label="Date début descente"
                                value={data.date_descente_debut}
                                onChange={handleDateDebutChange}
                                error={errors.date_descente_debut}
                            />

                            <DateField
                                label="Date fin descente"
                                value={data.date_descente_fin}
                                onChange={(val) => setData('date_descente_fin', val)}
                                min={data.date_descente_debut}
                                error={errors.date_descente_fin}
                            />
                        </div>
                    </div>

                    {/* Info pièces jointes */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Les pièces jointes pourront être ajoutées après la création du dossier
                        </p>
                    </div>
                    
                    {/* Boutons */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel || (() => window.history.back())}
                            className="h-11 order-2 sm:order-1"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 order-1 sm:order-2"
                        >
                            {processing ? (
                                <>
                                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    {mode === 'create' ? 'Création...' : 'Modification...'}
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {mode === 'create' ? 'Créer le dossier' : 'Enregistrer'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

// ✅ Composants helpers pour réduire la complexité

function DistrictSelector({ districts, selectedId, onSelect, open, onOpenChange, error }: any) {
    const selected = districts.find((d: District) => d.id === selectedId);
    
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">
                District <span className="text-red-500">*</span>
            </Label>
            <Popover open={open} onOpenChange={onOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-11"
                    >
                        {selected ? selected.nom_district : "Sélectionner..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Rechercher..." />
                        <CommandEmpty>Aucun district trouvé.</CommandEmpty>
                        <CommandList>
                            <CommandGroup className="max-h-64 overflow-auto">
                                {districts
                                    .slice()
                                    .sort((a: District, b: District) => a.nom_district.localeCompare(b.nom_district, 'fr'))
                                    .map((district: District) => (
                                        <CommandItem
                                            key={district.id}
                                            value={district.nom_district}
                                            onSelect={() => {
                                                onSelect(district.id);
                                                onOpenChange(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedId === district.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {district.nom_district}
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
                Pour les permissions système
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

function CirconscriptionSelector({ value, onChange, suggestions, open, onOpenChange, error }: any) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">
                Circonscription <span className="text-red-500">*</span>
            </Label>
            <Popover open={open} onOpenChange={onOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-11 font-normal"
                    >
                        {value || "Saisir..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Taper pour rechercher..."
                            value={value}
                            onValueChange={onChange}
                        />
                        <CommandList>
                            {suggestions.length === 0 && value ? (
                                <CommandEmpty>
                                    <div className="p-4 text-center">
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Aucune suggestion
                                        </p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => {
                                                onOpenChange(false);
                                                toast.info(`"${value}" sera enregistré`);
                                            }}
                                        >
                                            ✓ Utiliser "{value}"
                                        </Button>
                                    </div>
                                </CommandEmpty>
                            ) : (
                                <CommandGroup heading="Suggestions" className="max-h-64 overflow-auto">
                                    {suggestions.map((circ: string) => (
                                        <CommandItem
                                            key={circ}
                                            value={circ}
                                            onSelect={(val) => {
                                                onChange(val);
                                                onOpenChange(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === circ ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {circ}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
                Pour les documents officiels (saisie libre)
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

function TypeCommuneSelector({ value, onChange, error }: any) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">
                Type de commune <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
                <Button
                    type="button"
                    variant={value === 'Commune Urbaine' ? 'default' : 'outline'}
                    className="h-11"
                    onClick={() => onChange('Commune Urbaine')}
                >
                    Urbaine
                </Button>
                <Button
                    type="button"
                    variant={value === 'Commune Rurale' ? 'default' : 'outline'}
                    className="h-11"
                    onClick={() => onChange('Commune Rurale')}
                >
                    Rurale
                </Button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

function CommuneSelector({
    value,
    onChange,
    availableCommunes,
    filteredCommunes,
    open,
    onOpenChange,
    error,
}: {
    value: string;
    onChange: (val: string) => void;
    availableCommunes: string[];
    filteredCommunes: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    error?: string;
}) {
    const hasSuggestions = filteredCommunes.length > 0;

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">
                Commune <span className="text-red-500">*</span>
            </Label>
            <Popover open={open} onOpenChange={onOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-11 font-normal"
                    >
                        {value || "Saisir..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Taper pour rechercher..."
                            value={value}
                            onValueChange={onChange}
                        />
                        <CommandList>
                            {!hasSuggestions && value ? (
                                <CommandEmpty>
                                    <div className="p-4 text-center">
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Aucune commune trouvée
                                        </p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => {
                                                onOpenChange(false);
                                                toast.info(`"${value}" sera enregistré comme commune personnalisée`);
                                            }}
                                        >
                                            ✓ Utiliser &quot;{value}&quot;
                                        </Button>
                                        {availableCommunes.length > 0 && (
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                Astuce : vérifiez l’orthographe ou essayez un autre mot-clé
                                            </p>
                                        )}
                                    </div>
                                </CommandEmpty>
                            ) : (
                                <CommandGroup heading="Communes suggérées" className="max-h-64 overflow-auto">
                                    {filteredCommunes.map((commune) => (
                                        <CommandItem
                                            key={commune}
                                            value={commune}
                                            onSelect={(val) => {
                                                onChange(val);
                                                onOpenChange(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === commune ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {commune}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
                Choisissez une commune suggérée ou saisissez-en une nouvelle
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
function DateField({
    label,
    value,
    onChange,
    error,
    min,
    max,
    helperText,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    min?: string;
    max?: string;
    helperText?: string;
}) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">
                {label} <span className="text-red-500">*</span>
            </Label>
            <Input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                min={min}
                max={max}
                required
                className="h-11"
            />
            {helperText && (
                <p className="text-xs text-muted-foreground">
                    {helperText}
                </p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}