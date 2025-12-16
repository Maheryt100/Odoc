// // pages/proprietes/components/DeleteProprieteDialog.tsx
// import { useState } from 'react';
// import { router } from '@inertiajs/react';
// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
// } from '@/components/ui/alert-dialog';
// import { Badge } from '@/components/ui/badge';
// import { AlertTriangle, Archive, Users, Trash2, Info } from 'lucide-react';
// import type { Propriete } from '@/types';

// interface DeleteProprieteDialogProps {
//     propriete: Propriete | null;
//     open: boolean;
//     onOpenChange: (open: boolean) => void;
// }

// interface DemandeurInfo {
//     id: number;
//     nom_complet: string;
//     cin: string;
//     status: 'active' | 'archive';
// }

// export default function DeleteProprieteDialog({
//     propriete,
//     open,
//     onOpenChange
// }: DeleteProprieteDialogProps) {
//     const [isDeleting, setIsDeleting] = useState(false);
//     const [demandeurs, setDemandeurs] = useState<DemandeurInfo[]>([]);
//     const [loading, setLoading] = useState(false);

//     const handleOpenChange = async (newOpen: boolean) => {
//         if (newOpen && propriete) {
//             setLoading(true);
//             try {
//                 const response = await fetch(
//                     route('api.propriete.demandeurs', { id: propriete.id })
//                 );
//                 const data = await response.json();
//                 setDemandeurs(data.demandeurs || []);
//             } catch (error) {
//                 console.error('Erreur chargement demandeurs:', error);
//             } finally {
//                 setLoading(false);
//             }
//         }
//         onOpenChange(newOpen);
//     };

//     const handleConfirm = () => {
//         if (!propriete) return;

//         setIsDeleting(true);
//         router.delete(route('proprietes.destroy', propriete.id), {
//             onFinish: () => {
//                 setIsDeleting(false);
//                 onOpenChange(false);
//             }
//         });
//     };

//     if (!propriete) return null;

//     const demandeursActifs = demandeurs.filter(d => d.status === 'active');
//     const demandeursArchives = demandeurs.filter(d => d.status === 'archive');
//     const hasDemandeurs = demandeurs.length > 0;
//     const canDelete = !hasDemandeurs;

//     return (
//         <AlertDialog open={open} onOpenChange={handleOpenChange}>
//             <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//                 <AlertDialogHeader>
//                     <AlertDialogTitle className="flex items-center gap-2">
//                         {canDelete ? (
//                             <>
//                                 <Trash2 className="h-5 w-5 text-red-500" />
//                                 Supprimer la propriété
//                             </>
//                         ) : (
//                             <>
//                                 <AlertTriangle className="h-5 w-5 text-amber-500" />
//                                 Suppression impossible
//                             </>
//                         )}
//                     </AlertDialogTitle>
//                 </AlertDialogHeader>

//                 {loading ? (
//                     <div className="py-8 text-center text-muted-foreground">
//                         Vérification des associations...
//                     </div>
//                 ) : canDelete ? (
//                     // ✅ Aucun demandeur - Suppression autorisée
//                     <AlertDialogDescription className="space-y-4">
//                         <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
//                             <div className="flex items-start gap-3">
//                                 <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
//                                 <div className="text-sm space-y-2">
//                                     <p className="font-medium text-blue-900 dark:text-blue-100">
//                                         Supprimer la propriété Lot {propriete.lot} ?
//                                     </p>
//                                     <p className="text-blue-700 dark:text-blue-300">
//                                         {propriete.titre && `Titre : TNº${propriete.titre}`}
//                                         {propriete.contenance && ` • Contenance : ${propriete.contenance} m²`}
//                                     </p>
//                                     <p className="text-red-600 dark:text-red-400 font-medium">
//                                         ⚠️ Cette action est irréversible !
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>
//                     </AlertDialogDescription>
//                 ) : (
//                     // ❌ Demandeurs associés - Suppression bloquée
//                     <AlertDialogDescription className="space-y-4">
//                         <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
//                             <div className="flex items-start gap-3">
//                                 <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
//                                 <div className="text-sm space-y-2">
//                                     <p className="font-medium text-red-900 dark:text-red-100">
//                                         Impossible de supprimer la propriété Lot {propriete.lot}
//                                     </p>
//                                     <p className="text-red-700 dark:text-red-300">
//                                         Des demandeurs sont associés à cette propriété.
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* 📊 Informations propriété */}
//                         <div className="p-3 bg-muted rounded-lg space-y-2">
//                             <div className="flex items-center justify-between">
//                                 <span className="font-medium">Lot {propriete.lot}</span>
//                                 {propriete.titre && (
//                                     <Badge variant="outline">TNº{propriete.titre}</Badge>
//                                 )}
//                             </div>
//                             {propriete.contenance && (
//                                 <div className="text-sm text-muted-foreground">
//                                     Contenance : {propriete.contenance} m²
//                                 </div>
//                             )}
//                             {propriete.dep_vol_complet && (
//                                 <div className="text-sm text-muted-foreground font-mono">
//                                     {propriete.dep_vol_complet}
//                                 </div>
//                             )}
//                         </div>

