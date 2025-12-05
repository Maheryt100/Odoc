// admin/activity-logs/components/FiltersCard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X, Search, Loader2, Calendar as CalendarIcon } from 'lucide-react';

interface FiltersCardProps {
    search: string;
    setSearch: (value: string) => void;
    selectedUser: string;
    setSelectedUser: (value: string) => void;
    selectedAction: string;
    setSelectedAction: (value: string) => void;
    selectedDocType: string;
    setSelectedDocType: (value: string) => void;
    dateFrom: string;
    setDateFrom: (value: string) => void;
    dateTo: string;
    setDateTo: (value: string) => void;
    users: Array<{ id: number; name: string; email: string }>;
    actions: Record<string, string>;
    documentTypes: Record<string, string>;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
    onFilter: () => void;
    isSearching?: boolean;
}

export const FiltersCard = ({
    search,
    setSearch,
    selectedUser,
    setSelectedUser,
    selectedAction,
    setSelectedAction,
    selectedDocType,
    setSelectedDocType,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    users,
    actions,
    documentTypes,
    hasActiveFilters,
    onClearFilters,
    onFilter,
    isSearching = false,
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
                                    Filtrer les logs par différents critères
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
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* Recherche */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                Recherche
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onFilter()}
                                    className="pl-9 h-11 border-2 focus:border-purple-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Utilisateur */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Utilisateur</label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger className="h-11 border-2">
                                    <SelectValue placeholder="Tous les utilisateurs" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les utilisateurs</SelectItem>
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id.toString()}>
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Action</label>
                            <Select value={selectedAction} onValueChange={setSelectedAction}>
                                <SelectTrigger className="h-11 border-2">
                                    <SelectValue placeholder="Toutes les actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes les actions</SelectItem>
                                    {Object.entries(actions).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Type de document */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type de document</label>
                            <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                                <SelectTrigger className="h-11 border-2">
                                    <SelectValue placeholder="Tous les types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les types</SelectItem>
                                    {Object.entries(documentTypes).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date début */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                Date début
                            </label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="h-11 border-2"
                            />
                        </div>

                        {/* Date fin */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                Date fin
                            </label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="h-11 border-2"
                            />
                        </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex justify-end gap-2 pt-2">
                        {hasActiveFilters && (
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
                        )}
                        <Button onClick={onFilter} size="sm" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Filtrer
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};