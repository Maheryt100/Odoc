// components/user-info.tsx - VERSION MODERNE
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';

export function UserInfo({ user, showEmail = false }: { user: User; showEmail?: boolean }) {
    const getInitials = useInitials();

    // Fonction pour générer une couleur de gradient basée sur le nom
    const getAvatarGradient = (name: string): string => {
        const gradients = [
            'from-blue-500 to-indigo-500',
            'from-purple-500 to-pink-500',
            'from-green-500 to-emerald-500',
            'from-orange-500 to-red-500',
            'from-cyan-500 to-blue-500',
            'from-violet-500 to-purple-500',
        ];
        const index = name.charCodeAt(0) % gradients.length;
        return gradients[index];
    };

    const gradient = getAvatarGradient(user.name);

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-primary/10">
                {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                ) : (
                    <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white font-semibold`}>
                        {getInitials(user.name)}
                    </AvatarFallback>
                )}
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground font-mono">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}