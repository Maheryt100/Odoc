// Statistics/components/charts/OuverturesFermeturesChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    data: Array<{
        month: string;
        ouvertures: number;
        fermetures: number;
    }>;
}

export function OuverturesFermeturesChart({ data }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Ouvertures vs Fermetures</CardTitle>
                <CardDescription>Évolution sur 12 mois</CardDescription>
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
                            dataKey="ouvertures" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            name="Ouvertures"
                            dot={{ fill: '#10b981' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="fermetures" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            name="Fermetures"
                            dot={{ fill: '#ef4444' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}