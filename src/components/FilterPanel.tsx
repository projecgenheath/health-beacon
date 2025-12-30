import { Calendar as CalendarIcon, Filter, X, RefreshCw, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { FilterConfig } from '@/hooks/useSearchAndFilter';

interface FilterPanelProps {
    filters: FilterConfig;
    onStatusToggle: (status: string) => void;
    onCategoryToggle: (category: string) => void;
    onLabToggle: (lab: string) => void;
    onDateRangeChange: (start: string | null, end: string | null) => void;
    onSortChange: (sortBy: FilterConfig['sortBy'], sortOrder: FilterConfig['sortOrder']) => void;
    onReset: () => void;
    availableCategories: string[];
    availableLabs: string[];
    activeFiltersCount: number;
}

export const FilterPanel = ({
    filters,
    onStatusToggle,
    onCategoryToggle,
    onLabToggle,
    onDateRangeChange,
    onSortChange,
    onReset,
    availableCategories,
    availableLabs,
    activeFiltersCount,
}: FilterPanelProps) => {
    const statuses = [
        { value: 'healthy', label: 'Normal', color: 'bg-status-healthy' },
        { value: 'warning', label: 'Atenção', color: 'bg-status-warning' },
        { value: 'danger', label: 'Crítico', color: 'bg-status-danger' },
    ];

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 relative">
                    <Filter className="h-4 w-4" />
                    Filtros
                    {activeFiltersCount > 0 && (
                        <Badge variant="default" className="ml-1 h-5 min-w-5 px-1 text-xs">
                            {activeFiltersCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Filtros</h4>
                        {activeFiltersCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={onReset} className="h-8 gap-1">
                                <RefreshCw className="h-3 w-3" />
                                Limpar
                            </Button>
                        )}
                    </div>

                    <Separator />

                    {/* Ordenação */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                            <ArrowUpDown className="h-3 w-3" />
                            Ordenar por
                        </Label>
                        <div className="flex gap-2">
                            <Select
                                value={filters.sortBy}
                                onValueChange={(value) => onSortChange(value as FilterConfig['sortBy'], filters.sortOrder)}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">Data</SelectItem>
                                    <SelectItem value="name">Nome</SelectItem>
                                    <SelectItem value="status">Status</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.sortOrder}
                                onValueChange={(value) => onSortChange(filters.sortBy, value as FilterConfig['sortOrder'])}
                            >
                                <SelectTrigger className="h-9 w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="asc">Crescente</SelectItem>
                                    <SelectItem value="desc">Decrescente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator />

                    {/* Data Range */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Período
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label htmlFor="date-start" className="text-xs text-muted-foreground">
                                    De
                                </Label>
                                <Input
                                    id="date-start"
                                    type="date"
                                    value={filters.dateRange.start || ''}
                                    onChange={(e) => onDateRangeChange(e.target.value || null, filters.dateRange.end)}
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div>
                                <Label htmlFor="date-end" className="text-xs text-muted-foreground">
                                    Até
                                </Label>
                                <Input
                                    id="date-end"
                                    type="date"
                                    value={filters.dateRange.end || ''}
                                    onChange={(e) => onDateRangeChange(filters.dateRange.start, e.target.value || null)}
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>
                        {(filters.dateRange.start || filters.dateRange.end) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDateRangeChange(null, null)}
                                className="h-7 w-full text-xs gap-1"
                            >
                                <X className="h-3 w-3" />
                                Limpar período
                            </Button>
                        )}
                    </div>

                    <Separator />

                    {/* Status Filter */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Status</Label>
                        <div className="space-y-2">
                            {statuses.map((status) => (
                                <div key={status.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`status-${status.value}`}
                                        checked={filters.statuses.includes(status.value)}
                                        onCheckedChange={() => onStatusToggle(status.value)}
                                    />
                                    <label
                                        htmlFor={`status-${status.value}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                                    >
                                        <div className={`h-2 w-2 rounded-full ${status.color}`} />
                                        {status.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Categories Filter */}
                    {availableCategories.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Categorias</Label>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                    {availableCategories.map((category) => (
                                        <div key={category} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`category-${category}`}
                                                checked={filters.categories.includes(category)}
                                                onCheckedChange={() => onCategoryToggle(category)}
                                            />
                                            <label
                                                htmlFor={`category-${category}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {category}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Labs Filter */}
                    {availableLabs.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Laboratórios</Label>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                    {availableLabs.map((lab) => (
                                        <div key={lab} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`lab-${lab}`}
                                                checked={filters.labs.includes(lab)}
                                                onCheckedChange={() => onLabToggle(lab)}
                                            />
                                            <label
                                                htmlFor={`lab-${lab}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {lab}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};
