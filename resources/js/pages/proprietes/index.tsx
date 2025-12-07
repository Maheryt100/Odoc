// pages/proprietes/index.tsx - ✅ VERSION FINALE AVEC SYSTÈME COMPLET

import { useMemo, useState } from 'react';
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
        setShowDemandeurDetail(false);
        setTimeout(() => {
            setSelectedPropriete(propriete);
            setShowProprieteDetail(true);
        }, 100);
    };

    const handleSelectDemandeurFromPropriete = (demandeur: Demandeur) => {
        setShowProprieteDetail(false);
        const demandeurComplet = demandeurs.find(d => d.id === demandeur.id) || demandeur;
        setTimeout(() => {
            setSelectedDemandeur(demandeurComplet);
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

    const handleCloseProprieteDialog = (open: boolean) => {
        setShowProprieteDetail(open);
        if (!open) {
            setTimeout(() => setSelectedPropriete(null), 300);
        }
    };

    const handleCloseDemandeurDialog = (open: boolean) => {
        setShowDemandeurDetail(open);
        if (!open) {
            setTimeout(() => setSelectedDemandeur(null), 300);
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
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                <LandPlot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Propriétés</h2>
                                <p className="text-sm text-muted-foreground">
                                    {proprietesFiltrees.length} propriété{proprietesFiltrees.length > 1 ? 's' : ''}
                                    {proprietesFiltrees.length !== proprietes.length && ` sur ${proprietes.length}`}
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
                                <span>Sans demandeur</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-200 dark:bg-green-900/50 rounded border border-green-300 dark:border-green-800"></div>
                                <span>Acquise</span>
                            </div>
                        </div>
                    </div>
                </div>

                <CardContent className="p-6">
                    {/* Filtres */}
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

            {/* Dialogues */}
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