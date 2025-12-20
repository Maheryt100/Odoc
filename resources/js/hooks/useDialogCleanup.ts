// ============================================
// hooks/useDialogCleanup.ts 
// ============================================
import { useEffect } from 'react';

export function cleanupDialogOverlays(): void {
    const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
    overlays.forEach(overlay => overlay.parentNode?.removeChild(overlay));
    
    const portals = document.querySelectorAll('[data-radix-portal]');
    portals.forEach(portal => {
        if (portal.childNodes.length === 0) {
            portal.parentNode?.removeChild(portal);
        }
    });
    
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
    document.body.removeAttribute('data-scroll-locked');
}

export function useDialogCleanup(isOpen: boolean): void {
    useEffect(() => {
        return () => cleanupDialogOverlays();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(cleanupDialogOverlays, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);
}
