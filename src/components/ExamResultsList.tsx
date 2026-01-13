import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { SearchBar } from './SearchBar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Activity,
    TrendingUp,
    TrendingDown,
    Minus,
    FileSearch,
    Calendar,
    Beaker,
} from 'lucide-react';
import { ExamResult } from '@/types/exam';

interface ExamResultsListProps {
    exams: ExamResult[];
    onExamDeleted?: () => void;
    loading?: boolean;
    filterProps?: {
        filteredData: ExamResult[];
        setSearchTerm: (term: string) => void;
        filters: { searchTerm: string };
    };
}

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'healthy':
            return {
                color: 'bg-status-healthy/10 text-status-healthy border-status-healthy/20',
                label: 'Normal',
                icon: TrendingUp,
            };
        case 'warning':
            return {
                color: 'bg-status-warning/10 text-status-warning border-status-warning/20',
                label: 'Atenção',
                icon: Minus,
            };
        case 'danger':
            return {
                color: 'bg-status-danger/10 text-status-danger border-status-danger/20',
                label: 'Alterado',
                icon: TrendingDown,
            };
        default:
            return {
                color: 'bg-muted text-muted-foreground',
                label: 'Desconhecido',
                icon: Activity,
            };
    }
};

const ExamResultCard = ({ exam }: { exam: ExamResult }) => {
    const statusConfig = getStatusConfig(exam.status);
    const StatusIcon = statusConfig.icon;

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                        'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        exam.status === 'healthy' && 'bg-status-healthy/10',
                        exam.status === 'warning' && 'bg-status-warning/10',
                        exam.status === 'danger' && 'bg-status-danger/10',
                    )}>
                        <Beaker className={cn(
                            'h-5 w-5',
                            exam.status === 'healthy' && 'text-status-healthy',
                            exam.status === 'warning' && 'text-status-warning',
                            exam.status === 'danger' && 'text-status-danger',
                        )} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-foreground truncate">
                                {exam.name}
                            </h4>
                            <Badge
                                variant="outline"
                                className={cn('gap-1 text-xs ml-2', statusConfig.color)}
                            >
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                            <div className="font-medium text-foreground">
                                <span className="text-lg">{exam.value}</span>
                                <span className="text-muted-foreground ml-1">{exam.unit}</span>
                            </div>

                            {(exam.referenceMin !== undefined || exam.referenceMax !== undefined) && (
                                <div className="text-xs text-muted-foreground">
                                    Ref: {exam.referenceMin ?? '-'} - {exam.referenceMax ?? '-'} {exam.unit}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2">
                            {exam.date && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(new Date(exam.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                </div>
                            )}
                            {exam.category && (
                                <Badge variant="secondary" className="text-xs">
                                    {exam.category}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const ExamResultsListComponent = ({
    exams,
    filterProps,
}: ExamResultsListProps) => {
    const [internalSearch, setInternalSearch] = useState('');

    // Determine which data and search handler to use
    const displayExams = filterProps?.filteredData || exams;
    const searchTerm = filterProps ? filterProps.filters.searchTerm : internalSearch;
    const handleSearchChange = filterProps ? filterProps.setSearchTerm : setInternalSearch;

    // Filter internally if no filterProps are provided
    const visibleExams = filterProps
        ? displayExams
        : exams.filter(exam =>
            !internalSearch ||
            exam.name.toLowerCase().includes(internalSearch.toLowerCase()) ||
            exam.category?.toLowerCase().includes(internalSearch.toLowerCase())
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
                            <ExamResultCard
                                key={exam.id}
                                exam={exam}
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
        </div>
    );
};

export const ExamResultsList = memo(ExamResultsListComponent);
