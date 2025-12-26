// documents/components/StickyActionFooter.tsx - ✅ FOOTER STICKY MOBILE

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, FileCheck, FileOutput, Receipt, Download, Lock } from 'lucide-react';
import { useIsMobile } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { DocumentTabType } from './DocumentTabs';

interface StickyActionFooterProps {
    activeTab: DocumentTabType;
    isGenerating: boolean;
    canGenerate: boolean;
    hasDocument: boolean;
    onGenerate: () => void;
    onDownload?: () => void;
    validationMessage?: string | null;
    documentType?: 'recu' | 'adv' | 'csf' | 'requisition';
}

export function StickyActionFooter({
    activeTab,
    isGenerating,
    canGenerate,
    hasDocument,
    onGenerate,
    onDownload,
    validationMessage,
    documentType
}: StickyActionFooterProps) {
    
    const isMobile = useIsMobile();

    // Ne pas afficher sur desktop
    if (!isMobile) return null;

    const getButtonConfig = () => {
        switch (activeTab) {
            case 'acte_vente':
                if (documentType === 'recu') {
                    return {
                        icon: Receipt,
                        label: hasDocument ? 'Télécharger Reçu' : 'Générer Reçu',
                        gradient: 'from-green-600 to-emerald-600'
                    };
                }
                return {
                    icon: FileText,
                    label: hasDocument ? 'Télécharger ADV' : 'Générer ADV',
                    gradient: 'from-violet-600 to-purple-600'
                };
            case 'csf':
                return {
                    icon: FileCheck,
                    label: hasDocument ? 'Télécharger CSF' : 'Générer CSF',
                    gradient: 'from-emerald-600 to-teal-600'
                };
            case 'requisition':
                return {
                    icon: FileOutput,
                    label: hasDocument ? 'Télécharger Réq.' : 'Générer Réq.',
                    gradient: 'from-blue-600 to-cyan-600'
                };
        }
    };

    const config = getButtonConfig();
    const Icon = config.icon;

    return (
        <>
            {/* Spacer pour éviter que le contenu soit caché */}
            <div className="h-20" />
            
            {/* Footer sticky */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
                <div className="container mx-auto px-4 py-3">
                    {/* Message de validation */}
                    {!canGenerate && validationMessage && (
                        <div className="mb-2 text-xs text-center text-amber-600 dark:text-amber-400 line-clamp-2">
                            {validationMessage}
                        </div>
                    )}
                    
                    {/* Bouton principal */}
                    <Button
                        onClick={hasDocument ? onDownload : onGenerate}
                        disabled={isGenerating || (!hasDocument && !canGenerate)}
                        size="lg"
                        className={cn(
                            "w-full h-12 text-sm font-semibold",
                            `bg-gradient-to-r ${config.gradient}`,
                            "shadow-md active:scale-95 transition-transform"
                        )}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Génération...
                            </>
                        ) : !canGenerate && !hasDocument ? (
                            <>
                                <Lock className="h-4 w-4 mr-2" />
                                Données incomplètes
                            </>
                        ) : hasDocument ? (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                {config.label}
                            </>
                        ) : (
                            <>
                                <Icon className="h-4 w-4 mr-2" />
                                {config.label}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </>
    );
}