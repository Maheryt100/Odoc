// DossierFilters.tsx - ✅ VERSION RESPONSIVE AMÉLIORÉE
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Search, X, SortAsc, SortDesc, Calendar, Filter } from 'lucide-react';
import { useState } from 'react';
import type { District } from '@/types';

export type FiltreStatutDossierType = 'tous' | 'ouverts' | 'fermes' | 'incomplets' | 'avec_problemes';
export type TriDossierType = 'date' | 'nom' | 'commune' | 'numero';

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
    
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const hasActiveFilters = 
        filtreStatut !== 'tous' || 
        recherche !== '' || 
        districtFilter !== 'all' || 
        dateStart !== '' || 
        dateEnd !== '';

    const resetAllFilters = () => {
        onFiltreStatutChange('tous');
        onRechercheChange('');
        onDistrictFilterChange('all');
        onDateStartChange('');
        onDateEndChange('');
    };

    return (
        <div className="space-y-4">
            {/* ✅ Ligne principale - Responsive */}
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

                {/* Filtres principaux - Wrappable */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    {/* Statut */}
                    <Select value={filtreStatut} onValueChange={onFiltreStatutChange}>
                        <SelectTrigger className="w-full sm:w-[140px] h-10">
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

                    {/* District */}
                    {canShowAllDistricts && districts.length > 0 && (
                        <Select value={districtFilter} onValueChange={onDistrictFilterChange}>
                            <SelectTrigger className="w-full sm:w-[130px] h-10">
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
                    )}

                    {/* Tri */}
                    <Select value={tri} onValueChange={onTriChange}>
                        <SelectTrigger className="w-full sm:w-[120px] h-10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="nom">Nom</SelectItem>
                            <SelectItem value="commune">Commune</SelectItem>
                            <SelectItem value="numero">Numéro</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Ordre */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onOrdreToggle}
                        className="h-10 w-10"
                        title={ordre === 'asc' ? 'Croissant' : 'Décroissant'}
                    >
                        {ordre === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>

                    {/* Filtres avancés toggle (mobile) */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="h-10 w-10 sm:hidden"
                        title="Filtres de dates"
                    >
                        <Calendar className="h-4 w-4" />
                    </Button>

                    {/* Reset */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetAllFilters}
                            className="h-10 px-3"
                        >
                            <X className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Réinitialiser</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* ✅ Filtres de dates - Collapsible sur mobile */}
            <div className={`${showAdvancedFilters || window.innerWidth >= 640 ? 'block' : 'hidden'} sm:block`}>
                <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 p-3 rounded-lg border">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2 shrink-0">
                            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-muted-foreground">
                                Période :
                            </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                            {/* Date début */}
                            <div className="flex-1 min-w-0">
                                <Label htmlFor="date-start" className="text-xs text-muted-foreground mb-1 block">
                                    Du
                                </Label>
                                <Input
                                    id="date-start"
                                    type="date"
                                    value={dateStart}
                                    onChange={(e) => onDateStartChange(e.target.value)}
                                    className="h-9"
                                />
                            </div>

                            {/* Date fin */}
                            <div className="flex-1 min-w-0">
                                <Label htmlFor="date-end" className="text-xs text-muted-foreground mb-1 block">
                                    Au
                                </Label>
                                <Input
                                    id="date-end"
                                    type="date"
                                    value={dateEnd}
                                    onChange={(e) => onDateEndChange(e.target.value)}
                                    min={dateStart || undefined}
                                    className="h-9"
                                />
                            </div>

                            {/* Reset dates */}
                            {(dateStart || dateEnd) && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        onDateStartChange('');
                                        onDateEndChange('');
                                    }}
                                    className="h-9 w-9 mt-0 sm:mt-5 shrink-0"
                                    title="Réinitialiser les dates"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Badge résultats */}
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="text-xs shrink-0 self-start sm:self-center sm:mt-5">
                                {totalFiltres} / {totalDossiers}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}