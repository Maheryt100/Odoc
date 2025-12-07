// resources/js/pages/dossiers/Show.tsx - ✅ VERSION REDESIGNÉE FINALE

import { Head, router, usePage, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowLeft, FileOutput, FileText } from 'lucide-react';
import type { BreadcrumbItem, Demandeur, Propriete, SharedData } from '@/types';
import type { BaseDemandeur, BasePropriete } from '@/pages/PiecesJointes/pieces-jointes';
import type { Dossier, DossierPermissions } from './types';
import type { DemandeurWithProperty } from '@/pages/demandeurs/types';

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

    const proprietes = dossier.proprietes || [];

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

    const handleLinkDemandeur = useCallback((propriete: Propriete) => {
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
    }, [dossier.is_closed, closeAllDialogs]);

    const handleLinkPropriete = useCallback((demandeur: Demandeur) => {
        if (dossier.is_closed) {
            toast.error('Impossible de lier : le dossier est fermé');
            return;
        }
        
        closeAllDialogs();
        
        setTimeout(() => {
            setSelectedDemandeurForLink(demandeur);
            setLinkProprieteOpen(true);
        }, 100);
    }, [dossier.is_closed, closeAllDialogs]);

    const handleDissociate = useCallback((
        demandeurId: number,
        proprieteId: number,
        demandeurNom: string,
        proprieteLot: string,
        type: 'from-demandeur' | 'from-propriete'
    ) => {
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
    }, [dossier.is_closed, proprietes, closeAllDialogs]);

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
    }, [allDemandeurs, closeAllDialogs]);

    const handleDeletePropriete = useCallback((id: number) => {
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
    }, [proprietes, closeAllDialogs]);

    const handleArchivePropriete = (id: number) => {
        if (confirm('Archiver cette propriété (acquise) ?')) {
            router.post(route('proprietes.archive'), { id }, {
                preserveScroll: true,
                onSuccess: () => toast.success('Propriété archivée'),
                onError: (errors) => toast.error('Erreur', { description: Object.values(errors).join('\n') })
            });
        }
    };

    const handleUnarchivePropriete = (id: number) => {
        if (confirm('Désarchiver cette propriété ?')) {
            router.post(route('proprietes.unarchive'), { id }, {
                preserveScroll: true,
                onSuccess: () => toast.success('Propriété désarchivée'),
                onError: (errors) => toast.error('Erreur', { description: Object.values(errors).join('\n') })
            });
        }
    };

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

    // ✅ Tooltip pour documents désactivé
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

            <div className="container mx-auto p-6 max-w-[1600px] space-y-6">
                
                {/* ✅ HEADER MODERNE - Style Generate.tsx */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Informations du dossier
                        </h1>
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <span className="font-medium">{dossier.nom_dossier}</span>
                            <span className="text-gray-400">•</span>
                            <span>{dossier.commune}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="gap-2 shadow-sm hover:shadow-md transition-all"
                        >
                            <Link href={route('dossiers')}>
                                <ArrowLeft className="h-4 w-4" />
                                Retour à la liste
                            </Link>
                        </Button>

                        {/* ✅ Documents - avec tooltip si désactivé */}
                        {permissions.canGenerateDocuments ? (
                            <Button asChild size="sm" className="gap-2 shadow-md">
                                <Link href={`/documents/generate/${dossier.id}`}>
                                    <FileOutput className="h-4 w-4" />
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
                                        <p>{documentButtonTooltip}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        
                        {/* Résumé - toujours accessible */}
                        <Button asChild size="sm" variant="outline" className="gap-2 shadow-md">
                            <Link href={`/demandes/resume/${dossier.id}`}>
                                <FileText className="h-4 w-4" />
                                Résumé
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Section Info */}
                <DossierInfoSection
                    dossier={dossier}
                    demandeursCount={allDemandeurs.length}
                    proprietesCount={proprietes.length}
                    onCloseToggle={() => setCloseDialogOpen(true)}
                    permissions={permissions}
                />

                <DemandeursIndex
                    demandeurs={allDemandeurs}
                    dossier={dossier}
                    proprietes={proprietes}
                    onSelectDemandeur={(dem) => console.log('Sélectionné:', dem)}
                    onDeleteDemandeur={handleDeleteDemandeur}
                    onLinkPropriete={handleLinkPropriete}
                    onDissociate={handleDissociate}
                    isDemandeurIncomplete={isDemandeurIncomplete}
                />

                <ProprietesIndex
                    proprietes={proprietes}
                    dossier={dossier}
                    demandeurs={allDemandeurs}
                    onSelectPropriete={(prop: any) => console.log('Sélectionné:', prop)}
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
                    canUpload={permissions.canEdit}
                    canDelete={permissions.canDelete}
                    canVerify={permissions.canClose}
                    initialCount={dossier.pieces_jointes_count || 0}
                    demandeurs={baseDemandeursForAttachments}
                    proprietes={baseProprietesForAttachments}
                    showRelated={true}
                />
            </div>

            {/* Dialogues */}
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

            <SmartDeleteProprieteDialog
                propriete={selectedProprieteToDelete}
                open={deleteProprieteOpen}
                onOpenChange={(open: boolean | ((prevState: boolean) => boolean)) => {
                    setDeleteProprieteOpen(open);
                    if (!open) {
                        setTimeout(() => setSelectedProprieteToDelete(null), 300);
                    }
                }}
            />

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
        </AppLayout>
    );
}