// pages/demandes/components/DemandeFilters.tsx - ✅ VERSION COMPACTE

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, SortAsc, SortDesc } from 'lucide-react';
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
    totalFiltres
}: DemandeFiltersProps) {
    
    const hasActiveFilters = filtreStatut !== 'tous' || recherche !== '';

    return (
        <div className="mb-4">
            {/* Ligne unique avec tous les contrôles */}
            <div className="flex items-center gap-2">
                {/* Barre de recherche - Flexible */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Rechercher par lot, nom ou CIN..."
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
                            Toutes ({totalDemandes})
                        </SelectItem>
                        <SelectItem value="actives">
                            Actives
                        </SelectItem>
                        <SelectItem value="archivees">
                            Archivées
                        </SelectItem>
                        <SelectItem value="incompletes">
                            Incomplètes
                        </SelectItem>
                    </SelectContent>
                </Select>

                {/* Tri */}
                <Select value={tri} onValueChange={onTriChange}>
                    <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="lot">Lot</SelectItem>
                        <SelectItem value="demandeur">Demandeur</SelectItem>
                        <SelectItem value="prix">Prix</SelectItem>
                        <SelectItem value="statut">Statut</SelectItem>
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

            {/* Résumé des résultats - Compact */}
            {hasActiveFilters && (
                <div className="text-xs text-muted-foreground mt-2 ml-1">
                    {totalFiltres} résultat{totalFiltres > 1 ? 's' : ''} sur {totalDemandes}
                </div>
            )}
        </div>
    );
}