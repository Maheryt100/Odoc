// pages/demandeurs/index.tsx - ✅ VERSION CORRIGÉE FINALE

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
    
    // ✅ CORRECTION: Ajout de l'état manquant
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
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Demandeurs</h2>
                                <p className="text-sm text-muted-foreground">
                                    {demandeursFiltres.length} demandeur{demandeursFiltres.length > 1 ? 's' : ''} 
                                    {demandeursFiltres.length !== demandeurs.length && ` sur ${demandeurs.length}`}
                                </p>
                            </div>
                        </div>
                        
                        {/* Légende */}
                        <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-200 dark:bg-red-900/50 rounded border border-red-300 dark:border-red-800"></div>
                                <span>Données incomplètes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-amber-200 dark:bg-amber-900/50 rounded border border-amber-300 dark:border-amber-800"></div>
                                <span>Sans propriété</span>
                            </div>
                        </div>
                    </div>
                </div>

                <CardContent className="p-6">
                    {/* Filtres */}
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
        </>
    );
}