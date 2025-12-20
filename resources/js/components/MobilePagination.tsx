// Fichier: components/MobilePagination.tsx

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobilePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function MobilePagination({
    currentPage,
    totalPages,
    onPageChange
}: MobilePaginationProps) {
    return (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
            </Button>
            
            <span className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
            </span>
            
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
        </div>
    );
}