// documents/tabs/CsfTab.tsx
import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { FileCheck, AlertCircle, Info, Loader2, Crown, Users, MapPin, Ruler } from 'lucide-react';
import { Demandeur, Dossier } from '@/types';
import { ProprieteWithDemandeurs, DemandeurWithCSF } from '../types';
import { safePrix, formatMontant } from '../helpers';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import SecureDownloadButton from '../components/SecureDownloadButton';

interface CsfTabProps {
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: DemandeurWithCSF[];
    dossier: Dossier;
}

export default function CsfTab({ proprietes, demandeurs, dossier }: CsfTabProps) {
    const [csfPropriete, setCsfPropriete] = useState<string>('');
    const [csfDemandeur, setCsfDemandeur] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    const selectedProprieteData = proprietes.find(p => p.id === Number(csfPropriete));

    // Filtrer les demandeurs selon la propriété sélectionnée
    const demandeursFiltered = useMemo(() => {
        if (!csfPropriete || !selectedProprieteData) return [];
        
        const demandeursLiesIds = selectedProprieteData.demandeurs_lies?.map(d => d.id) || [];
        return demandeurs.filter(d => demandeursLiesIds.includes(d.id));
    }, [csfPropriete, selectedProprieteData, demandeurs]);

    const selectedDemandeurData = demandeurs.find(d => d.id === Number(csfDemandeur));
    const documentCsf = selectedDemandeurData?.document_csf;
    const hasCsf = !!documentCsf;

    const canGenerate = () => {
        if (!csfPropriete || !csfDemandeur || hasCsf) return false;
        const prop = selectedProprieteData;
        const dem = selectedDemandeurData;
        if (!prop || !dem) return false;
        return true;
    };

    const handleGenerate = () => {
        if (!csfPropriete || !csfDemandeur) {
            toast.warning('Veuillez sélectionner une propriété et un demandeur');
            return;
        }

        if (isGenerating) return;

        setIsGenerating(true);

        try {
            const params = new URLSearchParams({
                id_propriete: csfPropriete,
                id_demandeur: csfDemandeur,
            });

            const url = `${route('documents.csf.generate')}?${params.toString()}`;
            window.location.href = url;
            
            toast.success('Génération du CSF en cours...');
            
            setTimeout(() => {
                router.reload({ 
                    only: ['demandeurs'],
                    preserveUrl: true,
                    onSuccess: () => {
                        toast.success('CSF généré avec succès !');
                        setIsGenerating(false);
                    },
                    onError: () => {
                        toast.error('Erreur lors de la mise à jour');
                        setIsGenerating(false);
                    }
                });
            }, 2000);
            
        } catch (error) {
            console.error('Erreur génération CSF:', error);
            toast.error('Erreur lors de la préparation du téléchargement');
            setIsGenerating(false);
        }
    };

    const handleProprieteChange = (value: string) => {
        setCsfPropriete(value);
        setCsfDemandeur('');
    };

    // Formater la contenance
    const formatContenance = (contenance: number | null | undefined): string => {
        if (!contenance) return "-";
        
        const hectares = Math.floor(contenance / 10000);
        const reste = contenance % 10000;
        const ares = Math.floor(reste / 100);
        const centiares = reste % 100;

        const parts = [];
        if (hectares > 0) parts.push(`${hectares}Ha`);
        if (ares > 0) parts.push(`${ares}A`);
        parts.push(`${centiares}Ca`);

        return parts.join(" ");
    };

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
                <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Certificat de Situation Financière
                </CardTitle>
                <CardDescription>
                    Générez un CSF pour chaque demandeur individuellement
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                
                {/* Sélection Propriété */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Propriété</Label>
                    <Select 
                        value={csfPropriete} 
                        onValueChange={handleProprieteChange}
                        disabled={isGenerating}
                    >
                        <SelectTrigger className="h-auto min-h-[50px]">
                            <SelectValue placeholder="Sélectionner une propriété" />
                        </SelectTrigger>
                        <SelectContent>
                            {proprietes.map((prop) => {
                                const principal = prop.demandeurs_lies?.find(d => d.ordre === 1);
                                const consortsList = prop.demandeurs_lies?.filter(d => d.ordre > 1) || [];
                                
                                return (
                                    <SelectItem key={prop.id} value={String(prop.id)}>
                                        <div className="flex items-center gap-6 py-2 whitespace-nowrap">
                                            {/* LOT + TITRE */}
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-mono">
                                                    Lot {prop.lot}
                                                </Badge>
                                                <Badge variant="outline">
                                                    TN°{prop.titre}
                                                </Badge>
                                            </div>

                                            {/* PRINCIPAL + CONSORTS */}
                                            {principal && (
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Crown className="h-3 w-3 text-yellow-500" />
                                                        <span className="font-medium">
                                                            {principal.nom} {principal.prenom}
                                                        </span>
                                                    </div>

                                                    {consortsList.length > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            <span>
                                                                + {consortsList.length} consort{consortsList.length > 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* Carte d'info propriété */}
                {csfPropriete && selectedProprieteData && (
                    <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-1" />
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className="bg-emerald-600 text-white">
                                            Lot {selectedProprieteData.lot}
                                        </Badge>
                                        <Badge variant="outline">
                                            TN°{selectedProprieteData.titre}
                                        </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Contenance:</span>
                                            <div className="font-semibold">
                                                {formatContenance(selectedProprieteData.contenance)}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Nature:</span>
                                            <div className="font-semibold capitalize">
                                                {selectedProprieteData.nature}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Propriétaire:</span>
                                        <div className="font-medium">{selectedProprieteData.proprietaire}</div>
                                    </div>

                                    {/* Prix total */}
                                    {selectedProprieteData?.demandeurs_lies && 
                                    selectedProprieteData.demandeurs_lies.length > 0 && (
                                        <div className="pt-3 border-t border-emerald-200 dark:border-emerald-800">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">Prix total:</span>
                                                <span className="font-semibold">
                                                    {formatMontant(
                                                        safePrix(
                                                            selectedProprieteData.demandeurs_lies?.[0]?.total_prix
                                                        )
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {demandeursFiltered.length > 0 && (
                                        <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Users className="h-4 w-4 text-emerald-600" />
                                                <span className="font-medium">
                                                    {demandeursFiltered.length} demandeur{demandeursFiltered.length > 1 ? 's' : ''} associé{demandeursFiltered.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Info filtrage */}
                {csfPropriete && demandeursFiltered.length === 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Aucun demandeur associé à cette propriété.
                        </AlertDescription>
                    </Alert>
                )}

                {csfPropriete && demandeursFiltered.length > 0 && (
                    <>
                        {/* Sélection Demandeur */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Demandeur</Label>
                            <Select 
                                value={csfDemandeur} 
                                onValueChange={setCsfDemandeur}
                                disabled={isGenerating}
                            >
                                <SelectTrigger className="h-auto min-h-[50px]">
                                    <SelectValue placeholder="Sélectionner un demandeur" />
                                </SelectTrigger>
                                <SelectContent>
                                    {demandeursFiltered.map((dem) => {
                                        const demandeurLie = selectedProprieteData?.demandeurs_lies?.find(d => d.id === dem.id);
                                        const isPrincipal = demandeurLie?.ordre === 1;
                                        const demWithCsf = dem as DemandeurWithCSF;
                                        const hasDocument = !!demWithCsf.document_csf;
                                        
                                        return (
                                            <SelectItem key={dem.id} value={String(dem.id)}>
                                                <div className="flex items-center gap-2 py-1">
                                                    {isPrincipal && <Crown className="h-3 w-3 text-yellow-500" />}
                                                    <span>{dem.nom_demandeur} {dem.prenom_demandeur}</span>
                                                    {demandeurLie && (
                                                        <Badge variant="outline" className="text-xs">
                                                            ordre {demandeurLie.ordre}
                                                        </Badge>
                                                    )}
                                                    {hasDocument && (
                                                        <Badge variant="default" className="bg-green-500 text-xs">
                                                            <FileCheck className="h-3 w-3" />
                                                        </Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Carte demandeur sélectionné */}
                        {csfDemandeur && selectedDemandeurData && (
                            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {selectedProprieteData?.demandeurs_lies?.find(d => d.id === selectedDemandeurData.id)?.ordre === 1 && (
                                                    <Badge className="bg-yellow-500 text-white">
                                                        <Crown className="h-3 w-3 mr-1" />
                                                        Principal
                                                    </Badge>
                                                )}
                                                <span className="font-semibold">
                                                    {selectedDemandeurData.titre_demandeur} {selectedDemandeurData.nom_demandeur} {selectedDemandeurData.prenom_demandeur}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">CIN:</span>
                                                    <div className="font-mono">{selectedDemandeurData.cin}</div>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Occupation:</span>
                                                    <div className="font-medium">{selectedDemandeurData.occupation || '-'}</div>
                                                </div>
                                            </div>

                                            {/* Badge de statut du CSF */}
                                            <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">Statut CSF:</span>
                                                    <DocumentStatusBadge document={selectedDemandeurData.document_csf} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Statut du CSF */}
                        {csfDemandeur && hasCsf && documentCsf && (
                            <Alert className="bg-green-500/10 border-green-500/50">
                                <FileCheck className="h-4 w-4 text-green-500" />
                                <AlertDescription className="text-green-700 dark:text-green-300">
                                    <div className="space-y-1">
                                        <div className="font-medium">
                                            CSF déjà généré pour ce demandeur
                                        </div>
                                        <div className="text-xs opacity-75">
                                            Généré le {documentCsf.generated_at}
                                        </div>
                                        <div className="text-xs opacity-75">
                                            Téléchargé {documentCsf.download_count || 0} fois
                                        </div>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </>
                )}

                {/* <Separator /> */}

                
                {/* <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Le Certificat de Situation Financière certifie que le demandeur n'est redevable
                        d'aucune somme et a versé le cautionnement réglementaire. Un CSF distinct est 
                        requis pour chaque demandeur.
                    </AlertDescription>
                </Alert> */}

                {/* Indicateur de génération */}
                {isGenerating && (
                    <Alert className="bg-blue-500/10 border-blue-500/50">
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        <AlertDescription className="text-blue-700 dark:text-blue-300">
                            {hasCsf ? 'Téléchargement en cours...' : 'Génération en cours...'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* ✅ BOUTON UNIFIÉ */}
                {csfDemandeur && (
                    hasCsf && documentCsf ? (
                        <SecureDownloadButton
                            document={documentCsf}
                            downloadRoute={route('documents.csf.download', documentCsf.id)}
                            regenerateRoute={route('documents.csf.regenerate', documentCsf.id)}
                            typeName="CSF"
                        />
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            disabled={!canGenerate() || isGenerating}
                            size="lg"
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Génération...
                                </>
                            ) : (
                                <>
                                    <FileCheck className="h-4 w-4 mr-2" />
                                    Générer le CSF
                                </>
                            )}
                        </Button>
                    )
                )}
            </CardContent>
        </Card>
    );
}