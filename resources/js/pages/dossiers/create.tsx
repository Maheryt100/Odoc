// resources/js/pages/dossiers/Create.tsx - ✅ VERSION RESPONSIVE
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Toaster } from 'sonner';
import type { BreadcrumbItem, District } from '@/types';
import DossierForm from '@/pages/dossiers/components/DossierForm';
import { route } from 'ziggy-js';

interface PageProps {
    districts: District[];
    suggested_numero: number;
    last_numero: number | null;
    [key: string]: unknown;
}

export default function Create() {
    const { districts, suggested_numero, last_numero } = usePage<PageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: 'Nouveau Dossier', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau dossier" />
            <Toaster richColors position="top-center" />

            {/* ✅ Container responsive avec padding adaptatif */}
            <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
                
                {/* ✅ Header responsive */}
                <div className="mb-4 sm:mb-6 space-y-2">
                    {/* Titre adaptatif */}
                    <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight">
                        Nouveau Dossier
                    </h1>
                    
                    {/* Description */}
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Créer un nouveau dossier de terrain avec les informations complètes.
                    </p>
                    
                    {/* ✅ Info numéros - Masqué sur mobile, visible desktop */}
                    {/* {(last_numero !== null || suggested_numero) && (
                        <div className="hidden sm:flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground pt-1">
                            {last_numero !== null && (
                                <span className="flex items-center gap-1">
                                    <span className="font-medium">Dernier :</span>
                                    <span className="font-mono text-blue-600 dark:text-blue-400">
                                        {last_numero}
                                    </span>
                                </span>
                            )}
                            {suggested_numero && (
                                <span className="flex items-center gap-1">
                                    <span className="font-medium">Suggéré :</span>
                                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                        {suggested_numero}
                                    </span>
                                </span>
                            )}
                        </div>
                    )} */}
                </div>

                {/* ✅ Formulaire */}
                <DossierForm
                    districts={districts}
                    suggested_numero={suggested_numero}
                    last_numero={last_numero}
                    mode="create"
                />
            </div>
        </AppLayout>
    );
}