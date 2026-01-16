import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { SearchBar } from './SearchBar';
import { ImprovedExamChart } from './ImprovedExamChart';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Activity,
    TrendingUp,
    TrendingDown,
    Minus,
    FileSearch,
    Calendar,
    Beaker,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Scan,
    Microscope,
    FileText,
} from 'lucide-react';
import { ExamResult, ExamHistory } from '@/types/exam';

interface ExamResultsListProps {
    exams: ExamResult[];
    histories?: ExamHistory[];
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
        case 'normal':
            return {
                color: 'bg-status-healthy/10 text-status-healthy border-status-healthy/20',
                gradient: 'from-status-healthy/20 to-status-healthy/5',
                label: status === 'normal' ? 'Normal' : 'Saudável',
                icon: TrendingUp,
                dotColor: 'bg-status-healthy',
            };
        case 'warning':
            return {
                color: 'bg-status-warning/10 text-status-warning border-status-warning/20',
                gradient: 'from-status-warning/20 to-status-warning/5',
                label: 'Atenção',
                icon: Minus,
                dotColor: 'bg-status-warning',
            };
        case 'danger':
        case 'abnormal':
            return {
                color: 'bg-status-danger/10 text-status-danger border-status-danger/20',
                gradient: 'from-status-danger/20 to-status-danger/5',
                label: status === 'abnormal' ? 'Alterado' : 'Crítico',
                icon: TrendingDown,
                dotColor: 'bg-status-danger',
            };
        default:
            return {
                color: 'bg-muted text-muted-foreground',
                gradient: 'from-muted/20 to-muted/5',
                label: 'Desconhecido',
                icon: Activity,
                dotColor: 'bg-muted-foreground',
            };
    }
};

interface ExamResultCardProps {
    exam: ExamResult;
    history?: ExamHistory;
}