//                         {/* 📊 Statistiques */}
//                         <div className="grid grid-cols-2 gap-3">
//                             <div className="p-3 bg-muted rounded-lg">
//                                 <div className="text-xs text-muted-foreground mb-1">Demandeurs</div>
//                                 <div className="text-2xl font-bold">{demandeurs.length}</div>
//                             </div>
//                             <div className="p-3 bg-muted rounded-lg">
//                                 <div className="text-xs text-muted-foreground mb-1">Statut</div>
//                                 <div className="text-sm font-medium">
//                                     {demandeursActifs.length > 0 ? 'Active' : 'Acquise'}
//                                 </div>
//                             </div>
//                         </div>

//                         {/* 👥 Liste des demandeurs */}
//                         <div className="space-y-3">
//                             <h4 className="font-medium text-sm flex items-center gap-2">
//                                 <Users className="h-4 w-4" />
//                                 Demandeurs associés :
//                             </h4>

//                             {demandeursActifs.length > 0 && (
//                                 <div className="space-y-2">
//                                     <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                                         Actifs ({demandeursActifs.length})
//                                     </div>
//                                     {demandeursActifs.map((dem) => (
//                                         <div 
//                                             key={dem.id}
//                                             className="p-3 bg-muted rounded-lg border border-border"
//                                         >
//                                             <div className="flex items-center justify-between">
//                                                 <div>
//                                                     <div className="font-medium text-sm">
//                                                         {dem.nom_complet}
//                                                     </div>
//                                                     <div className="text-xs text-muted-foreground font-mono">
//                                                         CIN: {dem.cin}
//                                                     </div>
//                                                 </div>
//                                                 <Badge variant="default" className="text-xs">
//                                                     Active
//                                                 </Badge>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}

//                             {demandeursArchives.length > 0 && (
//                                 <div className="space-y-2">
//                                     <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                                         Acquis ({demandeursArchives.length})
//                                     </div>
//                                     {demandeursArchives.map((dem) => (
//                                         <div 
//                                             key={dem.id}
//                                             className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
//                                         >
//                                             <div className="flex items-center justify-between">
//                                                 <div>
//                                                     <div className="font-medium text-sm">
//                                                         {dem.nom_complet}
//                                                     </div>
//                                                     <div className="text-xs text-muted-foreground font-mono">
//                                                         CIN: {dem.cin}
//                                                     </div>
//                                                 </div>
//                                                 <Badge 
//                                                     variant="outline" 
//                                                     className="text-xs bg-green-100 text-green-700 border-green-300"
//                                                 >
//                                                     <Archive className="mr-1 h-3 w-3" />
//                                                     Acquise
//                                                 </Badge>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>

//                         {/* 💡 Actions suggérées */}
//                         <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
//                             <h4 className="font-medium text-sm mb-2 text-blue-900 dark:text-blue-100">
//                                 💡 Actions possibles :
//                             </h4>
//                             <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
//                                 {demandeursActifs.length > 0 && (
//                                     <li>1. Dissociez d'abord tous les demandeurs actifs</li>
//                                 )}
//                                 {demandeursArchives.length > 0 && (
//                                     <li>
//                                         {demandeursActifs.length > 0 ? '2' : '1'}. Les acquisitions archivées doivent être conservées pour l'historique
//                                     </li>
//                                 )}
//                                 <li>
//                                     {demandeursArchives.length > 0 ? '3' : '2'}. Utilisez "Archiver (acquise)" si la propriété est définitivement acquise
//                                 </li>
//                             </ul>
//                         </div>
//                     </AlertDialogDescription>
//                 )}

//                 <AlertDialogFooter>
//                     <AlertDialogCancel disabled={isDeleting}>
//                         Annuler
//                     </AlertDialogCancel>
//                     {canDelete && (
//                         <AlertDialogAction
//                             onClick={handleConfirm}
//                             disabled={isDeleting}
//                             className="bg-red-500 hover:bg-red-600"
//                         >
//                             {isDeleting ? 'Suppression...' : 'Supprimer la propriété'}
//                         </AlertDialogAction>
//                     )}
//                 </AlertDialogFooter>
//             </AlertDialogContent>
//         </AlertDialog>
//     );
// }