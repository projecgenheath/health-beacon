import { useState, useMemo, useCallback } from 'react';

export interface FilterConfig {
    searchTerm: string;
    dateRange: {
        start: string | null;
        end: string | null;
    };
    statuses: string[];
    categories: string[];
    labs: string[];
    sortBy: 'date' | 'name' | 'status';
    sortOrder: 'asc' | 'desc';
}

export const defaultFilters: FilterConfig = {
    searchTerm: '',
    dateRange: {
        start: null,
        end: null,
    },
    statuses: [],
    categories: [],
    labs: [],
    sortBy: 'date',
    sortOrder: 'desc',
};

/**
 * Hook para gerenciar estado de busca e filtros
 * Retorna funções para atualizar filtros e dados filtrados
 */
export function useSearchAndFilter<T extends Record<string, any>>(
    data: T[],
    options: {
        searchFields: (keyof T)[];
        dateField?: keyof T;
        statusField?: keyof T;
        categoryField?: keyof T;
        labField?: keyof T;
    }
) {
    const [filters, setFilters] = useState<FilterConfig>(defaultFilters);

    // Atualizar busca por texto
    const setSearchTerm = useCallback((term: string) => {
        setFilters(prev => ({ ...prev, searchTerm: term }));
    }, []);

    // Atualizar range de datas
    const setDateRange = useCallback((start: string | null, end: string | null) => {
        setFilters(prev => ({ ...prev, dateRange: { start, end } }));
    }, []);

    // Toggle status filter
    const toggleStatus = useCallback((status: string) => {
        setFilters(prev => ({
            ...prev,
            statuses: prev.statuses.includes(status)
                ? prev.statuses.filter(s => s !== status)
                : [...prev.statuses, status],
        }));
    }, []);

    // Toggle category filter
    const toggleCategory = useCallback((category: string) => {
        setFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category],
        }));
    }, []);

    // Toggle lab filter
    const toggleLab = useCallback((lab: string) => {
        setFilters(prev => ({
            ...prev,
            labs: prev.labs.includes(lab)
                ? prev.labs.filter(l => l !== lab)
                : [...prev.labs, lab],
        }));
    }, []);

    // Atualizar ordenação
    const setSorting = useCallback((sortBy: FilterConfig['sortBy'], sortOrder: FilterConfig['sortOrder']) => {
        setFilters(prev => ({ ...prev, sortBy, sortOrder }));
    }, []);

    // Resetar todos os filtros
    const resetFilters = useCallback(() => {
        setFilters(defaultFilters);
    }, []);

    // Aplicar filtros e busca aos dados
    const filteredData = useMemo(() => {
        let result = [...data];

        // 1. Busca por texto
        if (filters.searchTerm.trim()) {
            const searchLower = filters.searchTerm.toLowerCase();
            result = result.filter(item =>
                options.searchFields.some(field => {
                    const value = item[field];
                    return value && String(value).toLowerCase().includes(searchLower);
                })
            );
        }

        // 2. Filtro por data
        if (options.dateField && (filters.dateRange.start || filters.dateRange.end)) {
            result = result.filter(item => {
                const itemDate = item[options.dateField];
                if (!itemDate) return false;

                const date = new Date(itemDate as string);
                const start = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
                const end = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

                if (start && date < start) return false;
                if (end && date > end) return false;
                return true;
            });
        }

        // 3. Filtro por status
        if (options.statusField && filters.statuses.length > 0) {
            result = result.filter(item =>
                filters.statuses.includes(String(item[options.statusField]))
            );
        }

        // 4. Filtro por categoria
        if (options.categoryField && filters.categories.length > 0) {
            result = result.filter(item =>
                filters.categories.includes(String(item[options.categoryField]))
            );
        }

        // 5. Filtro por laboratório
        if (options.labField && filters.labs.length > 0) {
            result = result.filter(item =>
                filters.labs.includes(String(item[options.labField]))
            );
        }

        // 6. Ordenação
        result.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (filters.sortBy) {
                case 'date':
                    aValue = options.dateField ? new Date(a[options.dateField] as string).getTime() : 0;
                    bValue = options.dateField ? new Date(b[options.dateField] as string).getTime() : 0;
                    break;
                case 'name':
                    aValue = String(a[options.searchFields[0]] || '').toLowerCase();
                    bValue = String(b[options.searchFields[0]] || '').toLowerCase();
                    break;
                case 'status':
                    aValue = options.statusField ? String(a[options.statusField]) : '';
                    bValue = options.statusField ? String(b[options.statusField]) : '';
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [data, filters, options]);

    // Estatísticas dos filtros
    const stats = useMemo(() => ({
        total: data.length,
        filtered: filteredData.length,
        hasActiveFilters:
            filters.searchTerm.trim() !== '' ||
            filters.dateRange.start !== null ||
            filters.dateRange.end !== null ||
            filters.statuses.length > 0 ||
            filters.categories.length > 0 ||
            filters.labs.length > 0,
    }), [data.length, filteredData.length, filters]);

    return {
        filters,
        filteredData,
        stats,
        setSearchTerm,
        setDateRange,
        toggleStatus,
        toggleCategory,
        toggleLab,
        setSorting,
        resetFilters,
    };
}
