// documents/components/ProprieteSelect.tsx - ✅ VERSION ULTRA-RESPONSIVE

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FileCheck, AlertCircle, Crown, Users } from 'lucide-react';
import { ProprieteWithDemandeurs } from '../types';
import { isProprieteComplete, getDemandeurPrincipal, getConsorts } from '../validation';
import { useIsMobile } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface ProprieteSelectProps {
    value: string;
    onChange: (value: string) => void;
    proprietes: ProprieteWithDemandeurs[];
    disabled?: boolean;
    placeholder?: string;
    showDemandeurs?: boolean;
}

export default function ProprieteSelect({
    value,
    onChange,
    proprietes,
    disabled = false,
    placeholder = "Sélectionner une propriété",
    showDemandeurs = true
}: ProprieteSelectProps) {
    
    const isMobile = useIsMobile();

    // ✅ Composant Item optimisé avec largeur flexible
    const ProprieteItem = ({ prop }: { prop: ProprieteWithDemandeurs }) => {
        const isComplete = isProprieteComplete(prop);
        const principal = getDemandeurPrincipal(prop.demandeurs_lies || []);
        const consorts = getConsorts(prop.demandeurs_lies || []);
        
        return (
            <div className={cn(
                "flex flex-col gap-1.5 py-1.5 w-full",
                isMobile ? "pr-2" : "pr-4"
            )}>
                {/* Ligne 1: LOT + TITRE + STATUS */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="font-mono text-[10px] xs:text-xs px-1.5 py-0">
                        L{prop.lot}
                    </Badge>
                    
                    <Badge variant="outline" className="text-[10px] xs:text-xs px-1.5 py-0">
                        TN°{prop.titre}
                    </Badge>

                    {/* Documents Status - Masqués sur très petits écrans */}
                    {!isMobile && (
                        <>
                            {prop.document_recu && (
                                <Badge className="bg-green-500 text-white text-[9px] xs:text-[10px] px-1 py-0">
                                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                    Reçu
                                </Badge>
                            )}
                            {prop.document_adv && (
                                <Badge className="bg-blue-500 text-white text-[9px] xs:text-[10px] px-1 py-0">
                                    <FileCheck className="h-2.5 w-2.5 mr-0.5" />
                                    ADV
                                </Badge>
                            )}
                        </>
                    )}

                    {!isComplete && (
                        <Badge variant="destructive" className="text-[9px] xs:text-[10px] px-1 py-0">
                            <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                            {isMobile ? '!' : 'Incomplet'}
                        </Badge>
                    )}
                </div>

                {/* Ligne 2: DEMANDEURS (si activé) */}
                {showDemandeurs && principal && (
                    <div className="flex items-center gap-1.5 text-[10px] xs:text-xs text-muted-foreground ml-0.5 flex-wrap">
                        <div className="flex items-center gap-1 shrink-0">
                            <Crown className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-yellow-500 shrink-0" />
                            <span className="font-medium">
                                {isMobile 
                                    ? `${principal.nom.substring(0, 8)}...`
                                    : `${principal.nom} ${principal.prenom}`
                                }
                            </span>
                        </div>

                        {consorts.length > 0 && (
                            <div className="flex items-center gap-0.5 xs:gap-1 shrink-0">
                                <Users className="h-2.5 w-2.5 xs:h-3 xs:w-3 shrink-0" />
                                <span className="whitespace-nowrap">
                                    +{consorts.length}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // ✅ Trigger optimisé avec texte raccourci
    const selectedProp = proprietes.find(p => p.id === Number(value));
    const TriggerContent = () => {
        if (!selectedProp) {
            return <span className="text-muted-foreground text-xs xs:text-sm">{placeholder}</span>;
        }

        const principal = getDemandeurPrincipal(selectedProp.demandeurs_lies || []);
        const consorts = getConsorts(selectedProp.demandeurs_lies || []);

        return (
            <div className="flex items-center gap-1.5 flex-wrap w-full">
                <Badge variant="outline" className="font-mono text-[10px] xs:text-xs px-1 py-0">
                    L{selectedProp.lot}
                </Badge>
                
                <Badge variant="outline" className="text-[10px] xs:text-xs px-1 py-0">
                    TN°{selectedProp.titre}
                </Badge>

                {showDemandeurs && principal && (
                    <span className="text-[10px] xs:text-xs text-muted-foreground truncate flex-1 min-w-0">
                        {isMobile 
                            ? `${principal.nom.substring(0, 6)}...`
                            : `${principal.nom}`
                        }
                        {consorts.length > 0 && ` +${consorts.length}`}
                    </span>
                )}

                {/* Status icons - Desktop only */}
                {!isMobile && (
                    <div className="flex items-center gap-1 ml-auto shrink-0">
                        {selectedProp.document_recu && (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                        )}
                        {selectedProp.document_adv && (
                            <FileCheck className="h-3 w-3 text-blue-500" />
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={cn(
                "h-auto min-h-[44px]", // Touch-friendly height
                isMobile ? "text-xs" : "text-sm"
            )}>
                <SelectValue>
                    <TriggerContent />
                </SelectValue>
            </SelectTrigger>
            
            <SelectContent 
                className={cn(
                    "max-h-[300px] overflow-y-auto",
                    // ✅ Largeur adaptative selon l'écran
                    "w-auto min-w-[280px]",
                    isMobile ? "max-w-[calc(100vw-32px)]" : "max-w-[600px]"
                )}
            >
                {proprietes.map((prop) => (
                    <SelectItem 
                        key={prop.id} 
                        value={String(prop.id)}
                        className={cn(
                            "cursor-pointer",
                            isMobile ? "py-2" : "py-3",
                            // ✅ Largeur flexible
                            "w-full"
                        )}
                    >
                        <ProprieteItem prop={prop} />
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

// ============================================
// COMPOSANT DEMANDEUR SELECT (Même principe)
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
    placeholder = "Sélectionner un demandeur",
    demandeurLies = []
}: DemandeurSelectProps) {
    
    const isMobile = useIsMobile();

    const DemandeurItem = ({ dem }: { dem: any }) => {
        const demandeurLie = demandeurLies.find(d => d.id === dem.id);
        const isPrincipal = demandeurLie?.ordre === 1;
        const hasDocument = !!dem.document_csf;
        
        return (
            <div className="flex items-center gap-1.5 flex-wrap py-1 w-full">
                {isPrincipal && (
                    <Crown className="h-3 w-3 text-yellow-500 shrink-0" />
                )}
                
                <span className={cn(
                    isMobile ? "text-xs" : "text-sm"
                )}>
                    {dem.nom_demandeur} {dem.prenom_demandeur}
                </span>
                
                {demandeurLie && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {isPrincipal ? 'P' : `#${demandeurLie.ordre}`}
                    </Badge>
                )}
                
                {hasDocument && !isMobile && (
                    <Badge className="bg-green-500 text-white text-[9px] px-1 py-0">
                        <FileCheck className="h-2.5 w-2.5" />
                    </Badge>
                )}
            </div>
        );
    };

    const selectedDem = demandeurs.find(d => d.id === Number(value));
    const TriggerContent = () => {
        if (!selectedDem) {
            return <span className="text-muted-foreground text-xs xs:text-sm">{placeholder}</span>;
        }

        const demandeurLie = demandeurLies.find(d => d.id === selectedDem.id);
        const isPrincipal = demandeurLie?.ordre === 1;

        return (
            <div className="flex items-center gap-1.5 w-full">
                {isPrincipal && (
                    <Crown className="h-3 w-3 text-yellow-500 shrink-0" />
                )}
                <span className={cn(
                    "flex-1 min-w-0",
                    isMobile ? "text-xs" : "text-sm"
                )}>
                    {isMobile 
                        ? `${selectedDem.nom_demandeur.substring(0, 10)}...`
                        : `${selectedDem.nom_demandeur} ${selectedDem.prenom_demandeur}`
                    }
                </span>
                {demandeurLie && !isMobile && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                        {isPrincipal ? 'Principal' : `Ordre ${demandeurLie.ordre}`}
                    </Badge>
                )}
            </div>
        );
    };

    return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={cn(
                "h-auto min-h-[44px]",
                isMobile ? "text-xs" : "text-sm"
            )}>
                <SelectValue>
                    <TriggerContent />
                </SelectValue>
            </SelectTrigger>
            
            <SelectContent 
                className={cn(
                    "max-h-[300px] overflow-y-auto",
                    // ✅ Largeur adaptative selon l'écran
                    "w-auto min-w-[240px]",
                    isMobile ? "max-w-[calc(100vw-32px)]" : "max-w-[500px]"
                )}
            >
                {demandeurs.map((dem) => (
                    <SelectItem 
                        key={dem.id} 
                        value={String(dem.id)}
                        className={cn(
                            "cursor-pointer",
                            isMobile ? "py-2" : "py-3",
                            // ✅ Largeur flexible
                            "w-full"
                        )}
                    >
                        <DemandeurItem dem={dem} />
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}