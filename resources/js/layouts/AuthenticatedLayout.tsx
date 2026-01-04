// resources/js/layouts/AuthenticatedLayout.tsx
import { ReactNode } from 'react';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

interface AuthenticatedLayoutProps {
    children: ReactNode;
    header?: ReactNode;
}

export default function AuthenticatedLayout({ children, header }: AuthenticatedLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            {header && (
                <header className="bg-white dark:bg-gray-800 shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}
            
            {/* Main Content */}
            <main className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}