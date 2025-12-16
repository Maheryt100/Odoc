// documents/tabs/RequisitionTab.tsx
import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileOutput, AlertCircle, Info, Loader2, FileCheck, MapPin, Ruler } from 'lucide-react';
import { Dossier } from '@/types';
import { ProprieteWithDemandeurs } from '../types';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import SecureDownloadButton from '../components/SecureDownloadButton';

interface RequisitionTabProps {
    proprietes: ProprieteWithDemandeurs[];
    dossier: Dossier;
}

export default function RequisitionTab({ proprietes, dossier }: RequisitionTabProps) {
    const [reqPropriete, setReqPropriete] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    const selectedProprieteData = proprietes.find(p => p.id === Number(reqPropriete));
    
    const documentRequisition = selectedProprieteData?.document_requisition;
    const hasRequisition = !!documentRequisition;

    const canGenerate = () => {
        if (!reqPropriete || hasRequisition) return false;
        const prop = selectedProprieteData;
        if (!prop) return false;
        return true;
    };

    // Formater la contenance
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
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <CardTitle className="flex items-center gap-2">
                    <FileOutput className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Réquisition
                </CardTitle>
                <CardDescription>
                    Sélectionnez la propriété pour générer la réquisition (aucun demandeur requis)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                
                {/* Sélection Propriété */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Propriété</Label>
                    <Select 
                        value={reqPropriete} 
                        onValueChange={setReqPropriete}
                        disabled={isGenerating}
                    >
                        <SelectTrigger className="h-auto min-h-[60px]">
                            <SelectValue placeholder="Sélectionner une propriété" />
                        </SelectTrigger>
                        <SelectContent>
                            {proprietes.map((prop) => {
                                const hasDoc = !!prop.document_requisition;
                                
                                return (
                                    <SelectItem key={prop.id} value={String(prop.id)}>
                                        <div className="flex items-center gap-6 py-2 whitespace-nowrap">

                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-mono">
                                                    Lot {prop.lot}
                                                </Badge>

                                                <Badge variant="outline">
                                                    TN°{prop.titre}
                                                </Badge>

                                                {hasDoc && (
                                                    <Badge variant="default" className="bg-green-500 text-xs">
                                                        <FileCheck className="h-3 w-3 mr-1" />
                                                        Généré
                                                    </Badge>
                                                )}

                                                <Badge
                                                    variant={prop.type_operation === "morcellement" ? "default" : "secondary"}
                                                    className="text-xs"
                                                >
                                                    {prop.type_operation === "morcellement"
                                                        ? "Morcellement"
                                                        : "Immatriculation"}
                                                </Badge>
                                            </div>

                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* Carte d'info propriété */}
                {reqPropriete && selectedProprieteData && (
                    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className="bg-blue-600 text-white">
                                            Lot {selectedProprieteData.lot}
                                        </Badge>
                                        <Badge variant="outline">
                                            TN°{selectedProprieteData.titre}
                                        </Badge>
                                        <Badge variant={selectedProprieteData.type_operation === 'morcellement' ? 'default' : 'secondary'}>
                                            {selectedProprieteData.type_operation === 'morcellement' ? 'Morcellement' : 'Immatriculation'}
                                        </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Ruler className="h-3 w-3" />
                                                Contenance:
                                            </span>
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

                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Situation:</span>
                                        <div className="font-medium">{selectedProprieteData.situation}</div>
                                    </div>

                                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Info className="h-3 w-3" />
                                            La réquisition sera générée automatiquement selon le type d'opération
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Badge de statut */}
                            <div className="pt-3 border-t">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Statut Réquisition:</span>
                                    <DocumentStatusBadge document={selectedProprieteData.document_requisition} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Statut réquisition */}
                {reqPropriete && hasRequisition && documentRequisition && (
                    <Alert className="bg-green-500/10 border-green-500/50">
                        <FileCheck className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-700 dark:text-green-300">
                            <div className="space-y-1">
                                <div className="font-medium">
                                    Réquisition déjà générée
                                </div>
                                <div className="text-xs opacity-75">
                                    Généré le {documentRequisition.generated_at}
                                </div>
                                <div className="text-xs opacity-75">
                                    Téléchargé {documentRequisition.download_count || 0} fois
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <Separator />

                {/* Explication */}
                <Alert>
                    <FileOutput className="h-4 w-4" />
                    <AlertDescription>
                        La réquisition demande au Conservateur de la Propriété Foncière de procéder à
                        l'immatriculation ou au morcellement d'un terrain. Ce document ne nécessite pas
                        de sélectionner un demandeur spécifique.
                    </AlertDescription>
                </Alert>

                {/* Indicateur de génération */}
                {isGenerating && (
                    <Alert className="bg-blue-500/10 border-blue-500/50">
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        <AlertDescription className="text-blue-700 dark:text-blue-300">
                            {hasRequisition ? 'Téléchargement en cours...' : 'Génération en cours...'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* ✅ BOUTON UNIFIÉ */}
                {reqPropriete && (
                    hasRequisition && documentRequisition ? (
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
                            size="lg"
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Génération...
                                </>
                            ) : (
                                <>
                                    <FileOutput className="h-4 w-4 mr-2" />
                                    Générer la Réquisition
                                </>
                            )}
                        </Button>
                    )
                )}
            </CardContent>
        </Card>
    );
}