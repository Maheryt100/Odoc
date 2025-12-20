
// Statistics/components/charts/TopCommunesChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface TCProps {
    data: Array<{
        commune: string;
        count: number;
    }>;
}

const COLORS = [
    '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export function TopCommunesChart({ data }: TCProps) {
    const isEmpty = !data || data.length === 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base sm:text-lg">Top 10 communes</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    Communes les plus actives
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-[300px] sm:h-[400px] text-muted-foreground">
                        <MapPin className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-sm">Aucune donnée disponible</p>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto">
                        <div className="min-w-[400px]">
                            <ResponsiveContainer width="100%" height={300} className="sm:!h-[400px]">
                                <BarChart 
                                    data={data} 
                                    layout="vertical"
                                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis 
                                        type="number"
                                        className="text-[10px] sm:text-xs"
                                        tick={{ fill: 'currentColor' }}
                                    />
                                    <YAxis 
                                        type="category"
                                        dataKey="commune" 
                                        className="text-[10px] sm:text-xs"
                                        tick={{ fill: 'currentColor' }}
                                        width={80}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '6px',
                                            fontSize: '12px'
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
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}