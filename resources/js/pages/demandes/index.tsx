// pages/demandes/index.tsx - ✅ VERSION REFONTE COMPLÈTE

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import type { Dossier } from '@/types';
import DemandeDetailDialog from './components/DemandeDetailDialog';
import DemandeurDetailDialog from '@/pages/demandeurs/components/DemandeurDetailDialog';
import ProprieteDetailDialog from '@/pages/proprietes/components/ProprieteDetailDialog';
import DemandeFilters from './components/DemandeFilters';
import DemandeTable from './components/DemandeTable';
import type { 
    DemandesIndexProps,
    DemandeWithDetails,
    FiltreStatutDemandeType,
    TriDemandeType
} from './types';
import {
    filterDemandesByStatus,
    sortDemandes,
    matchesDemandeSearch,
} from './helpers';

export default function DemandesIndex({
    documents,
    dossier,
    onArchive,
    onUnarchive,
}: DemandesIndexProps) {
    // STATE
    const [currentPage, setCurrentPage] = useState(1);
    const [filtreStatut, setFiltreStatut] = useState<FiltreStatutDemandeType>('tous');
    const [recherche, setRecherche] = useState('');
    const [tri, setTri] = useState<TriDemandeType>('date');
    const [ordre, setOrdre] = useState<'asc' | 'desc'>('desc');
    
    const [selectedDemande, setSelectedDemande] = useState<any>(null);
    const [showDemandeDetail, setShowDemandeDetail] = useState(false);
    const [selectedDemandeur, setSelectedDemandeur] = useState<any>(null);
    const [showDemandeurDetail, setShowDemandeurDetail] = useState(false);
    const [selectedPropriete, setSelectedPropriete] = useState<any>(null);
    const [showProprieteDetail, setShowProprieteDetail] = useState(false);

    const itemsPerPage = 10;

    // Nettoyer les overlays résiduels
    useEffect(() => {
        const cleanupOverlays = () => {
            const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
            overlays.forEach(overlay => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            });
            
            document.body.style.pointerEvents = '';
            document.body.style.overflow = '';
            document.body.removeAttribute('data-scroll-locked');
        };

        cleanupOverlays();
        return () => cleanupOverlays();
    }, []);

    useEffect(() => {
        if (!showDemandeDetail && !showDemandeurDetail && !showProprieteDetail) {
            const timer = setTimeout(() => {
                const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
                overlays.forEach(overlay => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                });
                
                document.body.style.pointerEvents = '';
                document.body.style.overflow = '';
                document.body.removeAttribute('data-scroll-locked');
            }, 300);
            
            return () => clearTimeout(timer);
        }
    }, [showDemandeDetail, showDemandeurDetail, showProprieteDetail]);

    // Helpers (déclarés AVANT useMemo)
    const isDemandeurIncomplete = (demandeur: any): boolean => {
        if (!demandeur) return true;
        const champsRequis = ['date_naissance', 'lieu_naissance', 'date_delivrance', 
                             'lieu_delivrance', 'domiciliation', 'occupation', 'nom_mere'];
        return champsRequis.some(champ => !demandeur[champ]);
    };

    const isProprieteIncomplete = (prop: any): boolean => {
        return !prop?.titre || !prop?.contenance || !prop?.proprietaire || 
               !prop?.nature || !prop?.vocation || !prop?.situation;
    };

    // FILTRAGE ET TRI
    const demandesFiltrees = useMemo(() => {
        let filtered = filterDemandesByStatus(documents.data, filtreStatut);
        
        if (recherche) {
            filtered = filtered.filter(d => matchesDemandeSearch(d, recherche));
        }
        
        filtered = sortDemandes(filtered, tri, ordre);
        
        return filtered;
    }, [documents.data, filtreStatut, recherche, tri, ordre]);

    // CALCUL DES DEMANDES AVEC _computed
    const processedDemandes = useMemo(() => {
        if (!demandesFiltrees || !Array.isArray(demandesFiltrees)) {
            return [];
        }
        return demandesFiltrees.map((doc): DemandeWithDetails => {
            const hasValidDemandeurs = doc.demandeurs && Array.isArray(doc.demandeurs) && doc.demandeurs.length > 0;
            const isArchived = doc.status === 'archive';
            
            const hasIncompleteData = hasValidDemandeurs
                ? doc.demandeurs.some((d: any) => isDemandeurIncomplete(d.demandeur)) || isProprieteIncomplete(doc.propriete)
                : isProprieteIncomplete(doc.propriete);

            return {
                ...doc,
                _computed: {
                    isIncomplete: hasIncompleteData,
                    hasValidDemandeurs,
                    isArchived,
                }
            };
        });
    }, [demandesFiltrees, isDemandeurIncomplete, isProprieteIncomplete]);

    // HANDLERS - DIALOGUES
    const handleSelectDemande = (doc: any) => {
        if (showDemandeurDetail || showProprieteDetail) {
            setShowDemandeurDetail(false);
            setShowProprieteDetail(false);
        }
        
        const demandeData = {
            ...doc.demandeurs[0],
            propriete: doc.propriete,
            nombre_demandeurs: doc.nombre_demandeurs,
            demandeurs: doc.demandeurs
        };
        setSelectedDemande(demandeData);
        setShowDemandeDetail(true);
    };

    const handleSelectDemandeurFromDemande = (demandeur: any) => {
        setShowDemandeDetail(false);
        
        setTimeout(() => {
            setSelectedDemande(null);
            setSelectedDemandeur(demandeur);
            setShowDemandeurDetail(true);
        }, 100);
    };

    const handleSelectProprieteFromDemande = (propriete: any) => {
        setShowDemandeDetail(false);
        
        setTimeout(() => {
            setSelectedDemande(null);
            setSelectedPropriete(propriete);
            setShowProprieteDetail(true);
        }, 100);
    };

    const handleSelectProprieteFromDemandeur = (propriete: any) => {
        setShowDemandeurDetail(false);
        
        setTimeout(() => {
            setSelectedDemandeur(null);
            setSelectedPropriete(propriete);
            setShowProprieteDetail(true);
        }, 100);
    };

    const handleSelectDemandeurFromPropriete = (demandeur: any) => {
        setShowProprieteDetail(false);
        
        setTimeout(() => {
            setSelectedPropriete(null);
            setSelectedDemandeur(demandeur);
            setShowDemandeurDetail(true);
        }, 100);
    };

    const handleCloseDemandeDialog = (open: boolean) => {
        setShowDemandeDetail(open);
        if (!open) {
            setTimeout(() => {
                setSelectedDemande(null);
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

    const handleCloseProprieteDialog = (open: boolean) => {
        setShowProprieteDetail(open);
        if (!open) {
            setTimeout(() => {
                setSelectedPropriete(null);
            }, 100);
        }
    };

    // HANDLERS - FILTRES
    const handleFiltreStatutChange = (newFiltre: FiltreStatutDemandeType) => {
        setFiltreStatut(newFiltre);
        setCurrentPage(1);
    };

    const handleRechercheChange = (newRecherche: string) => {
        setRecherche(newRecherche);
        setCurrentPage(1);
    };

    const handleTriChange = (newTri: TriDemandeType) => {
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
                <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 px-6 py-3 border-b">
                    <div className="flex items-center justify-between gap-4">
                        {/* Titre */}
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold leading-tight">Demandes</h2>
                                <p className="text-xs text-muted-foreground truncate">
                                    {demandesFiltrees.length} / {documents.total}
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
                                <div className="w-2.5 h-2.5 bg-gray-200 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
                                <span>Archivée</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-green-200 dark:bg-green-900/50 rounded border border-green-300 dark:border-green-800"></div>
                                <span>Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                <CardContent className="p-4">
                    {/* Filtres sur une seule ligne */}
                    <DemandeFilters
                        filtreStatut={filtreStatut}
                        onFiltreStatutChange={handleFiltreStatutChange}
                        recherche={recherche}
                        onRechercheChange={handleRechercheChange}
                        tri={tri}
                        onTriChange={handleTriChange}
                        ordre={ordre}
                        onOrdreToggle={handleOrdreToggle}
                        totalDemandes={documents.total}
                        totalFiltres={demandesFiltrees.length}
                    />

                    {/* Tableau */}
                    <DemandeTable
                        demandes={processedDemandes}
                        dossier={dossier}
                        onArchive={onArchive}
                        onUnarchive={onUnarchive}
                        onSelectDemande={handleSelectDemande}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                    />
                </CardContent>
            </Card>

            {/* Dialogues */}
            <DemandeDetailDialog
                demande={selectedDemande}
                open={showDemandeDetail}
                onOpenChange={handleCloseDemandeDialog}
                onSelectDemandeur={handleSelectDemandeurFromDemande}
                onSelectPropriete={handleSelectProprieteFromDemande}
            />

            <DemandeurDetailDialog
                demandeur={selectedDemandeur}
                open={showDemandeurDetail}
                onOpenChange={handleCloseDemandeurDialog}
                proprietes={dossier.proprietes || []}
                onSelectPropriete={handleSelectProprieteFromDemandeur}
                dossierId={dossier.id}
                dossierClosed={dossier.is_closed}
            />

            <ProprieteDetailDialog
                propriete={selectedPropriete}
                open={showProprieteDetail}
                onOpenChange={handleCloseProprieteDialog}
                onSelectDemandeur={handleSelectDemandeurFromPropriete}
                dossierClosed={dossier.is_closed}
            />
        </>
    );
}