// admin/activity-logs/components/LogsTable.tsx
import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { User, Activity } from 'lucide-react';
import { ActivityLog } from '../types';
import { ACTION_BADGE_CONFIG } from '../config';
import { formatDate, formatMetadata } from '../helpers';
import { EmptyState } from './EmptyState';

interface LogsTableProps {
    logs: ActivityLog[];
    actions: Record<string, string>;
}

export const LogsTable = ({ logs, actions }: LogsTableProps) => {
    const getActionBadge = (action: string) => {
        const config = ACTION_BADGE_CONFIG[action];
        return (
            <Badge className={config?.className || 'bg-gray-500'}>
                {actions[action] || action}
            </Badge>
        );
    };

    if (logs.length === 0) {
        return (
            <EmptyState
                icon={Activity}
                title="Aucune activité trouvée"
                description="Essayez d'ajuster vos filtres de recherche pour voir les logs d'activité"
            />
        );
    }

    return (
        <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b">
                    <tr>
                        <th className="text-left p-3 font-medium">Date/Heure</th>
                        <th className="text-left p-3 font-medium">Utilisateur</th>
                        <th className="text-left p-3 font-medium">Action</th>
                        <th className="text-left p-3 font-medium">Description</th>
                        <th className="text-left p-3 font-medium">District</th>
                        <th className="text-left p-3 font-medium">Détails</th>
                        <th className="text-left p-3 font-medium">IP</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 text-xs">
                                {formatDate(log.created_at)}
                            </td>
                            <td className="p-3">
                                <Link 
                                    href={`/admin/activity-logs/user/${log.user.id}`}
                                    className="flex items-center gap-1.5 hover:underline"
                                >
                                    <User className="h-3.5 w-3.5" />
                                    <span className="font-medium">{log.user.name}</span>
                                </Link>
                            </td>
                            <td className="p-3">
                                {getActionBadge(log.action)}
                            </td>
                            <td className="p-3">
                                {log.description}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                                {log.district?.nom_district || 'N/A'}
                            </td>
                            <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">
                                {formatMetadata(log.metadata)}
                            </td>
                            <td className="p-3 text-xs text-muted-foreground">
                                {log.ip_address}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};