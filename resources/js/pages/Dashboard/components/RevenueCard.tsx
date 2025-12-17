// Dashboard/components/RevenueCard.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Eye, EyeOff, TrendingUp, Info } from 'lucide-react';
import { usePage } from '@inertiajs/react';

interface Props {
    revenus_potentiels: number;
    variation?: string;
}

export function RevenueCard({ revenus_potentiels, variation = '+25%' }: Props) {
    const { auth } = usePage().props as any;
    const canViewRevenue = ['super_admin', 'admin_district'].includes(auth.user.role);
    
    // ✅ NOUVEAU : Stocker la préférence dans localStorage
    const [showRevenue, setShowRevenue] = useState(() => {
        if (!canViewRevenue) return false;
        
        // Récupérer la préférence de l'utilisateur depuis localStorage
        const saved = localStorage.getItem('dashboard_show_revenue');
        return saved ? JSON.parse(saved) : false;
    });

    // ✅ Sauvegarder la préférence quand elle change
    useEffect(() => {
        if (canViewRevenue) {
            localStorage.setItem('dashboard_show_revenue', JSON.stringify(showRevenue));
        }
    }, [showRevenue, canViewRevenue]);

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
                <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl font-bold">Revenus potentiels</CardTitle>
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
                            <div className="text-2xl font-bold">
                                {showRevenue ? (
                                    formatRevenueComplet(revenus_potentiels)
                                ) : (
                                    <div className="flex items-center gap-2">
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
                                <>
                                    <div className="flex items-center gap-1 pt-2 border-t">
                                        <TrendingUp className="h-3 w-3 text-green-600" />
                                        <span className="text-xs text-green-600 font-medium">
                                            {variation} ce trimestre
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                                        <div className="p-2 bg-green-50 rounded-lg">
                                            <p className="text-xs text-green-700 mb-1">Moyenne/dossier</p>
                                            <p className="text-sm font-bold text-green-700">
                                                {formatRevenueCourt(revenus_potentiels / 10)}
                                            </p>
                                        </div>
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <p className="text-xs text-blue-700 mb-1">Projection annuelle</p>
                                            <p className="text-sm font-bold text-blue-700">
                                                {formatRevenueCourt(revenus_potentiels * 4)}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {!showRevenue && (
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                    <Info className="h-3.5 w-3.5 text-blue-600" />
                                    <span className="text-xs text-blue-600">
                                        Cliquez sur l'œil pour voir les détails
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                        <EyeOff className="h-10 w-10 mb-3 opacity-50" />
                        <p className="text-sm font-medium">Accès réservé aux administrateurs</p>
                        <p className="text-xs mt-1 text-center max-w-xs">
                            Les informations financières ne sont visibles que par les administrateurs de district et super administrateurs
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}