// Statistics/components/charts/TopCommunesChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    data: Array<{
        commune: string;
        count: number;
    }>;
}

const COLORS = [
    '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export function TopCommunesChart({ data }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top 10 communes</CardTitle>
                <CardDescription>Communes les plus actives</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                        data={data} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                            type="number"
                            className="text-xs"
                            tick={{ fill: 'currentColor' }}
                        />
                        <YAxis 
                            type="category"
                            dataKey="commune" 
                            className="text-xs"
                            tick={{ fill: 'currentColor' }}
                            width={90}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px'
                            }}
                            formatter={(value: number) => [`${value} dossiers`, 'Total']}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}