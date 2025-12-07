// pages/proprietes/components/ProprieteFilters.tsx

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, SortAsc, SortDesc } from 'lucide-react';

export type FiltreStatutProprieteType = 'tous' | 'actives' | 'acquises' | 'sans_demandeur';
export type TriProprieteType = 'date' | 'lot' | 'contenance' | 'statut';

interface ProprieteFiltersProps {
    filtreStatut: FiltreStatutProprieteType;
    onFiltreStatutChange: (filtre: FiltreStatutProprieteType) => void;
    recherche: string;
    onRechercheChange: (recherche: string) => void;
    tri: TriProprieteType;
    onTriChange: (tri: TriProprieteType) => void;
    ordre: 'asc' | 'desc';
    onOrdreToggle: () => void;
    totalProprietes: number;
    totalFiltres: number;
}

export default function ProprieteFilters({
    filtreStatut,
    onFiltreStatutChange,
    recherche,
    onRechercheChange,
    tri,
    onTriChange,
    ordre,
    onOrdreToggle,
    totalProprietes,
    totalFiltres
}: ProprieteFiltersProps) {
    
    const hasActiveFilters = filtreStatut !== 'tous' || recherche !== '';

    return (
        <div className="space-y-4 mb-6">
            {/* Barre de recherche */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Rechercher par lot, titre, nature, propriétaire ou situation..."
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
                                Toutes les propriétés ({totalProprietes})
                            </SelectItem>
                            <SelectItem value="actives">
                                Avec demandeurs actifs
                            </SelectItem>
                            <SelectItem value="acquises">
                                Acquises (archivées)
                            </SelectItem>
                            <SelectItem value="sans_demandeur">
                                Sans demandeur
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
                            <SelectItem value="lot">Numéro de lot</SelectItem>
                            <SelectItem value="contenance">Contenance</SelectItem>
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
                    {totalFiltres} résultat{totalFiltres > 1 ? 's' : ''} trouvé{totalFiltres > 1 ? 's' : ''} sur {totalProprietes}
                </div>
            )}
        </div>
    );
}