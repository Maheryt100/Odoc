import { useState } from 'react';
import { FileCheck, User, MapPin, Ruler, Building2, Briefcase, RefreshCw } from 'lucide-react';
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
import type { ProprieteWithDemandeurs, DemandeurWithCSF, GenerateDocumentFn } from '../types';

interface CsfTabProps {
  selectedProprieteId: string;
  setSelectedProprieteId: (id: string) => void;
  selectedDemandeurId: string;
  setSelectedDemandeurId: (id: string) => void;
  selectedPropriete: ProprieteWithDemandeurs | undefined;
  selectedDemandeur: DemandeurWithCSF | undefined;
  availableDemandeurs: DemandeurWithCSF[];
  proprietes: ProprieteWithDemandeurs[];
  isGenerating: boolean;
  generateDocument: GenerateDocumentFn;
}

export function CsfTab({
  selectedProprieteId,
  setSelectedProprieteId,
  selectedDemandeurId,
  setSelectedDemandeurId,
  selectedPropriete,
  selectedDemandeur,
  availableDemandeurs,
  proprietes,
  isGenerating,
  generateDocument
}: CsfTabProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { download, isDownloading } = useDownload();

  const documentCsf = selectedDemandeur?.document_csf;
  const hasCsf = !!documentCsf;
  const needsRegeneration = documentCsf?.metadata?.needs_regeneration === true;

  const handleGenerate = async () => {
    await generateDocument('csf');
  };

  const handleDownload = async () => {
    if (!documentCsf) return;

    try {
      await download(
        route('documents.csf.download', documentCsf.id),
        documentCsf.nom_fichier
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
    if (!documentCsf) return;

    setIsRegenerating(true);
    try {
      const response = await documentApi.regenerate('csf', documentCsf.id);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = documentCsf.nom_fichier;
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
    badges: []
  }));

  const demandeurOptions = availableDemandeurs.map(d => {
    const demandeurLie = selectedPropriete?.demandeurs_lies?.find(dl => dl.id === d.id);
    const isPrincipal = demandeurLie?.ordre === 1;

    return {
      id: d.id,
      label: `${d.nom_demandeur} ${d.prenom_demandeur}`,
      sublabel: d.cin,
      badges: [
        ...(isPrincipal ? [{ label: 'Principal', variant: 'default' as const }] : []),
        ...(d.document_csf ? [{ label: 'CSF', variant: 'secondary' as const }] : [])
      ]
    };
  });

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

      {selectedProprieteId && availableDemandeurs.length === 0 && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">
            Aucun demandeur associé à cette propriété
          </AlertDescription>
        </Alert>
      )}

      {selectedProprieteId && availableDemandeurs.length > 0 && (
        <>
          <div>
            <Label className="mb-2 block">Demandeur</Label>
            <EntitySelect
              value={selectedDemandeurId}
              onChange={setSelectedDemandeurId}
              options={demandeurOptions}
              placeholder="Sélectionner un demandeur"
              disabled={isGenerating || isRegenerating}
            />
          </div>

          {selectedDemandeur && selectedPropriete && (
            <div className="space-y-3">
              <EntityCard
                title={`Lot ${selectedPropriete.lot}`}
                icon={<MapPin className="h-4 w-4 text-emerald-600" />}
                colorScheme="emerald"
                fields={[
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
                    value: selectedPropriete.proprietaire
                  }
                ]}
              />

              <EntityCard
                title={`${selectedDemandeur.nom_demandeur} ${selectedDemandeur.prenom_demandeur}`}
                icon={<User className="h-4 w-4 text-emerald-600" />}
                badges={[
                  {
                    label: 'CSF',
                    variant: hasCsf ? 'default' : 'outline'
                  }
                ]}
                colorScheme="emerald"
                fields={[
                  {
                    label: 'CIN',
                    value: selectedDemandeur.cin
                  },
                  {
                    label: 'Occupation',
                    value: selectedDemandeur.occupation || '-',
                    icon: <Briefcase className="h-3 w-3" />
                  },
                  {
                    label: 'Domiciliation',
                    value: selectedDemandeur.domiciliation || '-'
                  }
                ]}
              />

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Document CSF:</span>
                <StatusBadge document={documentCsf} showCount />
              </div>
            </div>
          )}

          {needsRegeneration && (
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20">
              <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                Le fichier est introuvable ou endommagé. Veuillez régénérer le document.
              </AlertDescription>
            </Alert>
          )}

          {selectedDemandeur && hasCsf && !needsRegeneration && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20">
              <FileCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                CSF déjà généré pour ce demandeur
              </AlertDescription>
            </Alert>
          )}

          {selectedDemandeur && (
            <div className="flex justify-center gap-3 pt-2">
              {hasCsf ? (
                <>
                  <ActionButton
                    onClick={handleDownload}
                    loading={isDownloading}
                    disabled={isRegenerating}
                    icon={<FileCheck className="h-4 w-4" />}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600"
                  >
                    Télécharger CSF
                  </ActionButton>
                  
                  <ActionButton
                    onClick={handleRegenerate}
                    loading={isRegenerating}
                    disabled={isDownloading}
                    icon={<RefreshCw className="h-4 w-4" />}
                    variant="outline"
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  >
                    Régénérer
                  </ActionButton>
                </>
              ) : (
                <ActionButton
                  onClick={handleGenerate}
                  loading={isGenerating}
                  icon={<FileCheck className="h-4 w-4" />}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600"
                >
                  Générer CSF
                </ActionButton>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}