// pages/admin/activity-logs/components/ActivityFilters.tsx - VERSION SERVEUR
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, X, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ActivityFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    userId: string;
    onUserIdChange: (value: string) => void;
    action: string;
    onActionChange: (value: string) => void;
    documentType: string;
    onDocumentTypeChange: (value: string) => void;
    dateFrom: string;
    onDateFromChange: (value: string) => void;
    dateTo: string;
    onDateToChange: (value: string) => void;
    
    users: Array<{ id: number; name: string; email: string }>;
    actions: Record<string, string>;
    documentTypes: Record<string, string>;
    
    totalLogs: number;
    filteredCount: number;
    
    onClearFilters: () => void;
    onApplyFilters: () => void; // ✅ NOUVEAU
}

export default function ActivityFilters({
    search,
    onSearchChange,
    userId,
    onUserIdChange,
    action,
    onActionChange,
    documentType,
    onDocumentTypeChange,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
    users,
    actions,
    documentTypes,
    totalLogs,
    filteredCount,
    onClearFilters,
    onApplyFilters,
}: ActivityFiltersProps) {
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!showFilters) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            
            if (buttonRef.current?.contains(target)) return;
            if (filterRef.current?.contains(target)) return;
            
            const isSelectPortal = (target as Element).closest('[role="listbox"]') || 
                                  (target as Element).closest('[data-radix-select-viewport]') ||
                                  (target as Element).closest('[data-radix-popper-content-wrapper]');
            
            if (isSelectPortal) return;
            
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
        userId !== 'all' || 
        action !== 'all' || 
        documentType !== 'all' || 
        dateFrom !== '' || 
        dateTo !== '' ||
        search !== '';
    
    const activeFiltersCount = [
        userId !== 'all',
        action !== 'all',
        documentType !== 'all',
        dateFrom !== '',
        dateTo !== ''
    ].filter(Boolean).length;

    // ✅ Appliquer les filtres avec Enter
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onApplyFilters();
        }
    };

    return (
        <div className="mb-4 space-y-3">
            <div className="relative">
                <div className="flex items-center gap-2">
                    {/* Barre de recherche */}
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Rechercher dans les logs..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="pl-9 pr-9 h-9 bg-white dark:bg-gray-950"
                        />
                        {search && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onSearchChange('')}
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
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-slate-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>

                    {/* ✅ Bouton Appliquer (visible si filtres modifiés) */}
                    {hasActiveFilters && (
                        <Button
                            onClick={onApplyFilters}
                            className="h-9 px-3 gap-2 flex-shrink-0"
                        >
                            <Search className="h-4 w-4" />
                            <span className="hidden sm:inline">Rechercher</span>
                        </Button>
                    )}
                </div>

                {/* Badges des filtres actifs */}
                {hasActiveFilters && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground">
                            Filtres actifs :
                        </span>
                        {userId !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 text-xs rounded-full">
                                User: {users.find(u => u.id.toString() === userId)?.name || userId}
                                <button
                                    onClick={() => {
                                        onUserIdChange('all');
                                        onApplyFilters();
                                    }}
                                    className="hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {action !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                                Action: {actions[action] || action}
                                <button
                                    onClick={() => {
                                        onActionChange('all');
                                        onApplyFilters();
                                    }}
                                    className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {documentType !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                Doc: {documentTypes[documentType] || documentType}
                                <button
                                    onClick={() => {
                                        onDocumentTypeChange('all');
                                        onApplyFilters();
                                    }}
                                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {(dateFrom || dateTo) && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                                Période
                                <button
                                    onClick={() => {
                                        onDateFromChange('');
                                        onDateToChange('');
                                        onApplyFilters();
                                    }}
                                    className="hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        <button
                            onClick={onClearFilters}
                            className="text-xs text-slate-600 dark:text-slate-400 hover:underline font-medium"
                        >
                            Tout effacer
                        </button>
                    </div>
                )}

                {/* Panel Filtres Popup */}
                {showFilters && (
                    <div 
                        ref={filterRef}
                        className="absolute top-full right-0 mt-2 w-96 bg-background border rounded-lg shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-600" />
                                Filtres avancés
                            </h4>
                            {hasActiveFilters && (
                                <button 
                                    onClick={onClearFilters} 
                                    className="text-sm text-slate-600 hover:underline font-medium"
                                >
                                    Réinitialiser
                                </button>
                            )}
                        </div>

                        {/* Body */}
                        <div className="p-4 space-y-4">
                            {/* Utilisateur */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Utilisateur</Label>
                                <Select value={userId} onValueChange={onUserIdChange}>
                                    <SelectTrigger className="w-full h-10 bg-white dark:bg-gray-950">
                                        <SelectValue />
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
                                <Label className="text-sm font-medium">Action</Label>
                                <Select value={action} onValueChange={onActionChange}>
                                    <SelectTrigger className="w-full h-10 bg-white dark:bg-gray-950">
                                        <SelectValue />
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
                                <Label className="text-sm font-medium">Type de document</Label>
                                <Select value={documentType} onValueChange={onDocumentTypeChange}>
                                    <SelectTrigger className="w-full h-10 bg-white dark:bg-gray-950">
                                        <SelectValue />
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

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-1">
                                        <CalendarIcon className="h-3.5 w-3.5" />
                                        Date début
                                    </Label>
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => onDateFromChange(e.target.value)}
                                        className="h-10 bg-white dark:bg-gray-950"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-1">
                                        <CalendarIcon className="h-3.5 w-3.5" />
                                        Date fin
                                    </Label>
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => onDateToChange(e.target.value)}
                                        className="h-10 bg-white dark:bg-gray-950"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer avec bouton Appliquer */}
                        <div className="px-4 py-3 border-t bg-muted/30 rounded-b-lg flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                                {filteredCount} résultat{filteredCount > 1 ? 's' : ''} sur {totalLogs}
                            </div>
                            <Button
                                onClick={() => {
                                    onApplyFilters();
                                    setShowFilters(false);
                                }}
                                size="sm"
                            >
                                Appliquer
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}