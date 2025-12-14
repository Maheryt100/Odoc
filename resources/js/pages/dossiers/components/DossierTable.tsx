// resources/js/pages/dossiers/components/DossierTable.tsx - ✅ VERSION SIMPLIFIÉE
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
    ChevronDown, ChevronUp, Eye, Pencil, Trash2, 
    EllipsisVertical, Lock, LockOpen, 
    FileText, FileOutput, Folder,
    Calendar, MapPin, User, LandPlot, Building2
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
    
    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDossiers = dossiers.slice(startIndex, endIndex);
    const totalPages = Math.ceil(dossiers.length / itemsPerPage);

    if (dossiers.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Folder className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">
                        Aucun dossier trouvé
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                        Essayez de modifier vos filtres ou critères de recherche
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {paginatedDossiers.map((dossier) => {
                    const isExpanded = expandedRows.has(dossier.id);
                    const permissions = calculateDossierPermissions(dossier, auth.user);
                    const docTooltip = getDisabledDocumentButtonTooltip(dossier, auth.user);

                    const demandeursCount = dossier.demandeurs_count ?? 0;
                    const proprietesCount = dossier.proprietes_count ?? 0;

                    return (
                        <Card key={dossier.id} className="hover:shadow-lg transition-all border-0 shadow-md">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    {/* Bouton expand */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onToggleExpand(dossier.id)}
                                        className="h-8 w-8 shrink-0"
                                    >
                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>

                                    {/* Contenu principal */}
                                    <div
                                        className="flex-1 cursor-pointer flex items-center gap-3 flex-wrap"
                                        onClick={() => router.visit(route('dossiers.show', dossier.id))}
                                    >
                                        {/* Nom du dossier */}
                                        <h3 className="font-semibold text-lg truncate max-w-[250px]">
                                            {dossier.nom_dossier}
                                        </h3>

                                        {/* Statut ouvert/fermé */}
                                        {dossier.is_closed ? (
                                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-400">
                                                <Lock className="h-3 w-3 mr-1" />
                                                Fermé
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400">
                                                <LockOpen className="h-3 w-3 mr-1" />
                                                Ouvert
                                            </Badge>
                                        )}

                                        <span className="text-muted-foreground">•</span>

                                        {/* Commune */}
                                        <span className="text-muted-foreground truncate max-w-[200px]">
                                            {dossier.commune}
                                        </span>

                                        {/* Compteurs - Plus visibles */}
                                        <div className="flex items-center gap-2 ml-auto">
                                            <Badge 
                                                variant="secondary" 
                                                className={`text-xs ${demandeursCount === 0 ? 'bg-red-100 text-red-700 dark:bg-red-950' : ''}`}
                                            >
                                                <User className="h-3 w-3 mr-1" />
                                                {demandeursCount}
                                            </Badge>
                                            <Badge 
                                                variant="secondary" 
                                                className={`text-xs ${proprietesCount === 0 ? 'bg-red-100 text-red-700 dark:bg-red-950' : ''}`}
                                            >
                                                <LandPlot className="h-3 w-3 mr-1" />
                                                {proprietesCount}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Menu actions */}
                                    <DossierActions 
                                        dossier={dossier} 
                                        permissions={permissions} 
                                        docTooltip={docTooltip} 
                                        onDelete={onDelete} 
                                    />
                                </div>

                                {/* Section étendue */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t ml-11 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <InfoItem icon={Building2} label="Type" value={dossier.type_commune} />
                                        <InfoItem icon={MapPin} label="Circonscription" value={dossier.circonscription} />
                                        <InfoItem icon={MapPin} label="Fokontany" value={dossier.fokontany} />
                                        <InfoItem 
                                            icon={Calendar} 
                                            label="Descente" 
                                            value={`${new Date(dossier.date_descente_debut).toLocaleDateString('fr-FR')} – ${new Date(dossier.date_descente_fin).toLocaleDateString('fr-FR')}`}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-9"
                    >
                        Précédent
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onPageChange(page)}
                                className="h-9 min-w-9"
                            >
                                {page}
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-9"
                    >
                        Suivant
                    </Button>
                </div>
            )}
        </>
    );
}

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
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <EllipsisVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={route('dossiers.show', dossier.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir détails
                    </Link>
                </DropdownMenuItem>
                {permissions.canEdit && (
                    <DropdownMenuItem asChild>
                        <Link href={route('dossiers.edit', dossier.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {permissions.canGenerateDocuments ? (
                    <DropdownMenuItem asChild>
                        <Link href={route('documents.generate', dossier.id)}>
                            <FileOutput className="mr-2 h-4 w-4" />
                            Documents
                        </Link>
                    </DropdownMenuItem>
                ) : (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="opacity-50 px-2 py-1.5 text-sm cursor-not-allowed">
                                    <FileOutput className="mr-2 h-4 w-4 inline" />
                                    Documents
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{docTooltip}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                <DropdownMenuItem asChild>
                    <Link href={route('demandes.resume', dossier.id)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Résumé demandes
                    </Link>
                </DropdownMenuItem>
                {permissions.canDelete && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(dossier)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon className="h-3 w-3" />
                <span>{label}</span>
            </div>
            <p className="font-medium text-sm truncate">{value}</p>
        </div>
    );
}