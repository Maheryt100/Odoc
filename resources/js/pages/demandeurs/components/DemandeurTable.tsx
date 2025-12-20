// pages/demandeurs/components/DemandeurTable.tsx - ✅ PAGINATION CORRIGÉE

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, Eye, Pencil, Trash, Ellipsis, Link2, Users } from 'lucide-react';
import type { DemandeurWithProperty, DemandeursIndexProps } from '../types';
import { getDemandeurStatusBadge, getRowClassName, formatNomComplet } from '../helpers';
import { useIsMobile } from '@/hooks/useResponsive';
import { DemandeurMobileCard } from './DemandeurMobileCard';

interface DemandeurTableProps extends Omit<DemandeursIndexProps, 'demandeurs'> {
    demandeurs: DemandeurWithProperty[];
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onEditDemandeur?: (demandeur: DemandeurWithProperty) => void;
}

export default function DemandeurTable({
    demandeurs,
    dossier,
    proprietes,
    onDeleteDemandeur,
    isDemandeurIncomplete,
    onLinkPropriete,
    onSelectDemandeur,
    onEditDemandeur, 
    currentPage,
    itemsPerPage,
    onPageChange
}: DemandeurTableProps) {
    
    const isMobile = useIsMobile();

    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDemandeurs = demandeurs.slice(startIndex, endIndex);
    const totalPages = Math.ceil(demandeurs.length / itemsPerPage);

    // ✅ CORRECTION: Fonction pagination déclarée AVANT utilisation
    function renderPagination() {
        if (totalPages <= 1) return null;
        
        return (
            <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8"
                >
                    Précédent
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                        page = i + 1;
                    } else if (currentPage <= 3) {
                        page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                    } else {
                        page = currentPage - 2 + i;
                    }
                    return (
                        <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onPageChange(page)}
                            className="h-8 min-w-8"
                        >
                            {page}
                        </Button>
                    );
                })}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8"
                >
                    Suivant
                </Button>
            </div>
        );
    }

    if (demandeurs.length === 0) {
        return (
            <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-medium text-muted-foreground">Aucun demandeur trouvé</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                    Essayez de modifier vos filtres ou critères de recherche
                </p>
            </div>
        );
    }

    // 📱 VERSION MOBILE
    if (isMobile) {
        return (
            <>
                <div className="space-y-3">
                    {paginatedDemandeurs.map((demandeur) => (
                        <DemandeurMobileCard
                            key={demandeur.id}
                            demandeur={demandeur}
                            isIncomplete={isDemandeurIncomplete(demandeur)}
                            dossierClosed={dossier.is_closed}
                            onView={() => onSelectDemandeur?.(demandeur)}
                            onEdit={() => onEditDemandeur?.(demandeur)}
                            onLink={() => onLinkPropriete?.(demandeur)}
                            onDelete={() => onDeleteDemandeur(demandeur.id)}
                        />
                    ))}
                </div>
                {renderPagination()}
            </>
        );
    }

    // 💻 VERSION DESKTOP
    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/30 border-b">
                        <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Nom complet
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                CIN
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Domiciliation
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Situation
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Téléphone
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Statut
                            </th>
                            <th className="px-4 py-2.5 w-[50px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {paginatedDemandeurs.map((demandeur) => {
                            const isIncomplete = isDemandeurIncomplete(demandeur);
                            const rowClass = getRowClassName(demandeur);
                            const statusBadge = getDemandeurStatusBadge(demandeur);
                            
                            return (
                                <tr 
                                    key={demandeur.id} 
                                    className={rowClass} 
                                    onClick={() => onSelectDemandeur?.(demandeur)}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">
                                                {formatNomComplet(demandeur)}
                                            </span>
                                            {isIncomplete && (
                                                <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                                        {demandeur.cin}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {demandeur.domiciliation || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {demandeur.situation_familiale || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {demandeur.telephone || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge 
                                            variant={statusBadge.variant} 
                                            className={`text-xs ${statusBadge.className}`}
                                        >
                                            {statusBadge.icon && (
                                                <statusBadge.icon className="mr-1 h-3 w-3" />
                                            )}
                                            {statusBadge.text}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Ellipsis className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onSelectDemandeur?.(demandeur)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Voir détails
                                                </DropdownMenuItem>
                                                {!dossier.is_closed && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => onEditDemandeur?.(demandeur)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Modifier
                                                        </DropdownMenuItem>
                                                        {proprietes.length > 0 && (
                                                            <DropdownMenuItem onClick={() => onLinkPropriete?.(demandeur)}>
                                                                <Link2 className="mr-2 h-4 w-4" />
                                                                Lier à une propriété
                                                            </DropdownMenuItem>
                                                        )}
                                                    </>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="text-red-500" 
                                                    onClick={() => onDeleteDemandeur(demandeur.id)}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {renderPagination()}
        </>
    );
}