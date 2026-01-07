// resources/js/pages/demandeurs/components/DemandeurFilters.tsx    
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, X, SortAsc, SortDesc, Filter } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

type FiltreStatutType = 'tous' | 'actives' | 'acquises' | 'sans';
type TriType = 'date' | 'nom' | 'proprietes' | 'statut';

interface DemandeurFiltersProps {
    filtreStatut: FiltreStatutType;
    onFiltreStatutChange: (filtre: FiltreStatutType) => void;
    recherche: string;
    onRechercheChange: (recherche: string) => void;
    tri: TriType;
    onTriChange: (tri: TriType) => void;
    ordre: 'asc' | 'desc';
    onOrdreToggle: () => void;
    totalDemandeurs: number;
    totalFiltres: number;
}

export default function DemandeurFilters({
    filtreStatut,
    onFiltreStatutChange,
    recherche,
    onRechercheChange,
    tri,
    onTriChange,
    ordre,
    onOrdreToggle,
    totalDemandeurs,
    totalFiltres
}: DemandeurFiltersProps) {
    
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!showFilters) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            
            // Ignorer si clic sur le bouton toggle
            if (buttonRef.current?.contains(target)) {
                return;
            }
            
            // Ignorer si clic dans le panel
            if (filterRef.current?.contains(target)) {
                return;
            }
            
            // Ignorer si clic dans un portal Select (radix-ui)
            const isSelectPortal = (target as Element).closest('[role="listbox"]') || 
                                  (target as Element).closest('[data-radix-select-viewport]') ||
                                  (target as Element).closest('[data-radix-popper-content-wrapper]');
            
            if (isSelectPortal) {
                return;
            }
            
            // Fermer uniquement si vraiment en dehors
            setShowFilters(false);
        };

        // Délai pour éviter fermeture immédiate à l'ouverture
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

    const getStatusLabel = (status: FiltreStatutType) => {
        const labels = {
            tous: 'Tous',
            actives: 'Avec propriétés',
            acquises: 'Acquises',
            sans: 'Sans propriété'
        };
        return labels[status];
    };

    const getSortLabel = (sort: TriType) => {
        const labels = {
            date: 'Date',
            nom: 'Nom',
            proprietes: 'Propriétés',
            statut: 'Statut'
        };
        return labels[sort];
    };

    return (
        <div className="mb-4 space-y-3">
            {/* Ligne principale */}
            <div className="relative">
                <div className="flex items-center gap-2">
                    {/* Barre de recherche */}
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Rechercher par nom, CIN..."
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

                    {/* Bouton Ordre (Externe) */}
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
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">
                                {getStatusLabel(filtreStatut)}
                                <button
                                    onClick={() => onFiltreStatutChange('tous')}
                                    className="hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5 transition-colors"
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
                                <Filter className="h-4 w-4 text-emerald-600" />
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
                                    onValueChange={(value) => onFiltreStatutChange(value as FiltreStatutType)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tous">Tous ({totalDemandeurs})</SelectItem>
                                        <SelectItem value="actives">Avec propriétés</SelectItem>
                                        <SelectItem value="acquises">Acquises</SelectItem>
                                        <SelectItem value="sans">Sans propriété</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Tri */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Trier par</Label>
                                <Select 
                                    value={tri} 
                                    onValueChange={(value) => onTriChange(value as TriType)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="date">Date</SelectItem>
                                        <SelectItem value="nom">Nom</SelectItem>
                                        <SelectItem value="proprietes">Propriétés</SelectItem>
                                        <SelectItem value="statut">Statut</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Footer simplifié */}
                        <div className="px-4 py-3 border-t bg-muted/30 rounded-b-lg">
                            <div className="text-xs text-muted-foreground text-center">
                                {totalFiltres} résultat{totalFiltres > 1 ? 's' : ''} sur {totalDemandeurs}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}