// DossierTable.tsx 

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
    DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
    ChevronDown, ChevronUp, Eye, Pencil, Trash2, 
    EllipsisVertical, Lock, LockOpen, 
    FileText, FileOutput, Folder,
    Calendar, MapPin, User, LandPlot, Building2, Hash
} from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import type { Dossier } from '@/types';
import { calculateDossierPermissions, getDisabledDocumentButtonTooltip } from '../helpers';

interface DossierTableProps {
    dossiers: Dossier[];
    auth: {
        user: {
            id: number;
            role: string;
            id_district?: number | null;
        };
    };
    expandedRows: Set<number>;
    onToggleExpand: (id: number) => void;
    onDelete: (dossier: Dossier) => void;
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export default function DossierTable({
    dossiers,
    auth,
    expandedRows,
    onToggleExpand,
    onDelete,
    currentPage,
    itemsPerPage,
    onPageChange
}: DossierTableProps) {
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDossiers = dossiers.slice(startIndex, endIndex);
    const totalPages = Math.ceil(dossiers.length / itemsPerPage);

    if (dossiers.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 sm:py-12 text-center">
                    <Folder className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground/30" />
                    <p className="text-base sm:text-lg font-medium text-muted-foreground mb-2">
                        Aucun dossier trouvé
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
                        Essayez de modifier vos filtres
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            {/* Liste des dossiers - Spacing adaptatif */}
            <div className="space-y-2 sm:space-y-3">
                {paginatedDossiers.map((dossier) => {
                    const isExpanded = expandedRows.has(dossier.id);
                    const permissions = calculateDossierPermissions(dossier, auth.user);
                    const docTooltip = getDisabledDocumentButtonTooltip(dossier, auth.user);

                    const demandeursCount = dossier.demandeurs_count ?? 0;
                    const proprietesCount = dossier.proprietes_count ?? 0;

                    // Affichage sécurisé du numéro
                    const displayNumero = (() => {
                        if (!dossier.numero_ouverture) return 'N/A';
                        return typeof dossier.numero_ouverture === 'number' 
                            ? `N° ${dossier.numero_ouverture}`
                            : `N° ${dossier.numero_ouverture}`;
                    })();

                    return (
                        <Card key={dossier.id} className="hover:shadow-lg transition-all border-0 shadow-md">
                            <CardContent className="p-3 sm:p-4">
                                {/* Header mobile-first */}
                                <div className="flex items-start gap-2">
                                    {/* Bouton expand */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onToggleExpand(dossier.id)}
                                        className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 mt-0.5"
                                    >
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </Button>

                                    {/* Contenu principal - Stack sur très petit mobile */}
                                    <div
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => router.visit(route('dossiers.show', dossier.id))}
                                    >
                                        {/* Ligne 1 : Nom + Numéro */}
                                        <div className="flex items-start gap-2 flex-wrap mb-2">
                                            <h3 className="font-semibold text-sm sm:text-base leading-tight break-words flex-1 min-w-0">
                                                {dossier.nom_dossier}
                                            </h3>
                                            
                                            <Badge 
                                                variant="outline" 
                                                className="text-xs bg-blue-50 text-blue-700 border-blue-300 font-mono shrink-0"
                                            >
                                                <Hash className="h-3 w-3 mr-1" />
                                                <span className="hidden xs:inline">{displayNumero}</span>
                                                <span className="xs:hidden">{dossier.numero_ouverture || 'N/A'}</span>
                                            </Badge>
                                        </div>

                                        {/* Ligne 2 : Badges statut */}
                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-2">
                                            {dossier.is_closed ? (
                                                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                                                    <Lock className="h-3 w-3 mr-1" />
                                                    <span className="hidden xs:inline">Fermé</span>
                                                    <span className="xs:hidden">F</span>
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                                    <LockOpen className="h-3 w-3 mr-1" />
                                                    <span className="hidden xs:inline">Ouvert</span>
                                                    <span className="xs:hidden">O</span>
                                                </Badge>
                                            )}

                                            <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                                                {dossier.commune}
                                            </span>
                                        </div>

                                        {/* Ligne 3 : Compteurs - Plus visibles */}
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <Badge 
                                                variant="secondary" 
                                                className={`text-xs px-2 py-0.5 ${demandeursCount === 0 ? 'bg-red-100 text-red-700 dark:bg-red-950' : ''}`}
                                            >
                                                <User className="h-3 w-3 mr-1" />
                                                {demandeursCount}
                                            </Badge>
                                            <Badge 
                                                variant="secondary" 
                                                className={`text-xs px-2 py-0.5 ${proprietesCount === 0 ? 'bg-red-100 text-red-700 dark:bg-red-950' : ''}`}
                                            >
                                                <LandPlot className="h-3 w-3 mr-1" />
                                                {proprietesCount}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Menu actions avec protection Documents */}
                                    <DossierActions 
                                        dossier={dossier} 
                                        permissions={permissions} 
                                        docTooltip={docTooltip} 
                                        onDelete={onDelete} 
                                    />
                                </div>

                                {/* Section étendue - Grid responsive */}
                                {isExpanded && (
                                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t ml-0 sm:ml-9 space-y-3 sm:space-y-4">
                                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                                            <InfoItem 
                                                icon={Building2} 
                                                label="Type" 
                                                value={dossier.type_commune} 
                                            />
                                            <InfoItem 
                                                icon={MapPin} 
                                                label="Circonscription" 
                                                value={dossier.circonscription} 
                                            />
                                            <InfoItem 
                                                icon={MapPin} 
                                                label="Fokontany" 
                                                value={dossier.fokontany} 
                                            />
                                            <InfoItem 
                                                icon={Calendar} 
                                                label="Descente" 
                                                value={`${formatDateShort(dossier.date_descente_debut)} – ${formatDateShort(dossier.date_descente_fin)}`}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Pagination responsive */}
            {totalPages > 1 && (
                <div className="flex flex-col xs:flex-row justify-center items-center gap-2 mt-4 sm:mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-9 w-full xs:w-auto text-xs sm:text-sm"
                    >
                        <span className="hidden xs:inline">Précédent</span>
                        <span className="xs:hidden">‹ Préc</span>
                    </Button>
                    
                    {/* Pages - Scrollable sur mobile si trop de pages */}
                    <div className="flex items-center gap-1 overflow-x-auto max-w-full px-2 xs:px-0">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else {
                                if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                            }
                            
                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => onPageChange(pageNum)}
                                    className="h-8 min-w-8 px-2 sm:h-9 sm:min-w-9 sm:px-3 text-xs sm:text-sm shrink-0"
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-9 w-full xs:w-auto text-xs sm:text-sm"
                    >
                        <span className="hidden xs:inline">Suivant</span>
                        <span className="xs:hidden">Suiv ›</span>
                    </Button>
                </div>
            )}
        </>
    );
}

/* ===================== COMPOSANT ACTIONS ===================== */

interface DossierActionsProps {
    dossier: Dossier;
    permissions: ReturnType<typeof calculateDossierPermissions>;
    docTooltip: string;
    onDelete: (dossier: Dossier) => void;
}

function DossierActions({ dossier, permissions, docTooltip, onDelete }: DossierActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                    <EllipsisVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
                {/* Voir détails */}
                <DropdownMenuItem asChild>
                    <Link href={route('dossiers.show', dossier.id)} className="flex items-center text-sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Voir détails
                    </Link>
                </DropdownMenuItem>
                
                {/* Modifier */}
                {permissions.canEdit && (
                    <DropdownMenuItem asChild>
                        <Link href={route('dossiers.edit', dossier.id)} className="flex items-center text-sm">
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                        </Link>
                    </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                {/* BOUTON DOCUMENTS AVEC PROTECTION */}
                {permissions.canGenerateDocuments ? (
                    <DropdownMenuItem asChild>
                        <Link href={route('documents.generate', dossier.id)} className="flex items-center text-sm">
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
                
                {/* Résumé des demandes */}
                <DropdownMenuItem asChild>
                    <Link href={route('demandes.resume', dossier.id)} className="flex items-center text-sm">
                        <FileText className="mr-2 h-4 w-4" />
                        Résumé
                    </Link>
                </DropdownMenuItem>
                
                {/* Supprimer */}
                {permissions.canDelete && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            className="text-red-600 text-sm" 
                            onClick={() => onDelete(dossier)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/* ===================== HELPERS ===================== */

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon className="h-3 w-3 shrink-0" />
                <span className="truncate">{label}</span>
            </div>
            <p className="font-medium text-xs sm:text-sm break-words">{value}</p>
        </div>
    );
}

function formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short'
    });
}