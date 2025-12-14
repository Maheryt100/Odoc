// Statistics/components/StatisticsFilters.tsx
import { useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Filter, Calendar, MapPin } from 'lucide-react';
import type { StatisticsFilters as Filters, Province, Region, District } from '../types';
import { useDebounce } from '@/hooks/use-debounce';
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface Props {
    filters: Filters;
    provinces: Province[];
    regions: Region[];
    districts: District[];
    canFilterGeography: boolean; // ✅ true pour Super Admin/Central User
    userDistrict?: District;      // ✅ District de l'utilisateur si Admin/User District
}

export function StatisticsFilters({ 
    filters, 
    provinces, 
    regions, 
    districts,
    canFilterGeography,
    userDistrict
}: Props) {
    // ✅ DEBUG : Vérifier les props reçues
    React.useEffect(() => {
        console.log('🔍 StatisticsFilters Props:', {
            canFilterGeography,
            userDistrict,
            hasDistrict: !!userDistrict,
            districtName: userDistrict?.nom_district
        });
    }, [canFilterGeography, userDistrict]);

    // ========== ÉTATS ==========
    const [period, setPeriod] = React.useState(filters.period || 'all');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');
    const [provinceId, setProvinceId] = React.useState(
        filters.province_id?.toString() || 'all'
    );
    const [regionId, setRegionId] = React.useState(
        filters.region_id?.toString() || 'all'
    );
    const [districtId, setDistrictId] = React.useState(
        filters.district_id?.toString() || 'all'
    );

    // ========== FILTRAGE EN CASCADE ==========
    
    // Régions filtrées par province sélectionnée
    const filteredRegions = useMemo(() => {
        if (provinceId === 'all') return regions;
        return regions.filter(r => r.id_province.toString() === provinceId);
    }, [regions, provinceId]);

    // Districts filtrés par région sélectionnée
    const filteredDistricts = useMemo(() => {
        if (regionId === 'all') return districts;
        return districts.filter(d => d.id_region.toString() === regionId);
    }, [districts, regionId]);

    // ========== GESTION DES CHANGEMENTS ==========
    
    // Quand province change → reset région et district
    const handleProvinceChange = (value: string) => {
        setProvinceId(value);
        setRegionId('all');
        setDistrictId('all');
    };

    // Quand région change → reset district
    const handleRegionChange = (value: string) => {
        setRegionId(value);
        setDistrictId('all');
    };

    // Debounce pour les dates
    const debouncedDateFrom = useDebounce(dateFrom, 500);
    const debouncedDateTo = useDebounce(dateTo, 500);

    // ========== AUTO-APPLY AVEC LOGIQUE HIÉRARCHIQUE ==========
    useEffect(() => {
        const params: any = {
            period,
        };

        // Dates personnalisées
        if (period === 'custom') {
            params.date_from = debouncedDateFrom || null;
            params.date_to = debouncedDateTo || null;
        }

        // ✅ LOGIQUE GÉOGRAPHIQUE HIÉRARCHIQUE
        if (canFilterGeography) {
            // Si district sélectionné → on envoie uniquement district_id
            if (districtId !== 'all') {
                params.district_id = districtId;
            }
            // Sinon si région sélectionnée → on envoie region_id
            else if (regionId !== 'all') {
                params.region_id = regionId;
            }
            // Sinon si province sélectionnée → on envoie province_id
            else if (provinceId !== 'all') {
                params.province_id = provinceId;
            }
            // Sinon → "all" (pas de filtre géographique)
        }
        // Si utilisateur district → pas de params géographiques (forcé côté serveur)

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

    // ========== LABELS DYNAMIQUES ==========
    
    const getPeriodLabel = () => {
        switch(period) {
            case 'today': return "Aujourd'hui";
            case 'week': return 'Cette semaine';
            case 'month': return 'Ce mois';
            case 'year': return 'Cette année';
            case 'all': return 'Toutes les données';
            case 'custom': return 'Période personnalisée';
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
        return 'Toutes les provinces';
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtres de recherche
                    </CardTitle>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {getPeriodLabel()}
                        </Badge>
                        <Badge variant="outline" className="text-sm">
                            <MapPin className="h-3 w-3 mr-1" />
                            {getGeographicLabel()}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {/* ========== SÉLECTEUR PÉRIODE ========== */}
                    <div className="space-y-2">
                        <Label htmlFor="period">Période</Label>
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger id="period">
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

                    {/* ========== DATES PERSONNALISÉES ========== */}
                    {period === 'custom' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="date_from">Date début</Label>
                                <Input 
                                    id="date_from"
                                    type="date" 
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date_to">Date fin</Label>
                                <Input 
                                    id="date_to"
                                    type="date" 
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    min={dateFrom}
                                />
                            </div>
                        </>
                    )}

                    {/* ========== FILTRES GÉOGRAPHIQUES (Super Admin / Central User) ========== */}
                    {canFilterGeography ? (
                        <>
                            {/* Province */}
                            <div className="space-y-2">
                                <Label htmlFor="province">Province</Label>
                                <Select value={provinceId} onValueChange={handleProvinceChange}>
                                    <SelectTrigger id="province">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes les provinces</SelectItem>
                                        {provinces.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                {p.nom_province}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Région (affichée si province sélectionnée ou 'all') */}
                            <div className="space-y-2">
                                <Label htmlFor="region">Région</Label>
                                <Select 
                                    value={regionId} 
                                    onValueChange={handleRegionChange}
                                    disabled={provinceId !== 'all' && filteredRegions.length === 0}
                                >
                                    <SelectTrigger id="region">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {provinceId === 'all' 
                                                ? 'Toutes les régions' 
                                                : 'Toutes (province sélectionnée)'}
                                        </SelectItem>
                                        {filteredRegions.map((r) => (
                                            <SelectItem key={r.id} value={r.id.toString()}>
                                                {r.nom_region}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* District (affiché si région sélectionnée ou 'all') */}
                            <div className="space-y-2">
                                <Label htmlFor="district">District</Label>
                                <Select 
                                    value={districtId} 
                                    onValueChange={setDistrictId}
                                    disabled={regionId !== 'all' && filteredDistricts.length === 0}
                                >
                                    <SelectTrigger id="district">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {regionId === 'all' 
                                                ? 'Tous les districts' 
                                                : 'Tous (région sélectionnée)'}
                                        </SelectItem>
                                        {filteredDistricts.map((d) => (
                                            <SelectItem key={d.id} value={d.id.toString()}>
                                                {d.nom_district}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    ) : (
                        /* ========== BADGE FIXE POUR ADMIN/USER DISTRICT ========== */
                        <div className="space-y-2">
                            <Label>District</Label>
                            <div className="flex items-center h-10 px-3 py-2 bg-muted rounded-md">
                                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="font-medium">
                                    {userDistrict?.nom_district || 'Non assigné'}
                                </span>
                                <Badge variant="secondary" className="ml-auto text-xs">
                                    Fixe
                                </Badge>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========== INDICATEUR DE FILTRE ACTIF ========== */}
                {(period !== 'all' || 
                  (canFilterGeography && (provinceId !== 'all' || regionId !== 'all' || districtId !== 'all'))
                ) && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            <strong>Filtre actif :</strong> {getPeriodLabel()}
                            {canFilterGeography && (
                                <> • {getGeographicLabel()}</>
                            )}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}