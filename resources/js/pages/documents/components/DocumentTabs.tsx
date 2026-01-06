// documents/components/DocumentTabs.tsx - ✅ SANS REÇU

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, FileCheck, FileOutput, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

export type DocumentTabType = 'acte_vente' | 'csf' | 'requisition';

interface DocumentTabsProps {
    activeTab: DocumentTabType;
    onTabChange: (tab: DocumentTabType) => void;
    stats: {
        proprietesAvecAdv: number;
        totalProprietes: number;
        demandeursAvecCsf: number;
        totalDemandeurs: number;
        requisitionsGenerees: number;
    };
}

const tabsConfig = [
    {
        value: 'acte_vente' as DocumentTabType,
        icon: FileText,
        label: 'Acte de Vente',
        shortLabel: 'ADV',
        getCount: (stats: DocumentTabsProps['stats']) => 
            `${stats.proprietesAvecAdv}/${stats.totalProprietes}`,
        colorClass: 'from-violet-600 to-purple-600',
        bgClass: 'bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-950/10 dark:to-purple-950/10',
    },
    {
        value: 'csf' as DocumentTabType,
        icon: FileCheck,
        label: 'CSF',
        shortLabel: 'CSF',
        getCount: (stats: DocumentTabsProps['stats']) => 
            `${stats.demandeursAvecCsf}/${stats.totalDemandeurs}`,
        colorClass: 'from-emerald-600 to-teal-600',
        bgClass: 'bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/10',
    },
    {
        value: 'requisition' as DocumentTabType,
        icon: FileOutput,
        label: 'Réquisition',
        shortLabel: 'Réq.',
        getCount: (stats: DocumentTabsProps['stats']) => 
            `${stats.requisitionsGenerees}/${stats.totalProprietes}`,
        colorClass: 'from-blue-600 to-cyan-600',
        bgClass: 'bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-950/10 dark:to-cyan-950/10',
    },
];

export function DocumentTabs({ activeTab, onTabChange, stats }: DocumentTabsProps) {
    const isMobile = useIsMobile();
    const activeConfig = tabsConfig.find(t => t.value === activeTab)!;
    const ActiveIcon = activeConfig.icon;

    if (isMobile) {
        return (
            <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20 border-b p-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="outline" 
                            className="w-full justify-between h-12"
                        >
                            <div className="flex items-center gap-2">
                                <ActiveIcon className="h-4 w-4" />
                                <span className="font-semibold">
                                    {activeConfig.label}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                    {activeConfig.getCount(stats)}
                                </Badge>
                            </div>
                            <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full min-w-[320px]" align="start">
                        {tabsConfig.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.value;
                            return (
                                <DropdownMenuItem
                                    key={tab.value}
                                    onClick={() => onTabChange(tab.value)}
                                    className={cn(
                                        "cursor-pointer py-3 px-4",
                                        isActive && tab.bgClass
                                    )}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4" />
                                            <span className="font-medium">
                                                {tab.label}
                                            </span>
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            {tab.getCount(stats)}
                                        </Badge>
                                    </div>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20 border-b">
            <div className="flex">
                {tabsConfig.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.value;
                    return (
                        <button
                            key={tab.value}
                            onClick={() => onTabChange(tab.value)}
                            className={cn(
                                "flex-1 flex flex-col items-center gap-2 py-4 px-6",
                                "transition-all duration-200",
                                "hover:bg-white/50 dark:hover:bg-gray-900/50",
                                isActive ? [
                                    tab.bgClass,
                                    "border-b-2",
                                    `border-gradient-to-r ${tab.colorClass}`,
                                    "shadow-sm"
                                ] : "border-b-2 border-transparent"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Icon className="h-5 w-5" />
                                <span className="font-semibold text-sm">
                                    {tab.label}
                                </span>
                            </div>
                            <Badge 
                                variant={isActive ? "default" : "secondary"}
                                className="text-xs"
                            >
                                {tab.getCount(stats)}
                            </Badge>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}