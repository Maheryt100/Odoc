import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, X, SortAsc, SortDesc, Calendar, Filter } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export type FiltreStatutDossierType = 'tous' | 'ouverts' | 'fermes' | 'incomplets' | 'avec_problemes';
export type TriDossierType = 'date' | 'nom' | 'commune' | 'numero';

interface District {
    id: number;
    nom_district: string;
}

interface DossierFiltersProps {
    filtreStatut: FiltreStatutDossierType;
    onFiltreStatutChange: (filtre: FiltreStatutDossierType) => void;
    recherche: string;
    onRechercheChange: (recherche: string) => void;
    districtFilter: string;
    onDistrictFilterChange: (district: string) => void;
    dateStart: string;
    onDateStartChange: (date: string) => void;
    dateEnd: string;
    onDateEndChange: (date: string) => void;
    tri: TriDossierType;
    onTriChange: (tri: TriDossierType) => void;
    ordre: 'asc' | 'desc';
    onOrdreToggle: () => void;
    districts: District[];
    totalDossiers: number;
    totalFiltres: number;
    canShowAllDistricts: boolean;
}

export default function DossierFilters({
    filtreStatut,
    onFiltreStatutChange,
    recherche,
    onRechercheChange,
    districtFilter,
    onDistrictFilterChange,
    dateStart,
    onDateStartChange,
    dateEnd,
    onDateEndChange,
    tri,
    onTriChange,
    ordre,
    onOrdreToggle,
    districts,
    totalDossiers,
    totalFiltres,
    canShowAllDistricts
}: DossierFiltersProps) {
    
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
        districtFilter !== 'all' || 
        dateStart !== '' || 
        dateEnd !== '' ||
        tri !== 'date' ||
        ordre !== 'desc';

    const activeFiltersCount = [
        filtreStatut !== 'tous',
        districtFilter !== 'all',
        dateStart,
        dateEnd,
        tri !== 'date',
        ordre !== 'desc'
    ].filter(Boolean).length;

    const resetAllFilters = () => {
        onFiltreStatutChange('tous');
        onRechercheChange('');
        onDistrictFilterChange('all');
        onDateStartChange('');
        onDateEndChange('');
        onTriChange('date');
    };

    const getStatusLabel = (status: FiltreStatutDossierType) => {
        const labels = {
            tous: 'Tous',
            ouverts: 'Ouverts',
            fermes: 'Fermés',
            incomplets: 'Incomplets',
            avec_problemes: 'Avec problèmes'
        };
        return labels[status];
    };

    const getSortLabel = (sort: TriDossierType) => {
        const labels = {
            date: 'Date',
            nom: 'Nom',
            commune: 'Commune',
            numero: 'Numéro'
        };
        return labels[sort];
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Barre de recherche */}
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Rechercher..."
                            value={recherche}
                            onChange={(e) => onRechercheChange(e.target.value)}
                            className="pl-9 pr-9 h-10"
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
                        className="relative h-10 px-4 gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        <span className="text-sm font-medium">Filtres</span>
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
                        className="h-10 w-10"
                        title={ordre === 'asc' ? 'Croissant' : 'Décroissant'}
                    >
                        {ordre === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Badges des filtres actifs */}
                {hasActiveFilters && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
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
                        {districtFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                                District: {districts.find(d => d.id.toString() === districtFilter)?.nom_district}
                                <button
                                    onClick={() => onDistrictFilterChange('all')}
                                    className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {dateStart && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                                Du: {new Date(dateStart).toLocaleDateString('fr-FR')}
                                <button
                                    onClick={() => onDateStartChange('')}
                                    className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {dateEnd && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                                Au: {new Date(dateEnd).toLocaleDateString('fr-FR')}
                                <button
                                    onClick={() => onDateEndChange('')}
                                    className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
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
                        className="absolute top-full right-0 mt-2 w-full sm:w-96 bg-background border rounded-lg shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Filter className="h-4 w-4 text-blue-600" />
                                Filtres de recherche
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
                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            
                            {/* Statut */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Statut</Label>
                                <Select value={filtreStatut} onValueChange={(value) => onFiltreStatutChange(value as FiltreStatutDossierType)}>
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tous">Tous ({totalDossiers})</SelectItem>
                                        <SelectItem value="ouverts">Ouverts</SelectItem>
                                        <SelectItem value="fermes">Fermés</SelectItem>
                                        <SelectItem value="incomplets">Incomplets</SelectItem>
                                        <SelectItem value="avec_problemes">Avec problèmes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* District */}
                            {canShowAllDistricts && districts.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">District</Label>
                                    <Select value={districtFilter} onValueChange={onDistrictFilterChange}>
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue placeholder="District" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tous districts</SelectItem>
                                            {districts.map(d => (
                                                <SelectItem key={d.id} value={d.id.toString()}>
                                                    {d.nom_district}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Tri */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Trier par</Label>
                                <Select value={tri} onValueChange={(value) => onTriChange(value as TriDossierType)}>
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="date">Date</SelectItem>
                                        <SelectItem value="nom">Nom</SelectItem>
                                        <SelectItem value="commune">Commune</SelectItem>
                                        <SelectItem value="numero">Numéro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Période */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    Période
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="date-start" className="text-xs text-muted-foreground">
                                            Du
                                        </Label>
                                        <Input
                                            id="date-start"
                                            type="date"
                                            value={dateStart}
                                            onChange={(e) => onDateStartChange(e.target.value)}
                                            className="h-10"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="date-end" className="text-xs text-muted-foreground">
                                            Au
                                        </Label>
                                        <Input
                                            id="date-end"
                                            type="date"
                                            value={dateEnd}
                                            onChange={(e) => onDateEndChange(e.target.value)}
                                            min={dateStart || undefined}
                                            className="h-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t bg-muted/30 rounded-b-lg">
                            <div className="text-xs text-muted-foreground text-center">
                                {totalFiltres} résultat{totalFiltres > 1 ? 's' : ''} sur {totalDossiers}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}