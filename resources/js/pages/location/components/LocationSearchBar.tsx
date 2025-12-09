// resources/js/pages/location/components/LocationSearchBar.tsx - ✅ VERSION REDESIGNÉE

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Eye } from 'lucide-react';

interface LocationSearchBarProps {
    search: string;
    onSearchChange: (value: string) => void;
    isSuperAdmin: boolean;
}

export default function LocationSearchBar({ search, onSearchChange, isSuperAdmin }: LocationSearchBarProps) {
    return (
        <Card className="border-0 shadow-lg">
            <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20 border-b">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        {/* Barre de recherche */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Rechercher une province, région ou district..."
                                value={search}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10 h-11 border-2"
                            />
                        </div>
                        
                        {/* Badge mode lecture */}
                        {!isSuperAdmin && (
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 gap-1">
                                <Eye className="h-3 w-3" />
                                Mode lecture seule
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </div>
        </Card>
    );
}