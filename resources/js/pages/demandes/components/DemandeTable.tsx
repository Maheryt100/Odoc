// pages/demandes/components/DemandeTable.tsx - ✅ VERSION TABLE COMPACTE

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
    AlertCircle, 
    Eye, 
    Ellipsis, 
    Archive, 
    ArchiveRestore, 
    FileText,
    Users,
    Home,
    DollarSign,
    Lock,
    LockOpen
} from 'lucide-react';
import type { DemandeWithDetails, DocumentDemande } from '../types';
import type { Dossier } from '@/types';
import { getRowClassName, formatNomComplet, isProprieteIncomplete } from '../helpers';

interface DemandeTableProps {
    demandes: DemandeWithDetails[];
    dossier: Dossier;
    onArchive: (doc: DocumentDemande) => void;
    onUnarchive: (doc: DocumentDemande) => void;
    onSelectDemande: (doc: DocumentDemande) => void;
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export default function DemandeTable({
    demandes,
    dossier,
    onArchive,
    onUnarchive,
    onSelectDemande,
    currentPage,
    itemsPerPage,
    onPageChange
}: DemandeTableProps) {
    
    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDemandes = demandes.slice(startIndex, endIndex);
    const totalPages = Math.ceil(demandes.length / itemsPerPage);

    if (demandes.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-medium text-muted-foreground">Aucune demande trouvée</p>
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
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Propriété
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Demandeur(s)
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Prix total
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Statut
                            </th>
                            <th className="px-4 py-2.5 w-[50px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {paginatedDemandes.map((doc) => {
                            const isArchived = doc._computed.isArchived;
                            const isIncomplete = doc._computed.isIncomplete;
                            const hasValidDemandeurs = doc._computed.hasValidDemandeurs;
                            const premierDemandeur = hasValidDemandeurs ? doc.demandeurs[0]?.demandeur : null;
                            const rowClass = getRowClassName(doc, isIncomplete);
                            
                            return (
                                <tr 
                                    key={doc.id} 
                                    className={`${rowClass} cursor-pointer transition-colors`}
                                    onClick={() => onSelectDemande(doc)}
                                >
                                    {/* Colonne Propriété */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-start gap-2">
                                            <Home className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm">Lot {doc.propriete?.lot || 'N/A'}</span>
                                                    {isProprieteIncomplete(doc.propriete) && (
                                                        <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {doc.propriete?.titre ? `TNº${doc.propriete.titre}` : 'Sans titre'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Colonne Demandeur(s) */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-start gap-2">
                                            <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0">
                                                {premierDemandeur ? (
                                                    <>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-medium text-sm truncate">
                                                                {formatNomComplet(premierDemandeur)}
                                                            </span>
                                                            {isIncomplete && (
                                                                <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        {doc.nombre_demandeurs > 1 && (
                                                            <Badge variant="secondary" className="text-xs mt-1">
                                                                +{doc.nombre_demandeurs - 1} autre{doc.nombre_demandeurs > 2 ? 's' : ''}
                                                            </Badge>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground italic">
                                                        Aucun demandeur
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Colonne Prix */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            
                                            <span className="font-bold text-primary text-sm">
                                                {doc.total_prix 
                                                    ? new Intl.NumberFormat('fr-FR').format(doc.total_prix) 
                                                    : '0'
                                                } Ar
                                            </span>
                                        </div>
                                    </td>

                                    {/* Colonne Statut */}
                                    <td className="px-4 py-3">
                                        {isArchived ? (
                                            <Badge variant="outline" className="bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                <Lock className="h-3 w-3 mr-1" />
                                                Archivée
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                <LockOpen className="h-3 w-3 mr-1" />
                                                Active
                                            </Badge>
                                        )}
                                    </td>

                                    {/* Colonne Actions */}
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Ellipsis className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onSelectDemande(doc)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Voir détails
                                                </DropdownMenuItem>
                                                {!dossier.is_closed && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        {isArchived ? (
                                                            <DropdownMenuItem 
                                                                className="text-blue-600" 
                                                                onClick={() => onUnarchive(doc)}
                                                            >
                                                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                                                Désarchiver
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem 
                                                                className="text-orange-600" 
                                                                onClick={() => onArchive(doc)}
                                                            >
                                                                <Archive className="mr-2 h-4 w-4" />
                                                                Archiver
                                                            </DropdownMenuItem>
                                                        )}
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

            {/* Pagination compacte */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8"
                    >
                        Précédent
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onPageChange(page)}
                            className="h-8 min-w-8"
                        >
                            {page}
                        </Button>
                    ))}
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
            )}
        </>
    );
}