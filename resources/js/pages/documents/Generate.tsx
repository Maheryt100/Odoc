// documents/Generate.tsx - ✅ VERSION RESPONSIVE COMPLÈTE

import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Info, ArrowLeft, FileText, FileCheck, FileOutput, 
    Sparkles, List, Menu
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { BreadcrumbItem, Demandeur, Dossier } from '@/types';
import { ProprieteWithDemandeurs, DemandeurWithCSF } from './types';
import ActeVenteTab from './tabs/ActeVenteTab';
import CsfTab from './tabs/CsfTab';
import RequisitionTab from './tabs/RequisitionTab';
import StatCard from './components/StatCard';
import { useDocumentStats } from './hooks/useDocumentStats';
import { useIsMobile } from '@/hooks/useResponsive';

interface GenerateProps {
    dossier: Dossier;
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: DemandeurWithCSF[];
}

export default function Generate({ dossier, proprietes, demandeurs }: GenerateProps) {
    const [activeTab, setActiveTab] = useState<'acte_vente' | 'csf' | 'requisition'>('acte_vente');
    const isMobile = useIsMobile();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Accueil", href: "/" },
        { title: "Dossiers", href: `/dossiers/${dossier.id}` },
        { title: "Génération de documents", href: `/documents/generate/${dossier.id}` },
    ];

    const stats = useDocumentStats({ proprietes, demandeurs });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Génération de documents" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-[1600px] space-y-4 sm:space-y-6">
                {/* ✅ Header Responsive */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                            Génération de documents
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-sm sm:text-base text-muted-foreground">
                            <span className="font-medium truncate max-w-[200px] sm:max-w-none">{dossier.nom_dossier}</span>
                            <span className="text-gray-400 hidden sm:inline">•</span>
                            <span className="truncate">{dossier.commune}</span>
                        </div>
                    </div>

                    {/* Actions - Mobile: Menu, Desktop: Boutons */}
                    {isMobile ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="shrink-0">
                                    <Menu className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                    <Link href={route('dossiers.show', dossier.id)} className="flex items-center">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Retour
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={route('demandes.resume', dossier.id)} className="flex items-center">
                                        <List className="h-4 w-4 mr-2" />
                                        Résumé demandes
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-3 shrink-0">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route('dossiers.show', dossier.id)}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Retour
                                </Link>
                            </Button>
                            <Button size="sm" asChild className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg">
                                <Link href={route('demandes.resume', dossier.id)}>
                                    <List className="h-4 w-4 mr-2" />
                                    <span className="hidden lg:inline">Résumé demandes</span>
                                    <span className="lg:hidden">Résumé</span>
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* ✅ Statistiques Responsive */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
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

                {/* ✅ Alerte Responsive */}
                <Alert className="border-0 shadow-md bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <AlertDescription className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                            <span className="font-semibold flex items-center gap-2">
                                <Sparkles className="h-3 w-3" />
                                Système de génération unique
                            </span>
                            <span className="text-blue-700 dark:text-blue-300 block mt-1">
                                {isMobile 
                                    ? 'Documents générés une seule fois'
                                    : 'Chaque document n\'est généré qu\'une fois, les suivants sont téléchargés depuis les archives'
                                }
                            </span>
                        </AlertDescription>
                    </div>
                </Alert>

                {/* ✅ Tabs Responsive */}
                <Card className="border-0 shadow-lg overflow-hidden">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                        <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20 border-b overflow-x-auto">
                            <TabsList className={`w-full h-auto bg-transparent ${isMobile ? 'p-3 gap-2' : 'p-6 gap-3'}`}>
                                <TabsTrigger 
                                    value="acte_vente" 
                                    className={`flex-1 flex flex-col gap-2 ${isMobile ? 'py-3 px-2' : 'py-4'} data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-100 data-[state=active]:to-purple-100 dark:data-[state=active]:from-violet-950/30 dark:data-[state=active]:to-purple-950/30 data-[state=active]:shadow-lg min-w-[90px]`}
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                                        <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                            {isMobile ? 'ADV' : 'Acte de Vente'}
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {stats.proprietesAvecAdv}/{stats.totalProprietes}
                                    </Badge>
                                </TabsTrigger>

                                <TabsTrigger 
                                    value="csf" 
                                    className={`flex-1 flex flex-col gap-2 ${isMobile ? 'py-3 px-2' : 'py-4'} data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-100 data-[state=active]:to-teal-100 dark:data-[state=active]:from-emerald-950/30 dark:data-[state=active]:to-teal-950/30 data-[state=active]:shadow-lg min-w-[90px]`}
                                >
                                    <div className="flex items-center gap-2">
                                        <FileCheck className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                                        <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>CSF</span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {stats.demandeursAvecCsf}/{stats.totalDemandeurs}
                                    </Badge>
                                </TabsTrigger>

                                <TabsTrigger 
                                    value="requisition" 
                                    className={`flex-1 flex flex-col gap-2 ${isMobile ? 'py-3 px-2' : 'py-4'} data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-100 data-[state=active]:to-cyan-100 dark:data-[state=active]:from-blue-950/30 dark:data-[state=active]:to-cyan-950/30 data-[state=active]:shadow-lg min-w-[90px]`}
                                >
                                    <div className="flex items-center gap-2">
                                        <FileOutput className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                                        <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                            {isMobile ? 'Réquis.' : 'Réquisition'}
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {stats.requisitionsGenerees}/{stats.totalProprietes}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-3 sm:p-4 md:p-6">
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