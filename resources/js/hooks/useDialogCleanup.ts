// hooks/useDialogCleanup.ts - VERSION AMÉLIORÉE
import { useEffect, useCallback } from 'react';

/**
 * ✅ Nettoyage agressif des overlays Radix UI
 */
export function cleanupDialogOverlays(): void {
    // 1. Supprimer tous les overlays
    const overlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-alert-dialog-overlay]');
    overlays.forEach(overlay => {
        overlay.parentNode?.removeChild(overlay);
    });
    
    // 2. Supprimer les portals vides
    const portals = document.querySelectorAll('[data-radix-portal]');
    portals.forEach(portal => {
        if (portal.childNodes.length === 0) {
            portal.parentNode?.removeChild(portal);
        }
    });
    
    // 3. Réinitialiser les styles du body
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
    document.body.removeAttribute('data-scroll-locked');
    document.body.removeAttribute('data-radix-focus-guard');
    
    // 4. Supprimer les aria-hidden forcés
    const hidden = document.querySelectorAll('[aria-hidden="true"][data-radix-focus-guard]');
    hidden.forEach(el => el.remove());
    
    // 5. Force re-render pour React
    window.dispatchEvent(new Event('resize'));
}

/**
 * Hook pour nettoyer automatiquement
 */
export function useDialogCleanup(isOpen: boolean): void {
    const cleanup = useCallback(() => {
        cleanupDialogOverlays();
    }, []);

    // Nettoyage au démontage
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    // Nettoyage à la fermeture
    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(cleanup, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, cleanup]);
}

/**
 * ✅ Hook pour nettoyage manuel dans les handlers
 */
export function useForceDialogCleanup() {
    return useCallback(() => {
        cleanupDialogOverlays();
    }, []);
}