// dossiers/components/AdvancedSearchBar.tsx
import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Search, X, Filter, Download, MapPin, FileText, Loader2, ChevronDown } from 'lucide-react';

interface SearchFilters {
    province_id?: string;
    region_id?: string;
    district_id?: string;
    statut?: 'tous' | 'ouverts' | 'fermes';
    date_debut?: string;
    date_fin?: string;
}

interface SearchResult {
    id: number;
    nom_dossier: string;
    numero_ouverture: number;
    commune: string;
    district: { id: number; nom: string };
    region?: { id: number; nom: string };
    province?: { id: number; nom: string };
    demandeurs_count: number;
    proprietes_count: number;
    is_closed: boolean;
    match_context: string[];
}

interface AvailableFilters {
    statuts: Array<{ value: string; label: string }>;
    provinces?: Array<{ value: number; label: string }>;
    regions?: Array<{ value: number; label: string; province_id: number }>;
    districts?: Array<{ value: number; label: string; region_id: number }>;
}

interface Props {
    canExport?: boolean;
    canAccessAllDistricts?: boolean;
    initialPageSize?: number;
}

export default function AdvancedSearchBar({
    canExport = false,
    canAccessAllDistricts = false,
    initialPageSize = 50,
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [totalResults, setTotalResults] = useState<number | null>(null);
    const [loadedCount, setLoadedCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [pageSize] = useState(initialPageSize);
    
    const [filters, setFilters] = useState<SearchFilters>({
        statut: 'tous',
    });
    
    const [availableFilters, setAvailableFilters] = useState<AvailableFilters>({
        statuts: [
            { value: 'tous', label: 'Tous' },
            { value: 'ouverts', label: 'Ouverts' },
            { value: 'fermes', label: 'Fermés' },
        ],
    });
    
    const searchRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchAvailableFilters();
    }, []);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (searchQuery.length >= 2) {
            timeoutRef.current = setTimeout(() => {
                performSearch(true); // true = reset results
            }, 300);
        } else {
            resetSearch();
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [searchQuery, filters]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
                setShowFilters(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const resetSearch = () => {
        setResults([]);
        setTotalResults(null);
        setLoadedCount(0);
        setHasMore(false);
        setNextCursor(null);
        setShowResults(false);
    };

    const fetchAvailableFilters = async () => {
        try {
            const response = await fetch('/search?q=init');
            const data = await response.json();
            setAvailableFilters(data.filters_available);
        } catch (error) {
            console.error('Erreur chargement filtres:', error);
        }
    };

    const performSearch = async (reset: boolean = false) => {
        if (reset) {
            setIsSearching(true);
            setResults([]);
            setNextCursor(null);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const params = new URLSearchParams({
                q: searchQuery,
                per_page: pageSize.toString(),
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
                ),
            });

            if (!reset && nextCursor) {
                params.append('cursor', nextCursor);
            }

            const response = await fetch(`/search?${params.toString()}`);
            const data = await response.json();

            if (reset) {
                setResults(data.dossiers);
                setTotalResults(data.total);
                setLoadedCount(data.loaded);
            } else {
                setResults(prev => [...prev, ...data.dossiers]);
                setLoadedCount(prev => prev + data.loaded);
            }

            setHasMore(data.has_more);
            setNextCursor(data.next_cursor);
            setStats(data.stats);
            setShowResults(true);
        } catch (error) {
            console.error('Erreur recherche:', error);
        } finally {
            setIsSearching(false);
            setIsLoadingMore(false);
        }
    };

    const loadMore = () => {
        if (!isLoadingMore && hasMore) {
            performSearch(false);
        }
    };

    const handleExport = () => {
        if (!canExport) return;

        const params = new URLSearchParams({
            q: searchQuery,
            ...Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
            ),
        });

        window.location.href = `/search/export?${params.toString()}`;
    };

    const handleResultClick = (dossierId: number) => {
        router.visit(`/dossiers/${dossierId}`);
        setShowResults(false);
    };

    const clearFilters = () => {
        setFilters({ statut: 'tous' });
    };

    const hasActiveFilters = filters.province_id || filters.region_id || 
        filters.district_id || filters.statut !== 'tous' || 
        filters.date_debut || filters.date_fin;

    const filteredRegions = availableFilters.regions?.filter(
        r => !filters.province_id || r.province_id === Number(filters.province_id)
    );

    const filteredDistricts = availableFilters.districts?.filter(
        d => !filters.region_id || d.region_id === Number(filters.region_id)
    );

    return (
        <div ref={searchRef} className="relative w-full max-w-3xl">
            {/* Barre de recherche */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, CIN, titre, propriété..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                        </div>
                    )}
                    {searchQuery && !isSearching && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center hover:bg-gray-100 rounded"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="relative h-11 w-11 flex items-center justify-center border rounded-lg hover:bg-gray-50"
                >
                    <Filter className="h-4 w-4" />
                    {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center">
                            •
                        </span>
                    )}
                </button>

                {/* {canExport && results.length > 0 && (
                    <button
                        onClick={handleExport}
                        className="h-11 w-11 flex items-center justify-center border rounded-lg hover:bg-gray-50"
                        title="Exporter les résultats"
                    >
                        <Download className="h-4 w-4" />
                    </button>
                )} */}
            </div>

            {/* Panel filtres */}
            {showFilters && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg p-4 space-y-4 z-50">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">Filtres de recherche</h4>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">
                                Réinitialiser
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium block">Statut</label>
                        <select
                            value={filters.statut}
                            onChange={(e) => setFilters({ ...filters, statut: e.target.value as any })}
                            className="w-full h-10 px-3 border rounded-lg"
                        >
                            {availableFilters.statuts.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    {canAccessAllDistricts && availableFilters.provinces && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium block">Province</label>
                                <select
                                    value={filters.province_id || ''}
                                    onChange={(e) => setFilters({
                                        ...filters,
                                        province_id: e.target.value,
                                        region_id: undefined,
                                        district_id: undefined,
                                    })}
                                    className="w-full h-10 px-3 border rounded-lg"
                                >
                                    <option value="">Toutes</option>
                                    {availableFilters.provinces.map((p) => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium block">Région</label>
                                <select
                                    value={filters.region_id || ''}
                                    onChange={(e) => setFilters({
                                        ...filters,
                                        region_id: e.target.value,
                                        district_id: undefined,
                                    })}
                                    disabled={!filters.province_id}
                                    className="w-full h-10 px-3 border rounded-lg disabled:bg-gray-100"
                                >
                                    <option value="">Toutes</option>
                                    {filteredRegions?.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium block">District</label>
                                <select
                                    value={filters.district_id || ''}
                                    onChange={(e) => setFilters({ ...filters, district_id: e.target.value })}
                                    disabled={!filters.region_id}
                                    className="w-full h-10 px-3 border rounded-lg disabled:bg-gray-100"
                                >
                                    <option value="">Tous</option>
                                    {filteredDistricts?.map((d) => (
                                        <option key={d.value} value={d.value}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium block">Période</label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="date"
                                value={filters.date_debut || ''}
                                onChange={(e) => setFilters({ ...filters, date_debut: e.target.value })}
                                className="h-10 px-3 border rounded-lg"
                            />
                            <input
                                type="date"
                                value={filters.date_fin || ''}
                                onChange={(e) => setFilters({ ...filters, date_fin: e.target.value })}
                                min={filters.date_debut}
                                className="h-10 px-3 border rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Résultats */}
            {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg max-h-[600px] overflow-hidden z-50">
                    {/* Header avec stats */}
                    <div className="p-3 border-b bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                    {loadedCount} / {totalResults !== null ? totalResults : '?'} résultat{(totalResults || loadedCount) > 1 ? 's' : ''}
                                </span>
                                {stats && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <span>•</span>
                                        <span>{stats.ouverts} ouvert{stats.ouverts > 1 ? 's' : ''}</span>
                                        <span>•</span>
                                        <span>{stats.fermes} fermé{stats.fermes > 1 ? 's' : ''}</span>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setShowResults(false)} className="p-1 hover:bg-gray-200 rounded">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                       
                    </div>

                    {/* Liste résultats */}
                    <div className="overflow-y-auto max-h-[450px]">
                        {results.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>Aucun résultat trouvé</p>
                            </div>
                        ) : (
                            <>
                                {results.map((result) => (
                                    <button
                                        key={result.id}
                                        onClick={() => handleResultClick(result.id)}
                                        className="w-full p-4 hover:bg-gray-50 border-b last:border-b-0 text-left transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                                                    <h4 className="font-medium truncate">{result.nom_dossier}</h4>
                                                    {result.numero_ouverture && (
                                                        <span className="px-2 py-0.5 text-xs bg-gray-100 rounded shrink-0">
                                                            N°{result.numero_ouverture}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <MapPin className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{result.commune}</span>
                                                    {result.district && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="truncate">{result.district.nom}</span>
                                                        </>
                                                    )}
                                                </div>

                                                {result.match_context.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                        {result.match_context.slice(0, 3).map((ctx, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
                                                                {ctx}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span>{result.demandeurs_count} demandeur{result.demandeurs_count > 1 ? 's' : ''}</span>
                                                    <span>•</span>
                                                    <span>{result.proprietes_count} propriété{result.proprietes_count > 1 ? 's' : ''}</span>
                                                </div>
                                            </div>

                                            <span className={`px-2 py-1 text-xs rounded shrink-0 ${
                                                result.is_closed ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                                {result.is_closed ? 'Fermé' : 'Ouvert'}
                                            </span>
                                        </div>
                                    </button>
                                ))}

                                {/* Bouton Load More */}
                                {hasMore && (
                                    <div className="p-4 border-t bg-gray-50">
                                        <button
                                            onClick={loadMore}
                                            disabled={isLoadingMore}
                                            className="w-full h-10 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoadingMore ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>Chargement...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-4 w-4" />
                                                    <span>Charger plus ({pageSize} suivants)</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}