// documents/components/ProprieteDisplayCard.tsx - ✅ VERSION RESPONSIVE

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Coins, Crown, Ruler, CheckCircle2 } from 'lucide-react';
import { ProprieteWithDemandeurs } from '../types';
import { getDemandeurPrincipal, getConsorts } from '../validation';
import { safePrix, formatMontant } from '../helpers';
import { useIsMobile } from '@/hooks/useResponsive';

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
    
    const isMobile = useIsMobile();
    const principal = getDemandeurPrincipal(propriete.demandeurs_lies || []);
    const consorts = getConsorts(propriete.demandeurs_lies || []);

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

    const prixTotal = principal ? safePrix(principal.total_prix) : 0;

    return (
        <Card className={`border-2 shadow-md hover:shadow-lg transition-all duration-300 ${colorClasses[colorScheme]}`}>
            <CardContent className={`${isMobile ? 'p-3' : 'p-4 sm:p-6'} space-y-3 sm:space-y-5`}>
                {/* Infos propriété */}
                <div className="flex items-start gap-2 sm:gap-4">
                    <div className={`${isMobile ? 'p-2' : 'p-3'} bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-sm shrink-0`}>
                        <MapPin className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'} ${iconColorClasses[colorScheme]}`} />
                    </div>
                    <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${badgeColorClasses[colorScheme]} text-white shadow-md text-xs`}>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Lot {propriete.lot}
                            </Badge>
                            <Badge variant="outline" className="shadow-sm text-xs">
                                TN°{propriete.titre}
                            </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                            <div className="p-2 sm:p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                <span className="text-muted-foreground flex items-center gap-1 sm:gap-2 mb-1">
                                    <Ruler className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    {isMobile ? 'Cont.' : 'Contenance'}:
                                </span>
                                <div className="font-semibold text-sm sm:text-base">
                                    {formatContenanceDisplay(propriete.contenance)}
                                </div>
                            </div>
                            <div className="p-2 sm:p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                <span className="text-muted-foreground mb-1 block">Nature:</span>
                                <div className="font-semibold text-sm sm:text-base capitalize truncate">
                                    {propriete.nature}
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-2 sm:p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                            <span className="text-muted-foreground text-xs sm:text-sm mb-1 block">
                                {isMobile ? 'Proprio.' : 'Propriétaire'}:
                            </span>
                            <div className="font-medium text-xs sm:text-sm truncate">{propriete.proprietaire}</div>
                        </div>
                    </div>
                </div>

                {/* Demandeurs */}
                {showDemandeurs && principal && (
                    <div className={`pt-3 sm:pt-4 border-t-2 ${borderColorClasses[colorScheme]}`}>
                        <div className="flex items-start gap-2 sm:gap-4">
                            <div className={`${isMobile ? 'p-2' : 'p-3'} bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-sm shrink-0`}>
                                <Users className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'} ${iconColorClasses[colorScheme]}`} />
                            </div>
                            <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md text-xs">
                                        <Crown className="h-3 w-3 mr-1" />
                                        {isMobile ? 'Princ.' : 'Principal'}
                                    </Badge>
                                    <span className="font-semibold text-xs sm:text-base truncate">
                                        {principal.nom} {principal.prenom}
                                    </span>
                                </div>
                                
                                {consorts.length > 0 && (
                                    <div className="space-y-2 p-2 sm:p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                        <div className="font-medium text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                                            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                                            Consorts ({consorts.length})
                                        </div>
                                        {!isMobile && (
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
                                        )}
                                    </div>
                                )}

                                {!isMobile && (
                                    <div className="text-xs text-muted-foreground bg-white/40 dark:bg-gray-900/40 p-2 rounded">
                                        {consorts.length > 0 
                                            ? `Document avec ${consorts.length + 1} demandeurs`
                                            : 'Document avec un seul demandeur'
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Prix */}
                {showPrice && principal && (
                    <div className={`pt-3 sm:pt-4 border-t-2 ${borderColorClasses[colorScheme]}`}>
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 rounded-lg shadow-sm">
                            <Coins className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} ${iconColorClasses[colorScheme]}`} />
                            <span className="text-muted-foreground font-medium text-xs sm:text-sm">
                                {isMobile ? 'Prix:' : 'Prix total:'}
                            </span>
                            <span className={`font-bold ${isMobile ? 'text-base' : 'text-lg'} ml-auto`}>
                                {formatMontant(prixTotal)}
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================
// documents/components/DemandeurDisplayCard.tsx - ✅ VERSION RESPONSIVE
// ============================================

import { Card as DemCard, CardContent as DemCardContent } from '@/components/ui/card';
import { Badge as DemBadge } from '@/components/ui/badge';
import { Users as DemUsers, Crown as DemCrown, Phone, MapPin as DemMapPin, Briefcase } from 'lucide-react';
import { Demandeur } from '@/types';

interface DemandeurDisplayCardProps {
    demandeur: Demandeur;
    ordre?: number;
    isPrincipal?: boolean;
    colorScheme?: 'violet' | 'emerald' | 'blue';
}

export function DemandeurDisplayCard({
    demandeur,
    ordre,
    isPrincipal = false,
    colorScheme = 'blue'
}: DemandeurDisplayCardProps) {
    
    const isMobile = useIsMobile();
    
    const colorClasses = {
        violet: 'border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20',
        emerald: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20',
        blue: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20',
    };

    const iconColorClasses = {
        violet: 'text-violet-600 dark:text-violet-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        blue: 'text-blue-600 dark:text-blue-400',
    };

    return (
        <DemCard className={`border-2 ${colorClasses[colorScheme]}`}>
            <DemCardContent className={isMobile ? 'p-3' : 'p-4'}>
                <div className="flex items-start gap-2 sm:gap-3">
                    <DemUsers className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} ${iconColorClasses[colorScheme]} flex-shrink-0 mt-1`} />
                    <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            {isPrincipal && (
                                <DemBadge className="bg-yellow-500 text-white text-xs">
                                    <DemCrown className="h-3 w-3 mr-1" />
                                    {isMobile ? 'Princ.' : 'Principal'}
                                </DemBadge>
                            )}
                            {!isPrincipal && ordre && (
                                <DemBadge variant="outline" className="text-xs">
                                    Ordre {ordre}
                                </DemBadge>
                            )}
                            <span className="font-semibold text-xs sm:text-sm truncate">
                                {demandeur.titre_demandeur} {demandeur.nom_demandeur} {demandeur.prenom_demandeur}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-muted-foreground">CIN:</span>
                                <div className="font-mono text-xs truncate">{demandeur.cin}</div>
                            </div>
                            {demandeur.occupation && !isMobile && (
                                <div>
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <Briefcase className="h-3 w-3" />
                                        Occupation:
                                    </span>
                                    <div className="font-medium text-xs truncate">{demandeur.occupation}</div>
                                </div>
                            )}
                        </div>

                        {demandeur.domiciliation && !isMobile && (
                            <div className="text-xs">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <DemMapPin className="h-3 w-3" />
                                    Domiciliation:
                                </span>
                                <div className="font-medium text-xs truncate">{demandeur.domiciliation}</div>
                            </div>
                        )}

                        {demandeur.telephone && !isMobile && (
                            <div className="text-xs">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    Téléphone:
                                </span>
                                <div className="font-medium text-xs">{demandeur.telephone}</div>
                            </div>
                        )}
                    </div>
                </div>
            </DemCardContent>
        </DemCard>
    );
}