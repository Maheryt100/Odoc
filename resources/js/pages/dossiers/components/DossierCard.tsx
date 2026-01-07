// DossierCard.tsx

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
    DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel 
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
    ChevronDown, ChevronUp, Eye, Pencil, EllipsisVertical, 
    LandPlot, UserPlus, Link2, Archive, Lock, LockOpen, 
    Calendar, Hash, MapPin, Building2, AlertCircle, User, FileOutput
} from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import type { Dossier } from '@/types';
import { calculateDossierPermissions, getDisabledDocumentButtonTooltip } from '../helpers';
import { useState } from 'react';

interface DossierCardProps {
    dossier: Dossier & {
        can_modify?: boolean;
        can_close?: boolean;
    };
    auth: {
        user: {
            id: number;
            role: string;
            id_district?: number | null;
        };
    };
    isReadOnly?: boolean;
}

export function DossierCard({ dossier, auth, isReadOnly = false }: DossierCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasArchivedProperties = dossier.proprietes?.some((p) => p.is_archived === true);

    // Calcul des permissions
    const permissions = calculateDossierPermissions(dossier, auth.user);
    const docTooltip = getDisabledDocumentButtonTooltip(dossier, auth.user);

    // Affichage sécurisé du numéro
    const displayNumero = (() => {
        if (!dossier.numero_ouverture) return 'N/A';
        return typeof dossier.numero_ouverture === 'number' 
            ? `N° ${dossier.numero_ouverture}`
            : `N° ${dossier.numero_ouverture}`;
    })();

    const demandeursCount = dossier.demandeurs_count ?? 0;
    const proprietesCount = dossier.proprietes_count ?? 0;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
                {/* Header responsive */}
                <div className="flex items-start gap-2">
                    {/* Bouton expand */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-7 w-7 shrink-0 mt-1"
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {/* Contenu principal - Flex column sur mobile */}
                    <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => router.visit(route('dossiers.show', dossier.id))}
                    >
                        {/* Ligne 1 : Nom + Numéro */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-semibold text-base truncate">
                                {dossier.nom_dossier}
                            </h3>
                            
                            <Badge 
                                variant="outline" 
                                className="text-xs bg-blue-50 text-blue-700 border-blue-300 font-mono shrink-0"
                            >
                                <Hash className="h-3 w-3 mr-1" />
                                {displayNumero}
                            </Badge>
                        </div>

                        {/* Ligne 2 : Statut + Commune */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                            {dossier.is_closed ? (
                                <Badge variant="outline" className="text-xs flex items-center gap-1 bg-orange-100 text-orange-700 border-orange-300">
                                    <Lock className="h-3 w-3" />
                                    Fermé
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-xs flex items-center gap-1 bg-green-100 text-green-700 border-green-300">
                                    <LockOpen className="h-3 w-3" />
                                    Ouvert
                                </Badge>
                            )}

                            {hasArchivedProperties && (
                                <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Archive className="h-3 w-3" />
                                    <span className="hidden sm:inline">Propriétés acquises</span>
                                    <span className="sm:hidden">Acquises</span>
                                </Badge>
                            )}

                            <span className="text-muted-foreground text-sm truncate">
                                {dossier.commune}
                            </span>
                        </div>

                        {/* Ligne 3 : Compteurs */}
                        <div className="flex items-center gap-2">
                            <Badge 
                                variant="secondary" 
                                className={`text-xs ${demandeursCount === 0 ? 'bg-red-100 text-red-700' : ''}`}
                            >
                                <User className="h-3 w-3 mr-1" />
                                {demandeursCount}
                            </Badge>
                            <Badge 
                                variant="secondary" 
                                className={`text-xs ${proprietesCount === 0 ? 'bg-red-100 text-red-700' : ''}`}
                            >
                                <LandPlot className="h-3 w-3 mr-1" />
                                {proprietesCount}
                            </Badge>
                        </div>
                    </div>

                    {/* Menu actions avec protection Documents */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                <EllipsisVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            
                            <DropdownMenuItem asChild>
                                <Link href={route("dossiers.show", dossier.id)} className="flex items-center">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir Détails
                                </Link>
                            </DropdownMenuItem>
                            
                            {!isReadOnly && permissions.canEdit && (
                                <DropdownMenuItem asChild>
                                    <Link href={route("dossiers.edit", dossier.id)} className="flex items-center">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            {/* BOUTON DOCUMENTS AVEC PROTECTION */}
                            {permissions.canGenerateDocuments ? (
                                <DropdownMenuItem asChild>
                                    <Link href={route("documents.generate", dossier.id)} className="flex items-center">
                                        <FileOutput className="mr-2 h-4 w-4" />
                                        Documents
                                    </Link>
                                </DropdownMenuItem>
                            ) : (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="opacity-50 px-2 py-1.5 text-sm cursor-not-allowed flex items-center">
                                                <FileOutput className="mr-2 h-4 w-4" />
                                                Documents
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[200px] text-xs">
                                            <p>{docTooltip || 'Génération non disponible'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            
                            {!isReadOnly && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Ajouter</DropdownMenuLabel>
                                    
                                    {!dossier.is_closed && (
                                        <DropdownMenuItem asChild>
                                            <Link href={route("nouveau-lot.create", dossier.id)} className="flex items-center">
                                                <LandPlot className="mr-2 h-4 w-4" />
                                                Nouveau Lot
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    
                                    <DropdownMenuItem asChild>
                                        <Link href={route("ajouter-demandeur.create", dossier.id)} className="flex items-center">
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Ajouter Demandeur
                                        </Link>
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem asChild>
                                        <Link href={route("lier-demandeur.create", dossier.id)} className="flex items-center">
                                            <Link2 className="mr-2 h-4 w-4" />
                                            Lier Existant
                                        </Link>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Section étendue responsive */}
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t ml-0 sm:ml-9 space-y-4">
                        {/* Grille responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <InfoItem icon={Building2} label="Type Commune" value={dossier.type_commune} />
                            <InfoItem icon={MapPin} label="Circonscription" value={dossier.circonscription} />
                            <InfoItem icon={MapPin} label="Fokontany" value={dossier.fokontany} />
                            <InfoItem 
                                icon={Calendar} 
                                label="Descente" 
                                value={`${formatDate(dossier.date_descente_debut)} – ${formatDate(dossier.date_descente_fin)}`}
                            />
                        </div>

                        {/* Dates ouverture/fermeture */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t">
                            <InfoItem 
                                icon={Calendar} 
                                label="Date d'ouverture" 
                                value={formatDate(dossier.date_ouverture)}
                            />

                            {dossier.is_closed && dossier.date_fermeture && (
                                <>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1 text-xs text-orange-600">
                                            <Lock className="h-3 w-3" />
                                            <span>Date de fermeture</span>
                                        </div>
                                        <p className="font-medium text-sm text-orange-700">
                                            {formatDate(dossier.date_fermeture)}
                                        </p>
                                    </div>

                                    {dossier.closedBy && (
                                        <InfoItem 
                                            icon={User} 
                                            label="Fermé par" 
                                            value={dossier.closedBy.name}
                                        />
                                    )}
                                </>
                            )}
                        </div>

                        {/* Alerte si incomplet */}
                        {(demandeursCount === 0 || proprietesCount === 0) && (
                            <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                <div className="text-xs text-amber-800 dark:text-amber-200">
                                    <strong>Dossier incomplet:</strong>
                                    {demandeursCount === 0 && ' Aucun demandeur.'}
                                    {proprietesCount === 0 && ' Aucune propriété.'}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Composant helper
function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon className="h-3 w-3" />
                <span>{label}</span>
            </div>
            <p className="font-medium text-sm break-words">{value}</p>
        </div>
    );
}

// Helper de formatage
function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}