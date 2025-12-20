// ============================================
// hooks/useResponsive.ts - VERSION UNIFIÉE DÉFINITIVE
// ============================================
import { useEffect, useState, useCallback } from 'react';

/**
 * Breakpoints standard Tailwind CSS
 * sm: 640px  - Petit mobile landscape
 * md: 768px  - Tablette portrait
 * lg: 1024px - Tablette landscape / Petit desktop
 * xl: 1280px - Desktop standard
 * 2xl: 1536px - Grand écran
 */
const BREAKPOINTS = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook principal pour détecter si on est en mode mobile
 * Mobile = largeur < 768px (breakpoint md de Tailwind)
 * 
 * @returns {boolean} true si mobile, false sinon
 */
export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.md - 1}px)`);

        const onChange = () => {
            setIsMobile(window.innerWidth < BREAKPOINTS.md);
        };

        // Initialisation
        onChange();
        
        // Écoute des changements
        mql.addEventListener('change', onChange);

        return () => mql.removeEventListener('change', onChange);
    }, []);

    return isMobile;
}

/**
 * Hook pour obtenir le breakpoint actuel
 * 
 * @returns {Breakpoint} Le breakpoint actuel (xs, sm, md, lg, xl, 2xl)
 */
export function useBreakpoint(): Breakpoint {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>('md');

    useEffect(() => {
        const updateBreakpoint = () => {
            const width = window.innerWidth;
            
            if (width < BREAKPOINTS.sm) {
                setBreakpoint('xs');
            } else if (width < BREAKPOINTS.md) {
                setBreakpoint('sm');
            } else if (width < BREAKPOINTS.lg) {
                setBreakpoint('md');
            } else if (width < BREAKPOINTS.xl) {
                setBreakpoint('lg');
            } else if (width < BREAKPOINTS['2xl']) {
                setBreakpoint('xl');
            } else {
                setBreakpoint('2xl');
            }
        };

        updateBreakpoint();
        window.addEventListener('resize', updateBreakpoint);
        
        return () => window.removeEventListener('resize', updateBreakpoint);
    }, []);

    return breakpoint;
}

/**
 * Hook pour vérifier si la largeur est au moins égale à un breakpoint
 * Exemple: useMediaQuery('lg') retourne true si largeur >= 1024px
 * 
 * @param {Breakpoint} breakpoint - Le breakpoint à vérifier
 * @returns {boolean} true si la largeur >= breakpoint
 */
export function useMediaQuery(breakpoint: Breakpoint): boolean {
    const [matches, setMatches] = useState<boolean>(false);

    useEffect(() => {
        const minWidth = BREAKPOINTS[breakpoint];
        const mql = window.matchMedia(`(min-width: ${minWidth}px)`);

        const onChange = () => {
            setMatches(mql.matches);
        };

        onChange();
        mql.addEventListener('change', onChange);

        return () => mql.removeEventListener('change', onChange);
    }, [breakpoint]);

    return matches;
}

/**
 * Hook pour obtenir la largeur et hauteur actuelles de la fenêtre
 * 
 * @returns {{ width: number; height: number }} Dimensions de la fenêtre
 */
export function useWindowSize() {
    const [size, setSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        const handleResize = () => {
            setSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return size;
}

/**
 * Hook pour détecter l'orientation de l'appareil
 * 
 * @returns {'portrait' | 'landscape'} L'orientation actuelle
 */
export function useOrientation() {
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
        typeof window !== 'undefined' && window.innerWidth > window.innerHeight 
            ? 'landscape' 
            : 'portrait'
    );

    useEffect(() => {
        const handleOrientationChange = () => {
            setOrientation(
                window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
            );
        };

        window.addEventListener('resize', handleOrientationChange);
        return () => window.removeEventListener('resize', handleOrientationChange);
    }, []);

    return orientation;
}

/**
 * Hook pour détecter si on est sur un appareil tactile
 * 
 * @returns {boolean} true si tactile
 */
export function useIsTouchDevice(): boolean {
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        setIsTouch(
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0
        );
    }, []);

    return isTouch;
}


export function useMobileNavigation() {
    return useCallback(() => {
        document.body.style.removeProperty('pointer-events');
    }, []);
}