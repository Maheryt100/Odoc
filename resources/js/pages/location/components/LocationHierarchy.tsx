// resources/js/pages/location/components/LocationHierarchy.tsx 

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Map, MapPin, LandPlot, Search, X, Eye } from 'lucide-react';
import DistrictCard from './DistrictCard';
import type { District } from '@/types';

interface Region {
    id: number;
    nom_region: string;
    id_province: number;
    districts: District[];
}

interface Province {
    id: number;
    nom_province: string;
    regions: Region[];
}

interface LocationHierarchyProps {
    provinces: Province[];
    allProvinces: Province[];
    expandedProvinces: string[];
    expandedRegions: string[];
    isSuperAdmin: boolean;
    isPriceComplete: (district: District) => boolean;
    onExpandProvincesChange: (value: string[]) => void;
    onExpandRegionsChange: (value: string[]) => void;
    onDistrictEdit: (district: District) => void;
    onDistrictView: (district: District) => void;
    totalRegions: number;
    totalDistricts: number;
    search: string;
    onSearchChange: (value: string) => void;
}

export default function LocationHierarchy({
    provinces,
    allProvinces,
    expandedProvinces,
    expandedRegions,
    isSuperAdmin,
    isPriceComplete,
    onExpandProvincesChange,
    onExpandRegionsChange,
    onDistrictEdit,
    onDistrictView,
    totalRegions,
    totalDistricts,
    search,
    onSearchChange
}: LocationHierarchyProps) {
    return (
        <Card className="border-0 shadow-lg">
            {/* ✅ Header compact style propriétés */}
            <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 px-6 py-3 border-b">
                <div className="flex items-center justify-between gap-4">
                    {/* Titre et stats */}
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                            <Map className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold leading-tight">Hiérarchie des Localisations</h2>
                            <p className="text-xs text-muted-foreground truncate">
                                {provinces.length} / {allProvinces.length} province{allProvinces.length > 1 ? 's' : ''} • {totalRegions} région{totalRegions > 1 ? 's' : ''} • {totalDistricts} district{totalDistricts > 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Badge mode lecture */}
                    {!isSuperAdmin && (
                        <Badge variant="outline" className="hidden lg:flex bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 gap-1 flex-shrink-0">
                            <Eye className="h-3 w-3" />
                            Mode lecture
                        </Badge>
                    )}
                </div>
            </div>
            
            <CardContent className="p-4">
                {/* ✅ Barre de recherche intégrée - Style propriétés */}
                <div className="mb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Rechercher une province, région ou district..."
                                value={search}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-9 pr-9 h-9"
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
                    </div>
                    
                    {/* Résumé des résultats */}
                    {search && (
                        <div className="text-xs text-muted-foreground mt-2 ml-1">
                            {provinces.length} résultat{provinces.length > 1 ? 's' : ''} sur {allProvinces.length}
                        </div>
                    )}
                </div>

                {/* ✅ Hiérarchie */}
                {provinces.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <LandPlot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">Aucune localisation trouvée</p>
                        <p className="text-sm mt-1">Vérifiez vos critères de recherche</p>
                    </div>
                ) : (
                    <Accordion type="multiple" value={expandedProvinces} onValueChange={onExpandProvincesChange}>
                        {provinces.map((province) => (
                            <AccordionItem key={province.id} value={`province-${province.id}`} className="border-b">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                            <Map className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold text-base">{province.nom_province}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {province.regions.length} région{province.regions.length > 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pl-12 pt-3 space-y-3">
                                        <Accordion type="multiple" value={expandedRegions} onValueChange={onExpandRegionsChange}>
                                            {province.regions.map((region) => (
                                                <AccordionItem 
                                                    key={region.id} 
                                                    value={`region-${region.id}`} 
                                                    className="border-l-2 border-blue-200 dark:border-blue-800 ml-2 pl-4"
                                                >
                                                    <AccordionTrigger className="hover:no-underline py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900/30">
                                                                <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="font-medium text-sm">{region.nom_region}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {region.districts.length} district{region.districts.length > 1 ? 's' : ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="pl-11 pt-3 space-y-3">
                                                            {region.districts.map((district) => (
                                                                <DistrictCard
                                                                    key={district.id}
                                                                    district={district}
                                                                    isComplete={isPriceComplete(district)}
                                                                    isSuperAdmin={isSuperAdmin}
                                                                    onEdit={() => onDistrictEdit(district)}
                                                                    onView={() => onDistrictView(district)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}