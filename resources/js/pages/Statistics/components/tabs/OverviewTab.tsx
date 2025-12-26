// Statistics/components/tabs/OverviewTab.tsx
import { Activity, LandPlot, Users, DollarSign } from 'lucide-react';
import { StatCard } from '../StatCard';
import { EvolutionChart } from '../charts/EvolutionChart';
import type { Stats, ChartData } from '../../types';

interface Props {
    stats: Stats;
    charts: ChartData;
}

export function OverviewTab({ stats, charts }: Props) {
    const overview = stats.overview;
    const proprietes = stats.proprietes;
    const demandeurs = stats.demandeurs;
    const financials = stats.financials;

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Cards principales - Responsive */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    icon={Activity}
                    title="Total dossiers"
                    value={overview.total_dossiers.toString()}
                    subtitle={`${overview.dossiers_ouverts} ouverts, ${overview.dossiers_fermes} fermés`}
                    color="blue"
                />
                <StatCard 
                    icon={LandPlot}
                    title="Propriétés"
                    value={proprietes.total.toString()}
                    subtitle={`${proprietes.disponibles} disponibles`}
                    color="green"
                />
                <StatCard 
                    icon={Users}
                    title="Demandeurs"
                    value={demandeurs.total.toString()}
                    subtitle={`${demandeurs.avec_propriete} avec propriété`}
                    color="purple"
                />
                <StatCard 
                    icon={DollarSign}
                    title="Revenus"
                    value={`${(financials.total_revenus_potentiels / 1000000).toFixed(1)}M Ar`}
                    subtitle="Potentiel total"
                    color="orange"
                />
            </div>

            {/* Graphique d'évolution */}
            <EvolutionChart data={charts.evolution_complete} />
        </div>
    );
}