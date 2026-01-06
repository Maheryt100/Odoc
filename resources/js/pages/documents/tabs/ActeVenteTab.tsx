import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertCircle, Crown, Users, MapPin, Ruler, Building2, Coins, FileText, CheckCircle2 } from 'lucide-react';
import { ProprieteSelect } from '../components/DocumentSelects';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import SecureDownloadButton from '../components/SecureDownloadButton';
import NumeroRecuModal from '../components/NumeroRecuModal';
import { StickyActionFooter } from '../components/StickyActionFooter';
import { useIsMobile } from '@/hooks/useResponsive';
import { 
    getDemandeurPrincipal, 
    getConsorts, 
    validateForActeVente,
    getCompactValidationMessage
} from '../validation';
import { safePrix, formatMontant } from '../helpers';

interface ActeVenteTabProps {
    proprietes: any[];
    demandeurs: any[];
    dossier: any;
}

export default function ActeVenteTab({ proprietes, demandeurs, dossier }: ActeVenteTabProps) {
    const [selectedPropriete, setSelectedPropriete] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showRecuModal, setShowRecuModal] = useState(false);
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

    const documentAdv = selectedProprieteData?.document_adv;
    const hasAdv = !!documentAdv;

    // Validation STRICTE
    const validation = useMemo(() => {
        const demandeurData = demandeurPrincipal 
            ? demandeurs.find(d => d.id === demandeurPrincipal.id) || null
            : null;
        
        return validateForActeVente(
            selectedProprieteData || null,
            demandeurData,
            null // Pas encore de numéro de reçu saisi
        );
    }, [selectedPropriete, selectedProprieteData, demandeurPrincipal, demandeurs]);

    const canGenerateActeVente = useMemo((): boolean => {
        if (!selectedPropriete || !demandeurPrincipal) return false;
        if (hasAdv) return false;
        return validation.isValid;
    }, [hasAdv, selectedPropriete, demandeurPrincipal, validation.isValid]);

    const validationMessage = useMemo(() => {
        if (!selectedPropriete) return "Sélectionnez une propriété";
        if (!demandeurPrincipal) return "Aucun demandeur principal trouvé";
        
        return isMobile 
            ? getCompactValidationMessage(selectedProprieteData || null, demandeurs.find(d => d.id === demandeurPrincipal.id) || null, null)
            : validation.errorMessage;
    }, [selectedPropriete, selectedProprieteData, demandeurPrincipal, demandeurs, validation, isMobile]);

    /**
     * ✅ GÉNÉRATION AVEC NUMÉRO DE REÇU - Méthode POST corrigée
     */
    const handleGenerate = async (numeroRecu: string, notes?: string) => {
        if (!selectedPropriete || !demandeurPrincipal || isGenerating) return;

        setIsGenerating(true);
        setShowRecuModal(false);

        try {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
            if (!csrfToken) throw new Error('Token CSRF manquant');

            // ✅ CORRECTION : Utiliser POST au lieu de GET
            const response = await fetch(route('documents.acte-vente.generate'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    id_propriete: selectedPropriete,
                    id_demandeur: demandeurPrincipal.id,
                    numero_recu: numeroRecu,
                    notes: notes,
                }),
            });

            const contentType = response.headers.get('content-type') || '';

            // Si c'est du JSON, c'est une erreur
            if (contentType.includes('application/json')) {
                const data = await response.json();
                
                if (!data.success) {
                    toast.error(data.message || 'Erreur lors de la génération', {
                        description: data.error,
                    });
                    setIsGenerating(false);
                    return;
                }
            }

            // Si c'est un fichier Word, télécharger
            if (contentType.includes('application/vnd.openxmlformats')) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                
                // Extraire le nom du fichier depuis les headers
                const disposition = response.headers.get('content-disposition');
                const filenameMatch = disposition?.match(/filename="(.+)"/);
                const filename = filenameMatch ? filenameMatch[1] : `ADV_${Date.now()}.docx`;
                
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                toast.success('Acte de vente généré avec succès !', {
                    description: `Numéro de reçu : ${numeroRecu}`,
                });

                // Recharger les données après un court délai
                setTimeout(() => {
                    router.reload({ 
                        only: ['proprietes'],
                        preserveUrl: true,
                        onFinish: () => {
                            setIsGenerating(false);
                        }
                    });
                }, 1000);
            }
            
        } catch (error: any) {
            console.error('❌ Erreur génération ADV:', error);
            toast.error('Erreur de génération', {
                description: error.message,
            });
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
            {/* Sélection */}
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

            {/* Infos détaillées */}
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

                        {/* Status document */}
                        <div className="pt-3 border-t border-violet-200 dark:border-violet-800">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">Acte de Vente:</span>
                                <DocumentStatusBadge document={documentAdv} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Alertes validation */}
            {selectedPropriete && !validation.isValid && !hasAdv && (
                <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        {validationMessage}
                    </AlertDescription>
                </Alert>
            )}

            {selectedPropriete && validation.isValid && !hasAdv && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 py-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-xs text-green-800 dark:text-green-200">
                        ✅ Toutes les données sont complètes. Vous pouvez générer l'acte de vente.
                    </AlertDescription>
                </Alert>
            )}

            {/* Boutons Desktop */}
            {!isMobile && selectedPropriete && demandeurPrincipal && (
                <div className="flex flex-col items-center space-y-3 pt-2">
                    <div className="w-full max-w-md">
                        {hasAdv && documentAdv ? (
                            <SecureDownloadButton
                                document={documentAdv}
                                downloadRoute={route('documents.acte-vente.download', documentAdv.id)}
                                regenerateRoute={route('documents.acte-vente.regenerate', documentAdv.id)}
                                typeName="Acte de Vente"
                            />
                        ) : (
                            <Button
                                onClick={() => setShowRecuModal(true)}
                                disabled={!canGenerateActeVente || isGenerating}
                                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 h-12"
                                size="lg"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Générer l'Acte de Vente
                                {consorts.length > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {consorts.length + 1} demandeurs
                                    </Badge>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Footer Mobile */}
            {isMobile && selectedPropriete && demandeurPrincipal && !hasAdv && (
                <StickyActionFooter
                    activeTab="acte_vente"
                    isGenerating={isGenerating}
                    canGenerate={canGenerateActeVente}
                    hasDocument={false}
                    onGenerate={() => setShowRecuModal(true)}
                    validationMessage={validationMessage}
                    documentType="adv"
                />
            )}

            {isMobile && hasAdv && documentAdv && (
                <StickyActionFooter
                    activeTab="acte_vente"
                    isGenerating={false}
                    canGenerate={true}
                    hasDocument={true}
                    onDownload={() => window.location.href = route('documents.acte-vente.download', documentAdv.id)}
                    documentType="adv"
                    onGenerate={() => {}}
                />
            )}

            {/* Modal Numéro de Reçu */}
            <NumeroRecuModal
                isOpen={showRecuModal}
                onClose={() => setShowRecuModal(false)}
                onConfirm={handleGenerate}
                propriete={selectedProprieteData || null}
                validation={validation}
                isGenerating={isGenerating}
            />
        </div>
    );
}