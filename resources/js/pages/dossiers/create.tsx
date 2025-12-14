import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Toaster } from 'sonner';
import type { BreadcrumbItem, District } from '@/types';
import DossierForm from '@/pages/dossiers/components/DossierForm';

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
            <Head title="Nouveau Dossier" />
            <Toaster position="top-right" richColors />

            <div className="container mx-auto p-6 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Nouveau Dossier
                    </h1>
                    <div className="text-muted-foreground mt-2 space-y-1">
                        <p>Créer un nouveau dossier de terrain</p>
                        {last_numero !== null && (
                            <p className="text-sm">
                                <span className="text-blue-600 font-medium">
                                    Dernier numéro utilisé : {last_numero}
                                </span>
                                <span className="mx-2">•</span>
                                <span className="text-emerald-600 font-medium">
                                    Numéro suggéré : {suggested_numero}
                                </span>
                            </p>
                        )}
                    </div>
                </div>

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