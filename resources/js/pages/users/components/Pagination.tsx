// users/components/Pagination.tsx 
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
    onPageChange: (page: number) => void;
    itemName?: string;
}

export const Pagination = ({
    currentPage,
    lastPage,
    total,
    perPage,
    onPageChange,
    itemName = 'élément',
}: PaginationProps) => {
    if (lastPage <= 1) return null;

    const startItem = (currentPage - 1) * perPage + 1;
    const endItem = Math.min(currentPage * perPage, total);
    const itemNamePlural = total > 1 ? `${itemName}s` : itemName;

    const getPageNumbers = (): (number | 'ellipsis')[] => {
        const pages: (number | 'ellipsis')[] = [];
        const delta = 1;

        // Always show first page
        pages.push(1);

        // Calculate range around current page
        const rangeStart = Math.max(2, currentPage - delta);
        const rangeEnd = Math.min(lastPage - 1, currentPage + delta);

        // Add ellipsis after first page if needed
        if (rangeStart > 2) {
            pages.push('ellipsis');
        }

        // Add pages in range
        for (let i = rangeStart; i <= rangeEnd; i++) {
            pages.push(i);
        }

        // Add ellipsis before last page if needed
        if (rangeEnd < lastPage - 1) {
            pages.push('ellipsis');
        }

        // Always show last page if there's more than one page
        if (lastPage > 1) {
            pages.push(lastPage);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Info Text - Above on Mobile, Left on Desktop */}
            <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                <span className="font-medium">{startItem}-{endItem}</span> sur{' '}
                <span className="font-medium">{total}</span> {itemNamePlural}
            </div>

            {/* Pagination Controls - Top on Mobile, Right on Desktop */}
            <div className="flex items-center gap-1 order-1 sm:order-2">
                {/* First Page - Hidden on very small screens */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 hidden xs:flex"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    aria-label="Première page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Previous Page */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Page précédente"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Numbers - Hidden on very small screens, show current page only */}
                <div className="hidden sm:flex items-center gap-1">
                    {pageNumbers.map((page, index) => {
                        if (page === 'ellipsis') {
                            return (
                                <span 
                                    key={`ellipsis-${index}`} 
                                    className="px-2 text-muted-foreground text-sm"
                                >
                                    ...
                                </span>
                            );
                        }

                        const isActive = page === currentPage;
                        return (
                            <Button
                                key={page}
                                variant={isActive ? 'default' : 'outline'}
                                size="sm"
                                className="h-8 w-8 p-0 text-xs sm:text-sm"
                                onClick={() => onPageChange(page)}
                                disabled={isActive}
                            >
                                {page}
                            </Button>
                        );
                    })}
                </div>

                {/* Mobile: Simple Current/Total Display */}
                <div className="sm:hidden px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium min-w-[60px] text-center">
                    <span className="text-primary">{currentPage}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="text-muted-foreground">{lastPage}</span>
                </div>

                {/* Next Page */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === lastPage}
                    aria-label="Page suivante"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Last Page - Hidden on very small screens */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 hidden xs:flex"
                    onClick={() => onPageChange(lastPage)}
                    disabled={currentPage === lastPage}
                    aria-label="Dernière page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};