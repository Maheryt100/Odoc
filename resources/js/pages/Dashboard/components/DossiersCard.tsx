// Dashboard/components/DossiersCard.tsx - VERSION CORRIGÉE
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Folder, 
    FolderOpen, 
    FolderCheck,
    AlertCircle
} from 'lucide-react';
import type { CompletionDetails } from '../types';

interface Props {
    ouverts: number;
    fermes: number;
    nouveaux: number;
    enRetard: number;
    completion: CompletionDetails;
    variation?: string;
}

export function DossiersCard({ 
    ouverts, 
    fermes, 
    nouveaux, 
    enRetard,
    completion
}: Props) {
    const total = ouverts + fermes;
    const tauxIncomplet = completion.total_dossiers > 0
        ? ((completion.dossiers_incomplets / completion.total_dossiers) * 100).toFixed(1)
        : 0;

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg sm:text-2xl font-bold">Dossiers</CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {/* Total et statut */}
                <div className="flex items-baseline gap-2 mb-3 flex-wrap">
                    <div className="text-xl sm:text-2xl font-bold">{total}</div>
                    <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                        Total
                    </Badge>
                </div>

                {/* Statistiques principales */}
                <div className="space-y-2 mb-3 pb-3 border-b border-border">
                    {/* Ouverts */}
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-green-700 dark:text-green-400">Ouverts</span>
                        </div>
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">{ouverts}</span>
                    </div>

                    {/* Fermés */}
                    <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <div className="flex items-center gap-2">
                            <FolderCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Fermés</span>
                        </div>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{fermes}</span>
                    </div>
                </div>

                {/* Informations supplémentaires */}
                <div className="space-y-2">
                    {/* Nouveaux ce mois */}
                    {nouveaux > 0 && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Nouveaux ce mois</span>
                            <Badge variant="secondary" className="text-xs">
                                {nouveaux}
                            </Badge>
                        </div>
                    )}

                    {/* Dossiers en retard */}
                    {enRetard > 0 && (
                        <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                <span className="text-xs font-medium text-red-700 dark:text-red-400">
                                    En retard (&gt;90j)
                                </span>
                            </div>
                            <span className="text-sm font-bold text-red-700 dark:text-red-300">{enRetard}</span>
                        </div>
                    )}

                    {/* Message d'action si incomplets */}
                    {completion.dossiers_incomplets > 0 && (
                        <div className="pt-2 border-t border-border">
                            <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">
                                Action requise !
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {completion.dossiers_incomplets} dossier(s) sans demandeurs ou propriétés
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}