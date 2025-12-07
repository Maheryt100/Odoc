// Statistics/components/charts/InteractivePieChart.tsx
import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, ZoomIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface DataPoint {
    name: string;
    value: number;
    superficie?: number;
}

interface Props {
    data: DataPoint[];
    title: string;
    description?: string;
    onSegmentClick?: (data: DataPoint) => void;
}

export function InteractivePieChart({ data, title, description, onSegmentClick }: Props) {
    const [selectedSegment, setSelectedSegment] = useState<DataPoint | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    
    const handleClick = (data: DataPoint) => {
        setSelectedSegment(data);
        setShowDetailDialog(true);
        onSegmentClick?.(data);
    };
    
    const exportAsImage = () => {
        // À implémenter avec html2canvas ou svg-to-png
        console.log('Export image:', title);
        // Exemple simple :
        // const svg = document.querySelector('.recharts-surface');
        // const canvas = document.createElement('canvas');
        // ... conversion SVG -> Canvas -> PNG
    };
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{title}</CardTitle>
                            {description && <CardDescription>{description}</CardDescription>}
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                variant="outline"
                                onClick={exportAsImage}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Exporter
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                onClick={handleClick}
                                style={{ cursor: 'pointer' }}
                            >
                                {data.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]}
                                        strokeWidth={selectedSegment?.name === entry.name ? 3 : 0}
                                        stroke="#fff"
                                    />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px'
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Légende interactive */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {data.map((item, index) => (
                            <button
                                key={item.name}
                                onClick={() => handleClick(item)}
                                className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-sm font-medium">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {item.value}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                        {((item.value / total) * 100).toFixed(1)}%
                                    </Badge>
                                </div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>
            
            {/* Dialog de détail au clic */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ZoomIn className="h-5 w-5" />
                            Détails : {selectedSegment?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Informations détaillées sur cette catégorie
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedSegment && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-1">Nombre</p>
                                    <p className="text-2xl font-bold">{selectedSegment.value}</p>
                                </div>
                                
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-1">Pourcentage</p>
                                    <p className="text-2xl font-bold">
                                        {((selectedSegment.value / total) * 100).toFixed(1)}%
                                    </p>
                                </div>
                                
                                {selectedSegment.superficie && (
                                    <>
                                        <div className="p-4 bg-muted rounded-lg">
                                            <p className="text-sm text-muted-foreground mb-1">Superficie totale</p>
                                            <p className="text-2xl font-bold">
                                                {selectedSegment.superficie.toLocaleString()} m²
                                            </p>
                                        </div>
                                        
                                        <div className="p-4 bg-muted rounded-lg">
                                            <p className="text-sm text-muted-foreground mb-1">Superficie moyenne</p>
                                            <p className="text-2xl font-bold">
                                                {Math.round(selectedSegment.superficie / selectedSegment.value).toLocaleString()} m²
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <Button 
                                className="w-full" 
                                onClick={() => {
                                    // Naviguer vers la liste filtrée
                                    window.location.href = `/proprietes?vocation=${selectedSegment.name}`;
                                }}
                            >
                                Voir toutes les propriétés {selectedSegment.name}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

// ============================================================

// Statistics/components/charts/ComparisonChart.tsx
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonData {
    month: string;
    current: number;
    previous: number;
    difference: number;
    percentChange: number;
}

interface Props {
    title: string;
    description?: string;
}

export function ComparisonChart({ title, description }: Props) {
    const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
    
    // Données fictives - À remplacer par de vraies données
    const data: ComparisonData[] = [
        { month: 'Jan', current: 45, previous: 38, difference: 7, percentChange: 18.4 },
        { month: 'Fev', current: 52, previous: 42, difference: 10, percentChange: 23.8 },
        { month: 'Mar', current: 48, previous: 45, difference: 3, percentChange: 6.7 },
        { month: 'Avr', current: 61, previous: 48, difference: 13, percentChange: 27.1 },
        { month: 'Mai', current: 55, previous: 52, difference: 3, percentChange: 5.8 },
        { month: 'Jun', current: 67, previous: 55, difference: 12, percentChange: 21.8 },
    ];
    
    const getTrendIcon = (change: number) => {
        if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-gray-500" />;
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </div>
                    <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">Mensuel</SelectItem>
                            <SelectItem value="quarter">Trimestriel</SelectItem>
                            <SelectItem value="year">Annuel</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" />
                        <YAxis />
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
                            dataKey="current" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            name="Cette année"
                            dot={{ fill: '#3b82f6', r: 5 }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="previous" 
                            stroke="#94a3b8" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Année précédente"
                            dot={{ fill: '#94a3b8', r: 3 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
                
                {/* Tableau de comparaison */}
                <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-medium mb-3">Évolution par rapport à l'année précédente</h4>
                    {data.map((item) => (
                        <div 
                            key={item.month}
                            className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors"
                        >
                            <span className="text-sm font-medium">{item.month}</span>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground">
                                    {item.current} vs {item.previous}
                                </span>
                                <div className="flex items-center gap-1">
                                    {getTrendIcon(item.difference)}
                                    <span className={`text-sm font-medium ${
                                        item.difference > 0 ? 'text-green-600' :
                                        item.difference < 0 ? 'text-red-600' :
                                        'text-gray-600'
                                    }`}>
                                        {item.difference > 0 ? '+' : ''}{item.percentChange.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}