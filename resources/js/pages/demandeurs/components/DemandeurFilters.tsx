// pages/demandeurs/components/DemandeurFilters.tsx

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, SortAsc, SortDesc } from 'lucide-react';
import type { FiltreStatutType, TriType } from '../types';

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
    
    const hasActiveFilters = filtreStatut !== 'tous' || recherche !== '';

    return (
        <div className="space-y-4 mb-6">
            {/* Barre de recherche */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Rechercher par nom, prénom, CIN ou domiciliation..."
                    value={recherche}
                    onChange={(e) => onRechercheChange(e.target.value)}
                    className="pl-10 pr-10"
                />
                {recherche && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRechercheChange('')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Filtres et tri */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Filtre statut */}
                <div className="flex-1 min-w-[200px]">
                    <Select value={filtreStatut} onValueChange={onFiltreStatutChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tous">
                                Tous les demandeurs ({totalDemandeurs})
                            </SelectItem>
                            <SelectItem value="actives">
                                Avec propriétés actives
                            </SelectItem>
                            <SelectItem value="acquises">
                                Avec propriétés acquises
                            </SelectItem>
                            <SelectItem value="sans">
                                Sans propriété
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Tri */}
                <div className="flex-1 min-w-[200px]">
                    <Select value={tri} onValueChange={onTriChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Trier par" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date">Date de création</SelectItem>
                            <SelectItem value="nom">Nom alphabétique</SelectItem>
                            <SelectItem value="proprietes">Nombre de propriétés</SelectItem>
                            <SelectItem value="statut">Statut (incomplets d'abord)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Bouton ordre */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onOrdreToggle}
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
                        onClick={() => {
                            onFiltreStatutChange('tous');
                            onRechercheChange('');
                        }}
                        className="text-muted-foreground"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Réinitialiser
                    </Button>
                )}
            </div>

            {/* Résumé des résultats */}
            {hasActiveFilters && (
                <div className="text-sm text-muted-foreground">
                    {totalFiltres} résultat{totalFiltres > 1 ? 's' : ''} trouvé{totalFiltres > 1 ? 's' : ''} sur {totalDemandeurs}
                </div>
            )}
        </div>
    );
}