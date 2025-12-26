// admin/activity-logs/components/LogsTable.tsx - VERSION SIMPLIFIÉE
import { Badge } from '@/components/ui/badge';
import { User, MapPin, AlertCircle, Info, Calendar, Database, ExternalLink } from 'lucide-react';
import { ActivityLog } from '../types';
import { ACTION_BADGE_CONFIG } from '../config';
import { formatDate } from '../helpers';
import { EmptyState } from './EmptyState';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface LogsTableProps {
    logs: ActivityLog[];
    actions: Record<string, string>;
}

/**
 * Modal pour afficher les détails complets d'un log
 */
const LogDetailsModal = ({ log, open, onClose }: { log: ActivityLog | null; open: boolean; onClose: () => void }) => {
    if (!log) return null;

    const metadata = log.metadata || {};
    const metaEntries = Object.entries(metadata).filter(
        ([key]) => !['logged_at', 'logged_by'].includes(key)
    );

    const formatMetadataKey = (key: string): string => {
        const labels: Record<string, string> = {
            lot: 'Lot', titre: 'Titre', numero_recu: 'N° Reçu',
            montant: 'Montant', total_prix: 'Prix Total',
            document_type: 'Type Document', nom_dossier: 'Nom Dossier',
            numero_ouverture: 'N° Ouverture', commune: 'Commune',
            type_commune: 'Type Commune', circonscription: 'Circonscription',
            fokontany: 'Fokontany', motif_fermeture: 'Motif Fermeture',
            contenance: 'Superficie', nature: 'Nature', vocation: 'Vocation',
            proprietaire: 'Propriétaire', situation: 'Situation',
            nom: 'Nom', prenom: 'Prénom', cin: 'CIN',
            domiciliation: 'Domiciliation', user_name: 'Utilisateur',
            user_email: 'Email', user_role: 'Rôle',
            nom_fichier: 'Fichier', taille_formatee: 'Taille',
            attachable_type: 'Attaché à', dossier_nom: 'Nom Dossier',
        };
        return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatMetadataValue = (value: any): string => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
        if (typeof value === 'number') return value.toLocaleString('fr-FR');
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        
        const strValue = String(value);
        return strValue.length > 200 ? strValue.substring(0, 200) + '...' : strValue;
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-500" />
                        Détails de l'activité
                    </DialogTitle>
                    <DialogDescription>
                        Action effectuée le {formatDate(log.created_at)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Informations principales */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Utilisateur</p>
                            <p className="font-medium">{log.user?.name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{log.user?.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Action</p>
                            <Badge className={ACTION_BADGE_CONFIG[log.action]?.className || 'bg-gray-500'}>
                                {log.action_label}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Entité</p>
                            <p className="font-medium">{log.entity_label}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">District</p>
                            <p className="font-medium">{log.district?.nom_district || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            Description
                        </p>
                        <p className="text-sm">{log.details}</p>
                    </div>

                    {/* Métadonnées */}
                    {metaEntries.length > 0 && (
                        <div>
                            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Database className="h-4 w-4 text-blue-500" />
                                Informations complémentaires
                            </p>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {metaEntries.map(([key, value]) => (
                                    <div key={key} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 min-w-[120px]">
                                            {formatMetadataKey(key)}
                                        </span>
                                        <span className="text-xs text-foreground flex-1 font-mono">
                                            {formatMetadataValue(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Informations techniques */}
                    <div className="pt-3 border-t space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                Date/Heure
                            </span>
                            <span className="font-mono">{formatDate(log.created_at)}</span>
                        </div>
                        {log.ip_address && (
                            <div className="flex items-center justify-between">
                                <span>Adresse IP</span>
                                <code className="px-2 py-1 bg-muted rounded text-xs">
                                    {log.ip_address}
                                </code>
                            </div>
                        )}
                        {log.entity_id && (
                            <div className="flex items-center justify-between">
                                <span>ID Entité</span>
                                <code className="px-2 py-1 bg-muted rounded text-xs">
                                    #{log.entity_id}
                                </code>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Fermer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export const LogsTable = ({ logs, actions }: LogsTableProps) => {
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const handleRowClick = (log: ActivityLog) => {
        setSelectedLog(log);
        setModalOpen(true);
    };

    if (logs.length === 0) {
        return (
            <EmptyState
                icon={User}
                title="Aucune activité trouvée"
                description="Essayez d'ajuster vos filtres de recherche"
            />
        );
    }

    return (
        <>
            <div className="relative overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b bg-muted/30">
                        <tr>
                            <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                                Date/Heure
                            </th>
                            <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                                Utilisateur
                            </th>
                            <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                                Action
                            </th>
                            <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                                Entité
                            </th>
                            <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                                Détails
                            </th>
                            <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                                District
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {logs.map((log) => {
                            const config = ACTION_BADGE_CONFIG[log.action] || {};
                            const actionLabel = log.action_label || log.action || 'Action inconnue';
                            const entityLabel = log.entity_label || log.entity_type || 'Entité inconnue';
                            const details = log.details || 'Aucun détail disponible';
                            
                            return (
                                <tr 
                                    key={log.id} 
                                    onClick={() => handleRowClick(log)}
                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                >
                                    {/* Date/Heure */}
                                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDate(log.created_at)}
                                    </td>
                                    
                                    {/* Utilisateur */}
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold shadow-md">
                                                {log.user?.name?.substring(0, 2).toUpperCase() || '??'}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-sm truncate">
                                                    {log.user?.name || 'Utilisateur inconnu'}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {log.user?.email || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* Action */}
                                    <td className="p-3">
                                        <Badge className={config.className || 'bg-gray-500'}>
                                            {actionLabel}
                                        </Badge>
                                    </td>
                                    
                                    {/* Entité */}
                                    <td className="p-3">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted">
                                            {entityLabel}
                                        </span>
                                    </td>
                                    
                                    {/* Détails - Cliquer pour voir plus */}
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm max-w-md line-clamp-2">
                                                {details === 'Aucun détail disponible' ? (
                                                    <span className="text-muted-foreground italic">{details}</span>
                                                ) : (
                                                    <span>{details}</span>
                                                )}
                                            </div>
                                            <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                        </div>
                                    </td>
                                    
                                    {/* District */}
                                    <td className="p-3">
                                        {log.district ? (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5" />
                                                <span>{log.district.nom_district}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal de détails */}
            <LogDetailsModal
                log={selectedLog}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}