// Fichier: components/MobileFiltersDrawer.tsx
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';

interface MobileFiltersDrawerProps {
    children: React.ReactNode;
    title?: string;
    activeFiltersCount?: number;
}

export function MobileFiltersDrawer({
    children,
    title = 'Filtres',
    activeFiltersCount = 0
}: MobileFiltersDrawerProps) {
    const [open, setOpen] = useState(false);
    
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    {title}
                    {activeFiltersCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                            {activeFiltersCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                    {children}
                </div>
            </SheetContent>
        </Sheet>
    );
}