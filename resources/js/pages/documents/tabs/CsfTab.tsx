// documents/tabs/CsfTab.tsx - ✅ VERSION FINALE COMPLÈTE

import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertCircle, FileCheck, Crown, MapPin, Ruler, Building2, User, Phone, Briefcase } from 'lucide-react';
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

    const formatContenance = (contenance: number | null): string => {
        if (!contenance) return '-';
        const ha = Math.floor(contenance / 10000);
        const reste = contenance % 10000;
        const a = Math.floor(reste / 100);
        const ca = reste % 100;
        const parts = [];
        if (ha > 0) parts.push(`${ha}Ha`);
        if (a > 0) parts.push(`${a}A`);
        parts.push(`${ca}Ca`);
        return parts.join(' ');
    };

    return (
        <div className="space-y-4">
            {/* Sélection Propriété */}
            <div className="space-y-2">
                <Label className="text-sm font-semibold">Propriété</Label>
                <div className="max-w-2xl">
                    <ProprieteSelect
                        value={csfPropriete}
                        onChange={handleProprieteChange}
                        proprietes={proprietes}
                        disabled={isGenerating}
                        placeholder="Sélectionnez une propriété"
                    />
                </div>
            </div>

            {csfPropriete && demandeursFiltered.length === 0 && (
                <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        Aucun demandeur associé à cette propriété
                    </AlertDescription>
                </Alert>
            )}

            {csfPropriete && demandeursFiltered.length > 0 && (
                <>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Demandeur</Label>
                        <div className="max-w-2xl">
                            <DemandeurSelect
                                value={csfDemandeur}
                                onChange={setCsfDemandeur}
                                demandeurs={demandeursFiltered}
                                disabled={isGenerating}
                                demandeurLies={selectedProprieteData?.demandeurs_lies}
                                placeholder="Sélectionnez un demandeur"
                            />
                        </div>
                    </div>

                    {csfDemandeur && selectedDemandeurData && selectedProprieteData && (
                        <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/10">
                            <CardContent className="p-4 sm:p-6 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                                        <MapPin className="h-4 w-4" />
                                        <span>Propriété Lot {selectedProprieteData.lot}</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                        <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                <Ruler className="h-3 w-3" />
                                                Contenance
                                            </div>
                                            <p className="font-semibold text-sm">{formatContenance(selectedProprieteData.contenance)}</p>
                                        </div>
                                        <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                <Building2 className="h-3 w-3" />
                                                Nature
                                            </div>
                                            <p className="font-semibold text-sm capitalize">{selectedProprieteData.nature}</p>
                                        </div>
                                        <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg col-span-2 lg:col-span-1">
                                            <div className="text-xs text-muted-foreground mb-1">Propriétaire</div>
                                            <p className="font-semibold text-sm truncate">{selectedProprieteData.proprietaire}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-emerald-200 dark:border-emerald-800 space-y-3">
                                    <div className="flex items-center gap-2">
                                        {selectedProprieteData?.demandeurs_lies?.find(d => d.id === selectedDemandeurData.id)?.ordre === 1 && (
                                            <Crown className="h-4 w-4 text-yellow-500" />
                                        )}
                                        <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        <span className="font-semibold text-sm">
                                            {selectedDemandeurData.titre_demandeur} {selectedDemandeurData.nom_demandeur} {selectedDemandeurData.prenom_demandeur}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                            <div className="text-xs text-muted-foreground mb-1">CIN</div>
                                            <p className="font-mono text-sm">{selectedDemandeurData.cin}</p>
                                        </div>
                                        {selectedDemandeurData.occupation && (
                                            <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                    <Briefcase className="h-3 w-3" />
                                                    Occupation
                                                </div>
                                                <p className="font-semibold text-sm">{selectedDemandeurData.occupation}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">CSF:</span>
                                        <DocumentStatusBadge document={selectedDemandeurData.document_csf} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {csfDemandeur && hasCsf && documentCsf && (
                        <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 py-2">
                            <FileCheck className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-xs text-green-800 dark:text-green-200">
                                CSF déjà généré
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isMobile && csfDemandeur && (
                        <div className="flex flex-col items-center pt-2">
                            <div className="w-full max-w-md">
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
                        </div>
                    )}

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

// ============================================
// REQUISITION TAB
// ============================================

import { Badge } from '@/components/ui/badge';

interface RequisitionTabProps {
    proprietes: ProprieteWithDemandeurs[];
    dossier: Dossier;
}

export function RequisitionTab({ proprietes, dossier }: RequisitionTabProps) {
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

    const formatContenance = (contenance: number | null): string => {
        if (!contenance) return '-';
        const ha = Math.floor(contenance / 10000);
        const reste = contenance % 10000;
        const a = Math.floor(reste / 100);
        const ca = reste % 100;
        const parts = [];
        if (ha > 0) parts.push(`${ha}Ha`);
        if (a > 0) parts.push(`${a}A`);
        parts.push(`${ca}Ca`);
        return parts.join(' ');
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-sm font-semibold">Propriété</Label>
                <div className="max-w-2xl">
                    <ProprieteSelect
                        value={reqPropriete}
                        onChange={setReqPropriete}
                        proprietes={proprietes}
                        disabled={isGenerating}
                        placeholder="Sélectionnez une propriété"
                    />
                </div>
            </div>

            {reqPropriete && selectedProprieteData && (
                <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-950/10 dark:to-cyan-950/10">
                    <CardContent className="p-4 sm:p-6 space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="font-semibold text-sm">Lot {selectedProprieteData.lot}</span>
                                <Badge variant={selectedProprieteData.type_operation === 'morcellement' ? 'default' : 'secondary'} className="text-xs">
                                    {selectedProprieteData.type_operation === 'morcellement' ? 'Morcellement' : 'Immatriculation'}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <Ruler className="h-3 w-3" />
                                        Contenance
                                    </div>
                                    <p className="font-semibold text-sm">{formatContenance(selectedProprieteData.contenance)}</p>
                                </div>
                                <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        Nature
                                    </div>
                                    <p className="font-semibold text-sm capitalize">{selectedProprieteData.nature}</p>
                                </div>
                                <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg col-span-2 lg:col-span-1">
                                    <div className="text-xs text-muted-foreground mb-1">Propriétaire</div>
                                    <p className="font-semibold text-sm truncate">{selectedProprieteData.proprietaire}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs pt-2 border-t">
                                <span className="text-muted-foreground">Réquisition:</span>
                                <DocumentStatusBadge document={selectedProprieteData.document_requisition} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {reqPropriete && hasRequisition && documentRequisition && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 py-2">
                    <FileCheck className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-xs text-green-800 dark:text-green-200">
                        Réquisition déjà générée
                    </AlertDescription>
                </Alert>
            )}

            {!isMobile && reqPropriete && (
                <div className="flex flex-col items-center pt-2">
                    <div className="w-full max-w-md">
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
                </div>
            )}

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