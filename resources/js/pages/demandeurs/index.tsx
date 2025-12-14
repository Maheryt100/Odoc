// pages/demandeurs/index.tsx - ✅ VERSION COMPACTE

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import DemandeurDetailDialog from './components/DemandeurDetailDialog';
import ProprieteDetailDialog from '@/pages/proprietes/components/ProprieteDetailDialog';
import DemandeurFilters from './components/DemandeurFilters';
import DemandeurTable from './components/DemandeurTable';
import type { Propriete } from '@/types';
import type { 
    DemandeursIndexProps, 
    DemandeurWithProperty, 
    FiltreStatutType, 
    TriType 
} from './types';
import { 
    filterDemandeursByStatus, 
    sortDemandeurs, 
    matchesSearch 
} from './helpers';
import EditDemandeurDialog from './components/EditDemandeurDialog';

export default function DemandeursIndex({
    demandeurs,
    dossier,
    proprietes,
    onDeleteDemandeur,
    isDemandeurIncomplete,
    onLinkPropriete,
    onDissociate
}: DemandeursIndexProps) {
    
    // STATE
    const [currentPage, setCurrentPage] = useState(1);
    const [filtreStatut, setFiltreStatut] = useState<FiltreStatutType>('tous');
    const [recherche, setRecherche] = useState('');
    const [tri, setTri] = useState<TriType>('date');
    const [ordre, setOrdre] = useState<'asc' | 'desc'>('desc');
    
    const [selectedDemandeur, setSelectedDemandeur] = useState<DemandeurWithProperty | null>(null);
    const [showDemandeurDetail, setShowDemandeurDetail] = useState(false);
    const [editDemandeur, setEditDemandeur] = useState<DemandeurWithProperty | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    
    const [selectedPropriete, setSelectedPropriete] = useState<Propriete | null>(null);
    const [showProprieteDetail, setShowProprieteDetail] = useState(false);

    const itemsPerPage = 10;

    // FILTRAGE ET TRI
    const demandeursFiltres = useMemo(() => {
        let filtered = filterDemandeursByStatus(demandeurs, filtreStatut);
        
        if (recherche) {
            filtered = filtered.filter(d => matchesSearch(d, recherche));
        }
        
        filtered = sortDemandeurs(filtered, tri, ordre);
        
        return filtered;
    }, [demandeurs, filtreStatut, recherche, tri, ordre]);

    // HANDLERS - DIALOGUES
    const handleSelectDemandeur = (demandeur: DemandeurWithProperty) => {
        setShowProprieteDetail(false);
        setTimeout(() => {
            setSelectedDemandeur(demandeur);
            setShowDemandeurDetail(true);
        }, 100);
    };

    const handleSelectProprieteFromDemandeur = (propriete: Propriete) => {
        setShowDemandeurDetail(false);
        setTimeout(() => {
            setSelectedPropriete(propriete);
            setShowProprieteDetail(true);
        }, 100);
    };

    const handleSelectDemandeurFromPropriete = (demandeur: any) => {
        setShowProprieteDetail(false);
        const demandeurWithProperty = demandeurs.find(d => d.id === demandeur.id);
        if (demandeurWithProperty) {
            setTimeout(() => {
                setSelectedDemandeur(demandeurWithProperty);
                setShowDemandeurDetail(true);
            }, 100);
        }
    };

    const handleCloseDemandeurDialog = (open: boolean) => {
        setShowDemandeurDetail(open);
        if (!open) {
            setTimeout(() => {
                setSelectedDemandeur(null);
            }, 300);
        }
    };

    const handleCloseProprieteDialog = (open: boolean) => {
        setShowProprieteDetail(open);
        if (!open) {
            setTimeout(() => {
                setSelectedPropriete(null);
            }, 300);
        }
    };

    const handleEditDemandeur = (demandeur: DemandeurWithProperty) => {
        setShowDemandeurDetail(false);
        setShowProprieteDetail(false);
        setTimeout(() => {
            setEditDemandeur(demandeur);
            setShowEditDialog(true);
        }, 100);
    };

    const handleCloseEditDialog = (open: boolean) => {
        setShowEditDialog(open);
        if (!open) {
            setTimeout(() => {
                setEditDemandeur(null);
            }, 300);
        }
    };

    // HANDLERS - FILTRES
    const handleFiltreStatutChange = (newFiltre: FiltreStatutType) => {
        setFiltreStatut(newFiltre);
        setCurrentPage(1);
    };

    const handleRechercheChange = (newRecherche: string) => {
        setRecherche(newRecherche);
        setCurrentPage(1);
    };

    const handleTriChange = (newTri: TriType) => {
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
                <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 px-6 py-3 border-b">
                    <div className="flex items-center justify-between gap-4">
                        {/* Titre */}
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                                <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold leading-tight">Demandeurs</h2>
                                <p className="text-xs text-muted-foreground truncate">
                                    {demandeursFiltres.length} / {demandeurs.length}
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
                                <span>Sans propriété</span>
                            </div>
                        </div>
                    </div>
                </div>

                <CardContent className="p-4">
                    {/* Filtres sur une seule ligne */}
                    <DemandeurFilters
                        filtreStatut={filtreStatut}
                        onFiltreStatutChange={handleFiltreStatutChange}
                        recherche={recherche}
                        onRechercheChange={handleRechercheChange}
                        tri={tri}
                        onTriChange={handleTriChange}
                        ordre={ordre}
                        onOrdreToggle={handleOrdreToggle}
                        totalDemandeurs={demandeurs.length}
                        totalFiltres={demandeursFiltres.length}
                    />

                    {/* Tableau */}
                    <DemandeurTable
                        demandeurs={demandeursFiltres}
                        dossier={dossier}
                        proprietes={proprietes}
                        onDeleteDemandeur={onDeleteDemandeur}
                        isDemandeurIncomplete={isDemandeurIncomplete}
                        onLinkPropriete={onLinkPropriete}
                        onSelectDemandeur={handleSelectDemandeur}
                        onEditDemandeur={handleEditDemandeur}
                        onDissociate={onDissociate}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                    />
                </CardContent>
            </Card>

            {/* Dialogues */}
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

            <ProprieteDetailDialog
                propriete={selectedPropriete}
                open={showProprieteDetail}
                onOpenChange={handleCloseProprieteDialog}
                onSelectDemandeur={handleSelectDemandeurFromPropriete}
                dossierClosed={dossier.is_closed}
                onDissociate={onDissociate}
            />
            
            <EditDemandeurDialog
                demandeur={editDemandeur}
                open={showEditDialog}
                onOpenChange={handleCloseEditDialog}
                dossierId={dossier.id}
                dossierClosed={dossier.is_closed}
            />
        </>
    );
}