// resources/js/pages/dossiers/Show.tsx 

import { Head, router, usePage, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowLeft, FileOutput, FileText, Info, Sparkles, Eye, Menu } from 'lucide-react';
import type { BreadcrumbItem, Demandeur, Propriete, SharedData } from '@/types';
import type { BaseDemandeur, BasePropriete } from '@/pages/PiecesJointes/pieces-jointes';
import type { Dossier, DossierPermissions } from './types';
import type { DemandeurWithProperty } from '@/pages/demandeurs/types';

// Hooks
import { useIsMobile } from '@/hooks/useResponsive';

// Composants
import { CloseDossierDialog } from './components/CloseDossierDialog';
import { LinkDemandeurDialog } from '../DemandeursProprietes/associations/LinkDemandeurDialog';
import { LinkProprieteDialog } from '../DemandeursProprietes/associations/LinkProprieteDialog';
import { DissociateDialog } from '../DemandeursProprietes/associations/DissociateDialog';
import SmartDeleteProprieteDialog from '@/pages/proprietes/components/SmartDeleteProprieteDialog';
import SmartDeleteDemandeurDialog from '@/pages/demandeurs/components/SmartDeleteDemandeurDialog';
import DossierInfoSection from './components/DossierInfoSection';
import DemandeursIndex from '@/pages/demandeurs/index';
import ProprietesIndex from '@/pages/proprietes/index';
import PiecesJointesIndex from '@/pages/PiecesJointes/Index';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getDisabledDocumentButtonTooltip } from './helpers';

interface PageProps {
    dossier: Dossier & {
        demandeurs: Demandeur[];
        proprietes: Propriete[];
        pieces_jointes_count?: number;
    };
    permissions: DossierPermissions;
    auth: {
        user: {
            id: number;
            role: string;
            id_district?: number | null;
        };
    };
    [key: string]: any;
}

