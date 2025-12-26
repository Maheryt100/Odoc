// pages/demandes/components/DemandeFilters.tsx - ✅ CORRECTION TYPE

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpDown, Filter, X, SortAsc, SortDesc } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useState, useRef, useEffect } from 'react';

// ✅ CORRECTION : Importer depuis types.ts
import type { FiltreStatutDemandeType, TriDemandeType } from '../types';

interface DemandeFiltersProps {
    filtreStatut: FiltreStatutDemandeType;
    onFiltreStatutChange: (filtre: FiltreStatutDemandeType) => void;
    recherche: string;
    onRechercheChange: (recherche: string) => void;
    tri: TriDemandeType;
    onTriChange: (tri: TriDemandeType) => void;
    ordre: 'asc' | 'desc';
    onOrdreToggle: () => void;
    totalDemandes: number;
    totalFiltres: number;
}

export default function DemandeFilters({
    filtreStatut,
    onFiltreStatutChange,
    recherche,
    onRechercheChange,
    tri,
    onTriChange,
    ordre,
    onOrdreToggle,
    totalDemandes,
    totalFiltres,
}: DemandeFiltersProps) {
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!showFilters) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            
            if (buttonRef.current?.contains(target)) {
                return;
            }
            
            if (filterRef.current?.contains(target)) {
                return;
            }
            
            const isSelectPortal = (target as Element).closest('[role="listbox"]') || 
                                  (target as Element).closest('[data-radix-select-viewport]') ||
                                  (target as Element).closest('[data-radix-popper-content-wrapper]');
            
            if (isSelectPortal) {
                return;
            }
            
            setShowFilters(false);
        };

        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilters]);

    const hasActiveFilters = 
        filtreStatut !== 'tous' || 
        recherche !== '' ||
        tri !== 'date' ||
        ordre !== 'desc';

    const activeFiltersCount = [
        filtreStatut !== 'tous',
        tri !== 'date',
        ordre !== 'desc'
    ].filter(Boolean).length;

    const resetAllFilters = () => {
        onFiltreStatutChange('tous');
        onRechercheChange('');
        onTriChange('date');
    };

    const getStatusLabel = (status: FiltreStatutDemandeType) => {
        const labels = {
            tous: 'Toutes',
            actives: 'Actives',
            archivees: 'Archivées',
            incompletes: 'Incomplètes'
        };
        return labels[status];
    };

    const getSortLabel = (sort: TriDemandeType) => {
        const labels = {
            date: 'Date',
            lot: 'N° Lot',
            demandeur: 'Demandeur',
            prix: 'Prix',
            statut: 'Statut', // ✅ AJOUTÉ
        };
        return labels[sort];
    };

    return (
        <div className="mb-4 space-y-3">
            <div className="relative">
                <div className="flex items-center gap-2">
                    {/* Barre de recherche */}
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Rechercher par lot, demandeur, CIN..."
                            value={recherche}
                            onChange={(e) => onRechercheChange(e.target.value)}
                            className="pl-9 pr-9 h-9"
                        />
                        {recherche && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRechercheChange('')}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>

                    {/* Bouton Filtres */}
                    <Button
                        ref={buttonRef}
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="relative h-9 px-3 gap-2 flex-shrink-0"
                    >
                        <Filter className="h-4 w-4" />
                        <span className="text-sm font-medium hidden lg:inline">Filtres</span>
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>

                    {/* Bouton Ordre */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onOrdreToggle}
                        className="h-9 w-9 flex-shrink-0"
                        title={ordre === 'asc' ? 'Croissant' : 'Décroissant'}
                    >
                        {ordre === 'asc' ? (
                            <SortAsc className="h-4 w-4" />
                        ) : (
                            <SortDesc className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Badges des filtres actifs */}
                {hasActiveFilters && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground">
                            Filtres actifs :
                        </span>
                        {filtreStatut !== 'tous' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                {getStatusLabel(filtreStatut)}
                                <button
                                    onClick={() => onFiltreStatutChange('tous')}
                                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {tri !== 'date' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                                Tri: {getSortLabel(tri)}
                                <button
                                    onClick={() => onTriChange('date')}
                                    className="hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        <button
                            onClick={resetAllFilters}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            Tout effacer
                        </button>
                    </div>
                )}

                {/* Panel Filtres Popup */}
                {showFilters && (
                    <div 
                        ref={filterRef}
                        className="absolute top-full right-0 mt-2 w-80 bg-background border rounded-lg shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Filter className="h-4 w-4 text-blue-600" />
                                Filtres
                            </h4>
                            {hasActiveFilters && (
                                <button 
                                    onClick={resetAllFilters} 
                                    className="text-sm text-blue-600 hover:underline font-medium"
                                >
                                    Réinitialiser
                                </button>
                            )}
                        </div>

                        {/* Body */}
                        <div className="p-4 space-y-4">
                            {/* Statut */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Statut</Label>
                                <Select 
                                    value={filtreStatut} 
                                    onValueChange={(value) => onFiltreStatutChange(value as FiltreStatutDemandeType)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tous">Toutes ({totalDemandes})</SelectItem>
                                        <SelectItem value="actives">Actives</SelectItem>
                                        <SelectItem value="archivees">Archivées</SelectItem>
                                        <SelectItem value="incompletes">Incomplètes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Tri */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Trier par</Label>
                                <Select 
                                    value={tri} 
                                    onValueChange={(value) => onTriChange(value as TriDemandeType)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="date">Date</SelectItem>
                                        <SelectItem value="lot">N° Lot</SelectItem>
                                        <SelectItem value="demandeur">Demandeur</SelectItem>
                                        <SelectItem value="prix">Prix</SelectItem>
                                        <SelectItem value="statut">Statut</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t bg-muted/30 rounded-b-lg">
                            <div className="text-xs text-muted-foreground text-center">
                                {totalFiltres} résultat{totalFiltres > 1 ? 's' : ''} sur {totalDemandes}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}