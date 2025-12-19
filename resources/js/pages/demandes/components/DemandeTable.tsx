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
    Lock,
    LockOpen,
    Calendar,
    DollarSign
} from 'lucide-react';

interface Demandeur {
    id: number;
    titre_demandeur?: string;
    nom_demandeur: string;
    prenom_demandeur?: string;
    cin: string;
    date_naissance?: string;
    lieu_naissance?: string;
    date_delivrance?: string;
    lieu_delivrance?: string;
    domiciliation?: string;
    occupation?: string;
    nom_mere?: string;
}

interface Propriete {
    id: number;
    lot: string;
    titre?: string;
    contenance?: number;
    nature?: string;
    vocation?: string;
    proprietaire?: string;
    situation?: string;
}

interface DemandeWithDetails {
    id: number;
    id_propriete: number;
    date_demande?: string;
    propriete: Propriete;
    demandeurs: Array<{
        id: number;
        id_demandeur: number;
        demandeur: Demandeur;
    }>;
    total_prix: number;
    status: string;
    status_consort: boolean;
    nombre_demandeurs: number;
    created_at?: string;
    _computed: {
        isIncomplete: boolean;
        hasValidDemandeurs: boolean;
        isArchived: boolean;
    };
}

interface Dossier {
    id: number;
    nom_dossier: string;
    is_closed: boolean;
}

