// resources/js/pages/dossiers/Create.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
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

            <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
                
                {/* Header avec bouton retour */}
                <div className="mb-4 sm:mb-6 space-y-3">
                    {/* Bouton retour - Toujours visible */}
                    <div className="flex justify-end">
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <Link href={route('dossiers')}>
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Retour à la liste</span>
                                <span className="sm:hidden">Retour</span>
                            </Link>
                        </Button>
                    </div>

                    {/* Titre et description */}
                    <div className="space-y-2">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight">
                            Nouveau Dossier
                        </h1>
                        
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Créer un nouveau dossier de terrain avec les informations complètes.
                        </p>
                    </div>
                </div>

                {/* Formulaire */}
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