// documents/core/hooks/useDocuments.ts
import { useState, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { documentApi } from '../api';
import { DOCUMENT_CONFIG } from '../../utils/constants';
import type { ProprieteWithDemandeurs, DemandeurWithCSF, GenerateDocumentFn } from '../../types'; 
interface UseDocumentsReturn {
  selectedProprieteId: string;
  selectedDemandeurId: string;
  isGenerating: boolean;
  selectedPropriete: ProprieteWithDemandeurs | undefined;
  selectedDemandeur: DemandeurWithCSF | undefined;
  availableDemandeurs: DemandeurWithCSF[];
  demandeurPrincipal: any;
  consorts: any[];
  setSelectedProprieteId: (id: string) => void;
  setSelectedDemandeurId: (id: string) => void;
  generateDocument: GenerateDocumentFn; 
}

export function useDocuments(
  initialProprietes: ProprieteWithDemandeurs[],
  initialDemandeurs: DemandeurWithCSF[]
): UseDocumentsReturn {
  const [selectedProprieteId, setSelectedProprieteId] = useState('');
  const [selectedDemandeurId, setSelectedDemandeurId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedPropriete = useMemo(
    () => initialProprietes.find(p => p.id === Number(selectedProprieteId)),
    [selectedProprieteId, initialProprietes]
  );

  const selectedDemandeur = useMemo(
    () => initialDemandeurs.find(d => d.id === Number(selectedDemandeurId)),
    [selectedDemandeurId, initialDemandeurs]
  );

  const availableDemandeurs = useMemo(() => {
    if (!selectedPropriete) return [];
    const ids = selectedPropriete.demandeurs_lies?.map(d => d.id) || [];
    return initialDemandeurs.filter(d => ids.includes(d.id));
  }, [selectedPropriete, initialDemandeurs]);

  const demandeurPrincipal = useMemo(() => {
    if (!selectedPropriete?.demandeurs_lies) return null;
    return selectedPropriete.demandeurs_lies.find(d => d.ordre === 1) || null;
  }, [selectedPropriete]);

  const consorts = useMemo(() => {
    if (!selectedPropriete?.demandeurs_lies) return [];
    return selectedPropriete.demandeurs_lies.filter(d => d.ordre > 1);
  }, [selectedPropriete]);

  const handleProprieteChange = useCallback((id: string) => {
    setSelectedProprieteId(id);
    setSelectedDemandeurId('');
  }, []);

  const generateDocument: GenerateDocumentFn = useCallback(async (
    type,
    additionalData
  ) => {
    if (!selectedProprieteId) {
      toast.error('Sélectionnez une propriété');
      return null;
    }

    setIsGenerating(true);
    try {
      const result = await documentApi.generate(type, {
        id_propriete: selectedProprieteId,
        id_demandeur: selectedDemandeurId || undefined,
        ...additionalData
      });

      toast.success(`${DOCUMENT_CONFIG[type].label} généré !`);
      
      router.reload({
        only: ['proprietes', 'demandeurs'],
        preserveUrl: true
      });

      return result;
    } catch (error: any) {
      toast.error(error.message || 'Erreur de génération');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProprieteId, selectedDemandeurId]);

  return {
    selectedProprieteId,
    selectedDemandeurId,
    isGenerating,
    selectedPropriete,
    selectedDemandeur,
    availableDemandeurs,
    demandeurPrincipal,
    consorts,
    setSelectedProprieteId: handleProprieteChange,
    setSelectedDemandeurId,
    generateDocument
  };
}