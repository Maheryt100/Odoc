// documents/components/DocumentSelects.tsx - ✅ VERSION ULTRA-CLEAN

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FileCheck, Crown, Users, MapPin, User, Info } from 'lucide-react';
import { ProprieteWithDemandeurs } from '../types';
import { isProprieteComplete, getDemandeurPrincipal, getConsorts } from '../validation';
import { useIsMobile } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================
// PROPRIETE SELECT
// ============================================

interface ProprieteSelectProps {
    value: string;
    onChange: (value: string) => void;
    proprietes: ProprieteWithDemandeurs[];
    disabled?: boolean;
    placeholder?: string;
}

export function ProprieteSelect({
    value,
    onChange,
    proprietes,
    disabled = false,
    placeholder = "Sélectionnez une propriété"
}: ProprieteSelectProps) {
    
    const isMobile = useIsMobile();
    const selectedProp = proprietes.find(p => p.id === Number(value));

    // ✅ Item minimal avec tooltip sur desktop
    const ProprieteItem = ({ prop }: { prop: ProprieteWithDemandeurs }) => {
        const isComplete = isProprieteComplete(prop);
        const principal = getDemandeurPrincipal(prop.demandeurs_lies || []);
        const consorts = getConsorts(prop.demandeurs_lies || []);
        
        const content = (
            <div className="flex items-center gap-2 w-full">
                {/* Infos essentielles */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Badge variant="outline" className="font-mono text-xs px-1.5 shrink-0">
                        L{prop.lot}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                        TN°{prop.titre}
                    </span>
                </div>

                {/* Status icons */}
                <div className="flex items-center gap-1 shrink-0">
                    {prop.document_recu && (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                    )}
                    {prop.document_adv && (
                        <FileCheck className="h-3 w-3 text-blue-500" />
                    )}
                    {!isComplete && (
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                    )}
                </div>
            </div>
        );

        // ✅ Tooltip sur desktop uniquement
        if (!isMobile) {
            return (
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">{content}</div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                            <div className="space-y-2 text-xs">
                                <div className="font-semibold flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    Lot {prop.lot} - TN°{prop.titre}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div>
                                        <span className="text-muted-foreground">Contenance:</span>
                                        <div className="font-medium">
                                            {formatContenance(prop.contenance)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Nature:</span>
                                        <div className="font-medium capitalize">{prop.nature}</div>
                                    </div>
                                </div>
                                {principal && (
                                    <div className="pt-2 border-t">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Crown className="h-3 w-3 text-yellow-500" />
                                            <span className="font-medium">
                                                {principal.nom} {principal.prenom}
                                            </span>
                                        </div>
                                        {consorts.length > 0 && (
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Users className="h-2.5 w-2.5" />
                                                +{consorts.length} consorts
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return content;
    };

    const formatContenance = (contenance: number | null): string => {
        if (!contenance) return '-';
        const ha = Math.floor(contenance / 10000);
        const reste = contenance % 10000;
        const a = Math.floor(reste / 100);
        const ca = reste % 100;
        const parts = [];
        if (ha > 0) parts.push(`${ha}Ha`);
        if (a > 0) parts.push(`${a}A`);
        parts.push(`${ca}Ca`);
        return parts.join(' ');
    };

    return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={cn(
                "h-11 w-full",
                isMobile && "h-12" // Plus grand sur mobile pour touch
            )}>
                <SelectValue>
                    {selectedProp ? (
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                                L{selectedProp.lot}
                            </Badge>
                            <span className="text-sm truncate">
                                TN°{selectedProp.titre}
                            </span>
                            {!isMobile && selectedProp.contenance && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                    {formatContenance(selectedProp.contenance)}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-muted-foreground text-sm">{placeholder}</span>
                    )}
                </SelectValue>
            </SelectTrigger>
            
            <SelectContent className="max-h-[300px]">
                {proprietes.map((prop) => (
                    <SelectItem 
                        key={prop.id} 
                        value={String(prop.id)}
                        className="cursor-pointer py-3"
                    >
                        <ProprieteItem prop={prop} />
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

// ============================================
// DEMANDEUR SELECT
// ============================================

interface DemandeurSelectProps {
    value: string;
    onChange: (value: string) => void;
    demandeurs: any[];
    disabled?: boolean;
    placeholder?: string;
    demandeurLies?: any[];
}

export function DemandeurSelect({
    value,
    onChange,
    demandeurs,
    disabled = false,
    placeholder = "Sélectionnez un demandeur",
    demandeurLies = []
}: DemandeurSelectProps) {
    
    const isMobile = useIsMobile();
    const selectedDem = demandeurs.find(d => d.id === Number(value));

    const DemandeurItem = ({ dem }: { dem: any }) => {
        const demandeurLie = demandeurLies.find(d => d.id === dem.id);
        const isPrincipal = demandeurLie?.ordre === 1;
        const hasDocument = !!dem.document_csf;
        
        const content = (
            <div className="flex items-center gap-2 w-full">
                {/* Infos essentielles */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {isPrincipal && (
                        <Crown className="h-3 w-3 text-yellow-500 shrink-0" />
                    )}
                    <span className="text-sm truncate">
                        {dem.nom_demandeur} {dem.prenom_demandeur}
                    </span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1 shrink-0">
                    {demandeurLie && (
                        <Badge variant="outline" className="text-[10px] px-1.5">
                            {isPrincipal ? 'P' : `#${demandeurLie.ordre}`}
                        </Badge>
                    )}
                    {hasDocument && (
                        <FileCheck className="h-3 w-3 text-green-500" />
                    )}
                </div>
            </div>
        );

        // ✅ Tooltip sur desktop
        if (!isMobile) {
            return (
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">{content}</div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                            <div className="space-y-2 text-xs">
                                <div className="font-semibold flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    {dem.titre_demandeur} {dem.nom_demandeur} {dem.prenom_demandeur}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div>
                                        <span className="text-muted-foreground">CIN:</span>
                                        <div className="font-mono">{dem.cin}</div>
                                    </div>
                                    {dem.occupation && (
                                        <div>
                                            <span className="text-muted-foreground">Occupation:</span>
                                            <div className="font-medium">{dem.occupation}</div>
                                        </div>
                                    )}
                                </div>
                                {demandeurLie && (
                                    <div className="pt-2 border-t text-[10px]">
                                        <span className="text-muted-foreground">
                                            {isPrincipal ? 'Demandeur principal' : `Consort - Ordre ${demandeurLie.ordre}`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return content;
    };

    return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={cn(
                "h-11 w-full",
                isMobile && "h-12"
            )}>
                <SelectValue>
                    {selectedDem ? (
                        <div className="flex items-center gap-2">
                            {demandeurLies.find(d => d.id === selectedDem.id)?.ordre === 1 && (
                                <Crown className="h-3 w-3 text-yellow-500 shrink-0" />
                            )}
                            <span className="text-sm truncate">
                                {selectedDem.nom_demandeur} {selectedDem.prenom_demandeur}
                            </span>
                            {!isMobile && (
                                <span className="text-xs text-muted-foreground ml-auto font-mono">
                                    {selectedDem.cin}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-muted-foreground text-sm">{placeholder}</span>
                    )}
                </SelectValue>
            </SelectTrigger>
            
            <SelectContent className="max-h-[300px]">
                {demandeurs.map((dem) => (
                    <SelectItem 
                        key={dem.id} 
                        value={String(dem.id)}
                        className="cursor-pointer py-3"
                    >
                        <DemandeurItem dem={dem} />
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}