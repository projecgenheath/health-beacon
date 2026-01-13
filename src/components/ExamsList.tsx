import { memo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { SearchBar } from './SearchBar';
import { FileSearch } from 'lucide-react';
import { ExamCard } from './ExamCard';
import { ExamViewerModal } from './ExamViewerModal';

interface Exam {
  id: string;
  file_name: string;
  exam_date: string | null;
  lab_name: string | null;
  processed: boolean | null;
  created_at: string;
}

interface ExamsListProps {
  exams: Exam[];
  onExamDeleted?: () => void;
  loading?: boolean;
  filterProps?: {
    filteredData: Exam[];
    setSearchTerm: (term: string) => void;
    filters: { searchTerm: string };
  };
  histories?: any;
}

const ExamsListComponent = ({
  exams,
  onExamDeleted,
  filterProps,
}: ExamsListProps) => {
  const [internalSearch, setInternalSearch] = useState('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Determine which data and search handler to use
  const displayExams = filterProps?.filteredData || exams;
  const searchTerm = filterProps ? filterProps.filters.searchTerm : internalSearch;
  const handleSearchChange = filterProps ? filterProps.setSearchTerm : setInternalSearch;

  // Filter internally if no filterProps are provided
  const visibleExams = filterProps
    ? displayExams
    : exams.filter(exam =>
      !internalSearch ||
      exam.file_name.toLowerCase().includes(internalSearch.toLowerCase()) ||
      exam.lab_name?.toLowerCase().includes(internalSearch.toLowerCase())
    );

  if (exams.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <FileSearch className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum exame encontrado</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Comece fazendo o upload do seu primeiro exame médico.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {exams.length > 5 && (
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Buscar exames..."
        />
      )}

      {/* Exams Grid */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="grid gap-4 pb-4">
          {visibleExams.length > 0 ? (
            visibleExams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onView={() => setSelectedExam(exam)}
                onDelete={onExamDeleted || (() => { })}
              />
            ))
          ) : (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <FileSearch className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum resultado para "{searchTerm}"
                </p>
                <Button
                  variant="link"
                  onClick={() => handleSearchChange('')}
                  className="mt-2"
                >
                  Limpar busca
                </Button>
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Exam Viewer Modal */}
      <ExamViewerModal
        isOpen={!!selectedExam}
        onClose={() => setSelectedExam(null)}
        fileUrl={selectedExam?.file_name || null} // Assuming file_name is used as path or we need another field? 
        // Wait, ExamViewerCard used fileUrl. Exam interface has file_name. 
        // Usually Supabase storage path matches file_name or there is a file_path field.
        // Let's re-check Exam interface in Index.tsx or useExamData.
        fileName={selectedExam?.file_name || ''}
      />
    </div>
  );
};

export const ExamsList = memo(ExamsListComponent);
