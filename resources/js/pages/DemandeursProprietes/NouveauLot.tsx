// pages/DemandeursProprietes/NouveauLot.tsx 

import { useState, useEffect, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, Toaster } from 'sonner';
import { Save, Plus, ArrowLeft, LandPlot, Users, Sparkles, CheckCircle2, FileText } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BreadcrumbItem, Dossier } from '@/types';
import ProprieteCreate, { ProprieteFormData, emptyPropriete } from '@/pages/proprietes/create';
import DemandeurCreate, { DemandeurFormData, emptyDemandeur } from '@/pages/demandeurs/create';
import DatePickerDemande from '@/components/DatePickerDemande';
import { useIsMobile } from '@/hooks/useResponsive';

type CreationMode = 'lot-demandeur' | 'lots-only' | 'demandeurs-only';

export default function NouveauLot() {
    const isMobile = useIsMobile();
    
    const { dossier, session } = usePage<{ 
        dossier: Dossier;
        session?: {
            preloadDemandeur?: DemandeurFormData;
            preloadPropriete?: ProprieteFormData;
        }
    }>().props;
    
    const [creationMode, setCreationMode] = useState<CreationMode>('lot-demandeur');
    const [processing, setProcessing] = useState(false);
    
    const [nextTempId, setNextTempId] = useState(() => Date.now());
    const generateTempId = useCallback(() => {
        const id = nextTempId;
        setNextTempId(prev => prev + 1);
        return id;
    }, [nextTempId]);
    
    const today = new Date().toISOString().split('T')[0];
    const [dateDemande, setDateDemande] = useState<string>(today);
    const [dateDemandeError, setDateDemandeError] = useState<string>('');
    
    const [proprietes, setProprietes] = useState<ProprieteFormData[]>(() => [{
        ...emptyPropriete,
        id_dossier: dossier.id,
        _tempId: generateTempId()
    }]);
    
    const [demandeurs, setDemandeurs] = useState<DemandeurFormData[]>(() => [{ 
        ...emptyDemandeur,
        _tempId: generateTempId()
    }]);
    
    const [selectedChargesByPropriete, setSelectedChargesByPropriete] = useState<Record<number, string[]>>({ 0: [] });

    useEffect(() => {
        if (session?.preloadDemandeur) {
            setDemandeurs([{
                ...session.preloadDemandeur,
                _tempId: generateTempId()
            }]);
        }
        
        if (session?.preloadPropriete) {
            setProprietes([{
                ...session.preloadPropriete,
                id_dossier: dossier.id,
                _tempId: generateTempId()
            }]);
        }
    }, [session?.preloadDemandeur, session?.preloadPropriete]);

    // ========== GESTION DES PROPRIÉTÉS ==========
    const addPropriete = () => {
        const newId = generateTempId();
        setProprietes([
            ...proprietes, 
            { 
                ...emptyPropriete, 
                id_dossier: dossier.id,
                _tempId: newId
            }
        ]);
        setSelectedChargesByPropriete({
            ...selectedChargesByPropriete,
            [proprietes.length]: []
        });
    };

    const removePropriete = (index: number) => {
        if (proprietes.length === 1) {
            toast.error('Au moins une propriété est requise');
            return;
        }
        const newProprietes = proprietes.filter((_, i) => i !== index);
        setProprietes(newProprietes);
        
        const newCharges = { ...selectedChargesByPropriete };
        delete newCharges[index];
        setSelectedChargesByPropriete(newCharges);
    };

    const updatePropriete = (index: number, field: keyof ProprieteFormData, value: string) => {
        const newProprietes = [...proprietes];
        newProprietes[index] = { 
            ...newProprietes[index], 
            [field]: value,
            id_dossier: dossier.id 
        };
        setProprietes(newProprietes);
    };

    const handleChargeChange = (proprieteIndex: number, charge: string, checked: boolean) => {
        let newCharges: string[];
        const currentCharges = selectedChargesByPropriete[proprieteIndex] || [];
        
        if (checked) {
            if (charge === "Aucune") {
                newCharges = ["Aucune"];
            } else {
                newCharges = currentCharges.filter(c => c !== "Aucune");
                newCharges = [...newCharges, charge];
            }
        } else {
            newCharges = currentCharges.filter(c => c !== charge);
        }
        
        setSelectedChargesByPropriete({
            ...selectedChargesByPropriete,
            [proprieteIndex]: newCharges
        });
        
        updatePropriete(proprieteIndex, 'charge', newCharges.join(', '));
    };

    // ========== GESTION DES DEMANDEURS ==========
    const addDemandeur = () => {
        const newId = generateTempId();
        setDemandeurs([
            ...demandeurs, 
            { 
                ...emptyDemandeur,
                _tempId: newId
            }
        ]);
    };

    const removeDemandeur = (index: number) => {
        if (demandeurs.length === 1) {
            toast.error('Au moins un demandeur est requis');
            return;
        }
        const newDemandeurs = demandeurs.filter((_, i) => i !== index);
        setDemandeurs(newDemandeurs);
    };

    const updateDemandeur = (index: number, field: keyof DemandeurFormData, value: string) => {
        setDemandeurs(prev => {
            const newDemandeurs = prev.map((d, i) => {
                if (i === index) {
                    return { ...d, [field]: value };
                }
                return d;
            });
            return newDemandeurs;
        });
    };

    const handleDateDemandeChange = (newDate: string) => {
        setDateDemande(newDate);
        
        if (new Date(newDate) > new Date()) {
            setDateDemandeError('La date ne peut pas être dans le futur');
            return;
        }
        
        if (new Date(newDate) < new Date('2020-01-01')) {
            setDateDemandeError('La date ne peut pas être antérieure au 01/01/2020');
            return;
        }
        
        const dateRequisition = proprietes[0]?.date_requisition;
        if (dateRequisition && new Date(newDate) < new Date(dateRequisition)) {
            setDateDemandeError('La date de demande ne peut pas être antérieure à la date de réquisition');
            return;
        }
        
        setDateDemandeError('');
    };

    // ========== VALIDATION ==========
    const validateProprietes = (): boolean => {
        for (let i = 0; i < proprietes.length; i++) {
            const p = proprietes[i];
            
            if (!p.lot?.trim()) {
                toast.error(`Propriété ${i + 1}: Le lot est obligatoire`);
                return false;
            }
            if (!p.type_operation) {
                toast.error(`Propriété ${i + 1}: Le type d'opération est obligatoire`);
                return false;
            }
            if (!p.nature) {
                toast.error(`Propriété ${i + 1}: La nature est obligatoire`);
                return false;
            }
            if (!p.vocation) {
                toast.error(`Propriété ${i + 1}: La vocation est obligatoire`);
                return false;
            }
        }
        return true;
    };

    const validateDemandeurs = (): boolean => {
        for (let i = 0; i < demandeurs.length; i++) {
            const d = demandeurs[i];
            
            if (!d.titre_demandeur?.trim()) {
                toast.error(`Demandeur ${i + 1}: Le titre de civilité est obligatoire`);
                return false;
            }
            if (!d.nom_demandeur?.trim()) {
                toast.error(`Demandeur ${i + 1}: Le nom est obligatoire`);
                return false;
            }
            if (!d.prenom_demandeur?.trim()) {
                toast.error(`Demandeur ${i + 1}: Le prénom est obligatoire`);
                return false;
            }
            if (!d.date_naissance) {
                toast.error(`Demandeur ${i + 1}: La date de naissance est obligatoire`);
                return false;
            }
            
            if (!d.cin) {
                toast.error(`Demandeur ${i + 1}: Le CIN est obligatoire`);
                return false;
            }
            if (!/^\d{12}$/.test(d.cin)) {
                toast.error(`Demandeur ${i + 1}: Le CIN doit contenir exactement 12 chiffres`);
                return false;
            }
            
            const cinDuplicates = demandeurs.filter((dem, idx) => idx !== i && dem.cin === d.cin);
            if (cinDuplicates.length > 0) {
                toast.error(`Demandeur ${i + 1}: Ce CIN est utilisé plusieurs fois dans le formulaire`);
                return false;
            }
        }
        return true;
    };

    // ========== SOUMISSION ==========
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (dateDemandeError) {
            toast.error('Erreur de date', { description: dateDemandeError });
            return;
        }

        if (creationMode === 'lots-only' || creationMode === 'lot-demandeur') {
            if (!validateProprietes()) return;
        }

        if (creationMode === 'demandeurs-only' || creationMode === 'lot-demandeur') {
            if (!validateDemandeurs()) return;
        }

        setProcessing(true);

        if (creationMode === 'lot-demandeur') {
            const cleanPropriete = { ...proprietes[0] };
            delete cleanPropriete._tempId;
            
            const cleanDemandeurs = demandeurs.map(d => {
                const clean = { ...d };
                delete clean._tempId;
                return clean;
            });

            router.post(route('nouveau-lot.store'), {
                ...cleanPropriete,
                date_demande: dateDemande,
                demandeurs_json: JSON.stringify(cleanDemandeurs)
            }, {
                onError: (errors) => {
                    console.error('Erreurs backend:', errors);
                    const errorMessages = Object.entries(errors)
                        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                        .join('\n');
                    
                    toast.error('Erreur de validation', {
                        description: errorMessages
                    });
                    setProcessing(false);
                },
                onSuccess: () => {
                    toast.success('Lot et demandeur(s) créés avec succès !');
                }
            });
        } else if (creationMode === 'lots-only') {
            const cleanProprietes = proprietes.map(p => {
                const clean = { ...p, id_dossier: dossier.id };
                delete clean._tempId;
                return clean;
            });

            router.post(route('proprietes.store-multiple'), {
                id_dossier: dossier.id,
                proprietes: JSON.stringify(cleanProprietes)
            }, {
                onError: (errors) => {
                    console.error('Erreurs backend:', errors);
                    const errorMessages = Object.values(errors).flat().join('\n');
                    toast.error('Erreur de validation', { description: errorMessages });
                    setProcessing(false);
                },
                onSuccess: () => {
                    toast.success(`${proprietes.length} propriété(s) créée(s) avec succès !`);
                }
            });
        } else if (creationMode === 'demandeurs-only') {
            const cleanDemandeurs = demandeurs.map(d => {
                const clean = { ...d };
                delete clean._tempId;
                return clean;
            });
            
            router.post(route('demandeurs.store-multiple'), {
                id_dossier: dossier.id,
                demandeurs: JSON.stringify(cleanDemandeurs)
            }, {
                onError: (errors) => {
                    console.error('Erreurs backend:', errors);
                    const errorMessages = Object.values(errors).flat().join('\n');
                    toast.error('Erreur de validation', { description: errorMessages });
                    setProcessing(false);
                },
                onSuccess: () => {
                    toast.success(`${demandeurs.length} demandeur(s) créé(s) avec succès !`);
                }
            });
        }
    };
    
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Nouvelle Entrée', href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvelle Entrée" />
            <Toaster position={isMobile ? "top-center" : "top-right"} richColors />

            <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-[1600px] space-y-4 sm:space-y-6">
                {/* Header - Responsive */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                            Nouvelle Entrée
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
                            <span className="font-medium">{dossier.nom_dossier}</span>
                            <span className="text-gray-400 hidden sm:inline">•</span>
                            <span className="text-xs sm:text-sm">{dossier.commune}</span>
                        </div>
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size={isMobile ? "sm" : "default"}
                        onClick={() => router.visit(route('dossiers.show', dossier.id))}
                        className="shadow-sm hover:shadow-md transition-all w-full sm:w-auto"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                    </Button>
                </div>

                {/* Mode sélection - Responsive */}
                <Card className="border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20 border-b">
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                Choisir le type de création
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Sélectionnez ce que vous souhaitez créer
                            </CardDescription>
                        </CardHeader>
                    </div>
                    <CardContent className="p-3 sm:p-6">
                        <RadioGroup value={creationMode} onValueChange={(value) => setCreationMode(value as CreationMode)}>
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                                <div 
                                    className={`flex items-start space-x-2 sm:space-x-3 p-3 sm:p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                        creationMode === 'lot-demandeur' 
                                            ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50 shadow-lg' 
                                            : 'border-border hover:border-violet-300 hover:bg-violet-50/50'
                                    }`} 
                                    onClick={() => setCreationMode('lot-demandeur')}
                                >
                                    <RadioGroupItem value="lot-demandeur" id="lot-demandeur" className="mt-1" />
                                    <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                                        <Label htmlFor="lot-demandeur" className="font-semibold cursor-pointer text-sm sm:text-base flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-violet-600 flex-shrink-0" />
                                            <span className="truncate">Lot + Demandeur(s)</span>
                                        </Label>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            Créer une propriété avec demandeurs
                                        </p>
                                        <Badge variant="outline" className="text-xs">Recommandé</Badge>
                                    </div>
                                </div>

                                <div 
                                    className={`flex items-start space-x-2 sm:space-x-3 p-3 sm:p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                        creationMode === 'lots-only' 
                                            ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg' 
                                            : 'border-border hover:border-emerald-300 hover:bg-emerald-50/50'
                                    }`} 
                                    onClick={() => setCreationMode('lots-only')}
                                >
                                    <RadioGroupItem value="lots-only" id="lots-only" className="mt-1" />
                                    <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                                        <Label htmlFor="lots-only" className="font-semibold cursor-pointer text-sm sm:text-base flex items-center gap-2">
                                            <LandPlot className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0" />
                                            <span className="truncate">Lot(s) seulement</span>
                                        </Label>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            Créer une ou plusieurs propriétés
                                        </p>
                                    </div>
                                </div>

                                <div 
                                    className={`flex items-start space-x-2 sm:space-x-3 p-3 sm:p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                        creationMode === 'demandeurs-only' 
                                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg' 
                                            : 'border-border hover:border-blue-300 hover:bg-blue-50/50'
                                    }`} 
                                    onClick={() => setCreationMode('demandeurs-only')}
                                >
                                    <RadioGroupItem value="demandeurs-only" id="demandeurs-only" className="mt-1" />
                                    <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                                        <Label htmlFor="demandeurs-only" className="font-semibold cursor-pointer text-sm sm:text-base flex items-center gap-2">
                                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                                            <span className="truncate">Demandeur(s) seulement</span>
                                        </Label>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            Créer un ou plusieurs demandeurs
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </RadioGroup>
                    </CardContent>
                </Card>

                {/* Date de demande - Responsive */}
                {creationMode === 'lot-demandeur' && (
                    <Card className="border-0 shadow-lg">
                        <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b">
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-base sm:text-lg">Date de la demande</CardTitle>
                            </CardHeader>
                        </div>
                        <CardContent className="p-4 sm:pt-6">
                            <DatePickerDemande
                                value={dateDemande}
                                onChange={handleDateDemandeChange}
                                error={dateDemandeError}
                                required
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Alert - Responsive */}
                <Alert className="border-0 shadow-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                    <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <AlertDescription>
                                <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1">
                                    Documents justificatifs
                                </p>
                                <p className="text-xs text-blue-700">
                                    Les pièces jointes pourront être ajoutées après création
                                </p>
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>

                {/* Section Propriétés - Responsive */}
                {(creationMode === 'lots-only' || creationMode === 'lot-demandeur') && (
                    <Card className="border-0 shadow-lg">
                        <div className="bg-gradient-to-r from-violet-50/50 to-purple-50/50 border-b">
                            <CardHeader className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="p-1.5 sm:p-2 bg-violet-100 rounded-lg flex-shrink-0">
                                            <LandPlot className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <CardTitle className="text-lg sm:text-xl truncate">
                                                Propriété{proprietes.length > 1 ? 's' : ''}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {proprietes.length} propriété{proprietes.length > 1 ? 's' : ''}
                                                </Badge>
                                            </CardDescription>
                                        </div>
                                    </div>
                                    {creationMode === 'lots-only' && (
                                        <Button 
                                            type="button" 
                                            onClick={addPropriete} 
                                            size="sm" 
                                            className="gap-2 shadow-md w-full sm:w-auto"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Ajouter
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                        </div>
                        <CardContent className="p-3 sm:p-6 space-y-6 sm:space-y-8">
                            {proprietes.map((propriete, index) => (
                                <div key={`propriete-${propriete._tempId}`} className="pb-6 sm:pb-8 border-b last:border-b-0 last:pb-0">
                                    <ProprieteCreate
                                        data={propriete}
                                        onChange={(field, value) => updatePropriete(index, field, value)}
                                        onRemove={creationMode === 'lots-only' ? () => removePropriete(index) : undefined}
                                        index={index}
                                        showRemoveButton={creationMode === 'lots-only' && proprietes.length > 1}
                                        selectedCharges={selectedChargesByPropriete[index] || []}
                                        onChargeChange={(charge, checked) => handleChargeChange(index, charge, checked)}
                                    />
                                </div>
                            ))}

                            {creationMode === 'lots-only' && (
                                <div className="flex justify-center pt-2 sm:pt-4">
                                    <Button 
                                        type="button" 
                                        onClick={addPropriete} 
                                        variant="outline"
                                        size={isMobile ? "default" : "lg"}
                                        className="gap-2 shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
                                    >
                                        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                                        Ajouter une autre propriété
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Section Demandeurs - Responsive */}
                {(creationMode === 'demandeurs-only' || creationMode === 'lot-demandeur') && (
                    <Card className="border-0 shadow-lg">
                        <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-b">
                            <CardHeader className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <CardTitle className="text-lg sm:text-xl truncate">Demandeurs</CardTitle>
                                            <CardDescription className="mt-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {demandeurs.length} demandeur{demandeurs.length > 1 ? 's' : ''}
                                                </Badge>
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button 
                                        type="button" 
                                        onClick={addDemandeur} 
                                        size="sm" 
                                        className="gap-2 shadow-md w-full sm:w-auto"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Ajouter
                                    </Button>
                                </div>
                            </CardHeader>
                        </div>
                        <CardContent className="p-3 sm:p-6 space-y-6 sm:space-y-8">
                            {demandeurs.map((demandeur, index) => (
                                <div key={`demandeur-${demandeur._tempId}`} className="pb-6 sm:pb-8 border-b last:border-b-0 last:pb-0">
                                    <DemandeurCreate
                                        data={demandeur}
                                        onChange={(field, value) => updateDemandeur(index, field, value)}
                                        onRemove={demandeurs.length > 1 ? () => removeDemandeur(index) : undefined}
                                        index={index}
                                        showRemoveButton={demandeurs.length > 1}
                                    />
                                </div>
                            ))}

                            <div className="flex justify-center pt-2 sm:pt-4">
                                <Button 
                                    type="button" 
                                    onClick={addDemandeur} 
                                    variant="outline"
                                    size={isMobile ? "default" : "lg"}
                                    className="gap-2 shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
                                >
                                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                                    Ajouter un autre demandeur
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions - Responsive avec boutons sticky sur mobile */}
                <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-t-0 p-3 sm:p-0 -mx-3 sm:mx-0">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-end sm:pb-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(route('dossiers.show', dossier.id))}
                            disabled={processing}
                            size={isMobile ? "default" : "lg"}
                            className="w-full sm:w-auto order-2 sm:order-1"
                        >
                            Annuler
                        </Button>
                        <Button 
                            type="button" 
                            onClick={handleSubmit} 
                            disabled={processing || (creationMode === 'lot-demandeur' && !!dateDemandeError)}
                            size={isMobile ? "default" : "lg"}
                            className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto order-1 sm:order-2"
                        >
                            <Save className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-sm sm:text-base">
                                {processing ? 'Enregistrement...' : 
                                    creationMode === 'lot-demandeur' ? 'Créer lot + demandeur(s)' :
                                    creationMode === 'lots-only' ? `Créer ${proprietes.length} propriété(s)` :
                                    `Créer ${demandeurs.length} demandeur(s)`
                                }
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}