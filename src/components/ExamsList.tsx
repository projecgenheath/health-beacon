import { useState } from 'react';
import { ExamResult, ExamHistory } from '@/types/exam';
import { ExamCard } from './ExamCard';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamsListProps {
  exams: ExamResult[];
  histories: ExamHistory[];
  onExamDeleted?: () => void;
}

type FilterType = 'all' | 'danger' | 'warning' | 'healthy';

export const ExamsList = ({ exams, histories, onExamDeleted }: ExamsListProps) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredExams = exams.filter((exam) => {
    if (filter === 'all') return true;
    return exam.status === filter;
  });

  const filterButtons: { type: FilterType; label: string; count: number }[] = [
    { type: 'all', label: 'Todos', count: exams.length },
    { type: 'danger', label: 'Alterados', count: exams.filter((e) => e.status === 'danger').length },
    { type: 'warning', label: 'Atenção', count: exams.filter((e) => e.status === 'warning').length },
    { type: 'healthy', label: 'Normal', count: exams.filter((e) => e.status === 'healthy').length },
  ];

  const getHistory = (examName: string) => {
    return histories.find((h) => h.examName === examName);
  };

  return (
    <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Seus Exames</h2>
        <Filter className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-1 px-1">
        {filterButtons.map((btn) => (
          <button
            key={btn.type}
            onClick={() => setFilter(btn.type)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200',
              filter === btn.type
                ? 'gradient-primary text-primary-foreground shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {btn.label}
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-xs',
                filter === btn.type ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
              )}
            >
              {btn.count}
            </span>
          </button>
        ))}
      </div>

      {/* Exams list */}
      <div className="space-y-3">
        {filteredExams.map((exam, index) => (
          <ExamCard 
            key={exam.id} 
            exam={exam} 
            history={getHistory(exam.name)} 
            index={index}
            onDelete={onExamDeleted}
          />
        ))}
      </div>

      {filteredExams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum exame encontrado com esse filtro</p>
        </div>
      )}
    </div>
  );
};