const ExamResultCard = ({ exam, history }: ExamResultCardProps) => {
    const [expanded, setExpanded] = useState(false);
    const statusConfig = getStatusConfig(exam.status);
    const StatusIcon = statusConfig.icon;

    // Determine exam type and icon
    const examType = exam.examType || 'laboratory';
    const isLabExam = examType === 'laboratory';
    const isImagingExam = examType === 'imaging';
    const isPathologyExam = examType === 'pathology';

    // Get appropriate icon based on exam type
    const getExamIcon = () => {
        if (isImagingExam) return Scan;
        if (isPathologyExam) return Microscope;
        return Beaker;
    };
    const ExamIcon = getExamIcon();

    // Calculate percentage within reference range (only for lab exams)
    const rangePercentage = isLabExam && exam.referenceMax !== exam.referenceMin
        ? ((exam.value - exam.referenceMin) / (exam.referenceMax - exam.referenceMin)) * 100
        : 50;
    const clampedPercentage = Math.max(0, Math.min(100, rangePercentage));

    // Get status color classes
    const getStatusColorClass = () => {
        if (['healthy', 'normal'].includes(exam.status)) return 'text-status-healthy';
        if (exam.status === 'warning') return 'text-status-warning';
        if (['danger', 'abnormal'].includes(exam.status)) return 'text-status-danger';
        return 'text-muted-foreground';
    };

    const getGlowClass = () => {
        if (['healthy', 'normal'].includes(exam.status)) return 'from-status-healthy/20 to-status-healthy/5 shadow-status-healthy/20';
        if (exam.status === 'warning') return 'from-status-warning/20 to-status-warning/5 shadow-status-warning/20';
        if (['danger', 'abnormal'].includes(exam.status)) return 'from-status-danger/20 to-status-danger/5 shadow-status-danger/20';
        return 'from-muted/20 to-muted/5';
    };

    const hasHistory = history && history.history.length > 1 && examType === 'laboratory';

    return (
        <Card
            className={cn(
                'group overflow-hidden transition-all duration-500 hover:shadow-xl',
                'backdrop-blur-xl bg-card/80 border-border/50',
                'hover:border-primary/30 hover:bg-card/90',
                hasHistory && 'cursor-pointer'
            )}
            onClick={() => hasHistory && setExpanded(!expanded)}
        >
            {/* Gradient overlay */}
            <div className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-30 pointer-events-none',
                statusConfig.gradient
            )} />

            <CardContent className="p-5 relative">
                <div className="flex items-start gap-4">
                    {/* Icon with glow effect */}
                    <div className={cn(
                        'relative h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0',
                        'bg-gradient-to-br shadow-lg',
                        getGlowClass()
                    )}>
                        <ExamIcon className={cn('h-7 w-7', getStatusColorClass())} />
                        {/* Pulse animation for abnormal/danger status */}
                        {['danger', 'abnormal'].includes(exam.status) && (
                            <span className="absolute inset-0 rounded-2xl animate-ping bg-status-danger/20" />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <h4 className="text-lg font-bold text-foreground truncate">
                                    {exam.name}
                                </h4>
                                {!isLabExam && (
                                    <Badge variant="secondary" className="text-xs">
                                        {isImagingExam ? 'Imagem' : 'Patologia'}
                                    </Badge>
                                )}
                            </div>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'gap-1.5 px-3 py-1 text-sm font-semibold rounded-xl',
                                    statusConfig.color
                                )}
                            >
                                <StatusIcon className="h-3.5 w-3.5" />
                                {statusConfig.label}
                            </Badge>
                        </div>

                        {/* Display based on exam type */}
                        {isLabExam ? (
                            <>
                                {/* Value display for laboratory exams */}
                                <div className="flex items-baseline gap-3 mb-3">
                                    <span className={cn('text-3xl font-bold tabular-nums', getStatusColorClass())}>
                                        {exam.value}
                                    </span>
                                    <span className="text-lg text-muted-foreground">{exam.unit}</span>
                                </div>

                                {/* Reference range bar */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                                        <span>Ref: {exam.referenceMin}</span>
                                        <span>{exam.referenceMax} {exam.unit}</span>
                                    </div>
                                    <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden">
                                        {/* Normal range indicator */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-status-healthy/30 via-status-healthy/50 to-status-healthy/30 rounded-full" />
                                        {/* Current value marker */}
                                        <div
                                            className={cn(
                                                'absolute top-0 h-full w-1 rounded-full transition-all duration-500',
                                                statusConfig.dotColor
                                            )}
                                            style={{ left: `${clampedPercentage}%`, transform: 'translateX(-50%)' }}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Text value display for imaging/pathology exams */}
                                {exam.textValue && (
                                    <div className="mb-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                                        <p className={cn('text-base font-medium', getStatusColorClass())}>
                                            {exam.textValue}
                                        </p>
                                    </div>
                                )}

                                {/* Description/Findings */}
                                {exam.description && (
                                    <div className="mb-3">
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                            <FileText className="h-3 w-3" /> Achados
                                        </p>
                                        <p className="text-sm text-foreground/80 line-clamp-3">
                                            {exam.description}
                                        </p>
                                    </div>
                                )}

                                {/* Conclusion */}
                                {exam.conclusion && (
                                    <div className="mb-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
                                        <p className="text-xs text-primary mb-1 font-medium">Conclusão</p>
                                        <p className="text-sm text-foreground">
                                            {exam.conclusion}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            {exam.date && (
                                <div className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-lg">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{format(parseISO(exam.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                </div>
                            )}
                            {exam.category && (
                                <Badge variant="secondary" className="text-xs font-medium">
                                    {exam.category}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expandable chart section - only for lab exams with history */}
                {hasHistory && (
                    <>
                        <div className="w-full mt-4 text-muted-foreground flex items-center justify-center gap-2 py-2 rounded-lg bg-muted/5 group-hover:bg-muted/10 transition-colors">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                {expanded ? 'Ocultar histórico' : 'Ver evolução'}
                            </span>
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>

                        {expanded && (
                            <div
                                className="mt-4 pt-4 border-t border-border/50 animate-in slide-in-from-top-2 duration-300 cursor-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ImprovedExamChart history={history} showDetails={true} />
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

const ExamResultsListComponent = ({
    exams,
    histories,
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

    // Find matching history for each exam
    const getHistoryForExam = (examName: string) => {
        return histories?.find(h => h.examName === examName);
    };

    if (exams.length === 0) {
        return (
            <Card className="p-12 backdrop-blur-xl bg-card/80 border-border/50">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="rounded-full bg-gradient-to-br from-muted to-muted/50 p-6 mb-4 shadow-lg">
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
                                history={getHistoryForExam(exam.name)}
                            />
                        ))
                    ) : (
                        <Card className="p-8 backdrop-blur-xl bg-card/80">
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
