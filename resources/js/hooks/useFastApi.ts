// ============================================
// resources/js/hooks/useFastApi.ts
// Hook React pour communiquer avec FastAPI
// ============================================

import { usePage } from '@inertiajs/react';
import { useCallback } from 'react';

interface FastApiConfig {
    url: string;
    token: string | null;
    connected: boolean;
}

export function useFastApi() {
    const { fastapi } = usePage().props as unknown as { fastapi: FastApiConfig };
    
    /**
     * Effectue une requête vers FastAPI
     */
    const request = useCallback(async <T = any>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> => {
        
        if (!fastapi.token) {
            throw new Error('Token JWT non disponible');
        }
        
        const url = `${fastapi.url}${endpoint}`;
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${fastapi.token}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `Erreur ${response.status}`);
        }
        
        return response.json();
    }, [fastapi]);
    
    /**
     * Récupère les imports depuis FastAPI
     */
    const getImports = useCallback(async (filters?: Record<string, any>) => {
        const params = new URLSearchParams(filters).toString();
        return request(`/api/imports?${params}`);
    }, [request]);
    
    /**
     * Récupère un import spécifique
     */
    const getImport = useCallback(async (importId: number) => {
        return request(`/api/imports/${importId}`);
    }, [request]);
    
    /**
     * Télécharge un fichier
     */
    const downloadFile = useCallback(async (fileId: number) => {
        if (!fastapi.token) {
            throw new Error('Token JWT non disponible');
        }
        
        const url = `${fastapi.url}/api/files/${fileId}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${fastapi.token}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Erreur téléchargement');
        }
        
        return response.blob();
    }, [fastapi]);
    
    return {
        connected: fastapi.connected,
        baseUrl: fastapi.url,
        request,
        getImports,
        getImport,
        downloadFile,
    };
}

// ============================================
// EXEMPLE D'UTILISATION
// ============================================

/*
import { useFastApi } from '@/hooks/useFastApi';

export default function TopoFluxPage() {
    const { getImports, connected } = useFastApi();
    const [imports, setImports] = useState([]);
    
    useEffect(() => {
        if (connected) {
            getImports({ status: 'pending' })
                .then(data => setImports(data.data))
                .catch(err => console.error(err));
        }
    }, [connected, getImports]);
    
    return <div>...</div>;
}
*/