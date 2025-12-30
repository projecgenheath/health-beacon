import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, ArrowLeft, TrendingUp, TrendingDown, Minus, ArrowRight, Download, BarChart3, List, Filter, Table, Image } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ExamStatus } from '@/types/exam';
import { toast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExamDate {
  date: string;
  examId: string;
}

interface ExamResultRow {
  id: string;
  name: string;
  value: number;
  unit: string;
  reference_min: number | null;
  reference_max: number | null;
  status: string;
  category: string | null;
  exam_date: string;
}

interface HistoryDataPoint {
  date: string;
  dateFormatted: string;
  [key: string]: string | number;
}

const CompareExams = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [availableDates, setAvailableDates] = useState<ExamDate[]>([]);
  const [date1, setDate1] = useState<string>('');
  const [date2, setDate2] = useState<string>('');
  const [results1, setResults1] = useState<ExamResultRow[]>([]);
  const [results2, setResults2] = useState<ExamResultRow[]>([]);
  const [allResults, setAllResults] = useState<ExamResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'chart' | 'table'>('list');
  const [selectedExams, setSelectedExams] = useState<Set<string>>(new Set());
  const chartRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    if (user) {
      fetchAvailableDates();
      fetchAllResults();
    }
  }, [user]);

  useEffect(() => {
    if (date1) fetchResultsForDate(date1, setResults1);
  }, [date1]);

  useEffect(() => {
    if (date2) fetchResultsForDate(date2, setResults2);
  }, [date2]);

  const fetchAvailableDates = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('id, exam_date')
        .eq('user_id', user.id)
        .not('exam_date', 'is', null)
        .order('exam_date', { ascending: false });

      if (error) throw error;

      const dates = data?.filter(d => d.exam_date).map(d => ({
        date: d.exam_date!,
        examId: d.id
      })) || [];

      setAvailableDates(dates);
      if (dates.length >= 2) {
        setDate1(dates[0].date);
        setDate2(dates[1].date);
      } else if (dates.length === 1) {
        setDate1(dates[0].date);
      }
    } catch (error) {
      console.error('Error fetching dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllResults = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select('*')
        .eq('user_id', user.id)
        .order('exam_date', { ascending: true });

      if (error) throw error;
      setAllResults((data as ExamResultRow[]) || []);
    } catch (error) {
      console.error('Error fetching all results:', error);
    }
  };

  const fetchResultsForDate = async (date: string, setter: (results: ExamResultRow[]) => void) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('exam_date', date);

      if (error) throw error;
      setter((data as ExamResultRow[]) || []);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const getComparisonData = () => {
    const allNames = new Set([...results1.map(r => r.name), ...results2.map(r => r.name)]);
    return Array.from(allNames).map(name => {
      const r1 = results1.find(r => r.name === name);
      const r2 = results2.find(r => r.name === name);
      return { name, result1: r1, result2: r2 };
    });
  };

  const getChartData = () => {
    const examNames = new Set(allResults.map(r => r.name));
    const dateMap = new Map<string, HistoryDataPoint>();

    // Filter results based on selected exams
    const filteredResults = selectedExams.size > 0
      ? allResults.filter(r => selectedExams.has(r.name))
      : allResults;

    filteredResults.forEach(result => {
      if (!dateMap.has(result.exam_date)) {
        dateMap.set(result.exam_date, {
          date: result.exam_date,
          dateFormatted: format(parseISO(result.exam_date), 'MMM/yy', { locale: ptBR }),
        });
      }
      dateMap.get(result.exam_date)![result.name] = result.value;
    });

    const filteredNames = selectedExams.size > 0
      ? Array.from(selectedExams)
      : Array.from(examNames);

    return {
      data: Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      examNames: Array.from(examNames),
      filteredNames,
    };
  };

  // Get multi-date comparison table data
  const getMultiDateTableData = () => {
    const examNames = [...new Set(allResults.map(r => r.name))];
    const dates = [...new Set(allResults.map(r => r.exam_date))].sort();

    // Filter exams if any selected
    const filteredExamNames = selectedExams.size > 0
      ? examNames.filter(name => selectedExams.has(name))
      : examNames;

    const tableData = filteredExamNames.map(examName => {
      const row: { name: string; unit: string; values: { date: string; value: number | null; status: string | null }[] } = {
        name: examName,
        unit: allResults.find(r => r.name === examName)?.unit || '',
        values: dates.map(date => {
          const result = allResults.find(r => r.name === examName && r.exam_date === date);
          return {
            date,
            value: result?.value ?? null,
            status: result?.status ?? null,
          };
        }),
      };
      return row;
    });

    return { tableData, dates };
  };

  const toggleExamSelection = (examName: string) => {
    setSelectedExams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(examName)) {
        newSet.delete(examName);
      } else {
        newSet.add(examName);
      }
      return newSet;
    });
  };

  const selectAllExams = () => {
    const { examNames } = getChartData();
    setSelectedExams(new Set(examNames));
  };

  const clearExamSelection = () => {
    setSelectedExams(new Set());
  };

  const getStatusConfig = (status: ExamStatus) => ({
    healthy: { bg: 'bg-status-healthy-bg', text: 'text-status-healthy' },
    warning: { bg: 'bg-status-warning-bg', text: 'text-status-warning' },
    danger: { bg: 'bg-status-danger-bg', text: 'text-status-danger' },
  }[status]);

  const getTrend = (v1?: number, v2?: number) => {
    if (v1 === undefined || v2 === undefined) return null;
    const diff = v2 - v1;
    if (Math.abs(diff) < 0.1) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const exportToPDF = async (includeChart = false) => {
    const doc = new jsPDF();
    const comparisonData = getComparisonData();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(14, 165, 233);
    doc.text('Comparação de Exames', 20, 20);

    // Dates
    doc.setFontSize(12);
    doc.setTextColor(100);
    const date1Formatted = date1 ? format(parseISO(date1), "d 'de' MMMM, yyyy", { locale: ptBR }) : '-';
    const date2Formatted = date2 ? format(parseISO(date2), "d 'de' MMMM, yyyy", { locale: ptBR }) : '-';
    doc.text(`Data 1: ${date1Formatted}`, 20, 35);
    doc.text(`Data 2: ${date2Formatted}`, 20, 42);

    // Table header
    doc.setFontSize(10);
    doc.setTextColor(50);
    let y = 55;
    doc.setFont('helvetica', 'bold');
    doc.text('Exame', 20, y);
    doc.text('Valor 1', 90, y);
    doc.text('Valor 2', 130, y);
    doc.text('Tendência', 170, y);

    // Table content
    doc.setFont('helvetica', 'normal');
    y += 10;

    comparisonData.forEach(({ name, result1, result2 }) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const trend = getTrend(result1?.value, result2?.value);
      const trendText = trend === 'up' ? '↑ Aumentou' : trend === 'down' ? '↓ Diminuiu' : trend === 'stable' ? '— Estável' : '-';

      doc.text(name.substring(0, 30), 20, y);
      doc.text(result1 ? `${result1.value} ${result1.unit}` : '-', 90, y);
      doc.text(result2 ? `${result2.value} ${result2.unit}` : '-', 130, y);
      doc.text(trendText, 170, y);

      y += 8;
    });

    // Add chart image if requested
    if (includeChart && chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
        });
        const imgData = canvas.toDataURL('image/png');

        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(14, 165, 233);
        doc.text('Gráfico de Evolução', 20, 20);

        const imgWidth = 170;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(imgData, 'PNG', 20, 30, imgWidth, Math.min(imgHeight, 200));
      } catch (error) {
        console.error('Error adding chart to PDF:', error);
      }
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Gerado em ${format(new Date(), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`, 20, 285);
    }

    doc.save(`comparacao-exames-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({
      title: 'PDF exportado',
      description: 'O arquivo foi baixado com sucesso.',
    });
  };

  const exportChartAsImage = async () => {
    if (!chartRef.current) {
      toast({
        title: 'Erro',
        description: 'Nenhum gráfico disponível para exportar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `grafico-exames-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: 'Imagem exportada',
        description: 'O gráfico foi salvo como imagem.',
      });
    } catch (error) {
      console.error('Error exporting chart:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar o gráfico.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-medical-light/20 to-background">
        <div className="animate-pulse">
          <Activity className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const comparisonData = getComparisonData();
  const { data: chartData, examNames, filteredNames } = getChartData();
  const colors = ['hsl(var(--primary))', 'hsl(var(--status-healthy))', 'hsl(var(--status-warning))', 'hsl(var(--status-danger))', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#7c7cff', '#7cffb2'];

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex gap-2">
            <Button onClick={() => exportToPDF(false)} variant="outline" disabled={comparisonData.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={() => exportToPDF(true)} variant="outline" disabled={allResults.length === 0}>
              <Image className="h-4 w-4 mr-2" />
              PDF + Gráfico
            </Button>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Comparar Exames</h1>
        <p className="text-muted-foreground">Compare seus resultados entre datas ou veja a evolução ao longo do tempo</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Data 1</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={date1} onValueChange={setDate1}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma data" />
              </SelectTrigger>
              <SelectContent>
                {availableDates.map((d) => (
                  <SelectItem key={d.examId} value={d.date}>
                    {format(parseISO(d.date), "d 'de' MMMM, yyyy", { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Data 2</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={date2} onValueChange={setDate2}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma data" />
              </SelectTrigger>
              <SelectContent>
                {availableDates.map((d) => (
                  <SelectItem key={d.examId} value={d.date}>
                    {format(parseISO(d.date), "d 'de' MMMM, yyyy", { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'chart' | 'table')} className="mb-6">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Tabela
          </TabsTrigger>
          <TabsTrigger value="chart" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Gráfico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {comparisonData.length > 0 ? (
            <div className="space-y-3">
              {comparisonData.map(({ name, result1, result2 }) => {
                const trend = getTrend(result1?.value, result2?.value);
                const config1 = result1 ? getStatusConfig(result1.status as ExamStatus) : null;
                const config2 = result2 ? getStatusConfig(result2.status as ExamStatus) : null;

                return (
                  <Card key={name} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-foreground">{name}</h3>
                        {trend && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            {trend === 'up' && <TrendingUp className="h-4 w-4 text-status-warning" />}
                            {trend === 'down' && <TrendingDown className="h-4 w-4 text-status-healthy" />}
                            {trend === 'stable' && <Minus className="h-4 w-4" />}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <div className={cn('p-3 rounded-lg text-center', config1?.bg || 'bg-muted')}>
                          {result1 ? (
                            <>
                              <p className={cn('text-lg font-bold', config1?.text)}>
                                {result1.value}
                              </p>
                              <p className="text-xs text-muted-foreground">{result1.unit}</p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">-</p>
                          )}
                        </div>
                        <div className="flex justify-center">
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className={cn('p-3 rounded-lg text-center', config2?.bg || 'bg-muted')}>
                          {result2 ? (
                            <>
                              <p className={cn('text-lg font-bold', config2?.text)}>
                                {result2.value}
                              </p>
                              <p className="text-xs text-muted-foreground">{result2.unit}</p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">-</p>
                          )}
                        </div>
                      </div>
                      {(result1 || result2) && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Ref: {result1?.reference_min || result2?.reference_min}-{result1?.reference_max || result2?.reference_max}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {availableDates.length < 2
                    ? 'Você precisa ter pelo menos dois exames para comparar'
                    : 'Selecione duas datas para comparar os resultados'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Multi-date Table View */}
        <TabsContent value="table" className="mt-4 space-y-4">
          {allResults.length > 0 ? (
            <>
              {/* Exam Filter for Table */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filtrar Exames
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllExams}
                        disabled={selectedExams.size === examNames.length}
                      >
                        Selecionar todos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearExamSelection}
                        disabled={selectedExams.size === 0}
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {examNames.map((name, index) => (
                      <label
                        key={name}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                          selectedExams.has(name)
                            ? "bg-primary/10 border-primary"
                            : "bg-muted/50 border-border hover:bg-muted"
                        )}
                      >
                        <Checkbox
                          checked={selectedExams.has(name)}
                          onCheckedChange={() => toggleExamSelection(name)}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: colors[index % colors.length] }}
                        >
                          {name}
                        </span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Multi-date Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Comparação em Todas as Datas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-card">Exame</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Unidade</th>
                          {getMultiDateTableData().dates.map(date => (
                            <th key={date} className="text-center p-3 font-medium text-muted-foreground whitespace-nowrap">
                              {format(parseISO(date), 'dd/MM/yy', { locale: ptBR })}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {getMultiDateTableData().tableData.map((row, rowIndex) => (
                          <tr key={row.name} className={cn("border-b border-border/50", rowIndex % 2 === 0 ? "bg-muted/20" : "")}>
                            <td className="p-3 font-medium sticky left-0 bg-inherit">{row.name}</td>
                            <td className="p-3 text-muted-foreground">{row.unit}</td>
                            {row.values.map((val, colIndex) => {
                              const statusConfig = val.status ? getStatusConfig(val.status as ExamStatus) : null;
                              return (
                                <td key={colIndex} className="text-center p-3">
                                  {val.value !== null ? (
                                    <span className={cn("px-2 py-1 rounded", statusConfig?.bg, statusConfig?.text)}>
                                      {val.value}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {getMultiDateTableData().tableData.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum exame selecionado
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Nenhum dado disponível para exibir na tabela
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chart" className="mt-4 space-y-4">
          {chartData.length > 0 && examNames.length > 0 ? (
            <>
              {/* Exam Filter */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filtrar Exames
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllExams}
                        disabled={selectedExams.size === examNames.length}
                      >
                        Selecionar todos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearExamSelection}
                        disabled={selectedExams.size === 0}
                      >
                        Limpar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportChartAsImage}
                      >
                        <Image className="h-4 w-4 mr-1" />
                        Exportar Imagem
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {examNames.map((name, index) => (
                      <label
                        key={name}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                          selectedExams.has(name)
                            ? "bg-primary/10 border-primary"
                            : "bg-muted/50 border-border hover:bg-muted"
                        )}
                      >
                        <Checkbox
                          checked={selectedExams.has(name)}
                          onCheckedChange={() => toggleExamSelection(name)}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: colors[index % colors.length] }}
                        >
                          {name}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {selectedExams.size === 0
                      ? `Mostrando todos os ${Math.min(examNames.length, 10)} exames`
                      : `${selectedExams.size} exame(s) selecionado(s)`}
                  </p>
                </CardContent>
              </Card>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Evolução dos Exames ao Longo do Tempo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div ref={chartRef} className="h-80 bg-background p-4 rounded">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="dateFormatted"
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={50}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        {filteredNames.slice(0, 10).map((name, index) => (
                          <Line
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={colors[examNames.indexOf(name) % colors.length]}
                            strokeWidth={2}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {filteredNames.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Mostrando os primeiros 10 exames selecionados. Total selecionado: {filteredNames.length}
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Nenhum dado disponível para exibir no gráfico
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};

export default CompareExams;
