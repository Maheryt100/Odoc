import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    FileText, Search, ChevronDown, ChevronUp, 
    MoreVertical, Eye, Archive, ArchiveRestore,
    Home, Users, DollarSign, Lock, LockOpen, AlertCircle,
    MapPin
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Document {
    id: number;
    id_propriete: number;
    propriete: {
        lot: string;
        titre?: string;
        contenance?: number;
        nature?: string;
        vocation?: string;
        proprietaire?: string;
        situation?: string;
    };
    demandeurs: Array<{
        id: number;
        demandeur: {
            titre_demandeur?: string;
            nom_demandeur: string;
            prenom_demandeur?: string;
            cin: string;
            domiciliation?: string;
            telephone?: string;
            date_naissance?: string;
            lieu_naissance?: string;
            date_delivrance?: string;
            lieu_delivrance?: string;
            occupation?: string;
            nom_mere?: string;
        };
    }>;
    total_prix: number;
    status: string;
    status_consort: boolean;
    nombre_demandeurs: number;
}

interface DemandesListProps {
    documents: Document[];
    search: string;
    filterStatus: 'all' | 'active' | 'archive';
    onArchive: (doc: Document) => void;
    onUnarchive: (doc: Document) => void;
    onSelectDemande: (doc: Document) => void;
}

