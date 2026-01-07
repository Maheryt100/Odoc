// pages/demandes/ResumeDossier.tsx - 

import { useState, useEffect, useMemo } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, ArrowLeft, FileOutput, Info, Sparkles, Menu, Eye } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Dossier, BreadcrumbItem } from '@/types';
import DemandesIndex from './index';
import DossierStats from './components/DossierStats';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/useResponsive';
import type { DocumentDemande, DemandeWithDetails } from './types';
import { useDialogCleanup, useForceDialogCleanup, cleanupDialogOverlays } from '@/hooks/useDialogCleanup';

interface ResumeDossierProps {
    dossier: Dossier & {
        can_generate_documents?: boolean; 
    };
    documents: {
        data: DocumentDemande[];
        current_page: number;
        last_page: number;
        total: number;
    };
    auth: {
        user: {
            id: number;
            role: string;
            id_district?: number | null;
        };
    };
}

export default function ResumeDossier({ dossier, documents, auth }: ResumeDossierProps) {

    
    const { flash } = usePage<{ flash?: { message?: string; success?: string; error?: string } }>().props;
    const isMobile = useIsMobile();
    
    // Archive dialogs
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
    const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false);
    const [selectedDemandeForAction, setSelectedDemandeForAction] = useState<DocumentDemande | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useDialogCleanup(archiveDialogOpen);
    useDialogCleanup(unarchiveDialogOpen);

    const forceCleanup = useForceDialogCleanup();

    const isReadOnly = useMemo(() => {
        return auth.user.role === 'super_admin' || auth.user.role === 'central_user';
    }, [auth.user.role]);

    const canGenerateDocuments = useMemo(() => {
        // Si le backend a fourni explicitement la permission
        if (dossier.can_generate_documents !== undefined) {
            return dossier.can_generate_documents;
        }

        // Sinon, calculer selon les règles métier
        if (isReadOnly) {
            return false; // Super admin et central user ne peuvent pas
        }

        // Admin district et user district peuvent si :
        // - Le dossier n'est pas fermé
        // - Le dossier appartient à leur district
        // - Il y a au moins 1 demandeur et 1 propriété
        const isAdmin = auth.user.role === 'admin_district';
        const isUser = auth.user.role === 'user_district';
        
        if (isAdmin || isUser) {
            const belongsToDistrict = auth.user.id_district === dossier.id_district;
            const hasData = (dossier.demandeurs_count || 0) > 0 && (dossier.proprietes_count || 0) > 0;
            return !dossier.is_closed && belongsToDistrict && hasData;
        }

        return false;
    }, [dossier, auth.user, isReadOnly]);

    const documentButtonTooltip = useMemo(() => {
        if (canGenerateDocuments) {
            return '';
        }

        if (isReadOnly) {
            return 'Mode consultation uniquement - Vous ne pouvez pas générer de documents';
        }

        if (dossier.is_closed) {
            return 'Impossible de générer des documents - Le dossier est fermé';
        }

        const hasNoDemandeurs = (dossier.demandeurs_count || 0) === 0;
        const hasNoProprietes = (dossier.proprietes_count || 0) === 0;

        if (hasNoDemandeurs && hasNoProprietes) {
            return 'Impossible de générer des documents - Aucun demandeur ni propriété';
        }

        if (hasNoDemandeurs) {
            return 'Impossible de générer des documents - Aucun demandeur dans le dossier';
        }

        if (hasNoProprietes) {
            return 'Impossible de générer des documents - Aucune propriété dans le dossier';
        }

        const wrongDistrict = auth.user.id_district !== dossier.id_district;
        if (wrongDistrict) {
            return `Impossible de générer des documents - Ce dossier appartient au district ${dossier.district?.nom_district || 'inconnu'}`;
        }

        return 'Génération de documents non disponible';
    }, [canGenerateDocuments, isReadOnly, dossier, auth.user]);

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
    const handleArchiveClick = (demandeWithDetails: DemandeWithDetails) => {
        if (isReadOnly) {
            toast.error('Action non autorisée', {
                description: 'Vous êtes en mode consultation uniquement'
            });
            return;
        }

        const doc: DocumentDemande = {
            id: demandeWithDetails.id,
            id_propriete: demandeWithDetails.id_propriete,
            date_demande: demandeWithDetails.date_demande,
            propriete: demandeWithDetails.propriete,
            demandeurs: demandeWithDetails.demandeurs,
            total_prix: demandeWithDetails.total_prix,
            status: demandeWithDetails.status,
            status_consort: demandeWithDetails.status_consort,
            nombre_demandeurs: demandeWithDetails.nombre_demandeurs,
            created_at: demandeWithDetails.created_at,
            updated_at: demandeWithDetails.updated_at,
        };
        setSelectedDemandeForAction(doc);
        setArchiveDialogOpen(true);
    };

    const handleUnarchiveClick = (demandeWithDetails: DemandeWithDetails) => {
        if (isReadOnly) {
            toast.error('Action non autorisée', {
                description: 'Vous êtes en mode consultation uniquement'
            });
            return;
        }

        const doc: DocumentDemande = {
            id: demandeWithDetails.id,
            id_propriete: demandeWithDetails.id_propriete,
            date_demande: demandeWithDetails.date_demande,
            propriete: demandeWithDetails.propriete,
            demandeurs: demandeWithDetails.demandeurs,
            total_prix: demandeWithDetails.total_prix,
            status: demandeWithDetails.status,
            status_consort: demandeWithDetails.status_consort,
            nombre_demandeurs: demandeWithDetails.nombre_demandeurs,
            created_at: demandeWithDetails.created_at,
            updated_at: demandeWithDetails.updated_at,
        };
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
                    setTimeout(forceCleanup, 100);
                },
                onError: (errors) => {
                    toast.error(Object.values(errors).join('\n'));
                },
                onFinish: () => {
                    setIsProcessing(false);
                    setTimeout(forceCleanup, 300);
                }
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
                    setTimeout(forceCleanup, 100);
                },
                onError: (errors) => {
                    toast.error(Object.values(errors).join('\n'));
                },
                onFinish: () => {
                    setIsProcessing(false);
                    setTimeout(forceCleanup, 300);
                }
            }
        );
    };
    
    useEffect(() => {
        return () => {
            cleanupDialogOverlays();
        };
    }, []);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Résumé', href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Résumé - ${dossier.nom_dossier}`} />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-[1600px] space-y-4 sm:space-y-6">
                
                {/* Header avec gestion des permissions */}
                <div className="flex items-start justify-between gap-2">
                    {/* Titre + Info */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Liste des demandes
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-sm sm:text-base text-muted-foreground">
                            <span className="font-medium truncate max-w-[200px] sm:max-w-none">{dossier.nom_dossier}</span>
                            <span className="text-gray-400 hidden sm:inline">•</span>
                            <span className="truncate">{dossier.commune}</span>
                            {isReadOnly && (
                                <>
                                    <span className="text-gray-400 hidden sm:inline">•</span>
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 rounded-full flex items-center gap-1 shrink-0">
                                        <Eye className="h-3 w-3" />
                                        <span className="hidden sm:inline">Mode consultation</span>
                                        <span className="sm:hidden">Lecture</span>
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Avec protection du bouton Documents */}
                    {isMobile ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="shrink-0 h-8 w-8 p-0">
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
                                {canGenerateDocuments ? (
                                    <DropdownMenuItem asChild>
                                        <Link href={route('documents.generate', dossier.id)} className="flex items-center">
                                            <FileOutput className="h-4 w-4 mr-2" />
                                            Générer documents
                                        </Link>
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem disabled className="opacity-50">
                                        <FileOutput className="h-4 w-4 mr-2" />
                                        Générer documents
                                    </DropdownMenuItem>
                                )}
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
                            
                            {/* Bouton Documents avec protection */}
                            {canGenerateDocuments ? (
                                <Button size="sm" asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                                    <Link href={route('documents.generate', dossier.id)}>
                                        <FileOutput className="h-4 w-4 mr-2" />
                                        <span className="hidden lg:inline">Générer documents</span>
                                        <span className="lg:hidden">Documents</span>
                                    </Link>
                                </Button>
                            ) : (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Button 
                                                    size="sm"
                                                    disabled
                                                    className="gap-2"
                                                >
                                                    <FileOutput className="h-4 w-4" />
                                                    <span className="hidden lg:inline">Générer documents</span>
                                                    <span className="lg:hidden">Documents</span>
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p>{documentButtonTooltip}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    )}
                </div>

                {/* Alerte lecture seule */}
                {isReadOnly && (
                    <Alert className="border-0 shadow-md bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                                <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <AlertDescription className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                                <span className="font-semibold flex items-center gap-2">
                                    <Sparkles className="h-3 w-3" />
                                    Mode consultation uniquement
                                </span>
                                <span className="text-blue-700 dark:text-blue-300 block mt-1">
                                    Vous pouvez consulter les demandes mais ne pouvez pas générer de documents.
                                    {!isMobile && ` Contactez l'administrateur du district ${dossier.district?.nom_district}.`}
                                </span>
                            </AlertDescription>
                        </div>
                    </Alert>
                )}

                <DossierStats
                    totalDemandes={documents.total}
                    activeCount={activeCount}
                    archivedCount={archivedCount}
                    proprietesCount={dossier.proprietes_count || 0}
                />

                {!isReadOnly && (
                    <Alert className="border-0 shadow-md bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <AlertDescription className="text-blue-900 dark:text-blue-100">
                                <p className="text-sm sm:text-base font-semibold flex items-center gap-2 mb-1">
                                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                                    Vue consolidée
                                </p>
                                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                                    {isMobile 
                                        ? 'Toutes les demandes du dossier.' 
                                        : 'Retrouvez ici toutes les demandes du dossier. Cliquez sur une ligne pour voir les détails complets.'
                                    }
                                </p>
                            </AlertDescription>
                        </div>
                    </Alert>
                )}

                <DemandesIndex
                    documents={documents}
                    dossier={dossier}
                    onArchive={handleArchiveClick}
                    onUnarchive={handleUnarchiveClick}
                />
            </div>

            {/* Dialogs d'archivage */}
            <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
                <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                            Archiver la propriété
                        </AlertDialogTitle>
                        {/*Retirer AlertDialogDescription, utiliser div directement */}
                    </AlertDialogHeader>
                    
                    {/*Contenu dans CardContent au lieu de AlertDialogDescription */}
                    <div className="px-6 pb-6 space-y-2 sm:space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Voulez-vous vraiment archiver cette propriété ?
                        </p>
                        
                        <div className="p-2 sm:p-3 bg-muted rounded-lg text-xs sm:text-sm space-y-1">
                            <p className="truncate">
                                <strong>Lot:</strong> {selectedDemandeForAction?.propriete?.lot}
                            </p>
                            <p>
                                <strong>Demandeurs:</strong> {selectedDemandeForAction?.nombre_demandeurs} personne(s)
                            </p>
                        </div>
                        
                        <div className="flex items-start gap-2 p-2 sm:p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md">
                            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs sm:text-sm text-orange-800 dark:text-orange-200">
                                Toutes les demandes associées seront archivées
                            </p>
                        </div>
                    </div>
                    
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel 
                            disabled={isProcessing} 
                            className="w-full sm:w-auto"
                            onClick={() => {
                                setArchiveDialogOpen(false);
                                setTimeout(() => {
                                    cleanupDialogOverlays();
                                }, 100);
                            }}
                        >
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmArchive}
                            disabled={isProcessing}
                            className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
                        >
                            {isProcessing ? 'Archivage...' : 'Archiver'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={unarchiveDialogOpen} onOpenChange={setUnarchiveDialogOpen}>
                <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            Désarchiver la propriété
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    
                    {/* Même correction */}
                    <div className="px-6 pb-6 space-y-2 sm:space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Voulez-vous vraiment désarchiver cette propriété ?
                        </p>
                        
                        <div className="p-2 sm:p-3 bg-muted rounded-lg text-xs sm:text-sm space-y-1">
                            <p className="truncate">
                                <strong>Lot:</strong> {selectedDemandeForAction?.propriete?.lot}
                            </p>
                            <p>
                                <strong>Demandeurs:</strong> {selectedDemandeForAction?.nombre_demandeurs} personne(s)
                            </p>
                        </div>
                        
                        <div className="flex items-start gap-2 p-2 sm:p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                                Toutes les demandes associées seront réactivées
                            </p>
                        </div>
                    </div>
                    
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel 
                            disabled={isProcessing} 
                            className="w-full sm:w-auto"
                            onClick={() => {
                                setUnarchiveDialogOpen(false);
                                // Nettoyage forcé
                                setTimeout(() => {
                                    cleanupDialogOverlays();
                                }, 100);
                            }}
                        >
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmUnarchive}
                            disabled={isProcessing}
                            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                        >
                            {isProcessing ? 'Désarchivage...' : 'Désarchiver'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}