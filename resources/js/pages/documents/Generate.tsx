// documents/Generate.tsx - ✅ VERSION ULTRA-RESPONSIVE (320px+)

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

    // ✅ Configuration des tabs avec labels courts pour mobile
    const tabsConfig = [
        {
            value: 'acte_vente',
            icon: FileText,
            label: 'Acte de Vente',
            shortLabel: 'ADV',
            count: `${stats.proprietesAvecAdv}/${stats.totalProprietes}`,
            colorClass: 'data-[state=active]:from-violet-100 data-[state=active]:to-purple-100 dark:data-[state=active]:from-violet-950/30 dark:data-[state=active]:to-purple-950/30'
        },
        {
            value: 'csf',
            icon: FileCheck,
            label: 'CSF',
            shortLabel: 'CSF',
            count: `${stats.demandeursAvecCsf}/${stats.totalDemandeurs}`,
            colorClass: 'data-[state=active]:from-emerald-100 data-[state=active]:to-teal-100 dark:data-[state=active]:from-emerald-950/30 dark:data-[state=active]:to-teal-950/30'
        },
        {
            value: 'requisition',
            icon: FileOutput,
            label: 'Réquisition',
            shortLabel: 'Réq.',
            count: `${stats.requisitionsGenerees}/${stats.totalProprietes}`,
            colorClass: 'data-[state=active]:from-blue-100 data-[state=active]:to-cyan-100 dark:data-[state=active]:from-blue-950/30 dark:data-[state=active]:to-cyan-950/30'
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Génération de documents" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-2 sm:p-4 md:p-6 max-w-[1600px] space-y-3 sm:space-y-6">
                {/* ✅ Header Ultra-Responsive avec Menu à droite */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent truncate">
                            Génération de documents
                        </h1>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mt-1 text-xs sm:text-sm md:text-base text-muted-foreground">
                            <span className="font-medium truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                                {dossier.nom_dossier}
                            </span>
                            <span className="text-gray-400 hidden xs:inline">•</span>
                            <span className="truncate max-w-[120px] xs:max-w-none">{dossier.commune}</span>
                        </div>
                    </div>

                    {/* Menu Actions - Toujours à droite */}
                    {isMobile ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="shrink-0 h-8 w-8 p-0">
                                    <Menu className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem asChild>
                                    <Link href={route('dossiers.show', dossier.id)} className="flex items-center text-xs">
                                        <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                                        Retour
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={route('demandes.resume', dossier.id)} className="flex items-center text-xs">
                                        <List className="h-3.5 w-3.5 mr-2" />
                                        Résumé
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route('dossiers.show', dossier.id)}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Retour
                                </Link>
                            </Button>
                            <Button size="sm" asChild className="bg-gradient-to-r from-violet-600 to-purple-600">
                                <Link href={route('demandes.resume', dossier.id)}>
                                    <List className="h-4 w-4 mr-2" />
                                    <span className="hidden md:inline">Résumé demandes</span>
                                    <span className="md:hidden">Résumé</span>
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* ✅ Statistiques - Grid optimisé pour 320px */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4">
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

                {/* ✅ Alerte Ultra-Compact */}
                <Alert className="border-0 shadow-md bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 p-2 sm:p-4">
                    <div className="flex items-start gap-1.5 sm:gap-3">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <AlertDescription className="text-[10px] xs:text-xs sm:text-sm md:text-base text-blue-900 dark:text-blue-100">
                            <span className="font-semibold flex items-center gap-1.5">
                                <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                                {isMobile ? 'Génération unique' : 'Système de génération unique'}
                            </span>
                            <span className="text-blue-700 dark:text-blue-300 block mt-0.5">
                                {isMobile 
                                    ? 'Docs générés 1× puis archivés'
                                    : 'Chaque document n\'est généré qu\'une fois, les suivants sont téléchargés depuis les archives'
                                }
                            </span>
                        </AlertDescription>
                    </div>
                </Alert>

                {/* ✅ TABS ULTRA-RESPONSIVE AVEC SCROLL HORIZONTAL */}
                <Card className="border-0 shadow-lg overflow-hidden">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                        {/* Container avec scroll horizontal sur mobile */}
                        <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20 border-b">
                            {/* ✅ Wrapper scrollable sur petits écrans */}
                            <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                                <TabsList className="w-full min-w-max h-auto bg-transparent p-1.5 xs:p-2 sm:p-6 gap-1 xs:gap-1.5 sm:gap-3 flex justify-start sm:justify-center">
                                    {tabsConfig.map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = activeTab === tab.value;
                                        
                                        return (
                                            <TabsTrigger
                                                key={tab.value}
                                                value={tab.value}
                                                className={`
                                                    flex flex-col gap-1 xs:gap-1.5 sm:gap-2
                                                    py-2 xs:py-2.5 sm:py-4
                                                    px-2 xs:px-3 sm:px-4
                                                    min-w-[72px] xs:min-w-[85px] sm:min-w-0 sm:flex-1
                                                    data-[state=active]:bg-gradient-to-br
                                                    data-[state=active]:shadow-lg
                                                    transition-all duration-200
                                                    ${tab.colorClass}
                                                `}
                                            >
                                                {/* Icon + Label */}
                                                <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 justify-center">
                                                    <Icon className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-5 sm:w-5 shrink-0" />
                                                    <span className="font-semibold text-[10px] xs:text-xs sm:text-sm whitespace-nowrap">
                                                        {/* Labels adaptatifs */}
                                                        <span className="inline xs:hidden">{tab.shortLabel}</span>
                                                        <span className="hidden xs:inline sm:hidden">{tab.label}</span>
                                                        <span className="hidden sm:inline">{tab.label}</span>
                                                    </span>
                                                </div>
                                                
                                                {/* Badge - Masqué sur très petits écrans si pas actif */}
                                                <Badge 
                                                    variant="secondary" 
                                                    className={`
                                                        text-[9px] xs:text-[10px] sm:text-xs
                                                        px-1 xs:px-1.5 sm:px-2
                                                        py-0 xs:py-0.5
                                                        h-4 xs:h-5
                                                        ${!isActive ? 'hidden xs:flex' : 'flex'}
                                                    `}
                                                >
                                                    {tab.count}
                                                </Badge>
                                            </TabsTrigger>
                                        );
                                    })}
                                </TabsList>
                            </div>
                        </div>

                        {/* Content avec padding adaptatif */}
                        <div className="p-2 xs:p-3 sm:p-4 md:p-6">
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