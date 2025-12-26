// pages/users/components/UserFilters.tsx - VERSION CORRIGÉE
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, X, Filter } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { District, UserRole } from '../types';

interface UserFiltersProps {
    // Valeurs des filtres
    recherche: string;
    onRechercheChange: (value: string) => void;
    filtreRole: string;
    onFiltreRoleChange: (value: string) => void;
    filtreDistrict: string;
    onFiltreDistrictChange: (value: string) => void;
    filtreStatut: string;
    onFiltreStatutChange: (value: string) => void;
    
    // Données
    districts: District[];
    roles: Record<UserRole, string>;
    
    // Stats
    totalUtilisateurs: number;
    totalFiltres: number;
    
    // Actions
    onResetFilters: () => void;
}

export default function UserFilters({
    recherche,
    onRechercheChange,
    filtreRole,
    onFiltreRoleChange,
    filtreDistrict,
    onFiltreDistrictChange,
    filtreStatut,
    onFiltreStatutChange,
    districts,
    roles,
    totalUtilisateurs,
    totalFiltres,
    onResetFilters,
}: UserFiltersProps) {
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // ✅ Détection clics outside
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
            
            // Ignorer clics dans les portals des Select
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
        filtreRole !== '' || 
        filtreDistrict !== '' || 
        filtreStatut !== '' ||
        recherche !== '';

    const activeFiltersCount = [
        filtreRole !== '',
        filtreDistrict !== '',
        filtreStatut !== ''
    ].filter(Boolean).length;

    const getRoleLabel = (roleKey: string) => {
        return roles[roleKey as UserRole] || roleKey;
    };

    const getDistrictLabel = (districtId: string) => {
        const district = districts.find(d => d.id.toString() === districtId);
        return district?.nom_district || districtId;
    };

    const getStatutLabel = (statut: string) => {
        const labels = {
            active: 'Actifs',
            inactive: 'Inactifs'
        };
        return labels[statut as keyof typeof labels];
    };

    return (
        <div className="mb-4 space-y-3">
            {/* Ligne principale */}
            <div className="relative">
                <div className="flex items-center gap-2">
                    {/* Barre de recherche - ✅ FOND BLANC AJOUTÉ */}
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Rechercher par nom, email..."
                            value={recherche}
                            onChange={(e) => onRechercheChange(e.target.value)}
                            className="pl-9 pr-9 h-9 bg-white dark:bg-gray-950"
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
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Badges des filtres actifs */}
                {hasActiveFilters && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground">
                            Filtres actifs :
                        </span>
                        {filtreRole && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs rounded-full">
                                Rôle: {getRoleLabel(filtreRole)}
                                <button
                                    onClick={() => onFiltreRoleChange('')}
                                    className="hover:bg-rose-200 dark:hover:bg-rose-800 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {filtreDistrict && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                                District: {getDistrictLabel(filtreDistrict)}
                                <button
                                    onClick={() => onFiltreDistrictChange('')}
                                    className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {filtreStatut && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                                {getStatutLabel(filtreStatut)}
                                <button
                                    onClick={() => onFiltreStatutChange('')}
                                    className="hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        <button
                            onClick={onResetFilters}
                            className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
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
                                <Filter className="h-4 w-4 text-rose-600" />
                                Filtres
                            </h4>
                            {hasActiveFilters && (
                                <button 
                                    onClick={onResetFilters} 
                                    className="text-sm text-rose-600 hover:underline font-medium"
                                >
                                    Réinitialiser
                                </button>
                            )}
                        </div>

                        {/* Body */}
                        <div className="p-4 space-y-4">
                            {/* Rôle - ✅ FIX: Utiliser "tous" au lieu de "" */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Rôle</Label>
                                <Select 
                                    value={filtreRole || "tous"} 
                                    onValueChange={(val) => onFiltreRoleChange(val === "tous" ? "" : val)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue placeholder="Tous les rôles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tous">Tous les rôles</SelectItem>
                                        {Object.entries(roles).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* District - ✅ FIX: Utiliser "tous" au lieu de "" */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">District</Label>
                                <Select 
                                    value={filtreDistrict || "tous"} 
                                    onValueChange={(val) => onFiltreDistrictChange(val === "tous" ? "" : val)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue placeholder="Tous les districts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tous">Tous les districts</SelectItem>
                                        {districts.map((district) => (
                                            <SelectItem key={district.id} value={district.id.toString()}>
                                                {district.nom_district}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Statut - ✅ FIX: Utiliser "tous" au lieu de "" */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Statut</Label>
                                <Select 
                                    value={filtreStatut || "tous"} 
                                    onValueChange={(val) => onFiltreStatutChange(val === "tous" ? "" : val)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue placeholder="Tous" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tous">Tous</SelectItem>
                                        <SelectItem value="active">Actifs</SelectItem>
                                        <SelectItem value="inactive">Inactifs</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t bg-muted/30 rounded-b-lg">
                            <div className="text-xs text-muted-foreground text-center">
                                {totalFiltres} résultat{totalFiltres > 1 ? 's' : ''} sur {totalUtilisateurs}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}