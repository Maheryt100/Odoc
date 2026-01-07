// documents/Generate.tsx
import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ArrowLeft, FileText, FileCheck, FileOutput } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocuments } from './core/hooks/useDocuments';
import { AdvTab } from './tabs/AdvTab';
import { CsfTab } from './tabs/CsfTab';
import { RequisitionTab } from './tabs/RequisitionTab';
import type { Dossier } from '@/types';
import type { ProprieteWithDemandeurs, DemandeurWithCSF } from './types';

interface GenerateProps {
  dossier: Dossier;
  proprietes: ProprieteWithDemandeurs[];
  demandeurs: DemandeurWithCSF[];
}

type DocumentTabType = 'acte_vente' | 'csf' | 'requisition';

export default function Generate({ dossier, proprietes, demandeurs }: GenerateProps) {
  const [activeTab, setActiveTab] = useState<DocumentTabType>('acte_vente');

  const {
    selectedProprieteId,
    selectedDemandeurId,
    isGenerating,
    selectedPropriete,
    selectedDemandeur,
    availableDemandeurs,
    demandeurPrincipal,
    consorts,
    setSelectedProprieteId,
    setSelectedDemandeurId,
    generateDocument
  } = useDocuments(proprietes, demandeurs);

  // Calcul des statistiques
  const stats = {
    proprietesAvecAdv: proprietes.filter(p => p.document_adv).length,
    totalProprietes: proprietes.length,
    demandeursAvecCsf: demandeurs.filter(d => d.document_csf).length,
    totalDemandeurs: demandeurs.length,
    requisitionsGenerees: proprietes.filter(p => p.document_requisition).length
  };

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Accueil', href: '/' },
        { title: 'Dossiers', href: `/dossiers/${dossier.id}` },
        { title: 'Documents', href: '#' }
      ]}
    >
      <Head title="Génération de documents" />
      <Toaster position="top-right" richColors />

      <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Génération de documents
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {dossier.nom_dossier} • {dossier.commune}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={route('dossiers.show', dossier.id)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-2 border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/20">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-violet-100 dark:bg-violet-900/50">
                <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Actes de Vente
                </p>
                <p className="text-2xl font-bold">
                  {stats.proprietesAvecAdv}
                  <span className="text-sm text-muted-foreground font-normal">
                    /{stats.totalProprietes}
                  </span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-2 border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <FileCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Certificats CSF
                </p>
                <p className="text-2xl font-bold">
                  {stats.demandeursAvecCsf}
                  <span className="text-sm text-muted-foreground font-normal">
                    /{stats.totalDemandeurs}
                  </span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-2 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <FileOutput className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Réquisitions
                </p>
                <p className="text-2xl font-bold">
                  {stats.requisitionsGenerees}
                  <span className="text-sm text-muted-foreground font-normal">
                    /{stats.totalProprietes}
                  </span>
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Onglets de documents */}
        <Card className="border-2">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DocumentTabType)}>
            <TabsList className="w-full grid grid-cols-3 h-auto p-2">
              <TabsTrigger 
                value="acte_vente" 
                className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-900 dark:data-[state=active]:bg-violet-900 dark:data-[state=active]:text-violet-100 py-3"
              >
                <FileText className="h-4 w-4 mr-2" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Acte de Vente</span>
                  <span className="text-xs text-muted-foreground">
                    {stats.proprietesAvecAdv}/{stats.totalProprietes}
                  </span>
                </div>
              </TabsTrigger>

              <TabsTrigger 
                value="csf" 
                className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 dark:data-[state=active]:bg-emerald-900 dark:data-[state=active]:text-emerald-100 py-3"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">CSF</span>
                  <span className="text-xs text-muted-foreground">
                    {stats.demandeursAvecCsf}/{stats.totalDemandeurs}
                  </span>
                </div>
              </TabsTrigger>

              <TabsTrigger 
                value="requisition" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-100 py-3"
              >
                <FileOutput className="h-4 w-4 mr-2" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Réquisition</span>
                  <span className="text-xs text-muted-foreground">
                    {stats.requisitionsGenerees}/{stats.totalProprietes}
                  </span>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="acte_vente" className="p-6 space-y-4">
              <AdvTab
                selectedProprieteId={selectedProprieteId}
                setSelectedProprieteId={setSelectedProprieteId}
                selectedPropriete={selectedPropriete}
                demandeurPrincipal={demandeurPrincipal}
                consorts={consorts}
                proprietes={proprietes}
                isGenerating={isGenerating}
                generateDocument={generateDocument}
                dossierId={dossier.id}
              />
            </TabsContent>

            <TabsContent value="csf" className="p-6 space-y-4">
              <CsfTab
                selectedProprieteId={selectedProprieteId}
                setSelectedProprieteId={setSelectedProprieteId}
                selectedDemandeurId={selectedDemandeurId}
                setSelectedDemandeurId={setSelectedDemandeurId}
                selectedPropriete={selectedPropriete}
                selectedDemandeur={selectedDemandeur}
                availableDemandeurs={availableDemandeurs}
                proprietes={proprietes}
                isGenerating={isGenerating}
                generateDocument={generateDocument}
              />
            </TabsContent>

            <TabsContent value="requisition" className="p-6 space-y-4">
              <RequisitionTab
                selectedProprieteId={selectedProprieteId}
                setSelectedProprieteId={setSelectedProprieteId}
                selectedPropriete={selectedPropriete}
                proprietes={proprietes}
                isGenerating={isGenerating}
                generateDocument={generateDocument}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AppLayout>
  );
}