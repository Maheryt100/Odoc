// users/components/FiltersCard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X, Search, Loader2 } from 'lucide-react';
import { District, UserFilters, UserRole } from '../types';

interface FiltersCardProps {
    search: string;
    setSearch: (value: string) => void;
    selectedRole: string;
    setSelectedRole: (value: string) => void;
    selectedDistrict: string;
    setSelectedDistrict: (value: string) => void;
    selectedStatus: string;
    setSelectedStatus: (value: string) => void;
    districts: District[];
    roles: Record<UserRole, string>;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
    isSearching: boolean;
}

export const FiltersCard = ({
    search,
    setSearch,
    selectedRole,
    setSelectedRole,
    selectedDistrict,
    setSelectedDistrict,
    selectedStatus,
    setSelectedStatus,
    districts,
    roles,
    hasActiveFilters,
    onClearFilters,
    isSearching,
}: FiltersCardProps) => {
    return (
        <Card className="border-0 shadow-lg">
            <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-b">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Filter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Filtres de recherche</CardTitle>
                                <CardDescription className="mt-1">
                                    Recherche automatique pendant la saisie
                                </CardDescription>
                            </div>
                        </div>
                        {isSearching && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="hidden sm:inline">Recherche...</span>
                            </div>
                        )}
                    </div>
                </CardHeader>
            </div>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Recherche */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                Recherche
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Nom ou email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-11 border-2 focus:border-purple-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Rôle */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rôle</label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger className="h-11 border-2">
                                    <SelectValue placeholder="Tous les rôles" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(roles).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* District */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">District</label>
                            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                                <SelectTrigger className="h-11 border-2">
                                    <SelectValue placeholder="Tous les districts" />
                                </SelectTrigger>
                                <SelectContent>
                                    {districts.map((district) => (
                                        <SelectItem key={district.id} value={district.id.toString()}>
                                            {district.nom_district} ({district.region.nom_region})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Statut */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Statut</label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="h-11 border-2">
                                    <SelectValue placeholder="Tous les statuts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Actif</SelectItem>
                                    <SelectItem value="inactive">Inactif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Bouton réinitialiser */}
                    {hasActiveFilters && (
                        <div className="flex justify-end pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClearFilters}
                                size="sm"
                                className="gap-2"
                            >
                                <X className="h-4 w-4" />
                                Réinitialiser les filtres
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};