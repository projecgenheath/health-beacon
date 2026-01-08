import { useMemo } from 'react';
import { ExamResult, ExamHistory } from '@/types/exam';
import { ExamCard } from './ExamCard';
import { SearchBar } from './SearchBar';
import { FilterPanel } from './FilterPanel';
import { ActiveFilters } from './ActiveFilters';
import { useSearchAndFilter } from '@/hooks/useSearchAndFilter';
import { FileQuestion } from 'lucide-react';

interface ExamsListProps {
  exams: ExamResult[];
  histories: ExamHistory[];
  onExamDeleted?: () => void;
}

export const ExamsList = ({ exams, histories, onExamDeleted }: ExamsListProps) => {
  // Extrair categorias e labs únicos dos exames
  const availableCategories = useMemo(() => {
    const categories = new Set(exams.map(e => e.category).filter(Boolean));
    return Array.from(categories) as string[];
  }, [exams]);

  const availableLabs: string[] = [];

  // Usar o hook de busca e filtros
  const {
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
  } = useSearchAndFilter(exams as unknown as Record<string, unknown>[], {
    searchFields: ['name', 'category'],
    dateField: 'date',
    statusField: 'status',
    categoryField: 'category',
  });

  const filteredExams = filteredData as unknown as ExamResult[];

  const getHistory = (examName: string) => {
    return histories.find((h) => h.examName === examName);
  };

  const activeFiltersCount =
    filters.statuses.length +
    filters.categories.length +
    filters.labs.length +
    (filters.dateRange.start ? 1 : 0) +
    (filters.dateRange.end ? 1 : 0);

  return (
    <div className="animate-slide-up space-y-4" style={{ animationDelay: '200ms' }}>
      {/* Header with title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Seus Exames</h2>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            value={filters.searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar exames por nome, categoria..."
          />
        </div>
        <FilterPanel
          filters={filters}
          onStatusToggle={toggleStatus}
          onCategoryToggle={toggleCategory}
          onLabToggle={toggleLab}
          onDateRangeChange={setDateRange}
          onSortChange={setSorting}
          onReset={resetFilters}
          availableCategories={availableCategories}
          availableLabs={availableLabs}
          activeFiltersCount={activeFiltersCount}
        />
      </div>

      {/* Active Filters */}
      <ActiveFilters
        filters={filters}
        onRemoveStatus={toggleStatus}
        onRemoveCategory={toggleCategory}
        onRemoveLab={toggleLab}
        onClearDateRange={() => setDateRange(null, null)}
        onClearAll={resetFilters}
        totalResults={stats.total}
        filteredResults={stats.filtered}
      />

      {/* Results Count - Only show if searching */}
      {filters.searchTerm && !stats.hasActiveFilters && (
        <p className="text-sm text-muted-foreground">
          {stats.filtered === 0
            ? 'Nenhum resultado encontrado'
            : `${stats.filtered} resultado${stats.filtered !== 1 ? 's' : ''} encontrado${stats.filtered !== 1 ? 's' : ''}`
          }
        </p>
      )}

      {/* Exams Grid/List */}
      {filteredExams.length > 0 ? (
        <div className="space-y-3">
          {filteredExams.map((exam, index) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              history={getHistory(exam.name)}
              index={index}
              onDelete={onExamDeleted}
              examId={exam.examId}
              fileUrl={exam.fileUrl}
              fileName={exam.fileName}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum exame encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {stats.hasActiveFilters || filters.searchTerm
              ? 'Tente ajustar os filtros ou termo de busca'
              : 'Faça upload do seu primeiro exame para começar'
            }
          </p>
          {stats.hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-sm text-primary hover:underline"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
};