export default function DemandesList({
    documents,
    search,
    filterStatus,
    onArchive,
    onUnarchive,
    onSelectDemande
}: DemandesListProps) {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const toggleExpand = (id: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const formatNomComplet = (demandeur: any): string => {
        if (!demandeur) return 'N/A';
        return [
            demandeur.titre_demandeur,
            demandeur.nom_demandeur,
            demandeur.prenom_demandeur
        ].filter(Boolean).join(' ');
    };

    const isDemandeurIncomplete = (demandeur: any): boolean => {
        if (!demandeur) return true;
        const champsRequis = [
            'date_naissance', 'lieu_naissance', 'date_delivrance',
            'lieu_delivrance', 'domiciliation', 'occupation', 'nom_mere'
        ];
        return champsRequis.some(champ => !demandeur[champ]);
    };

    const isProprieteIncomplete = (prop: any): boolean => {
        return !prop?.titre || !prop?.contenance || !prop?.proprietaire || 
               !prop?.nature || !prop?.vocation || !prop?.situation;
    };

    if (documents.length === 0) {
        return (
            <Card className="border-0 shadow-lg">
                <CardContent className="py-16 text-center">
                    <div className="max-w-md mx-auto space-y-4">
                        <div className="p-4 bg-muted/30 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                            <Search className="h-10 w-10 text-muted-foreground opacity-50" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">
                                Aucune demande trouvée
                            </h3>
                            <p className="text-muted-foreground">
                                {search || filterStatus !== 'all' 
                                    ? 'Aucune demande ne correspond aux critères de recherche'
                                    : 'Aucune demande n\'a encore été enregistrée dans ce dossier'
                                }
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-lg">
            <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20 p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                        <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Liste des demandes</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {documents.length} demande{documents.length > 1 ? 's' : ''} trouvée{documents.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            <CardContent className="p-6 space-y-3">
                {documents.map((doc) => {
                    const isExpanded = expandedRows.has(doc.id);
                    const isArchived = doc.status === 'archive';
                    const hasValidDemandeurs = doc.demandeurs?.length > 0;
                    const premierDemandeur = hasValidDemandeurs ? doc.demandeurs[0]?.demandeur : null;
                    
                    const hasIncompleteData = hasValidDemandeurs
                        ? doc.demandeurs.some(d => isDemandeurIncomplete(d.demandeur)) || isProprieteIncomplete(doc.propriete)
                        : isProprieteIncomplete(doc.propriete);

                    const cardClassName = isArchived 
                        ? 'bg-gray-50 dark:bg-gray-900/50' 
                        : hasIncompleteData 
                            ? 'bg-red-50 dark:bg-red-950/20'
                            : 'hover:shadow-md';

                    return (
                        <Card key={doc.id} className={`${cardClassName} transition-all duration-200`}>
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    {/* Bouton expand/collapse */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleExpand(doc.id)}
                                        className="h-9 w-9 shrink-0 hover:bg-primary/10"
                                    >
                                        {isExpanded ? (
                                            <ChevronUp className="h-5 w-5" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5" />
                                        )}
                                    </Button>

                                    {/* Contenu principal */}
                                    <div 
                                        className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center cursor-pointer"
                                        onClick={() => onSelectDemande(doc)}
                                    >
                                        {/* Propriété */}
                                        <div className="md:col-span-3 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Home className="h-4 w-4 text-green-600" />
                                                <p className="text-xs text-muted-foreground font-medium">Propriété</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-lg">Lot {doc.propriete?.lot || 'N/A'}</p>
                                                {isProprieteIncomplete(doc.propriete) && (
                                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {doc.propriete?.titre ? `TNº${doc.propriete.titre}` : 'Sans titre'}
                                            </p>
                                        </div>

                                        {/* Demandeurs */}
                                        <div className="md:col-span-4 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-blue-600" />
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    Demandeur{doc.nombre_demandeurs > 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {premierDemandeur ? (
                                                    <>
                                                        <p className="font-medium">
                                                            {formatNomComplet(premierDemandeur)}
                                                        </p>
                                                        {hasIncompleteData && (
                                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="font-medium text-muted-foreground italic">
                                                        Aucun demandeur
                                                    </p>
                                                )}
                                            </div>
                                            {doc.nombre_demandeurs > 1 && (
                                                <Badge variant="secondary" className="text-xs w-fit">
                                                    +{doc.nombre_demandeurs - 1} autre{doc.nombre_demandeurs > 2 ? 's' : ''}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Prix */}
                                        <div className="md:col-span-3 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-purple-600" />
                                                <p className="text-xs text-muted-foreground font-medium">Prix total</p>
                                            </div>
                                            <p className="font-bold text-primary text-lg">
                                                {doc.total_prix 
                                                    ? new Intl.NumberFormat('fr-FR').format(doc.total_prix) 
                                                    : '0'
                                                } Ar
                                            </p>
                                        </div>

                                        {/* Statut */}
                                        <div className="md:col-span-2 flex items-center justify-end gap-2">
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
                                        </div>
                                    </div>

                                    {/* Menu Actions */}
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 shrink-0"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onSelectDemande(doc)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Voir détails
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {isArchived ? (
                                                <DropdownMenuItem 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUnarchive(doc);
                                                    }}
                                                    className="text-blue-600"
                                                >
                                                    <ArchiveRestore className="mr-2 h-4 w-4" />
                                                    Désarchiver
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onArchive(doc);
                                                    }}
                                                    className="text-orange-600"
                                                >
                                                    <Archive className="mr-2 h-4 w-4" />
                                                    Archiver
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Section expandée */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t space-y-4">
                                        {/* Détails Propriété */}
                                        <div className="bg-muted/30 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Home className="h-5 w-5 text-green-600" />
                                                <p className="font-semibold text-green-900 dark:text-green-100">
                                                    Détails de la propriété
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                <div>
                                                    <span className="font-medium text-muted-foreground">Contenance:</span>
                                                    <p className="font-semibold">
                                                        {doc.propriete?.contenance 
                                                            ? `${new Intl.NumberFormat('fr-FR').format(doc.propriete.contenance)} m²` 
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-muted-foreground">Nature:</span>
                                                    <p className="font-semibold">{doc.propriete?.nature || '-'}</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-muted-foreground">Vocation:</span>
                                                    <p className="font-semibold">{doc.propriete?.vocation || '-'}</p>
                                                </div>
                                                {doc.propriete?.proprietaire && (
                                                    <div className="col-span-2 md:col-span-3">
                                                        <span className="font-medium text-muted-foreground">Propriétaire:</span>
                                                        <p className="font-semibold">{doc.propriete.proprietaire}</p>
                                                    </div>
                                                )}
                                                {doc.propriete?.situation && (
                                                    <div className="col-span-2 md:col-span-3">
                                                        <span className="font-medium text-muted-foreground">Situation:</span>
                                                        <p className="font-semibold">{doc.propriete.situation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Liste complète des demandeurs */}
                                        {hasValidDemandeurs ? (
                                            <div className="bg-muted/30 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Users className="h-5 w-5 text-blue-600" />
                                                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                                                        {doc.nombre_demandeurs > 1 
                                                            ? `Liste complète des demandeurs (${doc.nombre_demandeurs})`
                                                            : 'Informations du demandeur'
                                                        }
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    {doc.demandeurs.map((dem, idx) => {
                                                        if (!dem?.demandeur) return null;
                                                        return (
                                                            <div 
                                                                key={dem.id || idx}
                                                                className="flex items-center justify-between p-3 bg-background rounded-lg text-sm"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium">
                                                                            {formatNomComplet(dem.demandeur)}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground font-mono">
                                                                            CIN: {dem.demandeur?.cin || 'N/A'}
                                                                        </p>
                                                                        {dem.demandeur?.domiciliation && (
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {dem.demandeur.domiciliation}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {isDemandeurIncomplete(dem.demandeur) && (
                                                                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-300 dark:bg-red-950/20 dark:text-red-400">
                                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                                        Incomplet
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-muted/30 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                                    <p className="font-semibold text-orange-900 dark:text-orange-100">
                                                        Aucun demandeur associé
                                                    </p>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Cette propriété n'a pas encore de demandeur lié.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </CardContent>
        </Card>
    );
}