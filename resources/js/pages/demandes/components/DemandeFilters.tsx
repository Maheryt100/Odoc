// pages/demandes/components/DemandeFilters.tsx - ✅ VERSION RESPONSIVE

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpDown, Filter } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/useResponsive';
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
    const isMobile = useIsMobile();

    const filterOptions = [
        { value: 'tous', label: 'Toutes', count: totalDemandes },
        { value: 'actives', label: 'Actives', count: null },
        { value: 'archivees', label: 'Archivées', count: null },
        { value: 'incompletes', label: 'Incomplètes', count: null },
    ] as const;

    const sortOptions = [
        { value: 'date', label: 'Date' },
        { value: 'lot', label: 'N° Lot' },
        { value: 'demandeur', label: 'Demandeur' },
        { value: 'prix', label: 'Prix' },
    ] as const;

    // Version Mobile avec Sheet
    if (isMobile) {
        return (
            <div className="space-y-3 mb-4">
                {/* Recherche */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher..."
                        value={recherche}
                        onChange={(e) => onRechercheChange(e.target.value)}
                        className="pl-9 h-10"
                    />
                </div>

                {/* Boutons Filtres et Tri */}
                <div className="flex gap-2">
                    {/* Sheet Filtres */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="flex-1">
                                <Filter className="h-4 w-4 mr-2" />
                                Filtres
                                {filtreStatut !== 'tous' && (
                                    <Badge variant="secondary" className="ml-2">
                                        1
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[80vh]">
                            <SheetHeader>
                                <SheetTitle>Filtrer les demandes</SheetTitle>
                                <SheetDescription>
                                    {totalFiltres} sur {totalDemandes} demandes
                                </SheetDescription>
                            </SheetHeader>
                            <div className="space-y-3 mt-6">
                                {filterOptions.map((option) => (
                                    <Button
                                        key={option.value}
                                        variant={filtreStatut === option.value ? 'default' : 'outline'}
                                        className="w-full justify-start"
                                        onClick={() => onFiltreStatutChange(option.value as FiltreStatutDemandeType)}
                                    >
                                        {option.label}
                                        {option.count !== null && (
                                            <Badge variant="secondary" className="ml-auto">
                                                {option.count}
                                            </Badge>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Sheet Tri */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="flex-1">
                                <ArrowUpDown className="h-4 w-4 mr-2" />
                                Trier
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[60vh]">
                            <SheetHeader>
                                <SheetTitle>Trier par</SheetTitle>
                            </SheetHeader>
                            <div className="space-y-3 mt-6">
                                {sortOptions.map((option) => (
                                    <Button
                                        key={option.value}
                                        variant={tri === option.value ? 'default' : 'outline'}
                                        className="w-full justify-start"
                                        onClick={() => onTriChange(option.value as TriDemandeType)}
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={onOrdreToggle}
                                >
                                    <ArrowUpDown className="h-4 w-4 mr-2" />
                                    {ordre === 'asc' ? 'Croissant' : 'Décroissant'}
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Badge résultat */}
                {(recherche || filtreStatut !== 'tous') && (
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            {totalFiltres} résultat{totalFiltres > 1 ? 's' : ''}
                        </Badge>
                        {recherche && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRechercheChange('')}
                                className="h-6 text-xs"
                            >
                                Effacer recherche
                            </Button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Version Desktop
    return (
        <div className="space-y-4 mb-4">
            {/* Ligne 1 : Filtres rapides */}
            <div className="flex flex-wrap items-center gap-2">
                {filterOptions.map((option) => (
                    <Button
                        key={option.value}
                        variant={filtreStatut === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onFiltreStatutChange(option.value as FiltreStatutDemandeType)}
                        className="h-8"
                    >
                        {option.label}
                        {option.count !== null && (
                            <Badge 
                                variant={filtreStatut === option.value ? 'secondary' : 'outline'} 
                                className="ml-2"
                            >
                                {option.count}
                            </Badge>
                        )}
                    </Button>
                ))}
                
                {totalFiltres !== totalDemandes && (
                    <Badge variant="secondary" className="ml-2">
                        {totalFiltres} / {totalDemandes}
                    </Badge>
                )}
            </div>

            {/* Ligne 2 : Recherche et Tri */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Recherche */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par lot, demandeur, CIN..."
                        value={recherche}
                        onChange={(e) => onRechercheChange(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Tri */}
                <div className="flex gap-2 shrink-0">
                    <Select value={tri} onValueChange={(value) => onTriChange(value as TriDemandeType)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Trier par" />
                        </SelectTrigger>
                        <SelectContent>
                            {sortOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onOrdreToggle}
                        title={ordre === 'asc' ? 'Croissant' : 'Décroissant'}
                    >
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}