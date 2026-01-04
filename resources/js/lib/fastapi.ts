// ============================================
// resources/js/lib/fastapi.ts
// HELPER POUR APPELS FASTAPI DEPUIS REACT
// ============================================

import { usePage } from '@inertiajs/react';

interface FastApiConfig {
    url: string;
    token: string | null;
    connected: boolean;
}

/**
 * Hook pour accéder à la config FastAPI
 */
export function useFastApi() {
    const { fastapi } = usePage<{ fastapi: FastApiConfig }>().props;
    
    if (!fastapi.token) {
        console.error('❌ Token FastAPI non disponible');
    }
    
    return {
        url: fastapi.url,
        token: fastapi.token,
        connected: fastapi.connected,
        
        /**
         * Appeler FastAPI avec authentification
         */
        async call<T>(endpoint: string, options?: RequestInit): Promise<T> {
            if (!fastapi.token) {
                throw new Error('Token FastAPI non disponible');
            }
            
            const response = await fetch(`${fastapi.url}${endpoint}`, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${fastapi.token}`,
                    'Content-Type': 'application/json',
                    ...options?.headers,
                }
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`FastAPI Error: ${error}`);
            }
            
            return response.json();
        }
    };
}

/**
 * Exemples d'utilisation:
 * 
 * const { call } = useFastApi();
 * 
 * // GET
 * const imports = await call('/api/imports?status=pending');
 * 
 * // POST
 * const result = await call('/api/imports/1/validate', {
 *   method: 'PUT',
 *   body: JSON.stringify({ action: 'validate' })
 * });
 */