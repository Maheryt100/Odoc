// Statistics/components/StatisticsFilters.tsx
import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Calendar, MapPin, X, ChevronDown } from 'lucide-react';
import type { StatisticsFilters as Filters, Province, Region, District } from '../types';
import { useDebounce } from '@/hooks/use-debounce';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Props {
    filters: Filters;
    provinces: Province[];
    regions: Region[];
    districts: District[];
    canFilterGeography: boolean;
    userDistrict?: District | null;    
}

export function StatisticsFilters({ 
    filters, 
    provinces, 
    regions, 
    districts,
    canFilterGeography,
    userDistrict
}: Props) {
    const [isOpen, setIsOpen] = useState(true);
    const [period, setPeriod] = useState(filters.period || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [provinceId, setProvinceId] = useState(filters.province_id?.toString() || 'all');
    const [regionId, setRegionId] = useState(filters.region_id?.toString() || 'all');
    const [districtId, setDistrictId] = useState(filters.district_id?.toString() || 'all');

    // Régions filtrées
    const filteredRegions = useMemo(() => {
        if (provinceId === 'all') return regions;
        return regions.filter(r => r.id_province.toString() === provinceId);
    }, [regions, provinceId]);

    // Districts filtrés
    const filteredDistricts = useMemo(() => {
        if (regionId === 'all') return districts;
        return districts.filter(d => d.id_region.toString() === regionId);
    }, [districts, regionId]);

    const handleProvinceChange = (value: string) => {
        setProvinceId(value);
        setRegionId('all');
        setDistrictId('all');
    };

    const handleRegionChange = (value: string) => {
        setRegionId(value);
        setDistrictId('all');
    };

    const debouncedDateFrom = useDebounce(dateFrom, 500);
    const debouncedDateTo = useDebounce(dateTo, 500);

    useEffect(() => {
        const params: any = { period };

        if (period === 'custom') {
            params.date_from = debouncedDateFrom || null;
            params.date_to = debouncedDateTo || null;
        }

        if (canFilterGeography) {
            if (districtId !== 'all') {
                params.district_id = districtId;
            } else if (regionId !== 'all') {
                params.region_id = regionId;
            } else if (provinceId !== 'all') {
                params.province_id = provinceId;
            }
        }

        router.get(route('statistiques.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['stats', 'charts'],
            replace: true,
        });
    }, [
        period, 
        debouncedDateFrom, 
        debouncedDateTo, 
        provinceId, 
        regionId, 
        districtId,
        canFilterGeography
    ]);

    const getPeriodLabel = () => {
        switch(period) {
            case 'today': return "Aujourd'hui";
            case 'week': return 'Cette semaine';
            case 'month': return 'Ce mois';
            case 'year': return 'Cette année';
            case 'all': return 'Toutes périodes';
            case 'custom': return 'Personnalisé';
            default: return 'Période';
        }
    };

    const getGeographicLabel = () => {
        if (!canFilterGeography && userDistrict) {
            return userDistrict.nom_district;
        }
        
        if (districtId !== 'all') {
            const district = districts.find(d => d.id.toString() === districtId);
            return district?.nom_district || 'District';
        }
        if (regionId !== 'all') {
            const region = regions.find(r => r.id.toString() === regionId);
            return region?.nom_region || 'Région';
        }
        if (provinceId !== 'all') {
            const province = provinces.find(p => p.id.toString() === provinceId);
            return province?.nom_province || 'Province';
        }
        return 'Toutes zones';
    };

    const hasActiveFilters = period !== 'all' || 
        (canFilterGeography && (provinceId !== 'all' || regionId !== 'all' || districtId !== 'all'));

    const clearFilters = () => {
        setPeriod('all');
        setDateFrom('');
        setDateTo('');
        setProvinceId('all');
        setRegionId('all');
        setDistrictId('all');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Filtres de recherche</span>
                        <span className="sm:hidden">Filtres</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {/* Badges visibles sur desktop */}
                        <div className="hidden lg:flex gap-2">
                            <Badge variant="outline" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {getPeriodLabel()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {getGeographicLabel()}
                            </Badge>
                        </div>
                        
                        {/* Toggle button pour mobile */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(!isOpen)}
                            className="lg:hidden"
                        >
                            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Badges mobiles */}
                <div className="flex lg:hidden flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {getPeriodLabel()}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        {getGeographicLabel()}
                    </Badge>
                </div>
            </CardHeader>

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleContent>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Période */}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="period" className="text-xs sm:text-sm">Période</Label>
                                    <Select value={period} onValueChange={setPeriod}>
                                        <SelectTrigger id="period" className="h-9 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="today">Aujourd'hui</SelectItem>
                                            <SelectItem value="week">Cette semaine</SelectItem>
                                            <SelectItem value="month">Ce mois</SelectItem>
                                            <SelectItem value="year">Cette année</SelectItem>
                                            <SelectItem value="all">Tout</SelectItem>
                                            <SelectItem value="custom">Personnalisé</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Dates personnalisées */}
                                {period === 'custom' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="date_from" className="text-xs sm:text-sm">Du</Label>
                                            <Input 
                                                id="date_from"
                                                type="date" 
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="date_to" className="text-xs sm:text-sm">Au</Label>
                                            <Input 
                                                id="date_to"
                                                type="date" 
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                                min={dateFrom}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Filtres géographiques */}
                            {canFilterGeography ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="province" className="text-xs sm:text-sm">Province</Label>
                                        <Select value={provinceId} onValueChange={handleProvinceChange}>
                                            <SelectTrigger id="province" className="h-9 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Toutes</SelectItem>
                                                {provinces.map((p) => (
                                                    <SelectItem key={p.id} value={p.id.toString()}>
                                                        {p.nom_province}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="region" className="text-xs sm:text-sm">Région</Label>
                                        <Select 
                                            value={regionId} 
                                            onValueChange={handleRegionChange}
                                            disabled={provinceId !== 'all' && filteredRegions.length === 0}
                                        >
                                            <SelectTrigger id="region" className="h-9 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    {provinceId === 'all' ? 'Toutes' : 'Toutes (filtrées)'}
                                                </SelectItem>
                                                {filteredRegions.map((r) => (
                                                    <SelectItem key={r.id} value={r.id.toString()}>
                                                        {r.nom_region}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="district" className="text-xs sm:text-sm">District</Label>
                                        <Select 
                                            value={districtId} 
                                            onValueChange={setDistrictId}
                                            disabled={regionId !== 'all' && filteredDistricts.length === 0}
                                        >
                                            <SelectTrigger id="district" className="h-9 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    {regionId === 'all' ? 'Tous' : 'Tous (filtrés)'}
                                                </SelectItem>
                                                {filteredDistricts.map((d) => (
                                                    <SelectItem key={d.id} value={d.id.toString()}>
                                                        {d.nom_district}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label className="text-xs sm:text-sm">District</Label>
                                    <div className="flex items-center h-9 px-3 py-2 bg-muted rounded-md text-sm">
                                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                                        <span className="font-medium truncate">
                                            {userDistrict?.nom_district || 'Non assigné'}
                                        </span>
                                        <Badge variant="secondary" className="ml-auto text-xs shrink-0">
                                            Fixe
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            {hasActiveFilters && (
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <p className="text-xs text-muted-foreground">
                                        Filtres actifs
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="h-8 text-xs"
                                    >
                                        <X className="h-3 w-3 mr-1" />
                                        Réinitialiser
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}