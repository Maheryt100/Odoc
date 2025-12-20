// pages/proprietes/components/ProprieteTable.tsx - ✅ PAGINATION CORRIGÉE

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, Eye, Pencil, Trash, Ellipsis, Link2, Archive, ArchiveRestore, LandPlot, User } from 'lucide-react';
import type { ProprieteWithDetails, ProprietesIndexProps } from '../types';
import type { Propriete } from '@/types';
import { getRowClassName, isPropertyArchived, hasActiveDemandeurs } from '../helpers';
import EditProprieteDialog from '../components/EditProprieteDialog';
import { useIsMobile } from '@/hooks/useResponsive';
import { ProprieteMobileCard } from './ProprieteMobileCard';

interface ProprieteTableProps extends Omit<ProprietesIndexProps, 'proprietes'> {
    proprietes: ProprieteWithDetails[];
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onSelectPropriete: (propriete: Propriete) => void;
}

export default function ProprieteTable({
    proprietes,
    dossier,
    onDeletePropriete,
    onArchivePropriete,
    onUnarchivePropriete,
    isPropertyIncomplete,
    onLinkDemandeur,
    onSelectPropriete,
    currentPage,
    itemsPerPage,
    onPageChange
}: ProprieteTableProps) {
    
    const [editingPropriete, setEditingPropriete] = useState<ProprieteWithDetails | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const isMobile = useIsMobile();

    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProprietes = proprietes.slice(startIndex, endIndex);
    const totalPages = Math.ceil(proprietes.length / itemsPerPage);

    const handleEditClick = (propriete: ProprieteWithDetails) => {
        setEditingPropriete(propriete);
        setIsEditDialogOpen(true);
    };

    // ✅ CORRECTION: Fonction pagination utilisée
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

    if (proprietes.length === 0) {
        return (
            <div className="text-center py-12">
                <LandPlot className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-medium text-muted-foreground">Aucune propriété trouvée</p>
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
                    {paginatedProprietes.map((propriete) => (
                        <ProprieteMobileCard
                            key={propriete.id}
                            propriete={propriete}
                            isIncomplete={isPropertyIncomplete(propriete)}
                            dossierClosed={dossier.is_closed}
                            onView={() => onSelectPropriete(propriete)}
                            onEdit={() => handleEditClick(propriete)}
                            onLink={() => onLinkDemandeur?.(propriete)}
                            onArchive={() => onArchivePropriete(propriete.id)}
                            onUnarchive={() => onUnarchivePropriete(propriete.id)}
                            onDelete={() => onDeletePropriete(propriete.id)}
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
                                Lot
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Titre
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <div className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    <span>Propriété/Propriétaire</span>
                                </div>
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Contenance
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Nature
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Statut
                            </th>
                            <th className="px-4 py-2.5 w-[50px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {paginatedProprietes.map((propriete) => {
                            const isIncomplete = isPropertyIncomplete(propriete);
                            const isArchived = isPropertyArchived(propriete);
                            const hasDemandeurs = hasActiveDemandeurs(propriete);
                            const rowClass = getRowClassName(propriete, isIncomplete);
                            const canModify = !isArchived && !dossier.is_closed;
                            
                            return (
                                <tr 
                                    key={propriete.id} 
                                    className={rowClass} 
                                    onClick={() => onSelectPropriete(propriete)}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{propriete.lot}</span>
                                            {isIncomplete && (
                                                <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                            )}
                                            {isArchived && (
                                                <Archive className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {propriete.titre ? `TNº${propriete.titre}` : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-start gap-2 max-w-[250px]">
                                            {propriete.proprietaire ? (
                                                <span className="text-sm text-muted-foreground line-clamp-2" title={propriete.proprietaire}>
                                                    {propriete.proprietaire}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground/50">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {propriete.contenance ? `${propriete.contenance} m²` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground capitalize">
                                        {propriete.nature || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {isArchived ? (
                                            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                                <Archive className="mr-1 h-3 w-3" />Acquise
                                            </Badge>
                                        ) : hasDemandeurs ? (
                                            <Badge variant="default" className="text-xs">Avec demandeur</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-xs">Sans demandeur</Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Ellipsis className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onSelectPropriete(propriete)}>
                                                    <Eye className="mr-2 h-4 w-4" />Voir détails
                                                </DropdownMenuItem>
                                                {!dossier.is_closed && (
                                                    <>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleEditClick(propriete)}
                                                            disabled={!canModify}
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4" />Modifier
                                                        </DropdownMenuItem>
                                                        {!isArchived && (
                                                            <DropdownMenuItem onClick={() => onLinkDemandeur?.(propriete)}>
                                                                <Link2 className="mr-2 h-4 w-4" />Lier un demandeur
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        {isArchived ? (
                                                            <DropdownMenuItem 
                                                                className="text-blue-600" 
                                                                onClick={() => onUnarchivePropriete(propriete.id)}
                                                            >
                                                                <ArchiveRestore className="mr-2 h-4 w-4" />Désarchiver
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem 
                                                                className="text-green-600" 
                                                                onClick={() => onArchivePropriete(propriete.id)}
                                                            >
                                                                <Archive className="mr-2 h-4 w-4" />Archiver (acquise)
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem 
                                                            className="text-red-500" 
                                                            onClick={() => onDeletePropriete(propriete.id)}
                                                        >
                                                            <Trash className="mr-2 h-4 w-4" />Supprimer
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
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

            <EditProprieteDialog
                propriete={editingPropriete}
                dossier={dossier}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
            />
        </>
    );
}