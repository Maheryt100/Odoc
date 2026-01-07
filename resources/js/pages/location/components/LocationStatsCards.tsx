// // resources/js/pages/location/components/LocationStatsCards.tsx 

// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Building2, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

// interface LocationStatsCardsProps {
//     totalDistricts: number;
//     districtsWithPrices: number;
// }

// export default function LocationStatsCards({ totalDistricts, districtsWithPrices }: LocationStatsCardsProps) {
//     const districtsMissing = totalDistricts - districtsWithPrices;
//     const percentComplete = totalDistricts > 0 
//         ? Math.round((districtsWithPrices / totalDistricts) * 100) 
//         : 0;

//     return (
//         <div className="grid gap-4 md:grid-cols-3">
//             {/* Total Districts */}
//             <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
//                 <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
//                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                         <CardTitle className="text-sm font-medium">Total Districts</CardTitle>
//                         <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
//                             <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
//                         </div>
//                     </CardHeader>
//                 </div>
//                 <CardContent className="pt-4">
//                     <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
//                         {totalDistricts}
//                     </div>
//                     <p className="text-xs text-muted-foreground mt-2">
//                         Circonscriptions enregistrées
//                     </p>
//                 </CardContent>
//             </Card>

//             {/* Prix Configurés */}
//             <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
//                 <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
//                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                         <CardTitle className="text-sm font-medium">Prix Configurés</CardTitle>
//                         <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
//                             <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
//                         </div>
//                     </CardHeader>
//                 </div>
//                 <CardContent className="pt-4">
//                     <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
//                         {districtsWithPrices}
//                     </div>
//                     <div className="flex items-center gap-2 mt-2">
//                         <TrendingUp className="h-3 w-3 text-green-500" />
//                         <p className="text-xs text-muted-foreground">
//                             {percentComplete}% des districts complétés
//                         </p>
//                     </div>
//                     <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
//                         <div
//                             className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
//                             style={{ width: `${percentComplete}%` }}
//                         />
//                     </div>
//                 </CardContent>
//             </Card>

//             {/* Prix Manquants */}
//             <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
//                 <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
//                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                         <CardTitle className="text-sm font-medium">Prix Manquants</CardTitle>
//                         <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
//                             <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
//                         </div>
//                     </CardHeader>
//                 </div>
//                 <CardContent className="pt-4">
//                     <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
//                         {districtsMissing}
//                     </div>
//                     <p className="text-xs text-muted-foreground mt-2">
//                         Districts à configurer
//                     </p>
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }