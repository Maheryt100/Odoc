
// Statistics/components/charts/OuverturesFermeturesChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface OFProps {
    data: Array<{
        month: string;
        ouvertures: number;
        fermetures: number;
    }>;
}

export function OuverturesFermeturesChart({ data }: OFProps) {
    const isEmpty = !data || data.length === 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base sm:text-lg">Ouvertures vs Fermetures</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    Évolution sur 12 mois
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-[250px] sm:h-[300px] text-muted-foreground">
                        <Activity className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-sm">Aucune donnée disponible</p>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto">
                        <div className="min-w-[500px]">
                            <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
                                <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis 
                                        dataKey="month" 
                                        className="text-[10px] sm:text-xs"
                                        tick={{ fill: 'currentColor' }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis 
                                        className="text-[10px] sm:text-xs"
                                        tick={{ fill: 'currentColor' }}
                                        width={40}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '6px',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Legend 
                                        wrapperStyle={{ fontSize: '12px' }}
                                        iconSize={12}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="ouvertures" 
                                        stroke="#10b981" 
                                        strokeWidth={2}
                                        name="Ouvertures"
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="fermetures" 
                                        stroke="#ef4444" 
                                        strokeWidth={2}
                                        name="Fermetures"
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
