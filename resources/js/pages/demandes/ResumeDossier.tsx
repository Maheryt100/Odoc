// pages/demandes/ResumeDossier.tsx - ✅ VERSION REFONTE COMPLÈTE

import { useState, useEffect } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, ArrowLeft, FileOutput, Info, Sparkles } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Dossier, BreadcrumbItem } from '@/types';
import DemandesIndex from './index';
import DossierStats from './components/DossierStats';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

interface ResumeDossierProps {
    dossier: Dossier;
    documents: {
        data: Array<{
            id: number;
            id_propriete: number;
            propriete: any;
            demandeurs: any[];
            total_prix: number;
            status: string;
            status_consort: boolean;
            nombre_demandeurs: number;
        }>;
        current_page: number;
        last_page: number;
        total: number;
    };
}

export default function ResumeDossier({ dossier, documents }: ResumeDossierProps) {
    const { flash } = usePage<{ flash?: { message?: string; success?: string; error?: string } }>().props;
    
    // Archive dialogs
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
    const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false);
    const [selectedDemandeForAction, setSelectedDemandeForAction] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Toast notifications
    useEffect(() => {
        if (flash?.message) toast.info(flash.message);
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.message, flash?.success, flash?.error]);

    // Stats calculations
    const activeCount = documents.data.filter(d => d.status === 'active').length;
    const archivedCount = documents.data.filter(d => d.status === 'archive').length;

    // Handlers
    const handleArchiveClick = (doc: any) => {
        setSelectedDemandeForAction(doc);
        setArchiveDialogOpen(true);
    };

    const handleUnarchiveClick = (doc: any) => {
        setSelectedDemandeForAction(doc);
        setUnarchiveDialogOpen(true);
    };

    const confirmArchive = () => {
        if (!selectedDemandeForAction || isProcessing) return;
        setIsProcessing(true);
        router.post(route('proprietes.archive'), 
            { id: selectedDemandeForAction.id_propriete },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Propriété archivée avec succès');
                    setArchiveDialogOpen(false);
                    setSelectedDemandeForAction(null);
                },
                onError: (errors) => toast.error(Object.values(errors).join('\n')),
                onFinish: () => setIsProcessing(false)
            }
        );
    };

    const confirmUnarchive = () => {
        if (!selectedDemandeForAction || isProcessing) return;
        setIsProcessing(true);
        router.post(route('proprietes.unarchive'), 
            { id: selectedDemandeForAction.id_propriete },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Propriété désarchivée avec succès');
                    setUnarchiveDialogOpen(false);
                    setSelectedDemandeForAction(null);
                },
                onError: (errors) => toast.error(Object.values(errors).join('\n')),
                onFinish: () => setIsProcessing(false)
            }
        );
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Résumé', href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Résumé - ${dossier.nom_dossier}`} />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-[1600px] space-y-6">
                {/* En-tête moderne */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Liste des demandes (résumé)
                            </h1>
                            <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                                <span className="font-medium">{dossier.nom_dossier}</span>
                                <span className="text-gray-400">•</span>
                                <span>{dossier.commune}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('dossiers.show', dossier.id)}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Retour
                            </Link>
                        </Button>
                        <Button size="sm" asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                            <Link href={route('documents.generate', dossier.id)}>
                                <FileOutput className="h-4 w-4 mr-2" />
                                Générer documents
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Statistiques */}
                <DossierStats
                    totalDemandes={documents.total}
                    activeCount={activeCount}
                    archivedCount={archivedCount}
                    proprietesCount={dossier.proprietes_count || 0}
                />

                {/* Alerte info */}
                <Alert className="border-0 shadow-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <AlertDescription className="text-blue-900 dark:text-blue-100">
                            <p className="font-semibold flex items-center gap-2 mb-1">
                                <Sparkles className="h-4 w-4" />
                                Vue consolidée
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Retrouvez ici toutes les demandes du dossier. Cliquez sur une ligne pour voir les détails complets.
                            </p>
                        </AlertDescription>
                    </div>
                </Alert>

                {/* Liste des demandes */}
                <DemandesIndex
                    documents={documents}
                    dossier={dossier}
                    onArchive={handleArchiveClick}
                    onUnarchive={handleUnarchiveClick}
                />
            </div>

            {/* Archive Dialog */}
            <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-orange-600" />
                            Archiver la propriété
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <div className="space-y-3">
                                <p>Voulez-vous vraiment archiver cette propriété ?</p>
                                <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                                    <p><strong>Lot:</strong> {selectedDemandeForAction?.propriete?.lot}</p>
                                    <p><strong>Demandeurs:</strong> {selectedDemandeForAction?.nombre_demandeurs} personne(s)</p>
                                </div>
                                <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md">
                                    <Info className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-orange-800 dark:text-orange-200">
                                        Toutes les demandes associées seront archivées
                                    </p>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmArchive}
                            disabled={isProcessing}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isProcessing ? 'Archivage...' : 'Archiver'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Unarchive Dialog */}
            <AlertDialog open={unarchiveDialogOpen} onOpenChange={setUnarchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            Désarchiver la propriété
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <div className="space-y-3">
                                <p>Voulez-vous vraiment désarchiver cette propriété ?</p>
                                <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                                    <p><strong>Lot:</strong> {selectedDemandeForAction?.propriete?.lot}</p>
                                    <p><strong>Demandeurs:</strong> {selectedDemandeForAction?.nombre_demandeurs} personne(s)</p>
                                </div>
                                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                    <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        Toutes les demandes associées seront réactivées
                                    </p>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmUnarchive}
                            disabled={isProcessing}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isProcessing ? 'Désarchivage...' : 'Désarchiver'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}