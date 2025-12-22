// documents/tabs/CsfTab.tsx - ✅ VERSION MOBILE-OPTIMIZED

import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileCheck, AlertCircle, Loader2, Crown, Users, MapPin } from 'lucide-react';
import { Dossier } from '@/types';
import { ProprieteWithDemandeurs, DemandeurWithCSF } from '../types';
import { safePrix, formatMontant } from '../helpers';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import SecureDownloadButton from '../components/SecureDownloadButton';
import ProprieteSelect, { DemandeurSelect } from '../components/ProprieteSelect';
import { useIsMobile } from '@/hooks/useResponsive';

interface CsfTabProps {
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: DemandeurWithCSF[];
    dossier: Dossier;
}

export default function CsfTab({ proprietes, demandeurs, dossier }: CsfTabProps) {
    const [csfPropriete, setCsfPropriete] = useState<string>('');
    const [csfDemandeur, setCsfDemandeur] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const isMobile = useIsMobile();

    const selectedProprieteData = proprietes.find(p => p.id === Number(csfPropriete));

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
            <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                    {isMobile ? 'CSF' : 'Certificat de Situation Financière'}
                </CardTitle>
                {!isMobile && (
                    <CardDescription className="text-xs sm:text-sm">
                        Générez un CSF pour chaque demandeur individuellement
                    </CardDescription>
                )}
            </CardHeader>
            
            <CardContent className="space-y-3 sm:space-y-6 p-3 sm:p-6">
                
                {/* Sélection Propriété */}
                <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-semibold">Propriété</Label>
                    <ProprieteSelect
                        value={csfPropriete}
                        onChange={handleProprieteChange}
                        proprietes={proprietes}
                        disabled={isGenerating}
                        showDemandeurs={true}
                    />
                </div>

                {/* Carte propriété */}
                {csfPropriete && selectedProprieteData && (
                    <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                        <CardContent className="p-2 sm:p-4 space-y-2">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <Badge className="bg-emerald-600 text-white text-[10px] xs:text-xs">
                                            Lot {selectedProprieteData.lot}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] xs:text-xs">
                                            TN°{selectedProprieteData.titre}
                                        </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                                        <div>
                                            <span className="text-muted-foreground text-[10px] xs:text-xs">
                                                {isMobile ? 'Cont.' : 'Contenance'}:
                                            </span>
                                            <div className="font-semibold text-xs">
                                                {formatContenance(selectedProprieteData.contenance)}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-[10px] xs:text-xs">Nature:</span>
                                            <div className="font-semibold text-xs capitalize truncate">
                                                {selectedProprieteData.nature}
                                            </div>
                                        </div>
                                    </div>

                                    {!isMobile && (
                                        <div className="text-xs">
                                            <span className="text-muted-foreground text-[10px] xs:text-xs">Propriétaire:</span>
                                            <div className="font-medium text-xs truncate">
                                                {selectedProprieteData.proprietaire}
                                            </div>
                                        </div>
                                    )}

                                    {/* Prix */}
                                    {selectedProprieteData?.demandeurs_lies && 
                                    selectedProprieteData.demandeurs_lies.length > 0 && (
                                        <div className="pt-1.5 border-t border-emerald-200 dark:border-emerald-800">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span className="text-muted-foreground text-[10px] xs:text-xs">
                                                    {isMobile ? 'Prix:' : 'Prix total:'}
                                                </span>
                                                <span className="font-semibold text-xs">
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
                                        <div className="pt-1.5 border-t border-emerald-200 dark:border-emerald-800">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Users className="h-3 w-3 text-emerald-600" />
                                                <span className="font-medium text-[10px] xs:text-xs">
                                                    {demandeursFiltered.length} demandeur{demandeursFiltered.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Alerte pas de demandeurs */}
                {csfPropriete && demandeursFiltered.length === 0 && (
                    <Alert variant="destructive" className="p-2 sm:p-4">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        <AlertDescription className="text-xs sm:text-sm">
                            Aucun demandeur associé à cette propriété.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Sélection Demandeur */}
                {csfPropriete && demandeursFiltered.length > 0 && (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs sm:text-sm font-semibold">Demandeur</Label>
                            <DemandeurSelect
                                value={csfDemandeur}
                                onChange={setCsfDemandeur}
                                demandeurs={demandeursFiltered}
                                disabled={isGenerating}
                                demandeurLies={selectedProprieteData?.demandeurs_lies}
                            />
                        </div>

                        {/* Carte demandeur */}
                        {csfDemandeur && selectedDemandeurData && (
                            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                                <CardContent className="p-2 sm:p-4">
                                    <div className="flex items-start gap-2">
                                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {selectedProprieteData?.demandeurs_lies?.find(d => d.id === selectedDemandeurData.id)?.ordre === 1 && (
                                                    <Badge className="bg-yellow-500 text-white text-[10px] xs:text-xs">
                                                        <Crown className="h-2.5 w-2.5 mr-0.5" />
                                                        {isMobile ? 'P' : 'Principal'}
                                                    </Badge>
                                                )}
                                                <span className="font-semibold text-xs truncate">
                                                    {selectedDemandeurData.titre_demandeur} {selectedDemandeurData.nom_demandeur} {selectedDemandeurData.prenom_demandeur}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-1.5 text-xs">
                                                <div>
                                                    <span className="text-muted-foreground text-[10px] xs:text-xs">CIN:</span>
                                                    <div className="font-mono text-xs">{selectedDemandeurData.cin}</div>
                                                </div>
                                                {!isMobile && selectedDemandeurData.occupation && (
                                                    <div>
                                                        <span className="text-muted-foreground text-[10px] xs:text-xs">Occupation:</span>
                                                        <div className="font-medium text-xs truncate">
                                                            {selectedDemandeurData.occupation}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status CSF */}
                                            <div className="pt-1.5 border-t border-blue-200 dark:border-blue-800">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] xs:text-xs text-muted-foreground">CSF:</span>
                                                    <DocumentStatusBadge document={selectedDemandeurData.document_csf} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Statut CSF */}
                        {csfDemandeur && hasCsf && documentCsf && (
                            <Alert className="bg-green-500/10 border-green-500/50 p-2 sm:p-4">
                                <FileCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                                <AlertDescription className="text-green-700 dark:text-green-300 text-xs sm:text-sm">
                                    <div className="font-medium">
                                        CSF déjà généré
                                    </div>
                                    {!isMobile && (
                                        <div className="text-[10px] xs:text-xs opacity-75 mt-0.5">
                                            Généré le {documentCsf.generated_at}
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}
                    </>
                )}

                {/* Génération en cours */}
                {isGenerating && (
                    <Alert className="bg-blue-500/10 border-blue-500/50 p-2 sm:p-4">
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 animate-spin" />
                        <AlertDescription className="text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                            {hasCsf ? 'Téléchargement en cours...' : 'Génération en cours...'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Bouton */}
                {csfDemandeur && (
                    hasCsf && documentCsf ? (
                        <SecureDownloadButton
                            document={documentCsf}
                            downloadRoute={route('documents.csf.download', documentCsf.id)}
                            regenerateRoute={route('documents.csf.regenerate', documentCsf.id)}
                            typeName="CSF"
                            size={isMobile ? 'default' : 'lg'}
                        />
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            disabled={!canGenerate() || isGenerating}
                            size={isMobile ? 'default' : 'lg'}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-xs sm:text-sm"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                                    Génération...
                                </>
                            ) : (
                                <>
                                    <FileCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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