// users/components/UsersTable.tsx
import { Link } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Trash2, Power, MapPin, Search, Ellipsis, Eye } from 'lucide-react';
import { User } from '../types';
import { ROLE_BADGE_CONFIG, STATUS_CONFIG } from '../config';
import { EmptyState } from './EmptyState';
import { getInitials } from '../helpers';

interface UsersTableProps {
    users: User[];
    onToggleStatus: (user: User) => void;
    onDelete: (user: User) => void;
}

export const UsersTable = ({ users, onToggleStatus, onDelete }: UsersTableProps) => {
    const getRoleBadge = (role: string, roleName: string) => {
        const config = ROLE_BADGE_CONFIG[role as keyof typeof ROLE_BADGE_CONFIG];
        return (
            <Badge variant={config?.variant || 'outline'} className="text-xs">
                {roleName}
            </Badge>
        );
    };

    const getStatusBadge = (status: boolean) => {
        const config = status ? STATUS_CONFIG.active : STATUS_CONFIG.inactive;
        return (
            <Badge variant={config.variant} className={`${config.className} text-xs`}>
                {config.label}
            </Badge>
        );
    };

    const getAvatarColor = (name: string): string => {
        const colors = [
            'from-blue-500 to-indigo-500',
            'from-purple-500 to-pink-500',
            'from-green-500 to-emerald-500',
            'from-orange-500 to-red-500',
            'from-cyan-500 to-blue-500',
            'from-violet-500 to-purple-500',
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    if (users.length === 0) {
        return (
            <EmptyState
                icon={Search}
                title="Aucun utilisateur trouvé"
                description="Essayez d'ajuster vos filtres de recherche ou créez un nouvel utilisateur"
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-muted/30 border-b">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Utilisateur
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Email
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Rôle
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Localisation
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Statut
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Créé le
                        </th>
                        <th className="px-6 py-4 w-[50px]"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {users.map((user) => (
                        <tr 
                            key={user.id} 
                            className="hover:bg-muted/30 cursor-pointer transition-colors"
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(user.name)} flex items-center justify-center text-white text-sm font-semibold shadow-lg`}>
                                        {getInitials(user.name)}
                                    </div>
                                    <span className="font-medium">{user.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-sm text-muted-foreground font-mono">
                                    {user.email}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {getRoleBadge(user.role, user.role_name)}
                            </td>
                            <td className="px-6 py-4">
                                {user.district ? (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <div className="font-medium">{user.district.nom_district}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {user.district.nom_region}, {user.district.nom_province}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground italic">
                                        Tous les districts
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                {getStatusBadge(user.status)}
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-sm text-muted-foreground">
                                    {user.created_at}
                                </span>
                            </td>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Ellipsis className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {user.can_edit && (
                                            <DropdownMenuItem asChild>
                                                <Link href={`/users/${user.id}/edit`}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Modifier
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        {user.can_edit && (
                                            <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                                                <Power className="mr-2 h-4 w-4" />
                                                {user.status ? 'Désactiver' : 'Activer'}
                                            </DropdownMenuItem>
                                        )}
                                        {user.can_delete && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => onDelete(user)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Supprimer
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};