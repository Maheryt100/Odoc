// resources/js/ziggy.d.ts

declare module 'ziggy-js' {
    interface Route {
        (name?: string, params?: any, absolute?: boolean, config?: any): string;
    }

    const route: Route;
    export default route;
}

declare global {
    interface Window {
        route: (name: string, params?: any, absolute?: boolean, config?: any) => string;
    }
}

export {};