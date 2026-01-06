// users/Create.tsx - MOBILE OPTIMIZED
import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, AlertCircle, Eye, EyeOff, User, Shield, MapPin, Mail, Lock, Info } from 'lucide-react';

interface Location {
    id: number;
    nom_province: string;
    regions: Array<{
        id: number;
        nom_region: string;
        districts: Array<{
            id: number;
            nom_district: string;
        }>;
    }>;
}

interface PageProps {
    locations: Location[];
    roles: Record<string, string>;
    currentUserDistrict?: number;
    isSuperAdmin: boolean;
    isAdminDistrict: boolean;
    user?: {
        id: number;
        name: string;
        email: string;
        role: string;
        id_district?: number;
        status: boolean;
        district?: {
            id: number;
            nom_district: string;
            id_region: number;
            id_province: number;
        };
    };
}

export default function UserCreateEdit({ 
    locations, 
    roles, 
    currentUserDistrict, 
    isSuperAdmin, 
    isAdminDistrict,
    user 
}: PageProps) {
    const isEdit = !!user;
    
    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        password_confirmation: '',
        role: user?.role || '',
        id_province: user?.district?.id_province?.toString() || '',
        id_region: user?.district?.id_region?.toString() || '',
        id_district: user?.id_district?.toString() || '',
        status: user?.status !== undefined ? user.status : true,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [selectedProvince, setSelectedProvince] = useState(data.id_province);
    const [selectedRegion, setSelectedRegion] = useState(data.id_region);

    const regions = selectedProvince 
        ? locations.find(p => p.id.toString() === selectedProvince)?.regions || []
        : [];

    const districts = selectedRegion
        ? regions.find(r => r.id.toString() === selectedRegion)?.districts || []
        : [];

    const requiresDistrict = data.role === 'admin_district' || data.role === 'user_district';
    const noDistrictNeeded = data.role === 'super_admin' || data.role === 'central_user';

    const handleProvinceChange = (value: string) => {
        setSelectedProvince(value);
        setData({
            ...data,
            id_province: value,
            id_region: '',
            id_district: '',
        });
        setSelectedRegion('');
    };

    const handleRegionChange = (value: string) => {
        setSelectedRegion(value);
        setData({
            ...data,
            id_region: value,
            id_district: '',
        });
    };

    const handleDistrictChange = (value: string) => {
        setData('id_district', value);
    };

    const handleRoleChange = (value: string) => {
        setData('role', value);
        if (value === 'super_admin' || value === 'central_user') {
            setData({
                ...data,
                role: value,
                id_province: '',
                id_region: '',
                id_district: '',
            });
            setSelectedProvince('');
            setSelectedRegion('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEdit) {
            put(`/users/${user.id}`);
        } else {
            post('/users');
        }
    };

    // Helper pour afficher les descriptions de rôles - ✅ CORRIGÉ
    const getRoleDescription = (role: string): string => {
        switch(role) {
            case 'super_admin':
                return '👁️ Lecture seule sur tous les districts. Peut créer : super_admin, central_user, admin_district.';
            case 'central_user':
                return '👁️ Lecture seule sur tous les districts. Peut exporter les données.';
            case 'admin_district':
                return '✏️ Création/Modification/Suppression dans son district. Peut créer des user_district.';
            case 'user_district':
                return '✏️ Création/Modification dans son district. Pas de suppression.';
            default:
                return '';
        }
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Utilisateurs', href: '/users' },
                { title: isEdit ? 'Modifier' : 'Créer', href: '' },
            ]}
        >
            <Head title={isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'} />

            <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-6xl">
                {/* Header - Mobile Optimized */}
                <div className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                                {isEdit 
                                    ? 'Mettre à jour les informations de l\'utilisateur'
                                    : 'Créer un nouveau compte utilisateur'
                                }
                            </p>
                        </div>
                        <Link href="/users">
                            <Button variant="outline" size="sm" className="h-9 sm:h-11 w-full sm:w-auto">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Errors Alert */}
                {Object.keys(errors).length > 0 && (
                    <Alert variant="destructive" className="mb-4 sm:mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                                {Object.values(errors).map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Informations de base */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 p-3 sm:p-4 lg:p-6">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                                <div className="min-w-0">
                                    <CardTitle className="text-base sm:text-lg">Informations de base</CardTitle>
                                    <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm">
                                        Informations d'identification de l'utilisateur
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
                            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                                {/* Nom */}
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs sm:text-sm font-medium">
                                        <User className="inline h-3 w-3 mr-1" />
                                        Nom complet *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Jean Dupont"
                                        className={`h-9 sm:h-11 text-sm ${errors.name ? 'border-destructive' : ''}`}
                                    />
                                    {errors.name && (
                                        <p className="text-xs sm:text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
                                        <Mail className="inline h-3 w-3 mr-1" />
                                        Email *
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="jean.dupont@email.com"
                                        className={`h-9 sm:h-11 text-sm ${errors.email ? 'border-destructive' : ''}`}
                                    />
                                    {errors.email && (
                                        <p className="text-xs sm:text-sm text-destructive">{errors.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                                {/* Mot de passe */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-xs sm:text-sm font-medium">
                                        <Lock className="inline h-3 w-3 mr-1" />
                                        Mot de passe {!isEdit && '*'}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder={isEdit ? 'Laisser vide pour ne pas changer' : '••••••••'}
                                            className={`h-9 sm:h-11 pr-10 text-sm ${errors.password ? 'border-destructive' : ''}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-9 sm:h-11 w-9 sm:w-11"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-xs sm:text-sm text-destructive">{errors.password}</p>
                                    )}
                                </div>

                                {/* Confirmation mot de passe */}
                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation" className="text-xs sm:text-sm font-medium">
                                        <Lock className="inline h-3 w-3 mr-1" />
                                        Confirmer le mot de passe {!isEdit && '*'}
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder={isEdit ? 'Laisser vide pour ne pas changer' : '••••••••'}
                                        className="h-9 sm:h-11 text-sm"
                                    />
                                </div>
                            </div>

                            {isEdit && (
                                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                    <AlertCircle className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                                        Laisser les champs mot de passe vides pour conserver le mot de passe actuel
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* Rôle et Permissions + Affectation */}
                    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                        {/* Rôle et permissions */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 p-3 sm:p-4 lg:p-6">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 shrink-0" />
                                    <div className="min-w-0">
                                        <CardTitle className="text-base sm:text-lg">Rôle et permissions</CardTitle>
                                        <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm">
                                            Définir le niveau d'accès
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 sm:pt-6 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-xs sm:text-sm font-medium">Rôle *</Label>
                                    <Select value={data.role} onValueChange={handleRoleChange}>
                                        <SelectTrigger className={`h-9 sm:h-11 text-sm ${errors.role ? 'border-destructive' : ''}`}>
                                            <SelectValue placeholder="Sélectionner un rôle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(roles).map(([key, label]) => (
                                                <SelectItem key={key} value={key} className="text-sm">
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.role && (
                                        <p className="text-xs sm:text-sm text-destructive">{errors.role}</p>
                                    )}
                                </div>

                                {data.role && (
                                    <Alert className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800">
                                        <Info className="h-4 w-4 text-amber-600" />
                                        <AlertDescription className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                                            {getRoleDescription(data.role)}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/50">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs sm:text-sm font-medium">Compte actif</Label>
                                        <p className="text-xs text-muted-foreground">
                                            L'utilisateur peut se connecter
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.status}
                                        onCheckedChange={(checked) => setData('status', checked)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Affectation district */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 p-3 sm:p-4 lg:p-6">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 shrink-0" />
                                    <div className="min-w-0">
                                        <CardTitle className="text-base sm:text-lg">Affectation géographique</CardTitle>
                                        <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm">
                                            {noDistrictNeeded
                                                ? 'Ce rôle a accès à tous les districts'
                                                : 'Sélectionner le district de l\'utilisateur'
                                            }
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 sm:pt-6 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
                                {noDistrictNeeded ? (
                                    <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                                        <Info className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-xs sm:text-sm text-green-800 dark:text-green-200">
                                            Aucune affectation géographique requise pour ce rôle. 
                                            L'utilisateur aura accès à tous les districts.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="province" className="text-xs sm:text-sm font-medium">
                                                Province {requiresDistrict && '*'}
                                            </Label>
                                            <Select 
                                                value={selectedProvince} 
                                                onValueChange={handleProvinceChange}
                                                disabled={noDistrictNeeded}
                                            >
                                                <SelectTrigger className="h-9 sm:h-11 text-sm">
                                                    <SelectValue placeholder="Sélectionner une province" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {locations.map((province) => (
                                                        <SelectItem key={province.id} value={province.id.toString()} className="text-sm">
                                                            {province.nom_province}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="region" className="text-xs sm:text-sm font-medium">
                                                Région {requiresDistrict && '*'}
                                            </Label>
                                            <Select 
                                                value={selectedRegion} 
                                                onValueChange={handleRegionChange}
                                                disabled={!selectedProvince || noDistrictNeeded}
                                            >
                                                <SelectTrigger className="h-9 sm:h-11 text-sm">
                                                    <SelectValue placeholder="Sélectionner une région" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {regions.map((region) => (
                                                        <SelectItem key={region.id} value={region.id.toString()} className="text-sm">
                                                            {region.nom_region}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="district" className="text-xs sm:text-sm font-medium">
                                                District {requiresDistrict && '*'}
                                            </Label>
                                            <Select 
                                                value={data.id_district} 
                                                onValueChange={handleDistrictChange}
                                                disabled={!selectedRegion || noDistrictNeeded}
                                            >
                                                <SelectTrigger className={`h-9 sm:h-11 text-sm ${errors.id_district ? 'border-destructive' : ''}`}>
                                                    <SelectValue placeholder="Sélectionner un district" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {districts.map((district) => (
                                                        <SelectItem key={district.id} value={district.id.toString()} className="text-sm">
                                                            {district.nom_district}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {errors.id_district && (
                                                <p className="text-xs sm:text-sm text-destructive">{errors.id_district}</p>
                                            )}
                                        </div>

                                        {requiresDistrict && !data.id_district && (
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="text-xs sm:text-sm">
                                                    Un district est requis pour ce rôle
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-end pt-4 sm:pt-6 border-t">
                        <Link href="/users" className="w-full sm:w-auto">
                            <Button type="button" variant="outline" size="sm" className="h-9 sm:h-11 w-full">
                                Annuler
                            </Button>
                        </Link>
                        <Button 
                            type="submit" 
                            disabled={processing}
                            size="sm"
                            className="h-9 sm:h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppSidebarLayout>
    );
}