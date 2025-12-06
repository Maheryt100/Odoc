// documents/Generate.tsx - VERSION FINALE OPTIMISÉE
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Info, 
    ArrowLeft, 
    FileText, 
    FileCheck, 
    FileOutput, 
    Sparkles
} from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { BreadcrumbItem, Demandeur, Dossier } from '@/types';
import { ProprieteWithDemandeurs, DemandeurWithCSF } from './types';
import ActeVenteTab from './tabs/ActeVenteTab';
import CsfTab from './tabs/CsfTab';
import RequisitionTab from './tabs/RequisitionTab';
import StatCard from './components/StatCard';
import { useDocumentStats } from './hooks/useDocumentStats';

interface GenerateProps {
    dossier: Dossier;
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: DemandeurWithCSF[];
}

export default function Generate({ dossier, proprietes, demandeurs }: GenerateProps) {
    const [activeTab, setActiveTab] = useState<'acte_vente' | 'csf' | 'requisition'>('acte_vente');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Accueil", href: "/" },
        { title: "Dossiers", href: `/dossiers/${dossier.id}` },
        { title: "Génération de documents", href: `/documents/generate/${dossier.id}` },
    ];

    // ✅ Utiliser le hook optimisé
    const stats = useDocumentStats({ proprietes, demandeurs });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Génération de documents" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-[1600px] space-y-6">
                {/* Header redesigné */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                size="sm"
                                asChild
                                className="shadow-sm hover:shadow-md transition-all"
                            >
                                <Link href={route('dossiers.show', dossier.id)}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Retour au dossier
                                </Link>
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                            Génération de documents
                        </h1>
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <span className="font-medium">{dossier.nom_dossier}</span>
                            <span className="text-gray-400">•</span>
                            <span>{dossier.commune}</span>
                            <span className="text-gray-400">•</span>
                            <Badge variant="outline" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                Système unique
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* ✅ Statistiques avec composants réutilisables */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Actes de Vente"
                        value={stats.proprietesAvecAdv}
                        total={stats.totalProprietes}
                        icon={FileText}
                        colorScheme="violet"
                        label="propriétés"
                    />

                    <StatCard
                        title="Reçus de Paiement"
                        value={stats.proprietesAvecRecu}
                        total={stats.totalProprietes}
                        icon={FileCheck}
                        colorScheme="green"
                        label="propriétés"
                    />

                    <StatCard
                        title="CSF"
                        value={stats.demandeursAvecCsf}
                        total={stats.totalDemandeurs}
                        icon={FileCheck}
                        colorScheme="emerald"
                        label="demandeurs"
                    />

                    <StatCard
                        title="Réquisitions"
                        value={stats.requisitionsGenerees}
                        total={stats.totalProprietes}
                        icon={FileOutput}
                        colorScheme="cyan"
                        label="propriétés"
                    />
                </div>

                {/* Alerte informative redesignée */}
                <Alert className="border-0 shadow-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <AlertDescription className="text-blue-900 dark:text-blue-100">
                                <div className="space-y-2">
                                    <p className="font-semibold flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        Système de génération unique
                                    </p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Chaque document n'est généré qu'une seule fois. Si le document existe déjà, 
                                        il sera automatiquement téléchargé depuis les archives avec un compteur de téléchargements.
                                    </p>
                                </div>
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>

                {/* Tabs redesignés */}
                <Card className="border-0 shadow-lg">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                        <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20 border-b">
                            <TabsList className="w-full h-auto bg-transparent p-6 gap-3">
                                <TabsTrigger 
                                    value="acte_vente" 
                                    className="flex-1 flex flex-col gap-2 py-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-100 data-[state=active]:to-purple-100 dark:data-[state=active]:from-violet-950/30 dark:data-[state=active]:to-purple-950/30 data-[state=active]:shadow-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        <span className="font-semibold">Acte de Vente</span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {stats.proprietesAvecAdv}/{stats.totalProprietes}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="csf" 
                                    className="flex-1 flex flex-col gap-2 py-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-100 data-[state=active]:to-teal-100 dark:data-[state=active]:from-emerald-950/30 dark:data-[state=active]:to-teal-950/30 data-[state=active]:shadow-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileCheck className="h-5 w-5" />
                                        <span className="font-semibold">CSF</span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {stats.demandeursAvecCsf}/{stats.totalDemandeurs}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="requisition" 
                                    className="flex-1 flex flex-col gap-2 py-4 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-100 data-[state=active]:to-cyan-100 dark:data-[state=active]:from-blue-950/30 dark:data-[state=active]:to-cyan-950/30 data-[state=active]:shadow-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileOutput className="h-5 w-5" />
                                        <span className="font-semibold">Réquisition</span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {stats.requisitionsGenerees}/{stats.totalProprietes}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6">
                            <TabsContent value="acte_vente" className="mt-0">
                                <ActeVenteTab 
                                    proprietes={proprietes}
                                    demandeurs={demandeurs}
                                    dossier={dossier}
                                />
                            </TabsContent>

                            <TabsContent value="csf" className="mt-0">
                                <CsfTab 
                                    proprietes={proprietes}
                                    demandeurs={demandeurs}
                                    dossier={dossier}
                                />
                            </TabsContent>

                            <TabsContent value="requisition" className="mt-0">
                                <RequisitionTab 
                                    proprietes={proprietes}
                                    dossier={dossier}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                </Card>
            </div>
        </AppLayout>
    );
}