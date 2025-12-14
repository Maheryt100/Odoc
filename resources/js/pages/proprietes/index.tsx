// pages/proprietes/index.tsx - ✅ VERSION AVEC NETTOYAGE D'OVERLAY

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LandPlot } from 'lucide-react';
import type { Propriete, Dossier, Demandeur } from '@/types';
import ProprieteDetailDialog from '@/pages/proprietes/components/ProprieteDetailDialog';
import DemandeurDetailDialog from '@/pages/demandeurs/components/DemandeurDetailDialog';
import ProprieteFilters from './components/ProprieteFilters';
import ProprieteTable from './components/ProprieteTable';
import type { 
    ProprietesIndexProps,
    ProprieteWithDetails,
    FiltreStatutProprieteType,
    TriProprieteType
} from './types';
import {
    filterProprietesByStatus,
    sortProprietes,
    matchesSearch,
} from './helpers';

export default function ProprietesIndex({
    proprietes,
    dossier,
    demandeurs,
    onDeletePropriete,
    onArchivePropriete,
    onUnarchivePropriete,
    isPropertyIncomplete,
    onLinkDemandeur,
    onDissociate
}: ProprietesIndexProps) {
    // STATE
    const [currentPage, setCurrentPage] = useState(1);
    const [filtreStatut, setFiltreStatut] = useState<FiltreStatutProprieteType>('tous');
    const [recherche, setRecherche] = useState('');
    const [tri, setTri] = useState<TriProprieteType>('date');
    const [ordre, setOrdre] = useState<'asc' | 'desc'>('desc');
    
    const [selectedPropriete, setSelectedPropriete] = useState<Propriete | null>(null);
    const [showProprieteDetail, setShowProprieteDetail] = useState(false);
    const [selectedDemandeur, setSelectedDemandeur] = useState<Demandeur | null>(null);
    const [showDemandeurDetail, setShowDemandeurDetail] = useState(false);

    const itemsPerPage = 10;

    // CORRECTION : Nettoyer les overlays résiduels au montage et démontage
    useEffect(() => {
        // Fonction de nettoyage
        const cleanupOverlays = () => {
            // Nettoyer les overlays de radix-ui
            const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
            overlays.forEach(overlay => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            });
            
            // Nettoyer les styles du body
            document.body.style.pointerEvents = '';
            document.body.style.overflow = '';
            
            // Supprimer data-state du body si présent
            document.body.removeAttribute('data-scroll-locked');
        };

        // Nettoyage initial
        cleanupOverlays();

        // Nettoyage au démontage
        return () => {
            cleanupOverlays();
        };
    }, []);

    // Nettoyer quand tous les dialogs sont fermés
    useEffect(() => {
        if (!showProprieteDetail && !showDemandeurDetail) {
            const timer = setTimeout(() => {
                // Nettoyer les overlays résiduels
                const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
                overlays.forEach(overlay => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                });
                
                // Restaurer le body
                document.body.style.pointerEvents = '';
                document.body.style.overflow = '';
                document.body.removeAttribute('data-scroll-locked');
            }, 300);
            
            return () => clearTimeout(timer);
        }
    }, [showProprieteDetail, showDemandeurDetail]);

    // FILTRAGE ET TRI
    const proprietesFiltrees = useMemo(() => {
        let filtered = filterProprietesByStatus(proprietes, filtreStatut);
        
        if (recherche) {
            filtered = filtered.filter(p => matchesSearch(p, recherche));
        }
        
        filtered = sortProprietes(filtered, tri, ordre);
        
        return filtered;
    }, [proprietes, filtreStatut, recherche, tri, ordre]);

    // CALCUL DES PROPRIÉTÉS AVEC _computed
    const processedProprietes = useMemo(() => {
        if (!proprietesFiltrees || !Array.isArray(proprietesFiltrees)) {
            return [];
        }
        return proprietesFiltrees.map((prop: Propriete): ProprieteWithDetails => ({
            ...prop,
            _computed: {
                isIncomplete: isPropertyIncomplete(prop),
                hasDemandeurs: prop.demandes ? prop.demandes.some(d => d.status === 'active') : false,
                isArchived: prop.is_archived || false,
            }
        }));
    }, [proprietesFiltrees, isPropertyIncomplete]);

    // HANDLERS - DIALOGUES
    const handleSelectPropriete = (propriete: Propriete) => {
        // Fermer le dialog demandeur d'abord
        if (showDemandeurDetail) {
            setShowDemandeurDetail(false);
            setSelectedDemandeur(null);
        }
        
        // Ouvrir le dialog propriété
        setSelectedPropriete(propriete);
        setShowProprieteDetail(true);
    };

    const handleSelectDemandeurFromPropriete = (demandeur: Demandeur) => {
        // Fermer le dialog propriété
        setShowProprieteDetail(false);
        
        const demandeurComplet = demandeurs.find(d => d.id === demandeur.id) || demandeur;
        
        setTimeout(() => {
            setSelectedPropriete(null);
            setSelectedDemandeur(demandeurComplet);
            setShowDemandeurDetail(true);
        }, 100);
    };

    const handleSelectProprieteFromDemandeur = (propriete: Propriete) => {
        // Fermer le dialog demandeur
        setShowDemandeurDetail(false);
        
        setTimeout(() => {
            setSelectedDemandeur(null);
            setSelectedPropriete(propriete);
            setShowProprieteDetail(true);
        }, 100);
    };

    const handleCloseProprieteDialog = (open: boolean) => {
        setShowProprieteDetail(open);
        if (!open) {
            setTimeout(() => {
                setSelectedPropriete(null);
            }, 100);
        }
    };

    const handleCloseDemandeurDialog = (open: boolean) => {
        setShowDemandeurDetail(open);
        if (!open) {
            setTimeout(() => {
                setSelectedDemandeur(null);
            }, 100);
        }
    };

    // HANDLERS - FILTRES
    const handleFiltreStatutChange = (newFiltre: FiltreStatutProprieteType) => {
        setFiltreStatut(newFiltre);
        setCurrentPage(1);
    };

    const handleRechercheChange = (newRecherche: string) => {
        setRecherche(newRecherche);
        setCurrentPage(1);
    };

    const handleTriChange = (newTri: TriProprieteType) => {
        setTri(newTri);
        setCurrentPage(1);
    };

    const handleOrdreToggle = () => {
        setOrdre(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // RENDER
    return (
        <>
            <Card className="border-0 shadow-lg">
                {/* Header Compact */}
                <div className="bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 px-6 py-3 border-b">
                    <div className="flex items-center justify-between gap-4">
                        {/* Titre */}
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex-shrink-0">
                                <LandPlot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold leading-tight">Propriétés</h2>
                                <p className="text-xs text-muted-foreground truncate">
                                    {proprietesFiltrees.length} / {proprietes.length}
                                </p>
                            </div>
                        </div>
                        
                        {/* Légende compacte */}
                        <div className="hidden xl:flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-red-200 dark:bg-red-900/50 rounded border border-red-300 dark:border-red-800"></div>
                                <span>Incomplet</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-amber-200 dark:bg-amber-900/50 rounded border border-amber-300 dark:border-amber-800"></div>
                                <span>Sans demandeur</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-green-200 dark:bg-green-900/50 rounded border border-green-300 dark:border-green-800"></div>
                                <span>Acquise</span>
                            </div>
                        </div>
                    </div>
                </div>

                <CardContent className="p-4">
                    {/* Filtres sur une seule ligne */}
                    <ProprieteFilters
                        filtreStatut={filtreStatut}
                        onFiltreStatutChange={handleFiltreStatutChange}
                        recherche={recherche}
                        onRechercheChange={handleRechercheChange}
                        tri={tri}
                        onTriChange={handleTriChange}
                        ordre={ordre}
                        onOrdreToggle={handleOrdreToggle}
                        totalProprietes={proprietes.length}
                        totalFiltres={proprietesFiltrees.length}
                    />

                    {/* Tableau */}
                    <ProprieteTable
                        proprietes={processedProprietes}
                        dossier={dossier}
                        demandeurs={demandeurs}
                        onDeletePropriete={onDeletePropriete}
                        onArchivePropriete={onArchivePropriete}
                        onUnarchivePropriete={onUnarchivePropriete}
                        isPropertyIncomplete={isPropertyIncomplete}
                        onLinkDemandeur={onLinkDemandeur}
                        onSelectPropriete={handleSelectPropriete}
                        onDissociate={onDissociate}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                    />
                </CardContent>
            </Card>

            {/* Dialogues - Toujours rendus pour gérer le nettoyage */}
            <ProprieteDetailDialog
                propriete={selectedPropriete}
                open={showProprieteDetail}
                onOpenChange={handleCloseProprieteDialog}
                onSelectDemandeur={handleSelectDemandeurFromPropriete}
                dossierClosed={dossier.is_closed}
                onDissociate={onDissociate}
            />

            <DemandeurDetailDialog
                demandeur={selectedDemandeur}
                open={showDemandeurDetail}
                onOpenChange={handleCloseDemandeurDialog}
                proprietes={proprietes}
                onSelectPropriete={handleSelectProprieteFromDemandeur}
                dossierId={dossier.id}
                dossierClosed={dossier.is_closed}
                onDissociate={onDissociate}
            />
        </>
    );
}