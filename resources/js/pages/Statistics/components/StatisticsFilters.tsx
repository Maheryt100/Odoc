// Statistics/components/StatisticsFilters.tsx
import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Filter, Calendar } from 'lucide-react';
import type { StatisticsFilters as Filters, District } from '../types';
import { useDebounce } from '@/hooks/use-debounce';
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface Props {
    filters: Filters;
    districts: District[];
}

export function StatisticsFilters({ filters, districts }: Props) {
    // ✅ Période par défaut "all" (Tout)
    const [period, setPeriod] = React.useState(filters.period || 'all');
    const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
    const [dateTo, setDateTo] = React.useState(filters.date_to || '');
    const [districtId, setDistrictId] = React.useState(filters.district_id?.toString() || 'all');

    // Debounce pour les dates
    const debouncedDateFrom = useDebounce(dateFrom, 500);
    const debouncedDateTo = useDebounce(dateTo, 500);

    // ✅ Auto-apply avec gestion intelligente
    useEffect(() => {
        const params: any = {
            period,
            district_id: districtId !== 'all' ? districtId : null,
        };

        // Ajouter dates seulement si période custom
        if (period === 'custom') {
            params.date_from = debouncedDateFrom || null;
            params.date_to = debouncedDateTo || null;
        }

        router.get(route('statistiques.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['stats', 'charts'],
            replace: true, // ✅ Évite de polluer l'historique
        });
    }, [period, debouncedDateFrom, debouncedDateTo, districtId]);

    // ✅ Label de période dynamique
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

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtres de recherche
                    </CardTitle>
                    <Badge variant="outline" className="text-sm">
                        <Calendar className="h-3 w-3 mr-1" />
                        {getPeriodLabel()}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Sélecteur de période */}
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

                    {/* Dates personnalisées (affichées seulement si custom) */}
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
                                    min={dateFrom} // ✅ Date fin >= date début
                                />
                            </div>
                        </>
                    )}

                    {/* Sélecteur de district */}
                    <div className="space-y-2">
                        <Label htmlFor="district">District</Label>
                        <Select value={districtId} onValueChange={setDistrictId}>
                            <SelectTrigger id="district">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les districts</SelectItem>
                                {districts.map((d) => (
                                    <SelectItem key={d.id} value={d.id.toString()}>
                                        {d.nom_district}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* ✅ Indicateur de filtre actif */}
                {(period !== 'all' || districtId !== 'all') && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            <strong>Filtre actif :</strong> {getPeriodLabel()}
                            {districtId !== 'all' && ` • District sélectionné`}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}