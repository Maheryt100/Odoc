// documents/components/DocumentTabs.tsx
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, FileCheck, FileOutput } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentTabType, DocumentStats } from '../types';

interface DocumentTabsProps {
  activeTab: DocumentTabType;
  onTabChange: (tab: DocumentTabType) => void;
  stats: DocumentStats;
}

const tabs = [
  {
    value: 'acte_vente' as DocumentTabType,
    icon: FileText,
    label: 'Acte de Vente',
    shortLabel: 'ADV',
    getCount: (stats: DocumentStats) => 
      `${stats.proprietesAvecAdv}/${stats.totalProprietes}`,
    colorClass: 'from-violet-600 to-purple-600',
    bgClass: 'bg-violet-50 dark:bg-violet-950/20'
  },
  {
    value: 'csf' as DocumentTabType,
    icon: FileCheck,
    label: 'CSF',
    shortLabel: 'CSF',
    getCount: (stats: DocumentStats) => 
      `${stats.demandeursAvecCsf}/${stats.totalDemandeurs}`,
    colorClass: 'from-emerald-600 to-teal-600',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/20'
  },
  {
    value: 'requisition' as DocumentTabType,
    icon: FileOutput,
    label: 'Réquisition',
    shortLabel: 'Réq.',
    getCount: (stats: DocumentStats) => 
      `${stats.requisitionsGenerees}/${stats.totalProprietes}`,
    colorClass: 'from-blue-600 to-cyan-600',
    bgClass: 'bg-blue-50 dark:bg-blue-950/20'
  }
];

export function DocumentTabs({ activeTab, onTabChange, stats }: DocumentTabsProps) {
  return (
    <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20 border-b">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'flex-1 min-w-[150px] flex flex-col items-center gap-2 py-4 px-4',
                'transition-all duration-200 border-b-2',
                'hover:bg-white/50 dark:hover:bg-gray-900/50',
                isActive ? [
                  tab.bgClass,
                  'border-b-2',
                  `border-gradient-to-r ${tab.colorClass}`,
                  'shadow-sm'
                ] : 'border-transparent'
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                <span className="font-semibold text-sm hidden sm:inline">
                  {tab.label}
                </span>
                <span className="font-semibold text-sm sm:hidden">
                  {tab.shortLabel}
                </span>
              </div>
              <Badge 
                variant={isActive ? 'default' : 'secondary'}
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