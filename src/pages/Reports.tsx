import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamData } from '@/hooks/useExamData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileDown, Filter, Calendar, FileText, CheckCircle2, AlertTriangle, XCircle, Loader2, Check } from 'lucide-react';
import { format, subMonths, isAfter, parseISO, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import jsPDF from 'jspdf';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const Reports = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { exams, loading } = useExamData();

    const [timeRange, setTimeRange] = useState<string>('6');
    const [selectedStatus, setSelectedStatus] = useState<string[]>(['healthy', 'warning', 'danger']);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Carregar categorias disponíveis
    const categories = useMemo(() => {
        const cats = new Set(exams.map(e => e.category || 'Geral'));
        return Array.from(cats).sort();
    }, [exams]);

    // Inicializar categorias selecionadas
    useEffect(() => {
        if (categories.length > 0 && selectedCategories.length === 0) {
            setSelectedCategories(categories);
        }
    }, [categories]);

    // Filtrar exames
    const filteredExams = useMemo(() => {
        let result = exams;

        // Filtro de tempo
        if (timeRange !== 'all') {
            const now = new Date();
            let cutoff = now;
            if (timeRange === '1') cutoff = subMonths(now, 1);
            else if (timeRange === '3') cutoff = subMonths(now, 3);
            else if (timeRange === '6') cutoff = subMonths(now, 6);
            else if (timeRange === '12') cutoff = subMonths(now, 12);
            else if (timeRange === 'year') cutoff = startOfYear(now);

            result = result.filter(e => isAfter(parseISO(e.date), cutoff));
        }

        // Filtro de status
        result = result.filter(e => selectedStatus.includes(e.status));

        // Filtro de categoria
        if (filteredCategories => filteredCategories.length > 0) {
            result = result.filter(e => selectedCategories.includes(e.category || 'Geral'));
        }

        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [exams, timeRange, selectedStatus, selectedCategories]);

    const toggleStatus = (status: string) => {
        setSelectedStatus(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
        );
    };

    const selectAllCategories = () => setSelectedCategories(categories);
    const clearCategories = () => setSelectedCategories([]);

    const generatePDF = async () => {
        if (filteredExams.length === 0) {
            toast({
                title: "Nenhum exame selecionado",
                description: "Ajuste os filtros para incluir exames no relatório.",
                variant: "destructive"
            });
            return;
        }

        setIsExporting(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            let yPos = 20;

            // Header
            doc.setFontSize(22);
            doc.setTextColor(14, 165, 233); // Primary Color (Sky-500 equivalent)
            doc.text('Relatório de Saúde', margin, yPos);

            yPos += 8;
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text('Gerado pelo Health Beacon', margin, yPos);

            // Metadados do Relatório
            yPos += 15;
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);

            const today = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
            doc.text(`Data de Emissão: ${today}`, margin, yPos);

            if (user?.email) {
                yPos += 5;
                doc.text(`Usuário: ${user.email}`, margin, yPos);
            }

            yPos += 5;
            const periodText = timeRange === 'all' ? 'Todo o histórico' :
                timeRange === 'year' ? 'Este ano' :
                    `Últimos ${timeRange} meses`;
            doc.text(`Período: ${periodText}`, margin, yPos);

            yPos += 5;
            doc.text(`Total de Exames: ${filteredExams.length}`, margin, yPos);

            // Resumo por Status (Graficos simples)
            yPos += 15;
            const healthyCount = filteredExams.filter(e => e.status === 'healthy').length;
            const warningCount = filteredExams.filter(e => e.status === 'warning').length;
            const dangerCount = filteredExams.filter(e => e.status === 'danger').length;

            const boxWidth = (pageWidth - (margin * 2) - 20) / 3;
            const boxHeight = 20;

            // Healthy Box
            doc.setFillColor(236, 253, 245); // Emerald-50
            doc.setDrawColor(16, 185, 129); // Emerald-500
            doc.roundedRect(margin, yPos, boxWidth, boxHeight, 3, 3, 'FD');
            doc.setFontSize(12);
            doc.setTextColor(4, 120, 87); // Emerald-700
            doc.text(`${healthyCount}`, margin + (boxWidth / 2), yPos + 8, { align: 'center' });
            doc.setFontSize(8);
            doc.text('Normais', margin + (boxWidth / 2), yPos + 14, { align: 'center' });

            // Warning Box
            doc.setFillColor(255, 251, 235); // Amber-50
            doc.setDrawColor(245, 158, 11); // Amber-500
            doc.roundedRect(margin + boxWidth + 10, yPos, boxWidth, boxHeight, 3, 3, 'FD');
            doc.setFontSize(12);
            doc.setTextColor(180, 83, 9); // Amber-700
            doc.text(`${warningCount}`, margin + boxWidth + 10 + (boxWidth / 2), yPos + 8, { align: 'center' });
            doc.setFontSize(8);
            doc.text('Atenção', margin + boxWidth + 10 + (boxWidth / 2), yPos + 14, { align: 'center' });

            // Danger Box
            doc.setFillColor(254, 242, 242); // Red-50
            doc.setDrawColor(239, 68, 68); // Red-500
            doc.roundedRect(margin + (boxWidth + 10) * 2, yPos, boxWidth, boxHeight, 3, 3, 'FD');
            doc.setFontSize(12);
            doc.setTextColor(185, 28, 28); // Red-700
            doc.text(`${dangerCount}`, margin + (boxWidth + 10) * 2 + (boxWidth / 2), yPos + 8, { align: 'center' });
            doc.setFontSize(8);
            doc.text('Alterados', margin + (boxWidth + 10) * 2 + (boxWidth / 2), yPos + 14, { align: 'center' });

            yPos += 30;

            // Lista de Exames
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text('Detalhamento dos Exames', margin, yPos);
            yPos += 10;

            // Cabeçalho da Tabela
            doc.setFillColor(241, 245, 249); // Slate-100
            doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105); // Slate-600
            doc.setFont('helvetica', 'bold');

            const col1 = margin + 2;
            const col2 = margin + 65;
            const col3 = margin + 95;
            const col4 = margin + 130;
            const col5 = margin + 160;

            doc.text('Exame', col1, yPos + 5);
            doc.text('Data', col2, yPos + 5);
            doc.text('Resultado', col3, yPos + 5);
            doc.text('Referência', col4, yPos + 5);
            doc.text('Status', col5, yPos + 5);

            yPos += 8;
            doc.setFont('helvetica', 'normal');

            filteredExams.forEach((exam, index) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                    // Repetir cabeçalho se quiser, mas simplificando aqui
                }

                // Zebra striping
                if (index % 2 === 1) {
                    doc.setFillColor(248, 250, 252); // Slate-50
                    doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
                }

                doc.setFontSize(8);
                doc.setTextColor(30, 41, 59); // Slate-800

                // Truncate name if too long
                const name = exam.name.length > 35 ? exam.name.substring(0, 32) + '...' : exam.name;
                doc.text(name, col1, yPos + 5);

                doc.text(format(parseISO(exam.date), 'dd/MM/yyyy'), col2, yPos + 5);

                doc.setFont('helvetica', 'bold');
                doc.text(`${exam.value} ${exam.unit}`, col3, yPos + 5);
                doc.setFont('helvetica', 'normal');

                doc.text(`${exam.referenceMin} - ${exam.referenceMax}`, col4, yPos + 5);

                // Status com cor
                if (exam.status === 'healthy') doc.setTextColor(22, 163, 74);
                else if (exam.status === 'warning') doc.setTextColor(217, 119, 6);
                else doc.setTextColor(220, 38, 38);

                const statusLabel = exam.status === 'healthy' ? 'Normal' : exam.status === 'warning' ? 'Atenção' : 'Alterado';
                doc.text(statusLabel, col5, yPos + 5);

                yPos += 8;
            });

            // Footer
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    `Página ${i} de ${pageCount} - Gerado por Health Beacon`,
                    pageWidth / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );
            }

            doc.save(`health-beacon-relatorio-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
            toast({
                title: "Sucesso!",
                description: "Relatório gerado e baixado com sucesso."
            });

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            toast({
                title: "Erro ao gerar relatório",
                description: "Ocorreu um problema ao criar o arquivo PDF.",
                variant: "destructive"
            });
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in p-2 sm:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/dashboard')}
                        className="mb-2 pl-0 hover:pl-2 transition-all -ml-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar ao Dashboard
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
                    <p className="text-muted-foreground">Gere relatórios personalizados dos seus exames</p>
                </div>
                <Button onClick={generatePDF} disabled={isExporting} className="w-full sm:w-auto">
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    Baixar PDF
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Filtros */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Filtros
                            </CardTitle>
                            <CardDescription>Personalize o conteúdo do seu relatório</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Período */}
                            <div className="space-y-2">
                                <Label>Período</Label>
                                <Select value={timeRange} onValueChange={setTimeRange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o período" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todo o histórico</SelectItem>
                                        <SelectItem value="year">Este ano (desde Jan)</SelectItem>
                                        <SelectItem value="12">Últimos 12 meses</SelectItem>
                                        <SelectItem value="6">Últimos 6 meses</SelectItem>
                                        <SelectItem value="3">Últimos 3 meses</SelectItem>
                                        <SelectItem value="1">Último mês</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            {/* Status */}
                            <div className="space-y-2">
                                <Label>Status dos Exames</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="status-healthy"
                                            checked={selectedStatus.includes('healthy')}
                                            onCheckedChange={() => toggleStatus('healthy')}
                                        />
                                        <Label htmlFor="status-healthy" className="flex items-center cursor-pointer">
                                            <CheckCircle2 className="h-4 w-4 text-status-healthy mr-2" />
                                            Normais
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="status-warning"
                                            checked={selectedStatus.includes('warning')}
                                            onCheckedChange={() => toggleStatus('warning')}
                                        />
                                        <Label htmlFor="status-warning" className="flex items-center cursor-pointer">
                                            <AlertTriangle className="h-4 w-4 text-status-warning mr-2" />
                                            Atenção
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="status-danger"
                                            checked={selectedStatus.includes('danger')}
                                            onCheckedChange={() => toggleStatus('danger')}
                                        />
                                        <Label htmlFor="status-danger" className="flex items-center cursor-pointer">
                                            <XCircle className="h-4 w-4 text-status-danger mr-2" />
                                            Alterados
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Categorias */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Categorias</Label>
                                    <div className="text-xs space-x-2">
                                        <span className="text-primary cursor-pointer hover:underline" onClick={selectAllCategories}>Todas</span>
                                        <span className="text-muted-foreground">|</span>
                                        <span className="text-primary cursor-pointer hover:underline" onClick={clearCategories}>Limpar</span>
                                    </div>
                                </div>
                                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                                    <div className="space-y-2">
                                        {categories.map(category => (
                                            <div key={category} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`cat-${category}`}
                                                    checked={selectedCategories.includes(category)}
                                                    onCheckedChange={() => toggleCategory(category)}
                                                />
                                                <Label htmlFor={`cat-${category}`} className="text-sm cursor-pointer ml-2">
                                                    {category}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Preview */}
                <div className="lg:col-span-2">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Pré-visualização
                                </div>
                                <Badge variant="outline" className="ml-2">
                                    {filteredExams.length} exames encontrados
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Resumo dos dados que serão incluídos no relatório
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-[400px]">
                            {filteredExams.length > 0 ? (
                                <div className="space-y-4">
                                    <ScrollArea className="h-[500px] pr-4">
                                        {filteredExams.map((exam, index) => (
                                            <div key={index} className="flex items-start justify-between py-3 border-b last:border-0 border-border/50">
                                                <div>
                                                    <p className="font-medium text-sm">{exam.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(parseISO(exam.date), "d 'de' MMM, yyyy", { locale: ptBR })} • {exam.category}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className={cn(
                                                            "font-bold text-sm",
                                                            exam.status === 'healthy' ? "text-status-healthy" :
                                                                exam.status === 'warning' ? "text-status-warning" : "text-status-danger"
                                                        )}>
                                                            {exam.value} {exam.unit}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">Ref: {exam.referenceMin}-{exam.referenceMax}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </ScrollArea>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
                                    <Filter className="h-12 w-12 mb-4 opacity-20" />
                                    <p className="text-lg font-medium">Nenhum exame encontrado</p>
                                    <p className="text-sm">Tente ajustar os filtros selecionados.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Reports;
