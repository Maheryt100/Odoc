// pages/demandes/index.tsx - ✅ CORRECTION ERREURS TYPESCRIPT

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import type { Dossier, Propriete, Demandeur } from '@/types';
import DemandeDetailDialog from './components/DemandeDetailDialog';
import DemandeurDetailDialog from '@/pages/demandeurs/components/DemandeurDetailDialog';
import ProprieteDetailDialog from '@/pages/proprietes/components/ProprieteDetailDialog';
import DemandeFilters from './components/DemandeFilters';
import DemandeTable from './components/DemandeTable';
import { useIsMobile } from '@/hooks/useResponsive';
import type { 
    DemandesIndexProps,
    DemandeWithDetails,
    FiltreStatutDemandeType,
    TriDemandeType,
    DocumentDemande
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
    const isMobile = useIsMobile();

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

    const itemsPerPage = isMobile ? 5 : 10;

    // Nettoyer les overlays
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

    // Helpers
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

    // Transformation DocumentDemande → DemandeWithDetails
    const processedDemandes = useMemo((): DemandeWithDetails[] => {
        if (!documents.data || !Array.isArray(documents.data)) {
            return [];
        }
        
        return documents.data.map((doc): DemandeWithDetails => {
            const hasValidDemandeurs = doc.demandeurs && 
                                      Array.isArray(doc.demandeurs) && 
                                      doc.demandeurs.length > 0;
            const isArchived = doc.status === 'archive';
            
            const hasIncompleteData = hasValidDemandeurs
                ? doc.demandeurs.some((d: any) => isDemandeurIncomplete(d.demandeur)) || 
                  isProprieteIncomplete(doc.propriete)
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
    }, [documents.data]);

    // FILTRAGE ET TRI
    const demandesFiltrees = useMemo(() => {
        let filtered = filterDemandesByStatus(processedDemandes, filtreStatut);
        
        if (recherche) {
            filtered = filtered.filter(d => matchesDemandeSearch(d, recherche));
        }
        
        filtered = sortDemandes(filtered, tri, ordre);
        
        return filtered;
    }, [processedDemandes, filtreStatut, recherche, tri, ordre]);

    // HANDLERS - CONVERSION
    const handleArchiveClick = (demandeWithDetails: DemandeWithDetails) => {
        onArchive(demandeWithDetails);
    };

    const handleUnarchiveClick = (demandeWithDetails: DemandeWithDetails) => {
        onUnarchive(demandeWithDetails);
    };

    // Passer les données complètes au dialog
    const handleSelectDemande = (doc: DemandeWithDetails) => {
        if (showDemandeurDetail || showProprieteDetail) {
            setShowDemandeurDetail(false);
            setShowProprieteDetail(false);
        }
        
        setSelectedDemande({
            id: doc.id,
            id_demandeur: doc.demandeurs[0]?.id_demandeur,
            id_propriete: doc.id_propriete,
            date_demande: doc.date_demande,
            total_prix: doc.total_prix,
            status: doc.status,
            status_consort: doc.status_consort,
            demandeurs: doc.demandeurs,
            nombre_demandeurs: doc.nombre_demandeurs,
            propriete: doc.propriete,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
        });
        
        setShowDemandeDetail(true);
    };

    /**
     * ✅ CORRECTION : Enrichir le demandeur avec propriétés du dossier
     */
    const handleSelectDemandeurFromDemande = (demandeurPartiel: any) => {
        setShowDemandeDetail(false);
        
        setTimeout(() => {
            setSelectedDemande(null);
            
            const demandeurComplet = dossier.demandeurs?.find(
                d => d.id === demandeurPartiel.id
            );
            
            if (demandeurComplet) {
                const demandeurAvecProprietes = {
                    ...demandeurComplet,
                    proprietes: dossier.proprietes || []
                };
                
                setSelectedDemandeur(demandeurAvecProprietes);
            } else {
                console.warn('Demandeur complet introuvable, utilisation des données partielles');
                setSelectedDemandeur(demandeurPartiel);
            }
            
            setShowDemandeurDetail(true);
        }, 100);
    };

    /**
     * ✅ CORRECTION TYPESCRIPT : Type proper pour demandes[]
     */
    const handleSelectProprieteFromDemande = (proprietePartielle: any) => {
        setShowDemandeDetail(false);
        
        setTimeout(() => {
            setSelectedDemande(null);
            
            // Chercher la propriété complète
            let proprieteComplete = dossier.proprietes?.find(
                p => p.id === proprietePartielle.id
            );
            
            if (proprieteComplete) {
                // ✅ VALIDATION : S'assurer que demandes[] est présent et enrichi
                if (!proprieteComplete.demandes || proprieteComplete.demandes.length === 0) {
                    console.warn('Propriété trouvée mais sans demandes, reconstruction...');
                    
                    // ✅ FIX TYPE : Reconstruire avec tous les champs nécessaires
                    const demandesReconstruites = documents.data
                        .filter(doc => doc.id_propriete === proprieteComplete!.id)
                        .flatMap(doc => 
                            doc.demandeurs.map((d, idx) => ({
                                id: d.id,
                                id_demandeur: d.id_demandeur,
                                id_propriete: doc.id_propriete,
                                date_demande: doc.date_demande || '', // ✅ Champ ajouté
                                status: doc.status as 'active' | 'archive',
                                status_consort: doc.status_consort, // ✅ Champ ajouté
                                ordre: idx + 1,
                                total_prix: doc.total_prix,
                                motif_archive: null, // ✅ Champ ajouté
                                id_user: 0, // ✅ Champ ajouté (valeur par défaut)
                                created_at: doc.created_at || '', // ✅ Champ ajouté
                                updated_at: doc.updated_at || '', // ✅ Champ ajouté
                                demandeur: d.demandeur,
                                propriete: undefined, // Optionnel
                            }))
                        );
                    
                    // ✅ FIX UNDEFINED : S'assurer que proprieteComplete est défini
                    if (proprieteComplete) {
                        proprieteComplete = {
                            ...proprieteComplete,
                            demandes: demandesReconstruites
                        };
                    }
                }
                
                console.log('✅ Propriété complète envoyée au dialog:', {
                    id: proprieteComplete?.id,
                    lot: proprieteComplete?.lot,
                    demandes_count: proprieteComplete?.demandes?.length || 0
                });
                
                setSelectedPropriete(proprieteComplete);
            } else {
                console.warn('Propriété complète introuvable, reconstruction depuis données partielles');
                
                // ✅ FIX TYPE : Fallback avec tous les champs
                const demandesReconstruites = documents.data
                    .filter(doc => doc.id_propriete === proprietePartielle.id)
                    .flatMap(doc => 
                        doc.demandeurs.map((d, idx) => ({
                            id: d.id,
                            id_demandeur: d.id_demandeur,
                            id_propriete: doc.id_propriete,
                            date_demande: doc.date_demande || '',
                            status: doc.status as 'active' | 'archive',
                            status_consort: doc.status_consort,
                            ordre: idx + 1,
                            total_prix: doc.total_prix,
                            motif_archive: null,
                            id_user: 0,
                            created_at: doc.created_at || '',
                            updated_at: doc.updated_at || '',
                            demandeur: d.demandeur,
                            propriete: undefined,
                        }))
                    );
                
                const proprieteEnrichie = {
                    ...proprietePartielle,
                    demandes: demandesReconstruites
                };
                
                setSelectedPropriete(proprieteEnrichie);
            }
            
            setShowProprieteDetail(true);
        }, 100);
    };

    const handleSelectProprieteFromDemandeur = (propriete: any) => {
        setShowDemandeurDetail(false);
        setTimeout(() => {
            setSelectedDemandeur(null);
            
            const proprieteComplete = dossier.proprietes?.find(p => p.id === propriete.id);
            setSelectedPropriete(proprieteComplete || propriete);
            setShowProprieteDetail(true);
        }, 100);
    };

    const handleSelectDemandeurFromPropriete = (demandeur: any) => {
        setShowProprieteDetail(false);
        setTimeout(() => {
            setSelectedPropriete(null);
            
            const demandeurComplet = dossier.demandeurs?.find(d => d.id === demandeur.id);
            
            if (demandeurComplet) {
                const demandeurAvecProprietes = {
                    ...demandeurComplet,
                    proprietes: dossier.proprietes || []
                };
                setSelectedDemandeur(demandeurAvecProprietes);
            } else {
                setSelectedDemandeur(demandeur);
            }
            
            setShowDemandeurDetail(true);
        }, 100);
    };

    const handleCloseDemandeDialog = (open: boolean) => {
        setShowDemandeDetail(open);
        if (!open) {
            setTimeout(() => setSelectedDemande(null), 100);
        }
    };

    const handleCloseDemandeurDialog = (open: boolean) => {
        setShowDemandeurDetail(open);
        if (!open) {
            setTimeout(() => setSelectedDemandeur(null), 100);
        }
    };

    const handleCloseProprieteDialog = (open: boolean) => {
        setShowProprieteDetail(open);
        if (!open) {
            setTimeout(() => setSelectedPropriete(null), 100);
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
            <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 px-3 sm:px-6 py-3 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base sm:text-lg font-bold leading-tight">Demandes</h2>
                                <p className="text-xs text-muted-foreground truncate">
                                    {demandesFiltrees.length} / {documents.total}
                                </p>
                            </div>
                        </div>
                        
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

                <CardContent className="p-3 sm:p-4">
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

                    <DemandeTable
                        demandes={demandesFiltrees}
                        dossier={dossier}
                        onArchive={handleArchiveClick}
                        onUnarchive={handleUnarchiveClick}
                        onSelectDemande={handleSelectDemande}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                    />
                </CardContent>
            </Card>

            {/* DIALOGS AVEC DONNÉES COMPLÈTES */}
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