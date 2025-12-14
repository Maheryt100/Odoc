// resources/js/pages/dossiers/components/DossierInfoSection.tsx - ✅ VERSION ULTRA-COMPACTE
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Lock, LockOpen, Pencil, LandPlot,
    MapPin, Calendar, Building2, Hash, User, Clock, AlertCircle
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DossierInfoSectionProps } from '../types';
import { formatDate, getDurationInDays, getDaysSince } from '../helpers';

export default function DossierInfoSection({ 
    dossier, 
    demandeursCount, 
    proprietesCount,
    onCloseToggle,
    permissions
}: DossierInfoSectionProps) {
    
    const duration = getDurationInDays(dossier.date_descente_debut, dossier.date_descente_fin);
    const daysSinceOpening = getDaysSince(dossier.date_ouverture);

    // ✅ Affichage du numéro d'ouverture (gère les anciens strings et nouveaux integers)
    const displayNumero = typeof dossier.numero_ouverture === 'number' 
        ? `N° ${dossier.numero_ouverture}`
        : (dossier.numero_ouverture_display || dossier.numero_ouverture || 'Non assigné');

    return (
        <div className="space-y-4">
            {dossier.is_closed && (
                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                                        Dossier fermé le {formatDate(dossier.date_fermeture!)}
                                        {dossier.closedBy && <> par {dossier.closedBy.name}</>}
                                    </p>
                                    {dossier.motif_fermeture && (
                                        <p className="text-xs text-orange-700 dark:text-orange-400 mt-1 italic">
                                            {dossier.motif_fermeture}
                                        </p>
                                    )}
                                </div>
                                
                                {permissions.canClose && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={onCloseToggle}
                                        className="bg-green-600 hover:bg-green-700 shrink-0 h-8"
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

            <Card className="border-0 shadow-lg">
                {/* Header ultra-compact */}
                <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 px-6 py-3 border-b">
                    <div className="flex items-center justify-between gap-4">
                        {/* Info minimale */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-sm font-semibold">
                                    {displayNumero}
                                </span>
                            </div>
                            
                            {dossier.is_closed ? (
                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-400">
                                    <Lock className="mr-1 h-3 w-3" />
                                    Fermé
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400">
                                    <LockOpen className="mr-1 h-3 w-3" />
                                    Ouvert
                                </Badge>
                            )}

                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground truncate">{dossier.commune}</span>
                        </div>

                        {/* Boutons d'action compacts */}
                        <div className="flex gap-2">
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
                                            Rouvrir
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-3.5 w-3.5 mr-1.5" />
                                            Fermer
                                        </>
                                    )}
                                </Button>
                            )}

                            {!dossier.is_closed && (
                                <Button asChild size="sm" className="h-8">
                                    <Link href={`/nouveau-lot/${dossier.id}`}>
                                        <LandPlot className="h-3.5 w-3.5 mr-1.5" />
                                        Nouvelle Entrée
                                    </Link>
                                </Button>
                            )}

                            {permissions.canEdit ? (
                                <Button asChild variant="outline" size="sm" className="h-8">
                                    <Link href={`/dossiers/${dossier.id}/edit`}>
                                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                        Modifier
                                    </Link>
                                </Button>
                            ) : dossier.can_modify !== false && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Button variant="outline" size="sm" disabled className="h-8">
                                                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                                    Modifier
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
                    </div>
                </div>

                <CardContent className="p-4 space-y-4">
                    {/* Localisation compacte */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                            <div className="flex items-start gap-2">
                                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-0.5">Circonscription</p>
                                    <p className="text-sm font-semibold truncate">{dossier.circonscription}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-0.5">{dossier.type_commune}</p>
                                    <p className="text-sm font-semibold truncate">{dossier.commune}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-0.5">Fokontany</p>
                                    <p className="text-sm font-semibold truncate">{dossier.fokontany}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dates compactes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900">
                            <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-1">Descente</p>
                                    <p className="text-xs">
                                        {formatDate(dossier.date_descente_debut)} – {formatDate(dossier.date_descente_fin)}
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
                                    <p className="text-sm font-semibold">{formatDate(dossier.date_ouverture)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Il y a {daysSinceOpening} jour{daysSinceOpening > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistiques compactes */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <Badge variant="secondary" className="px-3 py-1 text-xs">
                            <User className="mr-1.5 h-3 w-3" />
                            {demandeursCount} Demandeur{demandeursCount > 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="secondary" className="px-3 py-1 text-xs">
                            <LandPlot className="mr-1.5 h-3 w-3" />
                            {proprietesCount} Propriété{proprietesCount > 1 ? 's' : ''}
                        </Badge>
                        {dossier.is_closed && dossier.date_fermeture && (
                            <Badge variant="outline" className="px-3 py-1 text-xs bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-400">
                                <Lock className="mr-1.5 h-3 w-3" />
                                Fermé le {formatDate(dossier.date_fermeture)}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}