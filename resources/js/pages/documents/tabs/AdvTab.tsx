import { useState } from 'react';
import { FileText, Crown, Users, MapPin, Ruler, Building2, Coins, RefreshCw, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EntitySelect } from '../components/EntitySelect';
import { EntityCard } from '../components/EntityCard';
import { ActionButton } from '../components/ActionButton';
import { RecuModal } from '../components/RecuModal';
import { useDownload } from '../core/hooks/useDownload';
import { documentApi } from '../core/api';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import type { ProprieteWithDemandeurs, DemandeurLie, GenerateDocumentFn } from '../types';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, AlertDialogHeader, AlertDialogFooter } from '@/components/ui/alert-dialog';

interface AdvTabProps {
  selectedProprieteId: string;
  setSelectedProprieteId: (id: string) => void;
  selectedPropriete: ProprieteWithDemandeurs | undefined;
  demandeurPrincipal: DemandeurLie | null;
  consorts: DemandeurLie[];
  proprietes: ProprieteWithDemandeurs[];
  isGenerating: boolean;
  generateDocument: GenerateDocumentFn;
  dossierId: number;
}

export function AdvTab({
  selectedProprieteId,
  setSelectedProprieteId,
  selectedPropriete,
  demandeurPrincipal,
  consorts,
  proprietes,
  isGenerating,
  generateDocument,
  dossierId
}: AdvTabProps) {
  const [showRecuModal, setShowRecuModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateMode, setRegenerateMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { download, isDownloading } = useDownload();

  const documentAdv = selectedPropriete?.document_adv;
  const hasAdv = !!documentAdv;
  const needsRegeneration = documentAdv?.metadata?.needs_regeneration === true;

  const handleGenerate = async (numeroRecu: string, dateRecu: string, notes?: string) => {
    if (!demandeurPrincipal) {
      console.error('Aucun demandeur principal trouvé');
      return;
    }

    if (regenerateMode && documentAdv) {
      await handleRegenerateWithData(numeroRecu, dateRecu, notes);
    } else {
      await generateDocument('adv', {
        numero_recu: numeroRecu,
        date_recu: dateRecu,
        notes,
        id_demandeur: demandeurPrincipal.id
      });
    }
    
    setShowRecuModal(false);
    setRegenerateMode(false);
  };

  const handleRegenerateWithData = async (numeroRecu: string, dateRecu: string, notes?: string) => {
    if (!documentAdv) return;

    setIsRegenerating(true);
    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
      
      const response = await fetch(route('documents.acte-vente.regenerate', documentAdv.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          numero_recu: numeroRecu,
          date_recu: dateRecu,
          notes
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = documentAdv.nom_fichier;
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

  const handleDownload = async () => {
    if (!documentAdv) return;

    try {
      await download(
        route('documents.acte-vente.download', documentAdv.id),
        documentAdv.nom_fichier
      );
    } catch (error: any) {
      if (error.message?.includes('introuvable') || error.message?.includes('manquant')) {
        toast.error('Fichier introuvable', {
          description: 'Veuillez régénérer le document',
          action: {
            label: 'Régénérer',
            onClick: () => {
              setRegenerateMode(true);
              setShowRecuModal(true);
            }
          }
        });
      } else {
        toast.error('Erreur de téléchargement');
      }
    }
  };

  const handleRegenerateClick = () => {
    setRegenerateMode(true);
    setShowRecuModal(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentAdv) return;

    setIsDeleting(true);
    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
      
      const response = await fetch(route('documents.acte-vente.delete', documentAdv.id), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken
        }
      });

      if (response.ok) {
        toast.success('Document supprimé avec succès');
        router.reload({ only: ['proprietes', 'demandeurs'], preserveUrl: true });
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error: any) {
      toast.error('Erreur de suppression', {
        description: error.message
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const proprieteOptions = proprietes.map(p => ({
    id: p.id,
    label: `Lot ${p.lot}`,
    sublabel: `TN°${p.titre}`,
    badges: [
      ...(p.document_adv ? [{ label: 'ADV', variant: 'default' as const }] : [])
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

      {selectedPropriete && demandeurPrincipal && (
        <EntityCard
          title={`Lot ${selectedPropriete.lot}`}
          icon={<MapPin className="h-4 w-4 text-violet-600" />}
          badges={[
            ...(hasAdv ? [{ label: 'ADV généré', variant: 'default' as const }] : [])
          ]}
          colorScheme="violet"
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
            },
            {
              label: 'Demandeur',
              value: `${demandeurPrincipal.nom} ${demandeurPrincipal.prenom}`,
              icon: <Crown className="h-3 w-3 text-yellow-500" />
            },
            ...(consorts.length > 0 ? [{
              label: 'Consorts',
              value: `${consorts.length} personne(s)`,
              icon: <Users className="h-3 w-3" />
            }] : []),
            {
              label: 'Prix total',
              value: demandeurPrincipal.total_prix,
              format: 'montant' as const,
              icon: <Coins className="h-3 w-3" />
            }
          ]}
        />
      )}

      {selectedPropriete && !hasAdv && !demandeurPrincipal && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">
            Aucun demandeur principal trouvé
          </AlertDescription>
        </Alert>
      )}

      {needsRegeneration && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20">
          <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
            Le fichier est introuvable ou endommagé. Veuillez régénérer le document.
          </AlertDescription>
        </Alert>
      )}

      {selectedPropriete && demandeurPrincipal && (
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          {hasAdv ? (
            <>
              <ActionButton
                onClick={handleDownload}
                loading={isDownloading}
                disabled={isRegenerating || isDeleting}
                icon={<FileText className="h-4 w-4" />}
                className="bg-gradient-to-r from-violet-600 to-purple-600"
              >
                Télécharger ADV
              </ActionButton>
              
              <ActionButton
                onClick={handleRegenerateClick}
                loading={isRegenerating}
                disabled={isDownloading || isDeleting}
                icon={<RefreshCw className="h-4 w-4" />}
                variant="outline"
                className="border-violet-600 text-violet-600 hover:bg-violet-50"
              >
                Régénérer
              </ActionButton>

              <ActionButton
                onClick={handleDeleteClick}
                loading={isDeleting}
                disabled={isDownloading || isRegenerating}
                icon={<Trash2 className="h-4 w-4" />}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                Supprimer
              </ActionButton>
            </>
          ) : (
            <ActionButton
              onClick={() => setShowRecuModal(true)}
              loading={isGenerating}
              icon={<FileText className="h-4 w-4" />}
              className="bg-gradient-to-r from-violet-600 to-purple-600"
            >
              Générer ADV
            </ActionButton>
          )}
        </div>
      )}

      <RecuModal
        isOpen={showRecuModal}
        onClose={() => {
          setShowRecuModal(false);
          setRegenerateMode(false);
        }}
        onConfirm={handleGenerate}
        dossierId={dossierId}
        isGenerating={isGenerating || isRegenerating}
        mode={regenerateMode ? 'regenerate' : 'generate'}
        existingData={regenerateMode && documentAdv ? {
          numeroRecu: documentAdv.numero_recu_externe || '',
          dateRecu: documentAdv.metadata?.recu_date || ''
        } : undefined}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'acte de vente ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le document et ses données associées (numéro de reçu, références) seront définitivement supprimés.
              Vous pourrez ensuite générer un nouvel acte de vente avec les bonnes informations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}