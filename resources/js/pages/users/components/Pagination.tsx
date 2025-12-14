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

        pages.push(1);

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(lastPage - 1, currentPage + delta); i++) {
            if (i === currentPage - delta && i > 2) {
                pages.push('ellipsis');
            }
            pages.push(i);
            if (i === currentPage + delta && i < lastPage - 1) {
                pages.push('ellipsis');
            }
        }

        if (lastPage > 1) {
            pages.push(lastPage);
        }

        return pages.filter((page, index, arr) => {
            if (page === 'ellipsis' && arr[index - 1] === 'ellipsis') {
                return false;
            }
            return true;
        });
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
                <span className="font-medium">{startItem}-{endItem}</span> sur <span className="font-medium">{total}</span> {itemNamePlural}
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="hidden md:flex items-center gap-1">
                    {pageNumbers.map((page, index) => {
                        if (page === 'ellipsis') {
                            return (
                                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
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
                                className="h-8 w-8 p-0"
                                onClick={() => onPageChange(page)}
                                disabled={isActive}
                            >
                                {page}
                            </Button>
                        );
                    })}
                </div>

                <div className="md:hidden px-2 py-1 text-sm font-medium">
                    {currentPage}/{lastPage}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === lastPage}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(lastPage)}
                    disabled={currentPage === lastPage}
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};