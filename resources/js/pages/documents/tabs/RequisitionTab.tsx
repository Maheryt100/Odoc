import { useState } from 'react';
import { FileOutput, MapPin, Ruler, Building2, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EntitySelect } from '../components/EntitySelect';
import { EntityCard } from '../components/EntityCard';
import { ActionButton } from '../components/ActionButton';
import { StatusBadge } from '../components/StatusBadge';
import { useDownload } from '../core/hooks/useDownload';
import { documentApi } from '../core/api';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import type { ProprieteWithDemandeurs, GenerateDocumentFn } from '../types';

interface RequisitionTabProps {
  selectedProprieteId: string;
  setSelectedProprieteId: (id: string) => void;
  selectedPropriete: ProprieteWithDemandeurs | undefined;
  proprietes: ProprieteWithDemandeurs[];
  isGenerating: boolean;
  generateDocument: GenerateDocumentFn;
}

export function RequisitionTab({
  selectedProprieteId,
  setSelectedProprieteId,
  selectedPropriete,
  proprietes,
  isGenerating,
  generateDocument
}: RequisitionTabProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { download, isDownloading } = useDownload();

  const documentRequisition = selectedPropriete?.document_requisition;
  const hasRequisition = !!documentRequisition;
  const needsRegeneration = documentRequisition?.metadata?.needs_regeneration === true;

  const handleGenerate = async () => {
    await generateDocument('requisition');
  };

  const handleDownload = async () => {
    if (!documentRequisition) return;

    try {
      await download(
        route('documents.requisition.download', documentRequisition.id),
        documentRequisition.nom_fichier
      );
    } catch (error: any) {
      if (error.message?.includes('introuvable') || error.message?.includes('manquant')) {
        toast.error('Fichier introuvable', {
          description: 'Le document sera marqué pour régénération',
          action: {
            label: 'Régénérer',
            onClick: () => handleRegenerate()
          }
        });
      } else {
        toast.error('Erreur de téléchargement');
      }
    }
  };

  const handleRegenerate = async () => {
    if (!documentRequisition) return;

    setIsRegenerating(true);
    try {
      const response = await documentApi.regenerate('requisition', documentRequisition.id);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = documentRequisition.nom_fichier;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success('Document régénéré avec succès');
        router.reload({ only: ['proprietes', 'demandeurs'], preserveUrl: true });
      } else {
        throw new Error('Erreur lors de la régénération');
      }
    } catch (error: any) {
      toast.error('Erreur de régénération', {
        description: error.message
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const proprieteOptions = proprietes.map(p => ({
    id: p.id,
    label: `Lot ${p.lot}`,
    sublabel: `TN°${p.titre}`,
    badges: [
      ...(p.document_requisition ? [{ label: 'Réq.', variant: 'default' as const }] : [])
    ]
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Propriété</Label>
        <EntitySelect
          value={selectedProprieteId}
          onChange={setSelectedProprieteId}
          options={proprieteOptions}
          placeholder="Sélectionner une propriété"
          disabled={isGenerating || isRegenerating}
        />
      </div>

      {selectedPropriete && (
        <div className="space-y-3">
          <EntityCard
            title={`Lot ${selectedPropriete.lot}`}
            icon={<MapPin className="h-4 w-4 text-blue-600" />}
            badges={[
              {
                label: selectedPropriete.type_operation === 'morcellement' 
                  ? 'Morcellement' 
                  : 'Immatriculation',
                variant: selectedPropriete.type_operation === 'morcellement' 
                  ? 'default' 
                  : 'secondary'
              }
            ]}
            colorScheme="blue"
            fields={[
              {
                label: 'Titre',
                value: selectedPropriete.titre || '-'
              },
              {
                label: 'Contenance',
                value: selectedPropriete.contenance,
                format: 'contenance' as const,
                icon: <Ruler className="h-3 w-3" />
              },
              {
                label: 'Nature',
                value: selectedPropriete.nature,
                icon: <Building2 className="h-3 w-3" />
              },
              {
                label: 'Propriétaire',
                value: selectedPropriete.proprietaire || '-'
              },
              {
                label: 'Situation',
                value: selectedPropriete.situation || '-'
              }
            ]}
          />
{/* 
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Réquisition:</span>
            <StatusBadge document={documentRequisition} showCount />
          </div> */}
        </div>
      )}

      {needsRegeneration && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20">
          <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
            Le fichier est introuvable ou endommagé. Veuillez régénérer le document.
          </AlertDescription>
        </Alert>
      )}

      {selectedPropriete && hasRequisition && !needsRegeneration && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20">
          <FileOutput className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800 dark:text-green-200">
            Réquisition déjà générée pour cette propriété
          </AlertDescription>
        </Alert>
      )}

      {selectedPropriete && (
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          {hasRequisition ? (
            <>
              <ActionButton
                onClick={handleDownload}
                loading={isDownloading}
                disabled={isRegenerating}
                icon={<FileOutput className="h-4 w-4" />}
                className="bg-gradient-to-r from-blue-600 to-cyan-600"
              >
                Télécharger Réquisition
              </ActionButton>
              
              <ActionButton
                onClick={handleRegenerate}
                loading={isRegenerating}
                disabled={isDownloading}
                icon={<RefreshCw className="h-4 w-4" />}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Régénérer
              </ActionButton>
            </>
          ) : (
            <ActionButton
              onClick={handleGenerate}
              loading={isGenerating}
              icon={<FileOutput className="h-4 w-4" />}
              className="bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              Générer Réquisition
            </ActionButton>
          )}
        </div>
      )}
    </div>
  );
}