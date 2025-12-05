// Statistics/components/charts/EvolutionChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    data: Array<{
        month: string;
        dossiers: number;
        proprietes: number;
        demandeurs: number;
    }>;
}

export function EvolutionChart({ data }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Évolution mensuelle</CardTitle>
                <CardDescription>Activité sur les 12 derniers mois</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                            dataKey="month" 
                            className="text-xs"
                            tick={{ fill: 'currentColor' }}
                        />
                        <YAxis 
                            className="text-xs"
                            tick={{ fill: 'currentColor' }}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px'
                            }}
                        />
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey="dossiers" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            name="Dossiers"
                            dot={{ fill: '#3b82f6' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="proprietes" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            name="Propriétés"
                            dot={{ fill: '#10b981' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="demandeurs" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            name="Demandeurs"
                            dot={{ fill: '#8b5cf6' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}