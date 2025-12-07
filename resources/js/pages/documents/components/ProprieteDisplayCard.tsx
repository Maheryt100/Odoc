// documents/components/ProprieteDisplayCard.tsx - VERSION FINALE
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Coins, Crown, Ruler, CheckCircle2 } from 'lucide-react';
import { ProprieteWithDemandeurs } from '../types';
import { getDemandeurPrincipal, getConsorts } from '../validation';
import { safePrix, safeContenance, formatMontant } from '../helpers';

interface ProprieteDisplayCardProps {
    propriete: ProprieteWithDemandeurs;
    showDemandeurs?: boolean;
    showPrice?: boolean;
    colorScheme?: 'violet' | 'emerald' | 'blue';
}

export default function ProprieteDisplayCard({
    propriete,
    showDemandeurs = true,
    showPrice = true,
    colorScheme = 'violet'
}: ProprieteDisplayCardProps) {
    
    const principal = getDemandeurPrincipal(propriete.demandeurs_lies || []);
    const consorts = getConsorts(propriete.demandeurs_lies || []);

    /**
     * ✅ CORRECTION : Utiliser safeContenance pour gérer null
     */
    const formatContenanceDisplay = (contenance: number | null): string => {
        const contenanceSafe = contenance ?? 0;
        if (contenanceSafe === 0) return '-';
        
        const hectares = Math.floor(contenanceSafe / 10000);
        const reste = contenanceSafe % 10000;
        const ares = Math.floor(reste / 100);
        const centiares = reste % 100;
        
        const parts = [];
        if (hectares > 0) parts.push(`${hectares}Ha`);
        if (ares > 0) parts.push(`${ares}A`);
        parts.push(`${centiares}Ca`);
        
        return parts.join(' ');
    };

    const colorClasses = {
        violet: 'border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/80 to-purple-50/50 dark:from-violet-950/30 dark:to-purple-950/20',
        emerald: 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20',
        blue: 'border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/80 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/20',
    };

    const iconColorClasses = {
        violet: 'text-violet-600 dark:text-violet-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        blue: 'text-blue-600 dark:text-blue-400',
    };

    const badgeColorClasses = {
        violet: 'bg-gradient-to-r from-violet-600 to-purple-600',
        emerald: 'bg-gradient-to-r from-emerald-600 to-teal-600',
        blue: 'bg-gradient-to-r from-blue-600 to-cyan-600',
    };

    const borderColorClasses = {
        violet: 'border-violet-200 dark:border-violet-800',
        emerald: 'border-emerald-200 dark:border-emerald-800',
        blue: 'border-blue-200 dark:border-blue-800',
    };

    /**
     * ✅ CORRECTION : Utiliser safePrix pour garantir number
     */
    const prixTotal = principal ? safePrix(principal.total_prix) : 0;

    return (
        <Card className={`border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${colorClasses[colorScheme]}`}>
            <CardContent className="p-6 space-y-5">
                {/* Infos propriété */}
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-sm">
                        <MapPin className={`h-6 w-6 ${iconColorClasses[colorScheme]}`} />
                    </div>
                    <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <Badge className={`${badgeColorClasses[colorScheme]} text-white shadow-md`}>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Lot {propriete.lot}
                            </Badge>
                            <Badge variant="outline" className="shadow-sm">
                                TN°{propriete.titre}
                            </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                <span className="text-muted-foreground flex items-center gap-2 mb-1">
                                    <Ruler className="h-3.5 w-3.5" />
                                    Contenance:
                                </span>
                                <div className="font-semibold text-base">
                                    {formatContenanceDisplay(propriete.contenance)}
                                </div>
                            </div>
                            <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                <span className="text-muted-foreground mb-1 block">Nature:</span>
                                <div className="font-semibold text-base capitalize">
                                    {propriete.nature}
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                            <span className="text-muted-foreground text-sm mb-1 block">Propriétaire:</span>
                            <div className="font-medium">{propriete.proprietaire}</div>
                        </div>
                    </div>
                </div>

                {/* Demandeurs */}
                {showDemandeurs && principal && (
                    <div className={`pt-4 border-t-2 ${borderColorClasses[colorScheme]}`}>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-sm">
                                <Users className={`h-6 w-6 ${iconColorClasses[colorScheme]}`} />
                            </div>
                            <div className="space-y-3 flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md">
                                        <Crown className="h-3 w-3 mr-1" />
                                        Principal
                                    </Badge>
                                    <span className="font-semibold text-base truncate">
                                        {principal.nom} {principal.prenom}
                                    </span>
                                </div>
                                
                                {consorts.length > 0 && (
                                    <div className="space-y-2 p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                        <div className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Consorts ({consorts.length}) :
                                        </div>
                                        <ul className="space-y-2 ml-2">
                                            {consorts.map((c, idx) => (
                                                <li key={idx} className="flex items-center gap-3 text-sm">
                                                    <Badge variant="outline" className="text-xs font-mono">
                                                        #{c.ordre}
                                                    </Badge>
                                                    <span className="truncate">{c.nom} {c.prenom}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="text-xs text-muted-foreground bg-white/40 dark:bg-gray-900/40 p-2 rounded">
                                    {consorts.length > 0 
                                        ? `Document avec ${consorts.length + 1} demandeurs`
                                        : 'Document avec un seul demandeur'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ✅ Prix - CORRECTION FINALE avec formatMontant */}
                {showPrice && principal && (
                    <div className={`pt-4 border-t-2 ${borderColorClasses[colorScheme]}`}>
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 rounded-lg shadow-sm">
                            <Coins className={`h-5 w-5 ${iconColorClasses[colorScheme]}`} />
                            <span className="text-muted-foreground font-medium">Prix total:</span>
                            <span className="font-bold text-lg ml-auto">
                                {formatMontant(prixTotal)}
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}