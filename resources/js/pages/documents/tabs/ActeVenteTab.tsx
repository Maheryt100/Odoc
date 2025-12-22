// documents/tabs/ActeVenteTab.tsx - ✅ VERSION MOBILE-OPTIMIZED

import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    FileText, AlertCircle, Users, CheckCircle2, 
    Lock, Receipt, Clock, Loader2, Crown, FileCheck, MapPin, Coins, XCircle
} from 'lucide-react';
import { Demandeur, Dossier } from '@/types';
import { ProprieteWithDemandeurs, DemandeurWithCSF } from '../types';
import { 
    isDemandeurComplete, 
    getDemandeurPrincipal,
    getConsorts,
    getMissingProprieteFields,
    getMissingDemandeurFields
} from '../validation';
import { safePrix, formatMontant } from '../helpers';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import SecureDownloadButton from '../components/SecureDownloadButton';
import ProprieteSelect from '../components/ProprieteSelect'; // ✅ NOUVEAU
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

    const isPrincipalComplete = useMemo(() => {
        if (!demandeurPrincipal) return false;
        const demandeurData = demandeurs.find(d => d.id === demandeurPrincipal.id);
        return demandeurData ? isDemandeurComplete(demandeurData) : false;
    }, [demandeurPrincipal, demandeurs]);

    const documentRecu = selectedProprieteData?.document_recu;
    const documentAdv = selectedProprieteData?.document_adv;
    const hasRecu = !!documentRecu;
    const hasAdv = !!documentAdv;

    const canGenerateRecu = useMemo(() => {
        if (!selectedPropriete || !demandeurPrincipal || hasRecu) return false;
        if (!selectedProprieteData || !isPrincipalComplete) return false;
        
        const missingPropFields = getMissingProprieteFields(selectedProprieteData);
        if (missingPropFields.length > 0) return false;
        
        const demandeurData = demandeurs.find(d => d.id === demandeurPrincipal.id);
        if (!demandeurData) return false;
        
        const missingDemFields = getMissingDemandeurFields(demandeurData);
        if (missingDemFields.length > 0) return false;
        
        return true;
    }, [selectedPropriete, demandeurPrincipal, hasRecu, selectedProprieteData, isPrincipalComplete, demandeurs]);

    const canGenerateActeVente = useMemo(() => {
        if (!selectedPropriete || !demandeurPrincipal || hasAdv || !hasRecu) return false;
        if (!selectedProprieteData || !isPrincipalComplete) return false;
        
        const missingPropFields = getMissingProprieteFields(selectedProprieteData);
        if (missingPropFields.length > 0) return false;
        
        const demandeurData = demandeurs.find(d => d.id === demandeurPrincipal.id);
        if (!demandeurData) return false;
        
        const missingDemFields = getMissingDemandeurFields(demandeurData);
        if (missingDemFields.length > 0) return false;
        
        return true;
    }, [selectedPropriete, demandeurPrincipal, hasAdv, hasRecu, selectedProprieteData, isPrincipalComplete, demandeurs]);

    const validationMessage = useMemo(() => {
        if (!selectedPropriete) return "Veuillez sélectionner une propriété";
        if (!selectedProprieteData) return "Propriété introuvable";
        if (!demandeurPrincipal) return "Aucun demandeur principal (ordre = 1) trouvé";
        
        const missingPropFields = getMissingProprieteFields(selectedProprieteData);
        const demandeurData = demandeurs.find(d => d.id === demandeurPrincipal.id);
        const missingDemFields = demandeurData ? getMissingDemandeurFields(demandeurData) : [];
        
        if (missingPropFields.length > 0 && missingDemFields.length > 0) {
            return `Propriété: ${missingPropFields.join(', ')} | Demandeur: ${missingDemFields.join(', ')}`;
        } else if (missingPropFields.length > 0) {
            return `Propriété: ${missingPropFields.join(', ')}`;
        } else if (missingDemFields.length > 0) {
            return `Demandeur: ${missingDemFields.join(', ')}`;
        }
        
        return null;
    }, [selectedPropriete, selectedProprieteData, demandeurPrincipal, demandeurs]);

    const formatContenance = (contenance: number | null): string => {
        if (!contenance) return '-';
        
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

    const handleGenerate = async (type: 'recu' | 'acte_vente') => {
        if (type === 'recu' && !canGenerateRecu) {
            toast.error('Impossible de générer le reçu', {
                description: validationMessage || 'Données incomplètes',
            });
            return;
        }

        if (type === 'acte_vente' && !canGenerateActeVente) {
            toast.error('Impossible de générer l\'acte de vente', {
                description: validationMessage || 'Données incomplètes ou reçu manquant',
            });
            return;
        }

        if (!selectedPropriete || !demandeurPrincipal) {
            toast.error('Sélection incomplète');
            return;
        }

        if (isGenerating) {
            toast.warning('Génération en cours, veuillez patienter...');
            return;
        }

        setIsGenerating(true);

        try {
            const params = new URLSearchParams({
                id_propriete: selectedPropriete,
                id_demandeur: String(demandeurPrincipal.id),
            });

            const baseUrl = type === 'recu' 
                ? route('documents.recu.generate')
                : route('documents.acte-vente.generate');
            
            const url = `${baseUrl}?${params.toString()}`;
            
            const messages = {
                recu: 'Génération du reçu en cours...',
                acte_vente: consorts.length > 0
                    ? `Génération ADV avec ${consorts.length + 1} demandeurs`
                    : 'Génération de l\'acte de vente...',
            };
            
            toast.success(messages[type]);
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
            window.location.href = url;
            
            setTimeout(() => {
                router.reload({ 
                    only: ['proprietes'],
                    preserveUrl: true,
                    onSuccess: () => {
                        toast.success(`${type === 'recu' ? 'Reçu' : 'Acte de vente'} généré avec succès !`);
                        setIsGenerating(false);
                    },
                    onError: () => {
                        toast.error('Erreur lors de la mise à jour');
                        setIsGenerating(false);
                    }
                });
            }, 2500);
            
        } catch (error) {
            console.error('Erreur génération:', error);
            toast.error('Erreur lors de la préparation du téléchargement');
            setIsGenerating(false);
        }
    };

    const prixTotal = demandeurPrincipal ? safePrix(demandeurPrincipal.total_prix) : 0;

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-violet-600 dark:text-violet-400" />
                    {isMobile ? 'ADV' : 'Acte de Vente'}
                </CardTitle>
                {!isMobile && (
                    <CardDescription className="text-xs sm:text-sm md:text-base">
                        Le demandeur principal (ordre = 1) sera automatiquement utilisé
                    </CardDescription>
                )}
            </CardHeader>
            
            <CardContent className="space-y-3 sm:space-y-6 p-3 sm:p-6">
                {/* ✅ NOUVEAU Select optimisé */}
                <div className="space-y-2">
                    <Label className="text-xs sm:text-sm md:text-base font-semibold">Propriété</Label>
                    <ProprieteSelect
                        value={selectedPropriete}
                        onChange={setSelectedPropriete}
                        proprietes={proprietes}
                        disabled={isGenerating}
                        showDemandeurs={true}
                    />
                </div>

                {/* ✅ Alerte validation compacte */}
                {selectedPropriete && validationMessage && !hasRecu && !hasAdv && (
                    <Alert variant="destructive" className="p-2 sm:p-4">
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        <AlertDescription className="text-xs sm:text-sm">
                            <div className="font-semibold mb-0.5">Impossible de générer</div>
                            <div className="text-[10px] xs:text-xs">{validationMessage}</div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* ✅ Carte propriété compacte */}
                {selectedPropriete && selectedProprieteData && (
                    <Card className="border-2 border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
                        <CardContent className="p-2 sm:p-4 space-y-2 sm:space-y-4">
                            {/* Infos propriété */}
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                                <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <Badge className="bg-violet-600 text-white text-[10px] xs:text-xs">
                                            Lot {selectedProprieteData.lot}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] xs:text-xs">
                                            TN°{selectedProprieteData.titre}
                                        </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
                                        <div>
                                            <span className="text-muted-foreground text-[10px] xs:text-xs sm:text-sm">
                                                {isMobile ? 'Cont.' : 'Contenance'}:
                                            </span>
                                            <div className="font-semibold text-xs sm:text-sm">
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
                                </div>
                            </div>

                            {/* Demandeurs */}
                            {demandeurPrincipal && (
                                <div className="pt-2 border-t border-violet-200 dark:border-violet-800">
                                    <div className="flex items-start gap-2">
                                        <Users className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <Badge className="bg-yellow-500 text-white text-[10px] xs:text-xs sm:text-sm">
                                                    <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
                                                    {isMobile ? 'Princ.' : 'Principal'}
                                                </Badge>
                                                <span className="font-semibold text-xs truncate">
                                                    {demandeurPrincipal.nom} {demandeurPrincipal.prenom}
                                                </span>
                                            </div>
                                            
                                            {consorts.length > 0 && !isMobile && (
                                                <div className="space-y-1 p-2 bg-white/60 dark:bg-gray-900/60 rounded text-xs">
                                                    <div className="font-medium text-muted-foreground flex items-center gap-1.5">
                                                        <Users className="h-3 w-3" />
                                                        Consorts ({consorts.length})
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Prix */}
                            <div className="pt-2 border-t border-violet-200 dark:border-violet-800">
                                <div className="flex items-center gap-1.5 p-2 bg-white/60 dark:bg-gray-900/60 rounded">
                                    <Coins className="h-3 w-3 sm:h-4 sm:w-4 text-violet-600 shrink-0" />
                                    <span className="text-muted-foreground text-[10px] xs:text-xs">
                                        {isMobile ? 'Prix:' : 'Prix total:'}
                                    </span>
                                    <span className="font-bold text-xs sm:text-sm md:text-base ml-auto">
                                        {formatMontant(prixTotal)}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Status */}
                            <div className="pt-2 border-t space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] xs:text-xs text-muted-foreground">Reçu:</span>
                                    <DocumentStatusBadge document={documentRecu} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] xs:text-xs text-muted-foreground">ADV:</span>
                                    <DocumentStatusBadge document={documentAdv} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Alertes */}
                {selectedPropriete && (
                    <>
                        {!hasRecu ? (
                            <Alert className="bg-amber-500/10 border-amber-500/50 p-2 sm:p-4">
                                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                                <AlertDescription className="text-xs sm:text-sm md:text-base">
                                    <strong>Étape obligatoire :</strong> Générer d'abord le reçu
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert className="bg-green-500/10 border-green-500/50 p-2 sm:p-4">
                                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                                <AlertDescription className="text-xs sm:text-sm md:text-base">
                                    <div className="font-medium">Reçu N°{documentRecu?.numero_document} confirmé</div>
                                    {!isMobile && (
                                        <div className="text-[10px] xs:text-xs opacity-75 flex items-center gap-1.5 mt-0.5">
                                            <Clock className="h-2.5 w-2.5" />
                                            {documentRecu?.generated_at}
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        {hasAdv && (
                            <Alert className="bg-blue-500/10 border-blue-500/50 p-2 sm:p-4">
                                <FileCheck className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                                <AlertDescription className="text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                                    <div className="font-medium">Acte de vente déjà généré</div>
                                    {!isMobile && (
                                        <div className="text-[10px] xs:text-xs opacity-75 flex items-center gap-1.5 mt-0.5">
                                            <Clock className="h-2.5 w-2.5" />
                                            {documentAdv?.generated_at}
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}
                    </>
                )}

                {isGenerating && (
                    <Alert className="bg-blue-500/10 border-blue-500/50 p-2 sm:p-4">
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 animate-spin" />
                        <AlertDescription className="text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                            Génération en cours...
                        </AlertDescription>
                    </Alert>
                )}

                {/* Boutons */}
                {selectedPropriete && demandeurPrincipal && (
                    <div className="space-y-2 sm:space-y-3">
                        {hasRecu && documentRecu ? (
                            <SecureDownloadButton
                                document={documentRecu}
                                downloadRoute={route('documents.recu.download', documentRecu.id)}
                                regenerateRoute={route('documents.recu.regenerate', documentRecu.id)}
                                typeName="Reçu"
                                variant="outline"
                                size={isMobile ? 'default' : 'lg'}
                            />
                        ) : (
                            <Button
                                onClick={() => handleGenerate('recu')}
                                disabled={!canGenerateRecu || isGenerating}
                                variant="default"
                                size={isMobile ? 'default' : 'lg'}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-xs sm:text-sm"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                                        Génération...
                                    </>
                                ) : !canGenerateRecu ? (
                                    <>
                                        <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                        {isMobile ? 'Incomplet' : 'Données incomplètes'}
                                    </>
                                ) : (
                                    <>
                                        <Receipt className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                        Générer le Reçu
                                    </>
                                )}
                            </Button>
                        )}

                        {hasRecu && (
                            hasAdv && documentAdv ? (
                                <SecureDownloadButton
                                    document={documentAdv}
                                    downloadRoute={route('documents.acte-vente.download', documentAdv.id)}
                                    regenerateRoute={route('documents.acte-vente.regenerate', documentAdv.id)}
                                    typeName="Acte de Vente"
                                    variant="default"
                                    size={isMobile ? 'default' : 'lg'}
                                />
                            ) : (
                                <Button
                                    onClick={() => handleGenerate('acte_vente')}
                                    disabled={!canGenerateActeVente || isGenerating}
                                    variant="default"
                                    size={isMobile ? 'default' : 'lg'}
                                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-xs sm:text-sm"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                                            Génération...
                                        </>
                                    ) : !canGenerateActeVente ? (
                                        <>
                                            <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                            {validationMessage ? (isMobile ? 'Incomplet' : 'Données incomplètes') : 'Reçu requis'}
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                            {isMobile ? 'Générer ADV' : 'Générer l\'Acte de Vente'}
                                            {consorts.length > 0 && !isMobile && (
                                                <Badge variant="secondary" className="ml-2 text-[10px]">
                                                    {consorts.length + 1} demandeurs
                                                </Badge>
                                            )}
                                        </>
                                    )}
                                </Button>
                            )
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}