// resources/js/pages/dossiers/components/DossierFilters.tsx - ✅ VERSION AVEC FILTRAGE PAR DATES
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Search, X, SortAsc, SortDesc, Calendar } from 'lucide-react';
import type { District } from '@/types';

export type FiltreStatutDossierType = 'tous' | 'ouverts' | 'fermes' | 'incomplets' | 'avec_problemes';
export type TriDossierType = 'date' | 'nom' | 'commune' | 'numero';

interface DossierFiltersProps {
    // Filtres
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
    
    // Tri
    tri: TriDossierType;
    onTriChange: (tri: TriDossierType) => void;
    ordre: 'asc' | 'desc';
    onOrdreToggle: () => void;
    
    // Données
    districts: District[];
    totalDossiers: number;
    totalFiltres: number;
    
    // Permissions
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
            {/* Ligne principale des filtres */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Barre de recherche - Flexible */}
                <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Rechercher par nom, commune, numéro..."
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

                {/* Filtre statut */}
                <Select value={filtreStatut} onValueChange={onFiltreStatutChange}>
                    <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="tous">
                            Tous ({totalDossiers})
                        </SelectItem>
                        <SelectItem value="ouverts">
                            Ouverts
                        </SelectItem>
                        <SelectItem value="fermes">
                            Fermés
                        </SelectItem>
                        <SelectItem value="incomplets">
                            Incomplets
                        </SelectItem>
                        <SelectItem value="avec_problemes">
                            Avec problèmes
                        </SelectItem>
                    </SelectContent>
                </Select>

                {/* District (si autorisé) */}
                {canShowAllDistricts && districts.length > 0 && (
                    <Select value={districtFilter} onValueChange={onDistrictFilterChange}>
                        <SelectTrigger className="w-[140px] h-9">
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
                    <SelectTrigger className="w-[130px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="nom">Nom</SelectItem>
                        <SelectItem value="commune">Commune</SelectItem>
                        <SelectItem value="numero">Numéro</SelectItem>
                    </SelectContent>
                </Select>

                {/* Bouton ordre */}
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

                {/* Reset filtres */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetAllFilters}
                        className="h-9 px-3 flex-shrink-0"
                    >
                        <X className="h-4 w-4 mr-1" />
                        <span className="hidden lg:inline">Réinitialiser</span>
                    </Button>
                )}
            </div>

            {/* Ligne secondaire : Filtres de dates */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 p-3 rounded-lg border">
                <div className="flex items-center gap-2 shrink-0">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-muted-foreground">Période d'ouverture :</span>
                </div>
                
                <div className="flex items-center gap-3 flex-1">
                    
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

                    {/* <span className="text-muted-foreground mt-5">au</span> */}

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

                    {/* Bouton reset dates */}
                    {(dateStart || dateEnd) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                onDateStartChange('');
                                onDateEndChange('');
                            }}
                            className="h-9 w-9 mt-5"
                            title="Réinitialiser les dates"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Badge des filtres actifs */}
                {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-auto text-xs shrink-0">
                        {totalFiltres} résultat{totalFiltres > 1 ? 's' : ''} / {totalDossiers}
                    </Badge>
                )}
            </div>
        </div>
    );
}