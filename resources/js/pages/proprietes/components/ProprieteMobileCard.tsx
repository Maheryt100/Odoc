// pages/proprietes/components/ProprieteMobileCard.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, Eye, Pencil, Trash, MoreVertical, Link2, Archive, ArchiveRestore } from 'lucide-react';
import type { ProprieteWithDetails } from '../types';
import { isPropertyArchived, hasActiveDemandeurs } from '../helpers';

interface ProprieteMobileCardProps {
    propriete: ProprieteWithDetails;
    isIncomplete: boolean;
    dossierClosed: boolean;
    onView: () => void;
    onEdit: () => void;
    onLink?: () => void;
    onArchive?: () => void;
    onUnarchive?: () => void;
    onDelete: () => void;
}

export function ProprieteMobileCard({
    propriete, isIncomplete, dossierClosed,
    onView, onEdit, onLink, onArchive, onUnarchive, onDelete
}: ProprieteMobileCardProps) {
    const isArchived = isPropertyArchived(propriete);
    const hasDemandeurs = hasActiveDemandeurs(propriete);
    
    return (
        <Card 
            className={`p-4 active:scale-[0.98] transition-transform ${
                isArchived ? 'border-green-300 bg-green-50/30 dark:bg-green-950/10' :
                isIncomplete ? 'border-red-300 bg-red-50/30 dark:bg-red-950/10' :
                !hasDemandeurs ? 'border-amber-300 bg-amber-50/30 dark:bg-amber-950/10' : ''
            }`}
            onClick={onView}
        >
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-base">Lot {propriete.lot}</p>
                            {isIncomplete && <AlertCircle className="h-4 w-4 text-red-500" />}
                            {isArchived && <Archive className="h-4 w-4 text-green-600" />}
                        </div>
                        {propriete.titre && (
                            <p className="text-xs text-muted-foreground">TNº{propriete.titre}</p>
                        )}
                    </div>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                                <Eye className="mr-2 h-4 w-4" />Voir
                            </DropdownMenuItem>
                            {!dossierClosed && (
                                <>
                                    <DropdownMenuItem 
                                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                        disabled={isArchived}
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />Modifier
                                    </DropdownMenuItem>
                                    {!isArchived && onLink && (
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLink(); }}>
                                            <Link2 className="mr-2 h-4 w-4" />Lier
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    {isArchived ? (
                                        onUnarchive && (
                                            <DropdownMenuItem 
                                                className="text-blue-600"
                                                onClick={(e) => { e.stopPropagation(); onUnarchive(); }}
                                            >
                                                <ArchiveRestore className="mr-2 h-4 w-4" />Désarchiver
                                            </DropdownMenuItem>
                                        )
                                    ) : (
                                        onArchive && (
                                            <DropdownMenuItem 
                                                className="text-green-600"
                                                onClick={(e) => { e.stopPropagation(); onArchive(); }}
                                            >
                                                <Archive className="mr-2 h-4 w-4" />Archiver
                                            </DropdownMenuItem>
                                        )
                                    )}
                                    <DropdownMenuItem 
                                        className="text-red-500"
                                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                    >
                                        <Trash className="mr-2 h-4 w-4" />Supprimer
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {propriete.proprietaire && (
                        <div className="col-span-2">
                            <span className="text-muted-foreground">Propriétaire:</span>
                            <p className="font-medium line-clamp-1">{propriete.proprietaire}</p>
                        </div>
                    )}
                    <div>
                        <span className="text-muted-foreground">Contenance:</span>
                        <p className="font-medium">
                            {propriete.contenance ? `${propriete.contenance} m²` : '-'}
                        </p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Nature:</span>
                        <p className="font-medium capitalize">{propriete.nature || '-'}</p>
                    </div>
                </div>
                
                {isArchived ? (
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                        <Archive className="mr-1 h-3 w-3" />Acquise
                    </Badge>
                ) : hasDemandeurs ? (
                    <Badge variant="default" className="text-xs">Avec demandeur</Badge>
                ) : (
                    <Badge variant="secondary" className="text-xs">Sans demandeur</Badge>
                )}
            </div>
        </Card>
    );
}