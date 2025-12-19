import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, SortAsc, SortDesc, Filter } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';

type FiltreStatutDemandeType = 'tous' | 'actives' | 'archivees' | 'incompletes';
type TriDemandeType = 'date' | 'date_demande' | 'lot' | 'demandeur' | 'prix' | 'statut';

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
    
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const hasActiveFilters = filtreStatut !== 'tous' || recherche !== '';

    const getTriLabel = (triValue: TriDemandeType): string => {
        switch (triValue) {
            case 'date':
                return 'Date création';
            case 'date_demande':
                return 'Date demande';
            case 'lot':
                return 'Lot';
            case 'demandeur':
                return 'Demandeur';
            case 'prix':
                return 'Prix';
            case 'statut':
                return 'Statut';
            default:
                return 'Inconnu';
        }
    };

    return (
        <div className="mb-4">
            {/* Vue Desktop - Tous les filtres sur une ligne */}
            <div className="hidden lg:flex items-center gap-2">
                {/* Barre de recherche */}
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
                    <SelectTrigger className="w-[180px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date">📅 Date création</SelectItem>
                        <SelectItem value="date_demande">🗓️ Date demande</SelectItem>
                        <SelectItem value="lot">🏠 Lot</SelectItem>
                        <SelectItem value="demandeur">👤 Demandeur</SelectItem>
                        <SelectItem value="prix">💰 Prix</SelectItem>
                        <SelectItem value="statut">🔖 Statut</SelectItem>
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
                        Réinitialiser
                    </Button>
                )}
            </div>

            {/* Vue Mobile - Recherche + Bouton Filtres */}
            <div className="lg:hidden space-y-3">
                {/* Barre de recherche mobile */}
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

                {/* Bouton Filtres Mobile */}
                <div className="flex items-center gap-2">
                    <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="flex-1 h-10 relative">
                                <Filter className="h-4 w-4 mr-2" />
                                Filtres et tri
                                {hasActiveFilters && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                                        !
                                    </span>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[80vh]">
                            <SheetHeader>
                                <SheetTitle>Filtres et tri</SheetTitle>
                                <SheetDescription>
                                    Personnalisez l'affichage de vos demandes
                                </SheetDescription>
                            </SheetHeader>
                            
                            <div className="mt-6 space-y-6">
                                {/* Statut */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Statut</label>
                                    <Select value={filtreStatut} onValueChange={onFiltreStatutChange}>
                                        <SelectTrigger className="w-full">
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
                                </div>

                                {/* Tri */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Trier par</label>
                                    <Select value={tri} onValueChange={onTriChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="date">📅 Date création</SelectItem>
                                            <SelectItem value="date_demande">🗓️ Date demande</SelectItem>
                                            <SelectItem value="lot">🏠 Lot</SelectItem>
                                            <SelectItem value="demandeur">👤 Demandeur</SelectItem>
                                            <SelectItem value="prix">💰 Prix</SelectItem>
                                            <SelectItem value="statut">🔖 Statut</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Ordre */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ordre</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant={ordre === 'asc' ? 'default' : 'outline'}
                                            onClick={() => ordre !== 'asc' && onOrdreToggle()}
                                            className="w-full"
                                        >
                                            <SortAsc className="h-4 w-4 mr-2" />
                                            Croissant
                                        </Button>
                                        <Button
                                            variant={ordre === 'desc' ? 'default' : 'outline'}
                                            onClick={() => ordre !== 'desc' && onOrdreToggle()}
                                            className="w-full"
                                        >
                                            <SortDesc className="h-4 w-4 mr-2" />
                                            Décroissant
                                        </Button>
                                    </div>
                                </div>

                                {/* Boutons d'action */}
                                <div className="space-y-2 pt-4 border-t">
                                    {hasActiveFilters && (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                onFiltreStatutChange('tous');
                                                onRechercheChange('');
                                            }}
                                            className="w-full"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Réinitialiser les filtres
                                        </Button>
                                    )}
                                    
                                    <Button 
                                        onClick={() => setMobileFilterOpen(false)}
                                        className="w-full"
                                    >
                                        Appliquer
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Badge nombre de résultats */}
                    <div className="px-3 py-2 border rounded-lg text-sm font-medium whitespace-nowrap">
                        {totalFiltres} / {totalDemandes}
                    </div>
                </div>
            </div>

            {/* Résumé des filtres actifs (Desktop) */}
            {hasActiveFilters && (
                <div className="hidden lg:block text-xs text-muted-foreground mt-2 ml-1">
                    {totalFiltres} résultat{totalFiltres > 1 ? 's' : ''} sur {totalDemandes}
                </div>
            )}

            {/* Indicateur du tri actif */}
            <div className="flex items-center gap-2 mt-2 ml-1">
                <span className="text-xs text-muted-foreground">
                    Tri : <strong>{getTriLabel(tri)}</strong> ({ordre === 'asc' ? 'croissant' : 'décroissant'})
                </span>
            </div>
        </div>
    );
}