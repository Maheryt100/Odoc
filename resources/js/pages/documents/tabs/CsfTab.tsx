// documents/tabs/CsfTab.tsx - ✅ VERSION ULTRA-CLEAN

import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertCircle, FileCheck, Crown, Users } from 'lucide-react';
import { Dossier } from '@/types';
import { ProprieteWithDemandeurs, DemandeurWithCSF } from '../types';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import SecureDownloadButton from '../components/SecureDownloadButton';
import { ProprieteSelect, DemandeurSelect } from '../components/DocumentSelects';
import { StickyActionFooter } from '../components/StickyActionFooter';
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
        return !!(selectedProprieteData && selectedDemandeurData);
    };

    const handleGenerate = () => {
        if (!csfPropriete || !csfDemandeur || isGenerating) {
            toast.warning('Sélectionnez une propriété et un demandeur');
            return;
        }

        setIsGenerating(true);

        try {
            const params = new URLSearchParams({
                id_propriete: csfPropriete,
                id_demandeur: csfDemandeur,
            });

            window.location.href = `${route('documents.csf.generate')}?${params.toString()}`;
            toast.success('Génération du CSF...');
            
            setTimeout(() => {
                router.reload({ 
                    only: ['demandeurs'],
                    preserveUrl: true,
                    onSuccess: () => {
                        toast.success('CSF généré !');
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

    const handleProprieteChange = (value: string) => {
        setCsfPropriete(value);
        setCsfDemandeur('');
    };

    return (
        <div className="space-y-4">
            {/* Sélection Propriété */}
            <div className="space-y-2">
                <Label className="text-sm font-semibold">Propriété</Label>
                <ProprieteSelect
                    value={csfPropriete}
                    onChange={handleProprieteChange}
                    proprietes={proprietes}
                    disabled={isGenerating}
                />
            </div>

            {/* Alerte pas de demandeurs */}
            {csfPropriete && demandeursFiltered.length === 0 && (
                <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        Aucun demandeur associé à cette propriété
                    </AlertDescription>
                </Alert>
            )}

            {/* Sélection Demandeur */}
            {csfPropriete && demandeursFiltered.length > 0 && (
                <>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Demandeur</Label>
                        <DemandeurSelect
                            value={csfDemandeur}
                            onChange={setCsfDemandeur}
                            demandeurs={demandeursFiltered}
                            disabled={isGenerating}
                            demandeurLies={selectedProprieteData?.demandeurs_lies}
                        />
                    </div>

                    {/* Info compacte */}
                    {csfDemandeur && selectedDemandeurData && (
                        <Card className="border-emerald-200 dark:border-emerald-800">
                            <CardContent className="p-4 space-y-3">
                                {/* Demandeur */}
                                <div className="flex items-center gap-2">
                                    {selectedProprieteData?.demandeurs_lies?.find(d => d.id === selectedDemandeurData.id)?.ordre === 1 && (
                                        <Crown className="h-4 w-4 text-yellow-500" />
                                    )}
                                    <span className="font-semibold text-sm">
                                        {selectedDemandeurData.nom_demandeur} {selectedDemandeurData.prenom_demandeur}
                                    </span>
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground">CSF:</span>
                                    <DocumentStatusBadge document={selectedDemandeurData.document_csf} />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Alerte succès */}
                    {csfDemandeur && hasCsf && documentCsf && (
                        <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 py-2">
                            <FileCheck className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-xs text-green-800 dark:text-green-200">
                                CSF déjà généré
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Bouton Desktop */}
                    {!isMobile && csfDemandeur && (
                        <div className="pt-2">
                            {hasCsf && documentCsf ? (
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
                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
                                >
                                    Générer le CSF
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Footer Mobile */}
                    {isMobile && csfDemandeur && (
                        <StickyActionFooter
                            activeTab="csf"
                            isGenerating={isGenerating}
                            canGenerate={canGenerate()}
                            hasDocument={hasCsf}
                            onGenerate={handleGenerate}
                            onDownload={documentCsf ? () => window.location.href = route('documents.csf.download', documentCsf.id) : undefined}
                        />
                    )}
                </>
            )}
        </div>
    );
}