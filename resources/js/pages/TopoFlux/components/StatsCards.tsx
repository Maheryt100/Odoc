// resources/js/pages/TopoFlux/components/StatsCards.tsx
// ✅ VERSION CORRIGÉE - CLÉS UNIQUES

import { Card } from '@/components/ui/card';
import { FileText, Clock, CheckCircle2, XCircle, Archive } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Stats {
    total: number;
    pending: number;
    archived: number;
    validated: number;
    rejected: number;
}

interface StatsCardsProps {
    stats: Stats;
}

interface StatCard {
    id: string; // ✅ Ajout d'un identifiant unique
    title: string;
    value: number;
    icon: LucideIcon;
    color: string;
}

export default function StatsCards({ stats }: StatsCardsProps) {
    // ✅ Chaque carte a maintenant un ID unique
    const cards: StatCard[] = [
        {
            id: 'stat-total',
            title: 'Total',
            value: stats.total,
            icon: FileText,
            color: 'text-blue-600 bg-blue-100'
        },
        {
            id: 'stat-pending',
            title: 'En attente',
            value: stats.pending,
            icon: Clock,
            color: 'text-yellow-600 bg-yellow-100'
        },
        {
            id: 'stat-archived',
            title: 'Archivés',
            value: stats.archived,
            icon: Archive,
            color: 'text-gray-600 bg-gray-100'
        },
        {
            id: 'stat-validated',
            title: 'Validés',
            value: stats.validated,
            icon: CheckCircle2,
            color: 'text-green-600 bg-green-100'
        },
        {
            id: 'stat-rejected',
            title: 'Rejetés',
            value: stats.rejected,
            icon: XCircle,
            color: 'text-red-600 bg-red-100'
        }
    ];
    
    return (
        <div className="grid gap-4 md:grid-cols-5">
            {cards.map((card) => (
                // ✅ Utilisation de l'ID unique comme clé
                <Card key={card.id} className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{card.title}</p>
                            <p className="text-3xl font-bold mt-1">{card.value}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${card.color}`}>
                            <card.icon className="h-6 w-6" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}