// documents/tabs/RequisitionTab.tsx - ✅ VERSION ULTRA-CLEAN

import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileCheck, MapPin } from 'lucide-react';
import { Dossier } from '@/types';
import { ProprieteWithDemandeurs } from '../types';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import SecureDownloadButton from '../components/SecureDownloadButton';
import { ProprieteSelect } from '../components/DocumentSelects';
import { StickyActionFooter } from '../components/StickyActionFooter';
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
        return !!selectedProprieteData;
    };

    const handleGenerate = () => {
        if (!reqPropriete || isGenerating) {
            toast.warning('Veuillez sélectionner une propriété');
            return;
        }

        setIsGenerating(true);

        try {
            const params = new URLSearchParams({ id_propriete: reqPropriete });
            window.location.href = `${route('documents.requisition.generate')}?${params.toString()}`;
            
            toast.success('Génération de la réquisition...');
            
            setTimeout(() => {
                router.reload({ 
                    only: ['proprietes'],
                    preserveUrl: true,
                    onSuccess: () => {
                        toast.success('Réquisition générée !');
                        setIsGenerating(false);
                    },
                    onError: () => {
                        toast.error('Erreur lors de la mise à jour');
                        setIsGenerating(false);
                    }
                });
            }, 2000);
            
        } catch (error) {
            toast.error('Erreur de génération');
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Sélection */}
            <div className="space-y-2">
                <Label className="text-sm font-semibold">Propriété</Label>
                <ProprieteSelect
                    value={reqPropriete}
                    onChange={setReqPropriete}
                    proprietes={proprietes}
                    disabled={isGenerating}
                />
            </div>

            {/* Info compacte */}
            {reqPropriete && selectedProprieteData && (
                <Card className="border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4 space-y-3">
                        {/* Type opération */}
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-sm">
                                Lot {selectedProprieteData.lot}
                            </span>
                            <Badge 
                                variant={selectedProprieteData.type_operation === 'morcellement' ? 'default' : 'secondary'}
                                className="text-xs"
                            >
                                {selectedProprieteData.type_operation === 'morcellement' ? 'Morcellement' : 'Immatriculation'}
                            </Badge>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Réquisition:</span>
                            <DocumentStatusBadge document={selectedProprieteData.document_requisition} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Alerte succès */}
            {reqPropriete && hasRequisition && documentRequisition && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 py-2">
                    <FileCheck className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-xs text-green-800 dark:text-green-200">
                        Réquisition déjà générée
                    </AlertDescription>
                </Alert>
            )}

            {/* Bouton Desktop */}
            {!isMobile && reqPropriete && (
                <div className="pt-2">
                    {hasRequisition && documentRequisition ? (
                        <SecureDownloadButton
                            document={documentRequisition}
                            downloadRoute={route('documents.requisition.download', documentRequisition.id)}
                            regenerateRoute={route('documents.requisition.regenerate', documentRequisition.id)}
                            typeName="Réquisition"
                        />
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            disabled={!canGenerate() || isGenerating}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
                        >
                            Générer la Réquisition
                        </Button>
                    )}
                </div>
            )}

            {/* Footer Mobile */}
            {isMobile && reqPropriete && (
                <StickyActionFooter
                    activeTab="requisition"
                    isGenerating={isGenerating}
                    canGenerate={canGenerate()}
                    hasDocument={hasRequisition}
                    onGenerate={handleGenerate}
                    onDownload={documentRequisition ? () => window.location.href = route('documents.requisition.download', documentRequisition.id) : undefined}
                />
            )}
        </div>
    );
}