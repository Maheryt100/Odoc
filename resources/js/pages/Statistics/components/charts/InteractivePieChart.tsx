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
        console.log('Export image:', title);
        // TODO: Implémenter avec html2canvas
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
            
            {/* Dialog de détail */}
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