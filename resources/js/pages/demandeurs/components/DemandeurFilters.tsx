// pages/demandeurs/components/DemandeurFilters.tsx - ✅ VERSION CORRIGÉE

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label'; // ✅ CORRECTION: import correct
import { Search, X, SortAsc, SortDesc, SlidersHorizontal } from 'lucide-react';
import type { FiltreStatutType, TriType } from '../types';
import { useIsMobile } from '@/hooks/useResponsive';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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
    
    const isMobile = useIsMobile();
    const hasActiveFilters = filtreStatut !== 'tous' || recherche !== '';
    const activeCount = (filtreStatut !== 'tous' ? 1 : 0) + (recherche ? 1 : 0);

    // 📱 VERSION MOBILE
    if (isMobile) {
        return (
            <div className="mb-4 space-y-3">
                <div className="relative">
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
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full gap-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            Filtres & Tri
                            {activeCount > 0 && (
                                <span className="ml-auto px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                                    {activeCount}
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px]">
                        <SheetHeader>
                            <SheetTitle>Filtres & Tri</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-4">
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Statut</Label>
                                <Select value={filtreStatut} onValueChange={onFiltreStatutChange}>
                                    <SelectTrigger className="w-full">
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

                            <div>
                                <Label className="text-sm font-medium mb-2 block">Trier par</Label>
                                <Select value={tri} onValueChange={onTriChange}>
                                    <SelectTrigger className="w-full">
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

                            <div>
                                <Label className="text-sm font-medium mb-2 block">Ordre</Label>
                                <Button
                                    variant="outline"
                                    onClick={onOrdreToggle}
                                    className="w-full gap-2"
                                >
                                    {ordre === 'asc' ? (
                                        <><SortAsc className="h-4 w-4" />Croissant</>
                                    ) : (
                                        <><SortDesc className="h-4 w-4" />Décroissant</>
                                    )}
                                </Button>
                            </div>

                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        onFiltreStatutChange('tous');
                                        onRechercheChange('');
                                    }}
                                    className="w-full gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Réinitialiser
                                </Button>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>

                {hasActiveFilters && (
                    <div className="text-xs text-muted-foreground text-center">
                        {totalFiltres} résultat{totalFiltres > 1 ? 's' : ''} sur {totalDemandeurs}
                    </div>
                )}
            </div>
        );
    }

    // 💻 VERSION DESKTOP
    return (
        <div className="mb-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
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

                <Select value={filtreStatut} onValueChange={onFiltreStatutChange}>
                    <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="tous">
                            Tous ({totalDemandeurs})
                        </SelectItem>
                        <SelectItem value="actives">
                            Avec propriétés
                        </SelectItem>
                        <SelectItem value="acquises">
                            Acquises
                        </SelectItem>
                        <SelectItem value="sans">
                            Sans propriété
                        </SelectItem>
                    </SelectContent>
                </Select>

                <Select value={tri} onValueChange={onTriChange}>
                    <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="nom">Nom</SelectItem>
                        <SelectItem value="proprietes">Propriétés</SelectItem>
                        <SelectItem value="statut">Statut</SelectItem>
                    </SelectContent>
                </Select>

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

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            onFiltreStatutChange('tous');
                            onRechercheChange('');
                        }}
                        className="h-9 px-3 flex-shrink-0"
                    >
                        <X className="h-4 w-4 mr-1" />
                        <span className="hidden lg:inline">Réinitialiser</span>
                    </Button>
                )}
            </div>

            {hasActiveFilters && (
                <div className="text-xs text-muted-foreground mt-2 ml-1">
                    {totalFiltres} résultat{totalFiltres > 1 ? 's' : ''} sur {totalDemandeurs}
                </div>
            )}
        </div>
    );
}