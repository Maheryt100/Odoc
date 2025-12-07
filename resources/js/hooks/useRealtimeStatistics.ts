// hooks/useRealtimeStatistics.ts
import { useEffect, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Initialiser Laravel Echo (à faire une seule fois dans l'app)
declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo;
    }
}

// Configuration Echo (à mettre dans un fichier séparé bootstrap.ts)
if (!window.Echo) {
    window.Pusher = Pusher;
    
    window.Echo = new Echo({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_PUSHER_APP_KEY,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
        forceTLS: true,
        encrypted: true,
        // Pour développement local avec Laravel WebSockets :
        // wsHost: window.location.hostname,
        // wsPort: 6001,
        // forceTLS: false,
        // disableStats: true,
    });
}

interface StatisticsUpdate {
    type: 'dossier' | 'propriete' | 'demandeur' | 'demande';
    action: 'created' | 'updated' | 'deleted';
    summary: Record<string, any>;
    timestamp: string;
}

interface UseRealtimeStatisticsOptions {
    districtId: number | null;
    autoRefresh?: boolean;
    debounceMs?: number;
    onUpdate?: (update: StatisticsUpdate) => void;
}

export function useRealtimeStatistics({
    districtId,
    autoRefresh = true,
    debounceMs = 2000,
    onUpdate
}: UseRealtimeStatisticsOptions) {
    const [lastUpdate, setLastUpdate] = useState<StatisticsUpdate | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [updateCount, setUpdateCount] = useState(0);
    
    // Debounce pour éviter trop de refresh
    const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);
    
    const handleUpdate = useCallback((update: StatisticsUpdate) => {
        console.log('📊 Mise à jour statistiques reçue:', update);
        
        setLastUpdate(update);
        setUpdateCount(prev => prev + 1);
        
        // Callback custom si fourni
        onUpdate?.(update);
        
        // Auto-refresh avec debounce
        if (autoRefresh) {
            if (refreshTimer) {
                clearTimeout(refreshTimer);
            }
            
            const timer = setTimeout(() => {
                console.log('🔄 Rafraîchissement automatique des statistiques...');
                router.reload({ only: ['stats', 'charts'] });
            }, debounceMs);
            
            setRefreshTimer(timer);
        }
    }, [autoRefresh, debounceMs, onUpdate, refreshTimer]);
    
    useEffect(() => {
        // Déterminer le canal à écouter
        const channels: string[] = [];
        
        if (districtId) {
            channels.push(`statistics.district.${districtId}`);
        } else {
            // Super admin : écouter le canal global
            channels.push('statistics.global');
        }
        
        console.log('🔌 Connexion aux canaux WebSocket:', channels);
        
        const listeners: any[] = [];
        
        channels.forEach(channelName => {
            const channel = window.Echo.channel(channelName);
            
            channel.listen('.statistics.updated', handleUpdate);
            
            listeners.push(channel);
        });
        
        // Événements de connexion
        window.Echo.connector.pusher.connection.bind('connected', () => {
            console.log('✅ WebSocket connecté');
            setIsConnected(true);
        });
        
        window.Echo.connector.pusher.connection.bind('disconnected', () => {
            console.log('❌ WebSocket déconnecté');
            setIsConnected(false);
        });
        
        // Cleanup
        return () => {
            console.log('🔌 Déconnexion des canaux WebSocket');
            listeners.forEach(channel => {
                window.Echo.leave(channel.name);
            });
            
            if (refreshTimer) {
                clearTimeout(refreshTimer);
            }
        };
    }, [districtId, handleUpdate, refreshTimer]);
    
    // Fonction pour forcer le refresh
    const forceRefresh = useCallback(() => {
        console.log('🔄 Rafraîchissement forcé des statistiques...');
        router.reload({ only: ['stats', 'charts'] });
    }, []);
    
    return {
        lastUpdate,
        isConnected,
        updateCount,
        forceRefresh,
    };
}