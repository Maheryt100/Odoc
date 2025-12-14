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
import { MoreVertical, Edit, Trash2, Power, MapPin, Search } from 'lucide-react';
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
    const getRoleBadge = (role: string, roleName?: string) => {
        const config = ROLE_BADGE_CONFIG[role as keyof typeof ROLE_BADGE_CONFIG];
        return (
            <Badge variant={config?.variant || 'outline'} className="text-xs">
                {roleName || config?.label || role}
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
                        <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                            Utilisateur
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                            Rôle
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">
                            Localisation
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                            Statut
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">
                            Créé le
                        </th>
                        <th className="px-4 py-2 w-[50px]"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {users.map((user) => (
                        <tr 
                            key={user.id} 
                            className="hover:bg-muted/30 transition-colors"
                        >
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${getAvatarColor(user.name)} flex items-center justify-center text-white text-xs font-semibold shadow`}>
                                        {getInitials(user.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">{user.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                {getRoleBadge(user.role, user.role_name)}
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                                {user.district ? (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div className="text-xs min-w-0">
                                            <div className="font-medium truncate">{user.district.nom_district}</div>
                                            <div className="text-muted-foreground truncate">
                                                {user.district.nom_region || 'Région inconnue'}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">
                                        Tous les districts
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                {getStatusBadge(user.status)}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                                <span className="text-xs text-muted-foreground">
                                    {user.created_at}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
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