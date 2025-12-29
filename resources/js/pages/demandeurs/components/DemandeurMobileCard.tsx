// resources/js/pages/demandeurs/components/DemandeurMobileCard.tsx 
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, Eye, Pencil, Trash, MoreVertical, Link2 } from 'lucide-react';
import type { DemandeurWithProperty } from '../types';
import { getDemandeurStatusBadge, formatNomComplet } from '../helpers';

interface DemandeurMobileCardProps {
    demandeur: DemandeurWithProperty;
    isIncomplete: boolean;
    dossierClosed: boolean;
    onView: () => void;
    onEdit: () => void;
    onLink?: () => void;
    onDelete: () => void;
}

export function DemandeurMobileCard({
    demandeur, isIncomplete, dossierClosed,
    onView, onEdit, onLink, onDelete
}: DemandeurMobileCardProps) {
    const statusBadge = getDemandeurStatusBadge(demandeur);
    
    return (
        <Card 
            className={`p-4 active:scale-[0.98] transition-transform ${
                isIncomplete ? 'border-red-300 bg-red-50/30 dark:bg-red-950/10' : ''
            }`}
            onClick={onView}
        >
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm truncate">
                                {formatNomComplet(demandeur)}
                            </p>
                            {isIncomplete && (
                                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                            CIN: {demandeur.cin}
                        </p>
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
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                                        <Pencil className="mr-2 h-4 w-4" />Modifier
                                    </DropdownMenuItem>
                                    {onLink && (
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLink(); }}>
                                            <Link2 className="mr-2 h-4 w-4" />Lier
                                        </DropdownMenuItem>
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
                    <div>
                        <span className="text-muted-foreground">Domicile:</span>
                        <p className="font-medium truncate">{demandeur.domiciliation || '-'}</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Tél:</span>
                        <p className="font-medium">{demandeur.telephone || '-'}</p>
                    </div>
                </div>
                
                <Badge variant={statusBadge.variant} className={`text-xs ${statusBadge.className}`}>
                    {statusBadge.icon && <statusBadge.icon className="mr-1 h-3 w-3" />}
                    {statusBadge.text}
                </Badge>
            </div>
        </Card>
    );
}