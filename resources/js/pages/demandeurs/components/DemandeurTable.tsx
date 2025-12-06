// pages/demandeurs/components/DemandeurTable.tsx

import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, Eye, Pencil, Trash, Ellipsis, Link2, Users } from 'lucide-react';
import type { DemandeurWithProperty, DemandeursIndexProps } from '../types';
import type { Propriete } from '@/types';
import { getDemandeurStatusBadge, getRowClassName, formatNomComplet } from '../helpers';

interface DemandeurTableProps extends Omit<DemandeursIndexProps, 'demandeurs'> {
    demandeurs: DemandeurWithProperty[];
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export default function DemandeurTable({
    demandeurs,
    dossier,
    proprietes,
    onDeleteDemandeur,
    isDemandeurIncomplete,
    onLinkPropriete,
    onSelectDemandeur,
    currentPage,
    itemsPerPage,
    onPageChange
}: DemandeurTableProps) {
    
    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDemandeurs = demandeurs.slice(startIndex, endIndex);
    const totalPages = Math.ceil(demandeurs.length / itemsPerPage);

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

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/30 border-b">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Nom complet
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                CIN
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Domiciliation
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Situation
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Téléphone
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Statut
                            </th>
                            <th className="px-6 py-4 w-[50px]"></th>
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
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {formatNomComplet(demandeur)}
                                            </span>
                                            {isIncomplete && (
                                                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                                        {demandeur.cin}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {demandeur.domiciliation || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {demandeur.situation_familiale || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {demandeur.telephone || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge 
                                            variant={statusBadge.variant} 
                                            className={statusBadge.className}
                                        >
                                            {statusBadge.icon && (
                                                <statusBadge.icon className="mr-1 h-3 w-3" />
                                            )}
                                            {statusBadge.text}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
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
                                                        <DropdownMenuItem asChild>
                                                            <Link
                                                                href={route('demandeurs.edit', {
                                                                    id_dossier: dossier.id,
                                                                    id_demandeur: demandeur.id
                                                                })}
                                                                className="flex items-center"
                                                            >
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Modifier
                                                            </Link>
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6 pb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Précédent
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </Button>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Suivant
                    </Button>
                </div>
            )}
        </>
    );
}