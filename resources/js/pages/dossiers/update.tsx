// resources/js/pages/dossiers/Update.tsx - ✅ VERSION RESPONSIVE
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Toaster } from 'sonner';
import type { BreadcrumbItem, District, Dossier } from '@/types';
import DossierForm from '@/pages/dossiers/components/DossierForm';
import { Badge } from '@/components/ui/badge';
import { FileEdit, Hash } from 'lucide-react';

interface PageProps {
    districts: District[];
    dossier: Dossier;
    [key: string]: unknown;
}

export default function Update() {
    const { districts, dossier } = usePage<PageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dossiers', href: route('dossiers') },
        { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
        { title: 'Modifier', href: '#' },
    ];

    //  Formater le numéro pour affichage
    const displayNumero = typeof dossier.numero_ouverture === 'number' 
        ? `N° ${dossier.numero_ouverture}`
        : dossier.numero_ouverture || 'N/A';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${dossier.nom_dossier}`} />
            <Toaster richColors position="top-center" />

            {/* ✅ Container responsive */}
            <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
                
                {/* ✅ Header responsive amélioré */}
                <div className="mb-4 sm:mb-6">
                    {/* Titre avec icône */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                            <FileEdit className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight">
                            Modifier le Dossier
                        </h1>
                    </div>
                    
                    {/* ✅ Info dossier - Responsive avec wrapping */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pl-8 sm:pl-11">
                        {/* Nom du dossier */}
                        <p className="text-sm sm:text-base text-muted-foreground font-medium truncate">
                            {dossier.nom_dossier}
                        </p>
                        
                        {/* Séparateur desktop uniquement */}
                        <span className="hidden sm:inline text-gray-400">—</span>
                        
                        {/* Badge numéro */}
                        <Badge 
                            variant="outline" 
                            className="w-fit text-xs sm:text-sm font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700"
                        >
                            <Hash className="h-3 w-3 mr-1" />
                            {displayNumero}
                        </Badge>
                    </div>
                    
                    {/* ✅ Note d'avertissement mobile
                    <div className="mt-3 sm:hidden bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                            <span className="shrink-0">ℹ️</span>
                            <span>
                                Le numéro d'ouverture ne peut pas être modifié. 
                                Seules les autres informations peuvent être mises à jour.
                            </span>
                        </p>
                    </div> */}
                </div>

                {/* ✅ Formulaire */}
                <DossierForm
                    districts={districts}
                    dossier={dossier}
                    mode="edit"
                />
            </div>
        </AppLayout>
    );
}