export default function Show() {
    const { dossier, permissions, auth } = usePage<PageProps>().props;
    const { flash } = usePage<SharedData>().props;
    const isMobile = useIsMobile();

    const proprietes = dossier.proprietes || [];

    // ✅ Déterminer si l'utilisateur est en lecture seule
    const isReadOnly = useMemo(() => {
        return auth.user.role === 'super_admin' || auth.user.role === 'central_user';
    }, [auth.user.role]);

    // États pour les dialogues de suppression
    const [deleteProprieteOpen, setDeleteProprieteOpen] = useState(false);
    const [selectedProprieteToDelete, setSelectedProprieteToDelete] = useState<Propriete | null>(null);
    
    const [deleteDemandeurOpen, setDeleteDemandeurOpen] = useState(false);
    const [selectedDemandeurToDelete, setSelectedDemandeurToDelete] = useState<Demandeur | null>(null);
    
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);
    
    // États pour la liaison
    const [linkDemandeurOpen, setLinkDemandeurOpen] = useState(false);
    const [linkProprieteOpen, setLinkProprieteOpen] = useState(false);
    const [selectedProprieteForLink, setSelectedProprieteForLink] = useState<Propriete | null>(null);
    const [selectedDemandeurForLink, setSelectedDemandeurForLink] = useState<Demandeur | null>(null);

    // État pour la dissociation
    const [dissociateDialogOpen, setDissociateDialogOpen] = useState(false);
    const [dissociateData, setDissociateData] = useState<{
        demandeurId: number;
        proprieteId: number;
        demandeurNom: string;
        proprieteLot: string;
        type: 'from-demandeur' | 'from-propriete';
        autresDemandeurs?: number;
    } | null>(null);
    const [isDissociating, setIsDissociating] = useState(false);

    useEffect(() => {
        if (flash?.message) toast.info(flash.message);
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.message, flash?.success, flash?.error]);

    // Gestionnaires de fermeture
    const closeAllDialogs = useCallback(() => {
        setLinkDemandeurOpen(false);
        setLinkProprieteOpen(false);
        setDissociateDialogOpen(false);
        setDeleteProprieteOpen(false);
        setDeleteDemandeurOpen(false);
        setCloseDialogOpen(false);
    }, []);

    const handleCloseLinkDemandeurDialog = useCallback(() => {
        setLinkDemandeurOpen(false);
        setTimeout(() => {
            setSelectedProprieteForLink(null);
        }, 300);
    }, []);

    const handleCloseLinkProprieteDialog = useCallback(() => {
        setLinkProprieteOpen(false);
        setTimeout(() => {
            setSelectedDemandeurForLink(null);
        }, 300);
    }, []);

    // ✅ Gestionnaires avec blocage lecture seule
    const handleLinkDemandeur = useCallback((propriete: Propriete) => {
        if (isReadOnly) {
            toast.error('Action non autorisée', {
                description: 'Vous êtes en mode consultation uniquement'
            });
            return;
        }
        
        if (dossier.is_closed) {
            toast.error('Impossible de lier : le dossier est fermé');
            return;
        }
        if (propriete.is_archived) {
            toast.error('Impossible de lier : la propriété est archivée (acquise)');
            return;
        }
        
        closeAllDialogs();
        
        setTimeout(() => {
            setSelectedProprieteForLink(propriete);
            setLinkDemandeurOpen(true);
        }, 100);
    }, [dossier.is_closed, closeAllDialogs, isReadOnly]);

    const handleLinkPropriete = useCallback((demandeur: Demandeur) => {
        if (isReadOnly) {
            toast.error('Action non autorisée', {
                description: 'Vous êtes en mode consultation uniquement'
            });
            return;
        }
        
        if (dossier.is_closed) {
            toast.error('Impossible de lier : le dossier est fermé');
            return;
        }
        
        closeAllDialogs();
        
        setTimeout(() => {
            setSelectedDemandeurForLink(demandeur);
            setLinkProprieteOpen(true);
        }, 100);
    }, [dossier.is_closed, closeAllDialogs, isReadOnly]);

    const handleDissociate = useCallback((
        demandeurId: number,
        proprieteId: number,
        demandeurNom: string,
        proprieteLot: string,
        type: 'from-demandeur' | 'from-propriete'
    ) => {
        if (isReadOnly) {
            toast.error('Action non autorisée', {
                description: 'Vous êtes en mode consultation uniquement'
            });
            return;
        }
        
        if (dossier.is_closed) {
            toast.error('Impossible de dissocier : le dossier est fermé');
            return;
        }

        const propriete = proprietes.find(p => {
            const pId = typeof p.id === 'number' ? p.id : parseInt(p.id);
            const propId = typeof proprieteId === 'number' ? proprieteId : parseInt(proprieteId);
            return pId === propId;
        });

        if (!propriete) {
            toast.error('Propriété introuvable');
            return;
        }

        if (propriete.is_archived) {
            toast.error('Impossible de dissocier : la propriété est archivée (acquise)');
            return;
        }

        const autresDemandeurs = propriete.demandes?.filter(d => {
            const demandeIdDemandeur = typeof d.id_demandeur === 'number' 
                ? d.id_demandeur 
                : parseInt(d.id_demandeur);
            const currentDemandeurId = typeof demandeurId === 'number'
                ? demandeurId
                : parseInt(demandeurId);
                
            const isOtherDemandeur = demandeIdDemandeur !== currentDemandeurId;
            const isActive = d.status === 'active';
            
            return isOtherDemandeur && isActive;
        }).length || 0;

        closeAllDialogs();
        
        setTimeout(() => {
            setDissociateData({
                demandeurId,
                proprieteId,
                demandeurNom,
                proprieteLot,
                type,
                autresDemandeurs
            });
            setDissociateDialogOpen(true);
        }, 100);
    }, [dossier.is_closed, proprietes, closeAllDialogs, isReadOnly]);

    const confirmDissociate = useCallback(() => {
        if (!dissociateData || isDissociating) {
            return;
        }

        setIsDissociating(true);

        router.post(route('association.dissociate'), {
            id_demandeur: dissociateData.demandeurId,
            id_propriete: dissociateData.proprieteId,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                const message = dissociateData.type === 'from-demandeur'
                    ? `Propriété Lot ${dissociateData.proprieteLot} dissociée avec succès`
                    : `${dissociateData.demandeurNom} dissocié de la propriété avec succès`;
                
                toast.success(message);
                
                setDissociateDialogOpen(false);
                setTimeout(() => {
                    setDissociateData(null);
                }, 300);
            },
            onError: (errors) => {
                toast.error('Erreur', {
                    description: Object.values(errors).join('\n')
                });
            },
            onFinish: () => {
                setIsDissociating(false);
            }
        });
    }, [dissociateData, isDissociating]);

    const allDemandeurs = useMemo((): DemandeurWithProperty[] => {
        return (dossier.demandeurs || []).map(d => ({
            ...d,
            hasProperty: d.hasProperty ?? false,
            proprietes_actives_count: d.proprietes_actives_count ?? 0,
            proprietes_acquises_count: d.proprietes_acquises_count ?? 0,
        })) as DemandeurWithProperty[];
    }, [dossier.demandeurs]);

    const handleDeleteDemandeur = useCallback((id: number) => {
        if (isReadOnly) {
            toast.error('Action non autorisée', {
                description: 'Vous êtes en mode consultation uniquement'
            });
            return;
        }
        
        const demandeur = allDemandeurs.find(d => d.id === id);
        if (!demandeur) {
            toast.error('Demandeur introuvable');
            return;
        }
        
        closeAllDialogs();
        
        setTimeout(() => {
            setSelectedDemandeurToDelete(demandeur);
            setDeleteDemandeurOpen(true);
        }, 100);
    }, [allDemandeurs, closeAllDialogs, isReadOnly]);

    const handleDeletePropriete = useCallback((id: number) => {
        if (isReadOnly) {
            toast.error('Action non autorisée', {
                description: 'Vous êtes en mode consultation uniquement'
            });
            return;
        }
        
        const propriete = proprietes.find(p => p.id === id);
        if (!propriete) {
            toast.error('Propriété introuvable');
            return;
        }
        
        closeAllDialogs();
        
        setTimeout(() => {
            setSelectedProprieteToDelete(propriete);
            setDeleteProprieteOpen(true);
        }, 100);
    }, [proprietes, closeAllDialogs, isReadOnly]);

    const handleArchivePropriete = useCallback((id: number) => {
        if (isReadOnly) {
            toast.error('Action non autorisée', {
                description: 'Vous êtes en mode consultation uniquement'
            });
            return;
        }
        
        if (confirm('Archiver cette propriété (acquise) ?')) {
            router.post(route('proprietes.archive'), { id }, {
                preserveScroll: true,
                onSuccess: () => toast.success('Propriété archivée'),
                onError: (errors) => toast.error('Erreur', { description: Object.values(errors).join('\n') })
            });
        }
    }, [isReadOnly]);

    const handleUnarchivePropriete = useCallback((id: number) => {
        if (isReadOnly) {
            toast.error('Action non autorisée', {
                description: 'Vous êtes en mode consultation uniquement'
            });
            return;
        }
        
        if (confirm('Désarchiver cette propriété ?')) {
            router.post(route('proprietes.unarchive'), { id }, {
                preserveScroll: true,
                onSuccess: () => toast.success('Propriété désarchivée'),
                onError: (errors) => toast.error('Erreur', { description: Object.values(errors).join('\n') })
            });
        }
    }, [isReadOnly]);

    const isPropertyIncomplete = (prop: Propriete): boolean => {
        return !prop.titre || !prop.contenance || !prop.proprietaire || !prop.nature || !prop.vocation || !prop.situation;
    };

    const isDemandeurIncomplete = (dem: Demandeur): boolean => {
        return !dem.date_naissance || !dem.lieu_naissance || !dem.date_delivrance || 
               !dem.lieu_delivrance || !dem.domiciliation || !dem.occupation || !dem.nom_mere;
    };

    const baseDemandeursForAttachments: BaseDemandeur[] = allDemandeurs.map(d => ({
        id: d.id,
        nom_demandeur: d.nom_demandeur,
        prenom_demandeur: d.prenom_demandeur ?? "",
        cin: d.cin,
    }));

    const baseProprietesForAttachments: BasePropriete[] = proprietes.map(p => ({
        id: p.id,
        lot: p.lot,
        titre: p.titre ?? null,
    }));

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: '#' }
    ];

    const documentButtonTooltip = !permissions.canGenerateDocuments 
        ? getDisabledDocumentButtonTooltip(dossier, { 
            role: auth.user.role,
            id_district: auth.user.id_district 
          })
        : '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Dossier ${dossier.nom_dossier}`} />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-[1600px] space-y-4 sm:space-y-6">
                
                {/* ✅ Header Responsive */}
                <div className="flex items-start justify-between gap-2">
                    {/* Titre et infos */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent truncate">
                            Informations du dossier
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

                    {/* Menu Actions - Toujours à droite */}
                    {isMobile ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="shrink-0 h-8 w-8 p-0">
                                    <Menu className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                    <Link href={route('dossiers')} className="flex items-center">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Retour
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={route('demandes.resume', dossier.id)} className="flex items-center">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Liste des demandes
                                    </Link>
                                </DropdownMenuItem>
                                {permissions.canGenerateDocuments && (
                                    <DropdownMenuItem asChild>
                                        <Link href={route('documents.generate', dossier.id)} className="flex items-center">
                                            <FileOutput className="h-4 w-4 mr-2" />
                                            Documents
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-3 shrink-0">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route('dossiers')}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Retour
                                </Link>
                            </Button>
                
                            <Button size="sm" asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
                                <Link href={route('demandes.resume', dossier.id)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    <span className="hidden lg:inline">Liste des demandes</span>
                                    <span className="lg:hidden">Demandes</span>
                                </Link>
                            </Button>
                            
                            {permissions.canGenerateDocuments ? (
                                <Button size="sm" asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
                                    <Link href={route('documents.generate', dossier.id)}>
                                        <FileOutput className="h-4 w-4 mr-2" />
                                        Documents
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
                                                    Documents
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p>{documentButtonTooltip || (isReadOnly 
                                                ? 'Mode consultation uniquement - Contactez un administrateur'
                                                : 'Génération non disponible')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    )}
                </div>
                {/* ✅ Alertes - Responsive */}
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
                                    Vous pouvez consulter ce dossier mais ne pouvez pas le modifier. 
                                    {!isMobile && ` Contactez l'administrateur du district ${dossier.district?.nom_district}.`}
                                </span>
                            </AlertDescription>
                        </div>
                    </Alert>
                )}

                {!isReadOnly && (
                    <Alert className="border-0 shadow-md bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg shrink-0">
                                <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <AlertDescription className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-100">
                                <span className="font-semibold flex items-center gap-2">
                                    <Sparkles className="h-3 w-3" />
                                    Gestion complète du dossier
                                </span>
                                <span className="text-emerald-700 dark:text-emerald-300 hidden sm:inline">
                                    — Gérez les demandeurs, propriétés et documents en un seul endroit
                                </span>
                            </AlertDescription>
                        </div>
                    </Alert>
                )}

                {/* Sections principales */}
                <DossierInfoSection
                    dossier={dossier}
                    demandeursCount={allDemandeurs.length}
                    proprietesCount={proprietes.length}
                    onCloseToggle={() => {
                        if (isReadOnly) {
                            toast.error('Action non autorisée', {
                                description: 'Vous êtes en mode consultation uniquement'
                            });
                            return;
                        }
                        setCloseDialogOpen(true);
                    }}
                    permissions={permissions}
                    userRole={auth.user.role}
                />
            
                <DemandeursIndex
                    demandeurs={allDemandeurs}
                    dossier={{ ...dossier, is_closed: dossier.is_closed || isReadOnly }}
                    proprietes={proprietes}
                    onSelectDemandeur={(dem) => console.log('Sélectionné:', dem)}
                    onDeleteDemandeur={handleDeleteDemandeur}
                    onLinkPropriete={handleLinkPropriete}
                    onDissociate={handleDissociate}
                    isDemandeurIncomplete={isDemandeurIncomplete}
                />

                <ProprietesIndex
                    proprietes={proprietes}
                    dossier={{ ...dossier, is_closed: dossier.is_closed || isReadOnly }}
                    demandeurs={allDemandeurs}
                    onDeletePropriete={handleDeletePropriete}
                    onArchivePropriete={handleArchivePropriete}
                    onUnarchivePropriete={handleUnarchivePropriete}
                    onLinkDemandeur={handleLinkDemandeur}
                    onDissociate={handleDissociate}
                    isPropertyIncomplete={isPropertyIncomplete}
                />
                
                <PiecesJointesIndex
                    attachableType="Dossier"
                    attachableId={dossier.id}
                    title="Documents du Dossier"
                    canUpload={permissions.canEdit && !isReadOnly}
                    canDelete={permissions.canDelete && !isReadOnly}
                    canVerify={permissions.canClose && !isReadOnly}
                    initialCount={dossier.pieces_jointes_count || 0}
                    demandeurs={baseDemandeursForAttachments}
                    proprietes={baseProprietesForAttachments}
                    showRelated={true}
                />
            </div>

            {/* Dialogues */}
            {!isReadOnly && (
                <>
                    {selectedProprieteForLink && (
                        <LinkDemandeurDialog
                            open={linkDemandeurOpen}
                            onOpenChange={handleCloseLinkDemandeurDialog}
                            propriete={selectedProprieteForLink}
                            demandeursDossier={allDemandeurs}
                            dossierId={dossier.id}
                        />
                    )}

                    {selectedDemandeurForLink && (
                        <LinkProprieteDialog
                            open={linkProprieteOpen}
                            onOpenChange={handleCloseLinkProprieteDialog}
                            demandeur={selectedDemandeurForLink}
                            proprietesDossier={proprietes}
                            dossierId={dossier.id}
                        />
                    )}

                    <DissociateDialog
                        open={dissociateDialogOpen}
                        onOpenChange={(open) => {
                            setDissociateDialogOpen(open);
                            if (!open) {
                                setTimeout(() => setDissociateData(null), 300);
                            }
                        }}
                        data={dissociateData}
                        isProcessing={isDissociating}
                        onConfirm={confirmDissociate}
                    />

                    {/* ✅ CORRECTION ICI */}
                    {selectedProprieteToDelete && (
                        <SmartDeleteProprieteDialog
                            propriete={selectedProprieteToDelete}  // ✅ Singulier, pas de tableau
                            open={deleteProprieteOpen}
                            onOpenChange={(open: boolean) => {
                                setDeleteProprieteOpen(open);
                                if (!open) {
                                    setTimeout(() => setSelectedProprieteToDelete(null), 300);
                                }
                            }}
                            dossierId={dossier.id}
                        />
                    )}

                    <SmartDeleteDemandeurDialog
                        demandeur={selectedDemandeurToDelete}
                        open={deleteDemandeurOpen}
                        onOpenChange={(open) => {
                            setDeleteDemandeurOpen(open);
                            if (!open) {
                                setTimeout(() => setSelectedDemandeurToDelete(null), 300);
                            }
                        }}
                        dossierId={dossier.id}
                    />

                    <CloseDossierDialog
                        dossier={dossier}
                        open={closeDialogOpen}
                        onOpenChange={setCloseDialogOpen}
                    />
                </>
            )}
        </AppLayout>
    );
}