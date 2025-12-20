// resources/js/pages/dossiers/components/DossierInfoSection.tsx - ✅ VERSION RESPONSIVE OPTIMALE

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Lock, LockOpen, Pencil, LandPlot, MapPin, Calendar, 
    Building2, Hash, User, Clock, AlertCircle, MoreVertical
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { DossierInfoSectionProps } from '../types';
import { formatDate, getDurationInDays, getDaysSince } from '../helpers';
import { useIsMobile } from '@/hooks/useResponsive';

export default function DossierInfoSection({ 
    dossier, 
    demandeursCount, 
    proprietesCount,
    onCloseToggle,
    permissions,
    userRole 
}: DossierInfoSectionProps) {
    
    const isMobile = useIsMobile();
    const duration = getDurationInDays(dossier.date_descente_debut, dossier.date_descente_fin);
    const daysSinceOpening = getDaysSince(dossier.date_ouverture);

    // ✅ Affichage du numéro d'ouverture
    const displayNumero = typeof dossier.numero_ouverture === 'number' 
        ? `N° ${dossier.numero_ouverture}`
        : (dossier.numero_ouverture_display || dossier.numero_ouverture || 'Non assigné');

    // ✅ Vérifier si l'utilisateur est en lecture seule
    const isReadOnly = userRole === 'super_admin' || userRole === 'central_user';

    return (
        <div className="space-y-3 sm:space-y-4">
            {/* ✅ Alerte fermeture - Responsive */}
            {dossier.is_closed && (
                <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-start gap-2 sm:gap-3">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-semibold text-orange-900 dark:text-orange-100">
                                        Fermé le {formatDate(dossier.date_fermeture!)}
                                        {dossier.closedBy && !isMobile && <> par {dossier.closedBy.name}</>}
                                    </p>
                                    {dossier.closedBy && isMobile && (
                                        <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
                                            Par {dossier.closedBy.name}
                                        </p>
                                    )}
                                    {dossier.motif_fermeture && (
                                        <p className="text-xs text-orange-700 dark:text-orange-400 mt-1 italic line-clamp-2">
                                            {dossier.motif_fermeture}
                                        </p>
                                    )}
                                </div>
                                
                                {permissions.canClose && !isReadOnly && (
                                    <Button
                                        variant="default"
                                        size={isMobile ? "sm" : "default"}
                                        onClick={onCloseToggle}
                                        className="bg-green-600 hover:bg-green-700 shrink-0 w-full sm:w-auto"
                                    >
                                        <LockOpen className="h-3.5 w-3.5 mr-1.5" />
                                        Rouvrir
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Card className="border-0 shadow-lg overflow-hidden">
                {/* ✅ Header - Responsive avec menu mobile */}
                <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 px-3 sm:px-6 py-3 sm:py-4 border-b">
                    <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4">
                        {/* Info minimale */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            {/* Ligne 1 mobile : Numéro + Status */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Hash className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                                    <span className="font-mono text-xs sm:text-sm font-semibold whitespace-nowrap">
                                        {displayNumero}
                                    </span>
                                </div>
                                
                                {dossier.is_closed ? (
                                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-400 text-xs">
                                        <Lock className="mr-1 h-3 w-3" />
                                        Fermé
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 text-xs">
                                        <LockOpen className="mr-1 h-3 w-3" />
                                        Ouvert
                                    </Badge>
                                )}
                            </div>

                            {/* Ligne 2 mobile : Commune */}
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground min-w-0">
                                <span className="hidden sm:inline text-gray-400">•</span>
                                <span className="truncate">{dossier.commune}</span>
                            </div>
                        </div>

                        {/* ✅ Boutons d'action - Responsive */}
                        {!isReadOnly && (
                            isMobile ? (
                                // Mobile : Menu dropdown
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="shrink-0 h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        {permissions.canClose && (
                                            <>
                                                <DropdownMenuItem onClick={onCloseToggle}>
                                                    {dossier.is_closed ? (
                                                        <>
                                                            <LockOpen className="h-4 w-4 mr-2" />
                                                            Rouvrir le dossier
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Lock className="h-4 w-4 mr-2" />
                                                            Fermer le dossier
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                        
                                        {!dossier.is_closed && (
                                            <DropdownMenuItem asChild>
                                                <Link href={`/nouveau-lot/${dossier.id}`} className="flex items-center">
                                                    <LandPlot className="h-4 w-4 mr-2" />
                                                    Nouvelle Entrée
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        
                                        {permissions.canEdit && (
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dossiers/${dossier.id}/edit`} className="flex items-center">
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Modifier
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                // Desktop : Boutons classiques
                                <div className="flex gap-2 shrink-0">
                                    {permissions.canClose && (
                                        <Button
                                            variant={dossier.is_closed ? "default" : "destructive"}
                                            size="sm"
                                            onClick={onCloseToggle}
                                            className={`h-8 ${dossier.is_closed 
                                                ? "bg-green-600 hover:bg-green-700" 
                                                : "bg-orange-600 hover:bg-orange-700"}`}
                                        >
                                            {dossier.is_closed ? (
                                                <>
                                                    <LockOpen className="h-3.5 w-3.5 mr-1.5" />
                                                    <span className="hidden lg:inline">Rouvrir</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="h-3.5 w-3.5 mr-1.5" />
                                                    <span className="hidden lg:inline">Fermer</span>
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {!dossier.is_closed && (
                                        <Button asChild size="sm" className="h-8">
                                            <Link href={`/nouveau-lot/${dossier.id}`}>
                                                <LandPlot className="h-3.5 w-3.5 mr-1.5" />
                                                <span className="hidden lg:inline">Nouvelle Entrée</span>
                                                <span className="lg:hidden">Entrée</span>
                                            </Link>
                                        </Button>
                                    )}

                                    {permissions.canEdit ? (
                                        <Button asChild variant="outline" size="sm" className="h-8">
                                            <Link href={`/dossiers/${dossier.id}/edit`}>
                                                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                                <span className="hidden xl:inline">Modifier</span>
                                            </Link>
                                        </Button>
                                    ) : dossier.can_modify !== false && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span>
                                                        <Button variant="outline" size="sm" disabled className="h-8">
                                                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                                            <span className="hidden xl:inline">Modifier</span>
                                                        </Button>
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Dossier fermé - Modification interdite</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                </div>

                <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                    {/* ✅ Localisation - Responsive Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        <InfoCard
                            icon={Building2}
                            label="Circonscription"
                            value={dossier.circonscription}
                            colorClass="blue"
                        />
                        <InfoCard
                            icon={MapPin}
                            label={dossier.type_commune}
                            value={dossier.commune}
                            colorClass="green"
                        />
                        <InfoCard
                            icon={MapPin}
                            label="Fokontany"
                            value={dossier.fokontany}
                            colorClass="purple"
                            className="sm:col-span-2 lg:col-span-1"
                        />
                    </div>

                    {/* ✅ Dates - Responsive Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        <div className="p-3 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900">
                            <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-1">Descente</p>
                                    <p className="text-xs sm:text-sm font-medium leading-snug">
                                        {formatDate(dossier.date_descente_debut)}
                                        <span className="hidden sm:inline"> – </span>
                                        <span className="sm:hidden"> - </span>
                                        {formatDate(dossier.date_descente_fin)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {duration} jour{duration > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900">
                            <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-1">Ouverture</p>
                                    <p className="text-xs sm:text-sm font-semibold">{formatDate(dossier.date_ouverture)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Il y a {daysSinceOpening} jour{daysSinceOpening > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ Statistiques - Responsive Badges */}
                    <div className="flex flex-wrap gap-2 pt-2 sm:pt-3 border-t">
                        <Badge variant="secondary" className="px-2.5 sm:px-3 py-1 text-xs">
                            <User className="mr-1 sm:mr-1.5 h-3 w-3" />
                            <span className="hidden xs:inline">{demandeursCount} Demandeur{demandeursCount > 1 ? 's' : ''}</span>
                            <span className="xs:hidden">{demandeursCount}</span>
                        </Badge>
                        <Badge variant="secondary" className="px-2.5 sm:px-3 py-1 text-xs">
                            <LandPlot className="mr-1 sm:mr-1.5 h-3 w-3" />
                            <span className="hidden xs:inline">{proprietesCount} Propriété{proprietesCount > 1 ? 's' : ''}</span>
                            <span className="xs:hidden">{proprietesCount}</span>
                        </Badge>
                        {dossier.is_closed && dossier.date_fermeture && (
                            <Badge variant="outline" className="px-2.5 sm:px-3 py-1 text-xs bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-400">
                                <Lock className="mr-1 sm:mr-1.5 h-3 w-3" />
                                <span className="hidden sm:inline">Fermé le {formatDate(dossier.date_fermeture)}</span>
                                <span className="sm:hidden">Fermé</span>
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ✅ Composant InfoCard réutilisable et responsive
interface InfoCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    colorClass: 'blue' | 'green' | 'purple' | 'orange' | 'indigo';
    className?: string;
}

function InfoCard({ icon: Icon, label, value, colorClass, className = '' }: InfoCardProps) {
    const colors = {
        blue: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400',
        green: 'bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900 text-green-600 dark:text-green-400',
        purple: 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900 text-purple-600 dark:text-purple-400',
        orange: 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900 text-orange-600 dark:text-orange-400',
        indigo: 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400',
    };

    const bgColor = colors[colorClass].split(' ')[0] + ' ' + colors[colorClass].split(' ')[1];
    const borderColor = colors[colorClass].split(' ')[2] + ' ' + colors[colorClass].split(' ')[3];
    const iconColor = colors[colorClass].split(' ')[4] + ' ' + colors[colorClass].split(' ')[5];

    return (
        <div className={`p-2.5 sm:p-3 ${bgColor} rounded-lg border ${borderColor} ${className}`}>
            <div className="flex items-start gap-2">
                <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${iconColor} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-xs sm:text-sm font-semibold truncate" title={value}>{value}</p>
                </div>
            </div>
        </div>
    );
}