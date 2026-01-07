// Dashboard/components/RevenueCard.tsx 
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Eye, EyeOff, Info } from 'lucide-react';
import { usePage } from '@inertiajs/react';

interface Props {
    revenus_potentiels: number;
    variation?: string;
}

export function RevenueCard({ revenus_potentiels, variation = '+25%' }: Props) {
    const { auth } = usePage().props as any;
    const canViewRevenue = ['super_admin', 'admin_district'].includes(auth.user.role);
    
    const [showRevenue, setShowRevenue] = useState(false);

    const handleToggle = () => {
        setShowRevenue(!showRevenue);
    };

    // Formattage en millions pour la vue réduite
    const formatRevenueCourt = (montant: number): string => {
        if (montant >= 1000000000) {
            return `${(montant / 1000000000).toFixed(1)}Mrd`;
        }
        if (montant >= 1000000) {
            return `${(montant / 1000000).toFixed(1)}M`;
        }
        return `${(montant / 1000).toFixed(0)}K`;
    };

    // Formattage complet
    const formatRevenueComplet = (montant: number): string => {
        return `${montant.toLocaleString('fr-FR')} Ar`;
    };

    return (
        <Card className="hover:shadow-lg transition-shadow lg:col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg sm:text-2xl font-bold">Revenus potentiels</CardTitle>
                    <Badge variant="outline" className="text-xs">
                        <Info className="h-3 w-3 mr-1" />
                        Actifs uniquement
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    {canViewRevenue && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleToggle}
                            className="h-7 px-2"
                            title={showRevenue ? "Masquer les montants" : "Afficher les montants"}
                        >
                            {showRevenue ? (
                                <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                                <Eye className="h-3.5 w-3.5" />
                            )}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {canViewRevenue ? (
                    <>
                        <div className="flex items-baseline gap-3 mb-3">
                            <div className="text-xl sm:text-2xl font-bold break-all">
                                {showRevenue ? (
                                    formatRevenueComplet(revenus_potentiels)
                                ) : (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="select-none text-muted-foreground">
                                            ••••••••
                                        </span>
                                        <Badge variant="secondary" className="text-xs">
                                            ~{formatRevenueCourt(revenus_potentiels)}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                                Montant total des demandes en cours de traitement
                            </p>
                            
                            {showRevenue && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-border">
                                    <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                        <p className="text-xs text-green-700 dark:text-green-400 mb-1">Moyenne/dossier</p>
                                        <p className="text-sm font-bold text-green-700 dark:text-green-300">
                                            {formatRevenueCourt(revenus_potentiels / 10)}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                        <p className="text-xs text-blue-700 dark:text-blue-400 mb-1">Projection annuelle</p>
                                        <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                            {formatRevenueCourt(revenus_potentiels * 4)}
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            {!showRevenue && (
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                                    <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    <span className="text-xs text-blue-600 dark:text-blue-400">
                                        Cliquez sur l'œil pour voir les détails
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                        <EyeOff className="h-10 w-10 mb-3 opacity-50" />
                        <p className="text-sm font-medium text-center">Accès réservé aux administrateurs</p>
                        <p className="text-xs mt-1 text-center max-w-xs">
                            Les informations financières ne sont visibles que par les administrateurs de district et super administrateurs
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}