import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FilterConfig } from '@/hooks/useSearchAndFilter';

interface ActiveFiltersProps {
    filters: FilterConfig;
    onRemoveStatus: (status: string) => void;
    onRemoveCategory: (category: string) => void;
    onRemoveLab: (lab: string) => void;
    onClearDateRange: () => void;
    onClearAll: () => void;
    totalResults: number;
    filteredResults: number;
}

export const ActiveFilters = ({
    filters,
    onRemoveStatus,
    onRemoveCategory,
    onRemoveLab,
    onClearDateRange,
    onClearAll,
    totalResults,
    filteredResults,
}: ActiveFiltersProps) => {
    const hasActiveFilters =
        filters.statuses.length > 0 ||
        filters.categories.length > 0 ||
        filters.labs.length > 0 ||
        filters.dateRange.start !== null ||
        filters.dateRange.end !== null;

    if (!hasActiveFilters && !filters.searchTerm) {
        return null;
    }

    const statusLabels: Record<string, string> = {
        healthy: 'Normal',
        warning: 'Atenção',
        danger: 'Crítico',
    };

    return (
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border animate-slide-down">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium">
                        {filteredResults === totalResults ? (
                            <span>{totalResults} resultado{totalResults !== 1 ? 's' : ''}</span>
                        ) : (
                            <span>
                                {filteredResults} de {totalResults} resultado{totalResults !== 1 ? 's' : ''}
                            </span>
                        )}
                    </p>
                    {hasActiveFilters && (
                        <p className="text-xs text-muted-foreground">
                            Filtros ativos
                        </p>
                    )}
                </div>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearAll}
                        className="h-8 text-xs gap-1"
                    >
                        <X className="h-3 w-3" />
                        Limpar tudo
                    </Button>
                )}
            </div>

            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {/* Date Range */}
                    {(filters.dateRange.start || filters.dateRange.end) && (
                        <Badge variant="secondary" className="gap-1">
                            📅{' '}
                            {filters.dateRange.start && format(new Date(filters.dateRange.start), 'dd/MM/yyyy', { locale: ptBR })}
                            {filters.dateRange.start && filters.dateRange.end && ' - '}
                            {filters.dateRange.end && format(new Date(filters.dateRange.end), 'dd/MM/yyyy', { locale: ptBR })}
                            <button
                                onClick={onClearDateRange}
                                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    {/* Status Filters */}
                    {filters.statuses.map((status) => (
                        <Badge key={status} variant="secondary" className="gap-1">
                            {statusLabels[status] || status}
                            <button
                                onClick={() => onRemoveStatus(status)}
                                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}

                    {/* Category Filters */}
                    {filters.categories.map((category) => (
                        <Badge key={category} variant="secondary" className="gap-1">
                            🏷️ {category}
                            <button
                                onClick={() => onRemoveCategory(category)}
                                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}

                    {/* Lab Filters */}
                    {filters.labs.map((lab) => (
                        <Badge key={lab} variant="secondary" className="gap-1">
                            🏥 {lab}
                            <button
                                onClick={() => onRemoveLab(lab)}
                                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
};
