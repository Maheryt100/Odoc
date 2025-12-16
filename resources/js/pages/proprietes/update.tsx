// // pages/proprietes/update.tsx
// // ✅ VERSION CORRIGÉE - Dates fonctionnelles + Structure propre

// import { useState } from 'react';
// import { Head, usePage, useForm } from '@inertiajs/react';
// import AppLayout from '@/layouts/app-layout';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { toast, Toaster } from 'sonner';
// import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
// import { Link } from '@inertiajs/react';
// import type { BreadcrumbItem } from '@/types';

// // ✅ Imports depuis les nouveaux fichiers
// import ProprieteCreate from '@/pages/proprietes/create';
// import { ProprieteFormData, ProprieteUpdatePageProps } from '@/pages/proprietes/types';
// import { proprieteToFormData, parseSelectedCharges } from '@/pages/proprietes/helpers';
// import { validateAndShowErrors } from '@/pages/proprietes/validation';

// export default function ProprieteUpdate() {
//     const { propriete, dossier } = usePage<ProprieteUpdatePageProps>().props;
//     const [processing, setProcessing] = useState(false);
    
//     // ✅ CORRECTION : Utiliser la fonction helper pour parser les charges
//     const [selectedCharges, setSelectedCharges] = useState<string[]>(
//         parseSelectedCharges(propriete?.charge)
//     );

//     // ✅ CORRECTION CRITIQUE : Utiliser proprieteToFormData qui gère les dates correctement
//     const { data, setData, put, errors } = useForm<ProprieteFormData>(
//         proprieteToFormData(propriete, dossier?.id)
//     );

//     const isArchived = propriete?.is_archived === true;
//     const isClosed = dossier?.is_closed === true;
//     const isDisabled = isArchived || isClosed;

//     /**
//      * ✅ Gestion des charges
//      */
//     const handleChargeChange = (charge: string, checked: boolean) => {
//         let newCharges: string[];
        
//         if (checked) {
//             if (charge === "Aucune") {
//                 newCharges = ["Aucune"];
//             } else {
//                 newCharges = selectedCharges.filter(c => c !== "Aucune");
//                 newCharges = [...newCharges, charge];
//             }
//         } else {
//             newCharges = selectedCharges.filter(c => c !== charge);
//         }
        
//         setSelectedCharges(newCharges);
//         setData('charge', newCharges.join(', '));
//     };

//     /**
//      * ✅ Soumission du formulaire avec validation
//      */
//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();

//         // Validation côté client
//         if (!validateAndShowErrors(data)) {
//             return;
//         }

//         setProcessing(true);

//         put(route('proprietes.update', propriete.id), {
//             onError: (errors) => {
//                 console.error('Erreurs de validation:', errors);
//                 const errorMessages = Object.entries(errors)
//                     .map(([field, message]) => `${field}: ${message}`)
//                     .join('\n');
//                 toast.error('Erreur de validation', { description: errorMessages });
//                 setProcessing(false);
//             },
//             onSuccess: () => {
//                 toast.success('Propriété modifiée avec succès !');
//             },
//             onFinish: () => {
//                 setProcessing(false);
//             }
//         });
//     };

//     const breadcrumbs: BreadcrumbItem[] = [
//         { title: 'Dossiers', href: route('dossiers') },
//         { title: dossier.nom_dossier, href: route('dossiers.show', dossier.id) },
//         { title: `Modifier Lot ${propriete.lot}`, href: '#' }
//     ];

//     return (
//         <AppLayout breadcrumbs={breadcrumbs}>
//             <Head title={`Modifier Lot ${propriete.lot}`} />
//             <Toaster position="top-right" richColors />

//             <div className="container mx-auto p-6 max-w-5xl">
//                 {/* Header */}
//                 <div className="mb-8">
//                     <Button asChild variant="ghost" size="sm" className="mb-4">
//                         <Link href={route('dossiers.show', dossier.id)}>
//                             <ArrowLeft className="mr-2 h-4 w-4" />
//                             Retour au dossier
//                         </Link>
//                     </Button>
                    
//                     <h1 className="text-3xl font-bold">Modifier Lot {propriete.lot}</h1>
//                     <p className="text-muted-foreground mt-2">
//                         Dossier: {dossier.nom_dossier}
//                     </p>
//                 </div>

//                 {/* Alertes */}
//                 {isDisabled && (
//                     <Alert variant="destructive" className="mb-6">
//                         <AlertTriangle className="h-4 w-4" />
//                         <AlertDescription>
//                             {isClosed && 'Ce dossier est fermé. Aucune modification n\'est possible.'}
//                             {isArchived && 'Cette propriété est archivée (acquise). Aucune modification n\'est possible.'}
//                         </AlertDescription>
//                     </Alert>
//                 )}

//                 {/* Formulaire */}
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Informations de la propriété</CardTitle>
//                         <CardDescription>
//                             Modifiez les informations ci-dessous et cliquez sur "Enregistrer les modifications"
//                         </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                         <form onSubmit={handleSubmit} className="space-y-8">
//                             <ProprieteCreate
//                                 data={data}
//                                 onChange={(field, value) => setData(field, value)} 
//                                 index={0}
//                                 showRemoveButton={false}
//                                 selectedCharges={selectedCharges}
//                                 onChargeChange={handleChargeChange}
//                             />

//                             {/* Messages d'erreur globaux */}
//                             {Object.keys(errors).length > 0 && (
//                                 <Alert variant="destructive">
//                                     <AlertTriangle className="h-4 w-4" />
//                                     <AlertDescription>
//                                         Veuillez corriger les erreurs ci-dessus
//                                     </AlertDescription>
//                                 </Alert>
//                             )}

//                             {/* Actions */}
//                             <div className="flex gap-4 justify-end pt-6 border-t">
//                                 <Button
//                                     type="button"
//                                     variant="outline"
//                                     onClick={() => window.history.back()}
//                                     disabled={processing}
//                                 >
//                                     Annuler
//                                 </Button>
//                                 <Button
//                                     type="submit"
//                                     disabled={processing || isDisabled}
//                                 >
//                                     <Save className="mr-2 h-4 w-4" />
//                                     {processing ? 'Enregistrement...' : 'Enregistrer les modifications'}
//                                 </Button>
//                             </div>
//                         </form>
//                     </CardContent>
//                 </Card>
//             </div>
//         </AppLayout>
//     );
// }