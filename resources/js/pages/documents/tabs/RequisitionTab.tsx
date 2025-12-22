// documents/tabs/RequisitionTab.tsx - ✅ VERSION MOBILE-OPTIMIZED

import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileOutput, Loader2, FileCheck, MapPin, Ruler } from 'lucide-react';
import { Dossier } from '@/types';
import { ProprieteWithDemandeurs } from '../types';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import SecureDownloadButton from '../components/SecureDownloadButton';
import ProprieteSelect from '../components/ProprieteSelect';
import { useIsMobile } from '@/hooks/useResponsive';

interface RequisitionTabProps {
    proprietes: ProprieteWithDemandeurs[];
    dossier: Dossier;
}

export default function RequisitionTab({ proprietes, dossier }: RequisitionTabProps) {
    const [reqPropriete, setReqPropriete] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const isMobile = useIsMobile();

    const selectedProprieteData = proprietes.find(p => p.id === Number(reqPropriete));
    
    const documentRequisition = selectedProprieteData?.document_requisition;
    const hasRequisition = !!documentRequisition;

    const canGenerate = () => {
        if (!reqPropriete || hasRequisition) return false;
        const prop = selectedProprieteData;
        if (!prop) return false;
        return true;
    };

    const formatContenance = (contenance: number | null): string => {
        if (!contenance) return "-";

        const hectares = Math.floor(contenance / 10000);
        const reste = contenance % 10000;
        const ares = Math.floor(reste / 100);
        const centiares = reste % 100;
        
        const parts = [];
        if (hectares > 0) parts.push(`${hectares}Ha`);
        if (ares > 0) parts.push(`${ares}A`);
        parts.push(`${centiares}Ca`);
        
        return parts.join(' ');
    };

    const handleGenerate = () => {
        if (!reqPropriete) {
            toast.warning('Veuillez sélectionner une propriété');
            return;
        }

        if (isGenerating) return;

        setIsGenerating(true);

        try {
            const params = new URLSearchParams({
                id_propriete: reqPropriete,
            });

            const url = `${route('documents.requisition.generate')}?${params.toString()}`;
            window.location.href = url;
            
            toast.success('Génération de la réquisition en cours...');
            
            setTimeout(() => {
                router.reload({ 
                    only: ['proprietes'],
                    preserveUrl: true,
                    onSuccess: () => {
                        toast.success('Réquisition générée avec succès !');
                        setIsGenerating(false);
                    },
                    onError: () => {
                        toast.error('Erreur lors de la mise à jour');
                        setIsGenerating(false);
                    }
                });
            }, 2000);
            
        } catch (error) {
            console.error('Erreur génération réquisition:', error);
            toast.error('Erreur lors de la préparation du téléchargement');
            setIsGenerating(false);
        }
    };

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FileOutput className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    Réquisition
                </CardTitle>
                {!isMobile && (
                    <CardDescription className="text-xs sm:text-sm">
                        Sélectionnez la propriété pour générer la réquisition (aucun demandeur requis)
                    </CardDescription>
                )}
            </CardHeader>
            
            <CardContent className="space-y-3 sm:space-y-6 p-3 sm:p-6">
                
                {/* Sélection Propriété */}
                <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-semibold">Propriété</Label>
                    <ProprieteSelect
                        value={reqPropriete}
                        onChange={setReqPropriete}
                        proprietes={proprietes}
                        disabled={isGenerating}
                        showDemandeurs={false}
                    />
                </div>

                {/* Carte propriété */}
                {reqPropriete && selectedProprieteData && (
                    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                        <CardContent className="p-2 sm:p-4 space-y-2 sm:space-y-4">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <Badge className="bg-blue-600 text-white text-[10px] xs:text-xs">
                                            Lot {selectedProprieteData.lot}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] xs:text-xs">
                                            TN°{selectedProprieteData.titre}
                                        </Badge>
                                        <Badge 
                                            variant={selectedProprieteData.type_operation === 'morcellement' ? 'default' : 'secondary'}
                                            className="text-[10px] xs:text-xs"
                                        >
                                            {isMobile 
                                                ? (selectedProprieteData.type_operation === 'morcellement' ? 'Morc.' : 'Immat.')
                                                : (selectedProprieteData.type_operation === 'morcellement' ? 'Morcellement' : 'Immatriculation')
                                            }
                                        </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground text-[10px] xs:text-xs flex items-center gap-1">
                                                <Ruler className="h-2.5 w-2.5 xs:h-3 xs:w-3" />
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
                                        <>
                                            <div className="text-xs">
                                                <span className="text-muted-foreground text-[10px] xs:text-xs">Propriétaire:</span>
                                                <div className="font-medium text-xs truncate">
                                                    {selectedProprieteData.proprietaire}
                                                </div>
                                            </div>

                                            <div className="text-xs">
                                                <span className="text-muted-foreground text-[10px] xs:text-xs">Situation:</span>
                                                <div className="font-medium text-xs truncate">
                                                    {selectedProprieteData.situation}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] xs:text-xs text-muted-foreground">
                                        {isMobile ? 'Réq.:' : 'Réquisition:'}
                                    </span>
                                    <DocumentStatusBadge document={selectedProprieteData.document_requisition} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Statut réquisition */}
                {reqPropriete && hasRequisition && documentRequisition && (
                    <Alert className="bg-green-500/10 border-green-500/50 p-2 sm:p-4">
                        <FileCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                        <AlertDescription className="text-green-700 dark:text-green-300 text-xs sm:text-sm">
                            <div className="font-medium">
                                Réquisition déjà générée
                            </div>
                            {!isMobile && (
                                <div className="text-[10px] xs:text-xs opacity-75 mt-0.5">
                                    Généré le {documentRequisition.generated_at}
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Génération en cours */}
                {isGenerating && (
                    <Alert className="bg-blue-500/10 border-blue-500/50 p-2 sm:p-4">
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 animate-spin" />
                        <AlertDescription className="text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                            {hasRequisition ? 'Téléchargement en cours...' : 'Génération en cours...'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Bouton */}
                {reqPropriete && (
                    hasRequisition && documentRequisition ? (
                        <SecureDownloadButton
                            document={documentRequisition}
                            downloadRoute={route('documents.requisition.download', documentRequisition.id)}
                            regenerateRoute={route('documents.requisition.regenerate', documentRequisition.id)}
                            typeName={isMobile ? 'Réq.' : 'Réquisition'}
                            size={isMobile ? 'default' : 'lg'}
                        />
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            disabled={!canGenerate() || isGenerating}
                            size={isMobile ? 'default' : 'lg'}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-xs sm:text-sm"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                                    Génération...
                                </>
                            ) : (
                                <>
                                    <FileOutput className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                    {isMobile ? 'Générer' : 'Générer la Réquisition'}
                                </>
                            )}
                        </Button>
                    )
                )}
            </CardContent>
        </Card>
    );
}