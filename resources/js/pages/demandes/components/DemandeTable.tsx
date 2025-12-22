// pages/demandes/components/DemandeTable.tsx - ✅ CORRECTION LIGNE 169 & 316

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/useResponsive';
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
    Lock,
    LockOpen,
    Calendar,
    DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DemandeWithDetails } from '../types';
import { Pagination } from '@/components/ui/pagination';

/* ===================== TYPES ===================== */

// ✅ Type partiel pour le demandeur (suffisant pour l'affichage)
interface DemandeurSimple {
    id: number;
    titre_demandeur?: string;
    nom_demandeur: string;
    prenom_demandeur?: string | null;
    cin: string;
}

interface Dossier {
    id: number;
    is_closed: boolean;
}

interface DemandeTableProps {
    demandes: DemandeWithDetails[];
    dossier: Dossier;
    onArchive: (doc: DemandeWithDetails) => void;
    onUnarchive: (doc: DemandeWithDetails) => void;
    onSelectDemande: (doc: DemandeWithDetails) => void;
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    showDateDemande?: boolean;
}

/* ===================== HELPERS ===================== */

// ✅ CORRECTION : Accepter le type partiel
const formatNomComplet = (d: DemandeurSimple) =>
    [d.titre_demandeur, d.nom_demandeur, d.prenom_demandeur].filter(Boolean).join(' ');

const formatDate = (date?: string) =>
    date ? new Date(date + 'T00:00:00').toLocaleDateString('fr-FR') : '-';

/* ===================== COMPONENT ===================== */

export default function DemandeTable({
    demandes,
    dossier,
    onArchive,
    onUnarchive,
    onSelectDemande,
    currentPage,
    itemsPerPage,
    onPageChange,
    showDateDemande = true
}: DemandeTableProps) {
    const isMobile = useIsMobile();

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDemandes = demandes.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(demandes.length / itemsPerPage);

    if (demandes.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-medium text-muted-foreground">Aucune demande trouvée</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* ================= MOBILE ================= */}
            {isMobile ? (
                <div className="space-y-3">
                    {paginatedDemandes.map((demande) => (
                        <MobileDemandeCard
                            key={demande.id}
                            demande={demande}
                            onSelect={() => onSelectDemande(demande)}
                            onArchive={() => onArchive(demande)}
                            onUnarchive={() => onUnarchive(demande)}
                            dossier={dossier}
                            showDateDemande={showDateDemande}
                        />
                    ))}
                </div>
            ) : (
                /* ================= DESKTOP ================= */
                <div className="overflow-x-auto hidden lg:block">
                    <table className="w-full">
                        <thead className="bg-muted/30 border-b">
                            <tr>
                                <th className="px-4 py-2 text-left">Propriété</th>
                                <th className="px-4 py-2 text-left">Demandeur(s)</th>
                                {showDateDemande && <th className="px-4 py-2">Date</th>}
                                <th className="px-4 py-2">Prix</th>
                                <th className="px-4 py-2">Statut</th>
                                <th className="px-4 py-2 w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedDemandes.map((doc) => {
                                const premier = doc.demandeurs[0]?.demandeur;

                                return (
                                    <tr
                                        key={doc.id}
                                        className="hover:bg-accent cursor-pointer"
                                        onClick={() => onSelectDemande(doc)}
                                    >
                                        <td className="px-4 py-3 font-semibold">
                                            Lot {doc.propriete?.lot}
                                        </td>

                                        <td className="px-4 py-3">
                                            {/* ✅ CORRECTION LIGNE 169 : Cast vers DemandeurSimple */}
                                            {premier ? formatNomComplet(premier as DemandeurSimple) : '—'}
                                        </td>

                                        {showDateDemande && (
                                            <td className="px-4 py-3">
                                                {formatDate(doc.date_demande)}
                                            </td>
                                        )}

                                        <td className="px-4 py-3 font-bold">
                                            {doc.total_prix.toLocaleString()} Ar
                                        </td>

                                        <td className="px-4 py-3">
                                            {doc._computed.isArchived ? (
                                                <Badge variant="secondary">
                                                    <Lock className="h-3 w-3 mr-1" />
                                                    Archivée
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    <LockOpen className="h-3 w-3 mr-1" />
                                                    Active
                                                </Badge>
                                            )}
                                        </td>

                                        <td
                                            className="px-4 py-3"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="ghost">
                                                        <Ellipsis className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => onSelectDemande(doc)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Détails
                                                    </DropdownMenuItem>

                                                    {!dossier.is_closed && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            {doc._computed.isArchived ? (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        onUnarchive(doc)
                                                                    }
                                                                >
                                                                    <ArchiveRestore className="h-4 w-4 mr-2" />
                                                                    Désarchiver
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        onArchive(doc)
                                                                    }
                                                                >
                                                                    <Archive className="h-4 w-4 mr-2" />
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
            )}

            {/* ================= PAGINATION ================= */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        Précédent
                    </Button>

                    <span className="text-sm font-medium px-3 py-1 border rounded">
                        {currentPage} / {totalPages}
                    </span>

                    <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        Suivant
                    </Button>
                </div>
            )}
        </div>
    );
}

/* ===================== MOBILE CARD ===================== */

function MobileDemandeCard({
    demande,
    onSelect,
    onArchive,
    onUnarchive,
    dossier,
    showDateDemande
}: {
    demande: DemandeWithDetails;
    onSelect: () => void;
    onArchive: () => void;
    onUnarchive: () => void;
    dossier: Dossier;
    showDateDemande: boolean;
}) {
    const premier = demande.demandeurs[0]?.demandeur;

    return (
        <Card
            className={cn(
                'cursor-pointer',
                demande._computed.isIncomplete && 'bg-red-50',
                demande._computed.isArchived && 'bg-gray-50'
            )}
            onClick={onSelect}
        >
            <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="font-bold">Lot {demande.propriete?.lot}</span>
                    <Badge variant="outline">
                        {demande._computed.isArchived ? 'Archivée' : 'Active'}
                    </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                    {/* ✅ CORRECTION LIGNE 316 : Cast vers DemandeurSimple */}
                    {premier ? formatNomComplet(premier as DemandeurSimple) : 'Aucun demandeur'}
                </div>

                {showDateDemande && (
                    <div className="text-sm">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        {formatDate(demande.date_demande)}
                    </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-bold">
                        {demande.total_prix.toLocaleString()} Ar
                    </span>

                    {!dossier.is_closed && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                demande._computed.isArchived
                                    ? onUnarchive()
                                    : onArchive();
                            }}
                        >
                            {demande._computed.isArchived ? 'Désarchiver' : 'Archiver'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}