// documents/tabs/ActeVenteTab.tsx - ✅ VERSION AMÉLIORÉE AVEC INFOS

import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Clock, Crown, Users, XCircle, MapPin, Ruler, Building2, Coins } from 'lucide-react';
import { Demandeur, Dossier } from '@/types';
import { ProprieteWithDemandeurs, DemandeurWithCSF } from '../types';
import { getDemandeurPrincipal, getConsorts, getMissingProprieteFields, getMissingDemandeurFields } from '../validation';
import { safePrix, formatMontant } from '../helpers';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import SecureDownloadButton from '../components/SecureDownloadButton';
import { ProprieteSelect } from '../components/DocumentSelects';
import { StickyActionFooter } from '../components/StickyActionFooter';
import { useIsMobile } from '@/hooks/useResponsive';

interface ActeVenteTabProps {
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: DemandeurWithCSF[];
    dossier: Dossier;
}

export default function ActeVenteTab({ proprietes, demandeurs, dossier }: ActeVenteTabProps) {
    const [selectedPropriete, setSelectedPropriete] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const isMobile = useIsMobile();

    const selectedProprieteData = proprietes.find(p => p.id === Number(selectedPropriete));
    const demandeurPrincipal = useMemo(() => {
        if (!selectedProprieteData?.demandeurs_lies) return null;
        return getDemandeurPrincipal(selectedProprieteData.demandeurs_lies);
    }, [selectedProprieteData]);

    const consorts = useMemo(() => {
        if (!selectedProprieteData?.demandeurs_lies) return [];
        return getConsorts(selectedProprieteData.demandeurs_lies);
    }, [selectedProprieteData]);

    const documentRecu = selectedProprieteData?.document_recu;
    const documentAdv = selectedProprieteData?.document_adv;
    const hasRecu = !!documentRecu;
    const hasAdv = !!documentAdv;

    const canGenerateRecu = useMemo(() => {
        if (!selectedPropriete || !demandeurPrincipal || hasRecu) return false;
        if (!selectedProprieteData) return false;
        
        const missingPropFields = getMissingProprieteFields(selectedProprieteData);
        if (missingPropFields.length > 0) return false;
        
        const demandeurData = demandeurs.find(d => d.id === demandeurPrincipal.id);
        if (!demandeurData) return false;
        
        const missingDemFields = getMissingDemandeurFields(demandeurData);
        return missingDemFields.length === 0;
    }, [selectedPropriete, demandeurPrincipal, hasRecu, selectedProprieteData, demandeurs]);

    const canGenerateActeVente = useMemo(() => {
        if (!selectedPropriete || !demandeurPrincipal || hasAdv || !hasRecu) return false;
        if (!selectedProprieteData) return false;
        
        const missingPropFields = getMissingProprieteFields(selectedProprieteData);
        if (missingPropFields.length > 0) return false;
        
        const demandeurData = demandeurs.find(d => d.id === demandeurPrincipal.id);
        if (!demandeurData) return false;
        
        const missingDemFields = getMissingDemandeurFields(demandeurData);
        return missingDemFields.length === 0;
    }, [selectedPropriete, demandeurPrincipal, hasAdv, hasRecu, selectedProprieteData, demandeurs]);

    const validationMessage = useMemo(() => {
        if (!selectedPropriete) return "Sélectionnez une propriété";
        if (!demandeurPrincipal) return "Aucun demandeur principal trouvé";
        
        const missingPropFields = getMissingProprieteFields(selectedProprieteData!);
        const demandeurData = demandeurs.find(d => d.id === demandeurPrincipal.id);
        const missingDemFields = demandeurData ? getMissingDemandeurFields(demandeurData) : [];
        
        if (missingPropFields.length > 0 && missingDemFields.length > 0) {
            return `Manquant: ${missingPropFields.join(', ')}, ${missingDemFields.join(', ')}`;
        } else if (missingPropFields.length > 0) {
            return `Propriété: ${missingPropFields.join(', ')}`;
        } else if (missingDemFields.length > 0) {
            return `Demandeur: ${missingDemFields.join(', ')}`;
        }
        return null;
    }, [selectedPropriete, selectedProprieteData, demandeurPrincipal, demandeurs]);

    const handleGenerate = async (type: 'recu' | 'acte_vente') => {
        if (type === 'recu' && !canGenerateRecu) {
            toast.error('Impossible de générer le reçu', { description: validationMessage || 'Données incomplètes' });
            return;
        }

        if (type === 'acte_vente' && !canGenerateActeVente) {
            toast.error('Impossible de générer l\'acte de vente', { description: validationMessage || 'Reçu manquant' });
            return;
        }

        if (!selectedPropriete || !demandeurPrincipal || isGenerating) return;

        setIsGenerating(true);

        try {
            const params = new URLSearchParams({
                id_propriete: selectedPropriete,
                id_demandeur: String(demandeurPrincipal.id),
            });

            const baseUrl = type === 'recu' 
                ? route('documents.recu.generate')
                : route('documents.acte-vente.generate');
            
            window.location.href = `${baseUrl}?${params.toString()}`;
            
            toast.success(type === 'recu' ? 'Génération du reçu...' : 'Génération de l\'ADV...');
            
            setTimeout(() => {
                router.reload({ 
                    only: ['proprietes'],
                    preserveUrl: true,
                    onSuccess: () => {
                        toast.success(`${type === 'recu' ? 'Reçu' : 'Acte de vente'} généré !`);
                        setIsGenerating(false);
                    },
                    onError: () => {
                        toast.error('Erreur lors de la mise à jour');
                        setIsGenerating(false);
                    }
                });
            }, 2500);
            
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

    const prixTotal = demandeurPrincipal ? safePrix(demandeurPrincipal.total_prix) : 0;

    return (
        <div className="space-y-4">
            {/* ✅ Sélection avec largeur limitée */}
            <div className="space-y-2">
                <Label className="text-sm font-semibold">Propriété</Label>
                <div className="max-w-2xl">
                    <ProprieteSelect
                        value={selectedPropriete}
                        onChange={setSelectedPropriete}
                        proprietes={proprietes}
                        disabled={isGenerating}
                        placeholder="Sélectionnez une propriété"
                    />
                </div>
            </div>

            {/* ✅ Infos détaillées propriété + demandeur */}
            {selectedPropriete && selectedProprieteData && demandeurPrincipal && (
                <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20">
                    <CardContent className="p-4 sm:p-6 space-y-4">
                        {/* Infos propriété */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-violet-900 dark:text-violet-100">
                                <MapPin className="h-4 w-4" />
                                <span>Informations de la propriété</span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <Ruler className="h-3 w-3" />
                                        <span>Contenance</span>
                                    </div>
                                    <p className="font-semibold text-sm">
                                        {formatContenance(selectedProprieteData.contenance)}
                                    </p>
                                </div>

                                <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <Building2 className="h-3 w-3" />
                                        <span>Nature</span>
                                    </div>
                                    <p className="font-semibold text-sm capitalize">
                                        {selectedProprieteData.nature}
                                    </p>
                                </div>

                                <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg sm:col-span-2 lg:col-span-1">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <Users className="h-3 w-3" />
                                        <span>Propriétaire</span>
                                    </div>
                                    <p className="font-semibold text-sm truncate">
                                        {selectedProprieteData.proprietaire}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Demandeur principal */}
                        <div className="pt-3 border-t border-violet-200 dark:border-violet-800">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Crown className="h-4 w-4 text-yellow-500" />
                                        <span className="font-semibold text-sm">
                                            {demandeurPrincipal.nom} {demandeurPrincipal.prenom}
                                        </span>
                                        {consorts.length > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                                <Users className="h-3 w-3 mr-1" />
                                                +{consorts.length} consort{consorts.length > 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Prix */}
                                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 rounded-lg">
                                    <Coins className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                    <div className="flex-1">
                                        <span className="text-xs text-muted-foreground">Prix total</span>
                                        <p className="font-bold text-lg">{formatMontant(prixTotal)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status documents */}
                        <div className="pt-3 border-t border-violet-200 dark:border-violet-800">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground">Reçu:</span>
                                    <DocumentStatusBadge document={documentRecu} />
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground">ADV:</span>
                                    <DocumentStatusBadge document={documentAdv} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Alertes */}
            {selectedPropriete && validationMessage && !hasRecu && !hasAdv && (
                <Alert variant="destructive" className="py-2">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{validationMessage}</AlertDescription>
                </Alert>
            )}

            {selectedPropriete && !hasRecu && !validationMessage && (
                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 py-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                        Générez d'abord le reçu
                    </AlertDescription>
                </Alert>
            )}

            {hasRecu && documentRecu && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 py-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-xs text-green-800 dark:text-green-200">
                        Reçu N°{documentRecu.numero_document} confirmé
                    </AlertDescription>
                </Alert>
            )}

            {/* Boutons Desktop - Centrés */}
            {!isMobile && selectedPropriete && demandeurPrincipal && (
                <div className="flex flex-col items-center space-y-3 pt-2">
                    <div className="w-full max-w-md space-y-3">
                        {hasRecu && documentRecu ? (
                            <SecureDownloadButton
                                document={documentRecu}
                                downloadRoute={route('documents.recu.download', documentRecu.id)}
                                regenerateRoute={route('documents.recu.regenerate', documentRecu.id)}
                                typeName="Reçu"
                                variant="outline"
                            />
                        ) : (
                            <Button
                                onClick={() => handleGenerate('recu')}
                                disabled={!canGenerateRecu || isGenerating}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                            >
                                Générer le Reçu
                            </Button>
                        )}

                        {hasRecu && (
                            hasAdv && documentAdv ? (
                                <SecureDownloadButton
                                    document={documentAdv}
                                    downloadRoute={route('documents.acte-vente.download', documentAdv.id)}
                                    regenerateRoute={route('documents.acte-vente.regenerate', documentAdv.id)}
                                    typeName="Acte de Vente"
                                />
                            ) : (
                                <Button
                                    onClick={() => handleGenerate('acte_vente')}
                                    disabled={!canGenerateActeVente || isGenerating}
                                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
                                >
                                    Générer l'Acte de Vente
                                    {consorts.length > 0 && (
                                        <Badge variant="secondary" className="ml-2">
                                            {consorts.length + 1} demandeurs
                                        </Badge>
                                    )}
                                </Button>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* Footer Mobile */}
            {isMobile && selectedPropriete && demandeurPrincipal && (
                <>
                    {!hasRecu ? (
                        <StickyActionFooter
                            activeTab="acte_vente"
                            isGenerating={isGenerating}
                            canGenerate={canGenerateRecu}
                            hasDocument={false}
                            onGenerate={() => handleGenerate('recu')}
                            validationMessage={validationMessage}
                            documentType="recu"
                        />
                    ) : hasRecu && documentRecu && !hasAdv ? (
                        <StickyActionFooter
                            activeTab="acte_vente"
                            isGenerating={isGenerating}
                            canGenerate={canGenerateActeVente}
                            hasDocument={false}
                            onGenerate={() => handleGenerate('acte_vente')}
                            validationMessage={validationMessage}
                            documentType="adv"
                        />
                    ) : hasAdv && documentAdv && (
                        <StickyActionFooter
                                    activeTab="acte_vente"
                                    isGenerating={false}
                                    canGenerate={true}
                                    hasDocument={true}
                                    onDownload={() => window.location.href = route('documents.acte-vente.download', documentAdv.id)}
                                    documentType="adv" onGenerate={function (): void {
                                        throw new Error('Function not implemented.');
                                    } }                        />
                    )}
                </>
            )}
        </div>
    );
}