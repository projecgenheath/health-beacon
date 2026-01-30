import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText,
  Calendar,
  Building2,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface ExamCardProps {
  exam: {
    id: string;
    file_name: string;
    exam_date: string | null;
    lab_name: string | null;
    processed: boolean | null;
    created_at: string;
  };
  onView: () => void;
  onDelete: () => void;
}

const ExamCardComponent = ({ exam, onView, onDelete }: ExamCardProps) => {
  const getStatusColor = (processed: boolean | null) => {
    if (processed === true) return 'bg-status-healthy/10 text-status-healthy border-status-healthy/20';
    if (processed === false) return 'bg-status-danger/10 text-status-danger border-status-danger/20';
    return 'bg-status-warning/10 text-status-warning border-status-warning/20';
  };

  const getStatusIcon = (processed: boolean | null) => {
    if (processed === true) return <CheckCircle className="h-3 w-3" />;
    if (processed === false) return <AlertCircle className="h-3 w-3" />;
    return <AlertCircle className="h-3 w-3" />;
  };

  const getStatusText = (processed: boolean | null) => {
    if (processed === true) return 'Processado';
    if (processed === false) return 'Falha';
    return 'Pendente';
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate mb-1">
              {exam.file_name}
            </h4>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
              {exam.exam_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(exam.exam_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
              )}
              {exam.lab_name && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  <span>{exam.lab_name}</span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <Badge
              variant="outline"
              className={cn('gap-1 text-xs', getStatusColor(exam.processed))}
            >
              {getStatusIcon(exam.processed)}
              {getStatusText(exam.processed)}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onView}
              title="Visualizar"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Memoize to prevent unnecessary re-renders
export const ExamCard = memo(ExamCardComponent);
