// documents/Generate.tsx - ✅ VERSION FINALE CORRIGÉE

import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Info, ArrowLeft, List, Sparkles, Menu, FileText, Receipt, FileCheck, FileOutput } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { BreadcrumbItem, Dossier } from '@/types';
import { ProprieteWithDemandeurs, DemandeurWithCSF } from './types';
import ActeVenteTab from './tabs/ActeVenteTab';
import CsfTab from './tabs/CsfTab';
import RequisitionTab from './tabs/RequisitionTab';
import StatCard from './components/StatCard';
import { DocumentTabs, DocumentTabType } from './components/DocumentTabs';
import { useDocumentStats } from './hooks/useDocumentStats';
import { useIsMobile } from '@/hooks/useResponsive';

interface GenerateProps {
    dossier: Dossier;
    proprietes: ProprieteWithDemandeurs[];
    demandeurs: DemandeurWithCSF[];
}

export default function Generate({ dossier, proprietes, demandeurs }: GenerateProps) {
    const [activeTab, setActiveTab] = useState<DocumentTabType>('acte_vente');
    const isMobile = useIsMobile();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Accueil", href: "/" },
        { title: "Dossiers", href: `/dossiers/${dossier.id}` },
        { title: "Documents", href: `/documents/generate/${dossier.id}` },
    ];

    const stats = useDocumentStats({ proprietes, demandeurs });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Génération de documents" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-[1400px] space-y-4 sm:space-y-6">
                
                {/* ✅ Header Ultra-Compact */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent truncate">
                            Génération de documents
                        </h1>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mt-1 text-xs sm:text-sm text-muted-foreground">
                            <span className="font-medium truncate max-w-[150px] sm:max-w-none">
                                {dossier.nom_dossier}
                            </span>
                            <span className="text-gray-400 hidden xs:inline">•</span>
                            <span className="truncate max-w-[120px] sm:max-w-none">{dossier.commune}</span>
                        </div>
                    </div>

                    {/* Menu Actions */}
                    {isMobile ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="shrink-0 h-8 w-8 p-0">
                                    <Menu className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem asChild>
                                    <Link href={route('dossiers.show', dossier.id)} className="flex items-center">
                                        <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                                        Retour
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={route('demandes.resume', dossier.id)} className="flex items-center">
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

                {/* ✅ Stats Grid Compact avec icons directement importés */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    <StatCard
                        title="ADV"
                        value={stats.proprietesAvecAdv}
                        total={stats.totalProprietes}
                        icon={FileText}
                        colorScheme="violet"
                        label="propriétés"
                    />
                    <StatCard
                        title="Reçus"
                        value={stats.proprietesAvecRecu}
                        total={stats.totalProprietes}
                        icon={Receipt}
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

                {/* ✅ Alerte Info Compact */}
                <Alert className="border-0 shadow-md bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 py-2 sm:py-3">
                    <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <AlertDescription className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                            <span className="font-semibold flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3" />
                                {isMobile ? 'Génération unique' : 'Système de génération unique'}
                            </span>
                            <span className="text-blue-700 dark:text-blue-300 block mt-0.5">
                                {isMobile 
                                    ? 'Docs générés 1×, puis téléchargés'
                                    : 'Chaque document n\'est généré qu\'une fois, les suivants sont téléchargés depuis les archives'
                                }
                            </span>
                        </AlertDescription>
                    </div>
                </Alert>

                {/* ✅ TABS + CONTENT */}
                <Card className="border-0 shadow-lg overflow-hidden">
                    <DocumentTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        stats={stats}
                    />

                    {/* Content */}
                    <div className="p-3 sm:p-4 md:p-6">
                        {activeTab === 'acte_vente' && (
                            <ActeVenteTab 
                                proprietes={proprietes}
                                demandeurs={demandeurs}
                                dossier={dossier}
                            />
                        )}

                        {activeTab === 'csf' && (
                            <CsfTab 
                                proprietes={proprietes}
                                demandeurs={demandeurs}
                                dossier={dossier}
                            />
                        )}

                        {activeTab === 'requisition' && (
                            <RequisitionTab 
                                proprietes={proprietes}
                                dossier={dossier}
                            />
                        )}
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}