interface DemandeTableProps {
    demandes: DemandeWithDetails[];
    dossier: Dossier;
    onArchive: (doc: any) => void;
    onUnarchive: (doc: any) => void;
    onSelectDemande: (doc: any) => void;
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    showDateDemande?: boolean;
}

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
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDemandes = demandes.slice(startIndex, endIndex);
    const totalPages = Math.ceil(demandes.length / itemsPerPage);

    const formatNomComplet = (demandeur: Demandeur): string => {
        return [
            demandeur.titre_demandeur,
            demandeur.nom_demandeur,
            demandeur.prenom_demandeur
        ].filter(Boolean).join(' ');
    };

    const isProprieteIncomplete = (prop: Propriete): boolean => {
        return !prop?.titre || !prop?.contenance || !prop?.proprietaire || 
               !prop?.nature || !prop?.vocation || !prop?.situation;
    };

    const formatDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '-';
        
        try {
            const date = new Date(dateStr + 'T00:00:00');
            return date.toLocaleDateString('fr-FR');
        } catch {
            return dateStr;
        }
    };

    const getDemandeAge = (dateDemande: string | null | undefined): number | null => {
        if (!dateDemande) return null;
        
        try {
            const date = new Date(dateDemande + 'T00:00:00');
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch {
            return null;
        }
    };

    const getAgeLabel = (age: number | null): string => {
        if (age === null) return '-';
        
        if (age === 0) return "Aujourd'hui";
        if (age === 1) return "Hier";
        if (age < 7) return `${age}j`;
        if (age < 30) return `${Math.floor(age / 7)}sem`;
        if (age < 365) return `${Math.floor(age / 30)}mois`;
        return `${Math.floor(age / 365)}an`;
    };

    const getRowClassName = (doc: DemandeWithDetails): string => {
        const isArchived = doc._computed.isArchived;
        const isIncomplete = doc._computed.isIncomplete;
        
        if (isArchived) {
            return 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900/70';
        }
        
        if (isIncomplete) {
            return 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30';
        }
        
        return 'hover:bg-accent/50';
    };

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
            {/* Vue Desktop - Tableau classique */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/30 border-b">
                        <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Propriété
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Demandeur(s)
                            </th>
                            {showDateDemande && (
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Date demande
                                </th>
                            )}
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
                            const rowClass = getRowClassName(doc);
                            const age = getDemandeAge(doc.date_demande);
                            const ageLabel = getAgeLabel(age);
                            
                            return (
                                <tr 
                                    key={doc.id} 
                                    className={`${rowClass} cursor-pointer transition-colors`}
                                    onClick={() => onSelectDemande(doc)}
                                >
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

                                    {showDateDemande && (
                                        <td className="px-4 py-3">
                                            <div className="flex items-start gap-2">
                                                <Calendar className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    {doc.date_demande ? (
                                                        <>
                                                            <p className="text-sm font-medium">
                                                                {formatDate(doc.date_demande)}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {ageLabel}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground italic">
                                                            Non renseignée
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    )}

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

            {/* Vue Mobile - Cards compactes */}
            <div className="lg:hidden space-y-3">
                {paginatedDemandes.map((doc) => {
                    const isArchived = doc._computed.isArchived;
                    const isIncomplete = doc._computed.isIncomplete;
                    const hasValidDemandeurs = doc._computed.hasValidDemandeurs;
                    const premierDemandeur = hasValidDemandeurs ? doc.demandeurs[0]?.demandeur : null;
                    const age = getDemandeAge(doc.date_demande);
                    const ageLabel = getAgeLabel(age);
                    
                    const cardClass = isArchived 
                        ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200' 
                        : isIncomplete 
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-200'
                            : 'hover:shadow-md border-border';
                    
                    return (
                        <div 
                            key={doc.id}
                            className={`border rounded-lg p-4 ${cardClass} transition-all cursor-pointer`}
                            onClick={() => onSelectDemande(doc)}
                        >
                            {/* Header - Lot + Status */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Home className="h-5 w-5 text-green-600 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-base">Lot {doc.propriete?.lot || 'N/A'}</span>
                                            {isProprieteIncomplete(doc.propriete) && (
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {doc.propriete?.titre ? `TNº${doc.propriete.titre}` : 'Sans titre'}
                                        </p>
                                    </div>
                                </div>
                                
                                {isArchived ? (
                                    <Badge variant="outline" className="bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 flex-shrink-0">
                                        <Lock className="h-3 w-3 mr-1" />
                                        Archivée
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
                                        <LockOpen className="h-3 w-3 mr-1" />
                                        Active
                                    </Badge>
                                )}
                            </div>

                            {/* Demandeur */}
                            <div className="flex items-start gap-2 mb-3 pb-3 border-b">
                                <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    {premierDemandeur ? (
                                        <>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm">
                                                    {formatNomComplet(premierDemandeur)}
                                                </span>
                                                {isIncomplete && (
                                                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
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

                            {/* Prix + Date */}
                            <div className="grid grid-cols-2 gap-3">
                                {showDateDemande && (
                                    <div className="flex items-start gap-2">
                                        <Calendar className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">Date</p>
                                            {doc.date_demande ? (
                                                <>
                                                    <p className="text-sm font-medium">
                                                        {formatDate(doc.date_demande)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {ageLabel}
                                                    </p>
                                                </>
                                            ) : (
                                                <span className="text-sm text-muted-foreground italic">-</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex items-start gap-2">
                                    <DollarSign className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">Prix</p>
                                        <p className="font-bold text-primary text-sm">
                                            {doc.total_prix 
                                                ? new Intl.NumberFormat('fr-FR', {notation: 'compact', maximumFractionDigits: 1}).format(doc.total_prix)
                                                : '0'
                                            } Ar
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Menu actions mobile */}
                            <div className="mt-3 pt-3 border-t flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => onSelectDemande(doc)}
                                >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Détails
                                </Button>
                                
                                {!dossier.is_closed && (
                                    <>
                                        {isArchived ? (
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="text-blue-600"
                                                onClick={() => onUnarchive(doc)}
                                            >
                                                <ArchiveRestore className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="text-orange-600"
                                                onClick={() => onArchive(doc)}
                                            >
                                                <Archive className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
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
                    
                    {/* Desktop: Tous les numéros */}
                    <div className="hidden sm:flex gap-2">
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
                    </div>
                    
                    {/* Mobile: Numéro actuel */}
                    <div className="sm:hidden flex items-center gap-2 px-3 py-1 border rounded">
                        <span className="text-sm font-medium">{currentPage} / {totalPages}</span>
                    </div>
                    
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