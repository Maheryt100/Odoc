// resources/js/pages/location/index.tsx 

import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, District, User } from '@/types';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Info, MapPin, Sparkles } from 'lucide-react';

// Import des composants
import LocationHierarchy from './components/LocationHierarchy';
import PriceEditDialog from './components/PriceEditDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Province {
    id: number;
    nom_province: string;
    regions: Region[];
}

interface Region {
    id: number;
    nom_region: string;
    id_province: number;
    districts: District[];
}

interface LocationPageProps {
    provinces: Province[];
    auth: { user: User };
}

interface PriceFormData {
    id: number;
    edilitaire: number;
    agricole: number;
    forestiere: number;
    touristique: number;
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Gestion des localisations',
        href: '/location',
    },
];

export default function LocationIndex({ provinces, auth }: LocationPageProps) {
    const [search, setSearch] = useState("");
    const [expandedProvinces, setExpandedProvinces] = useState<string[]>([]);
    const [expandedRegions, setExpandedRegions] = useState<string[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'view'>('view');

    const isSuperAdmin = auth.user.role === 'super_admin';

    const { data, setData, post, reset, processing } = useForm<PriceFormData>({
        id: 0,
        edilitaire: 0,
        agricole: 0,
        forestiere: 0,
        touristique: 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        post(route('circonscription.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDialogOpen(false);
                reset();
                toast.success('Prix mis à jour avec succès');
            },
            onError: (errors) => {
                console.error('Erreurs:', errors);
                toast.error('Erreur lors de la mise à jour des prix');
            }
        });
    };

    const openDistrictDialog = (district: District, mode: 'edit' | 'view') => {
        setViewMode(mode);
        setSelectedDistrict(district);
        setData({
            id: district.id,
            edilitaire: district.edilitaire || 0,
            agricole: district.agricole || 0,
            forestiere: district.forestiere || 0,
            touristique: district.touristique || 0,
        });
        setIsDialogOpen(true);
    };

    const isPriceComplete = (district: District): boolean => {
        return (district.edilitaire || 0) > 0 && 
               (district.agricole || 0) > 0 && 
               (district.forestiere || 0) > 0 && 
               (district.touristique || 0) > 0;
    };

    // Filtrer les provinces/régions/districts selon la recherche
    const filteredProvinces = provinces.map(province => ({
        ...province,
        regions: province.regions.map(region => ({
            ...region,
            districts: region.districts.filter(district =>
                district.nom_district.toLowerCase().includes(search.toLowerCase())
            )
        })).filter(region => 
            region.nom_region.toLowerCase().includes(search.toLowerCase()) ||
            region.districts.length > 0
        )
    })).filter(province => 
        province.nom_province.toLowerCase().includes(search.toLowerCase()) ||
        province.regions.length > 0
    );

    // Compter les statistiques
    const getTotalStats = () => {
        let totalDistricts = 0;
        let districtsWithPrices = 0;

        provinces.forEach(province => {
            province.regions.forEach(region => {
                region.districts.forEach(district => {
                    totalDistricts++;
                    if (isPriceComplete(district)) {
                        districtsWithPrices++;
                    }
                });
            });
        });

        return { totalDistricts, districtsWithPrices };
    };

    const stats = getTotalStats();
    const totalRegions = provinces.reduce((acc, p) => acc + p.regions.length, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Toaster position="top-right" richColors />
            
            <div className="container mx-auto p-6 max-w-[1600px] space-y-6">
                {/* ✅ HEADER MODERNE - Orange/Amber */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent flex items-center gap-3">
                        <MapPin className="h-8 w-8 text-orange-600" />
                        Gestion des Localisations
                    </h1>
                    <p className="text-muted-foreground">
                        Vue hiérarchique des provinces, régions et districts avec leurs tarifications
                    </p>
                </div>

                {/* ✅ Alert Info */}
                <Alert className="border-0 shadow-md bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg shrink-0">
                            <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <AlertDescription className="text-sm text-orange-900 dark:text-orange-100">
                            <span className="font-semibold flex items-center gap-2">
                                <Sparkles className="h-3 w-3" />
                                Structure hiérarchique complète
                            </span>
                            <span className="text-orange-700 dark:text-orange-300">
                                — Configurez les tarifs par district et suivez la couverture géographique
                            </span>
                        </AlertDescription>
                    </div>
                </Alert>

                {/* ✅ Hiérarchie avec recherche intégrée */}
                <LocationHierarchy
                    provinces={filteredProvinces}
                    allProvinces={provinces}
                    expandedProvinces={expandedProvinces}
                    expandedRegions={expandedRegions}
                    isSuperAdmin={isSuperAdmin}
                    isPriceComplete={isPriceComplete}
                    onExpandProvincesChange={setExpandedProvinces}
                    onExpandRegionsChange={setExpandedRegions}
                    onDistrictEdit={(district) => openDistrictDialog(district, 'edit')}
                    onDistrictView={(district) => openDistrictDialog(district, 'view')}
                    totalRegions={totalRegions}
                    totalDistricts={stats.totalDistricts}
                    search={search}
                    onSearchChange={setSearch}
                />
            </div>

            {/* Dialog de modification/visualisation */}
            <PriceEditDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                district={selectedDistrict}
                viewMode={viewMode}
                data={data}
                processing={processing}
                onDataChange={(field, value) => setData(field, value)}
                onSubmit={handleSubmit}
            />
        </AppLayout>
    );
}