import { useState, useMemo } from 'react';
import { useExamData } from '@/hooks/useExamData';
import { useBMIHistory } from '@/hooks/useBMIHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnalyticsSkeleton } from '@/components/skeletons';
import { UpdateBMIDialog } from '@/components/UpdateBMIDialog';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { format, parseISO, subMonths, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, Activity, Target, Calendar, AlertTriangle, Scale, Plus } from 'lucide-react';

const Analytics = () => {
  const { exams, histories, summary, loading } = useExamData();
  const { history: bmiHistory, stats: bmiStats, loading: bmiLoading, refetch: refetchBMI, getBMICategory } = useBMIHistory();
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('12');
  const [showBMIDialog, setShowBMIDialog] = useState(false);

  // Filter data by time range
  const filteredHistories = useMemo(() => {
    const cutoffDate = subMonths(new Date(), parseInt(timeRange));
    return histories.map(h => ({
      ...h,
      history: h.history.filter(item => isAfter(parseISO(item.date), cutoffDate))
    })).filter(h => h.history.length > 0);
  }, [histories, timeRange]);

  // Filter BMI history by time range
  const filteredBMIHistory = useMemo(() => {
    const cutoffDate = subMonths(new Date(), parseInt(timeRange));
    return bmiHistory
      .filter(item => isAfter(parseISO(item.recorded_at), cutoffDate))
      .map(item => ({
        ...item,
        dateFormatted: format(parseISO(item.recorded_at), 'dd/MM/yy', { locale: ptBR }),
        fullDate: format(parseISO(item.recorded_at), "d 'de' MMMM, yyyy", { locale: ptBR }),
        category: getBMICategory(item.bmi),
      }));
  }, [bmiHistory, timeRange, getBMICategory]);

  // Health Overview data combining exam status and BMI
  const healthOverviewData = useMemo(() => {
    const dateMap = new Map<string, {
      date: string;
      dateFormatted: string;
      healthScore: number;
      bmi: number | null;
      totalExams: number;
      healthyExams: number;
    }>();

    // Process exam history for health score
    histories.forEach(h => {
      h.history.forEach(item => {
        if (!dateMap.has(item.date)) {
          dateMap.set(item.date, {
            date: item.date,
            dateFormatted: format(parseISO(item.date), 'dd/MM', { locale: ptBR }),
            healthScore: 0,
            bmi: null,
            totalExams: 0,
            healthyExams: 0,
          });
        }
        const entry = dateMap.get(item.date)!;
        entry.totalExams++;
        if (item.status === 'healthy') entry.healthyExams++;
        entry.healthScore = Math.round((entry.healthyExams / entry.totalExams) * 100);
      });
    });

    // Add BMI data
    bmiHistory.forEach(item => {
      const existing = dateMap.get(item.recorded_at);
      if (existing) {
        existing.bmi = item.bmi;
      } else {
        dateMap.set(item.recorded_at, {
          date: item.recorded_at,
          dateFormatted: format(parseISO(item.recorded_at), 'dd/MM', { locale: ptBR }),
          healthScore: 0,
          bmi: item.bmi,
          totalExams: 0,
          healthyExams: 0,
        });
      }
    });

    return Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-20);
  }, [histories, bmiHistory]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => [
    { name: 'Saudável', value: summary.healthy, color: 'hsl(var(--chart-2))' },
    { name: 'Atenção', value: summary.warning, color: 'hsl(var(--chart-4))' },
    { name: 'Crítico', value: summary.danger, color: 'hsl(var(--chart-1))' },
  ].filter(item => item.value > 0), [summary]);

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const categories = new Map<string, number>();
    exams.forEach(exam => {
      const cat = exam.category || 'Geral';
      categories.set(cat, (categories.get(cat) || 0) + 1);
    });
    return Array.from(categories.entries()).map(([name, value]) => ({ name, value }));
  }, [exams]);

  // Trend calculation for each exam
  const examTrends = useMemo(() => {
    return filteredHistories.map(h => {
      if (h.history.length < 2) return { name: h.examName, trend: 'stable', change: 0 };
      
      const first = h.history[0].value;
      const last = h.history[h.history.length - 1].value;
      const change = ((last - first) / first) * 100;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (change > 5) trend = 'up';
      else if (change < -5) trend = 'down';
      
      return { name: h.examName, trend, change, unit: h.unit, currentValue: last };
    });
  }, [filteredHistories]);

  // Monthly exam count
  const monthlyExamCount = useMemo(() => {
    const months = new Map<string, number>();
    histories.forEach(h => {
      h.history.forEach(item => {
        const monthKey = format(parseISO(item.date), 'MMM yyyy', { locale: ptBR });
        months.set(monthKey, (months.get(monthKey) || 0) + 1);
      });
    });
    return Array.from(months.entries())
      .map(([month, count]) => ({ month, count }))
      .slice(-6);
  }, [histories]);

  if (loading || bmiLoading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics de Saúde</h1>
          <p className="text-muted-foreground">Acompanhe suas tendências de saúde ao longo do tempo</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Últimos 3 meses</SelectItem>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Último ano</SelectItem>
            <SelectItem value="24">Últimos 2 anos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Exames</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalExams}</div>
            <p className="text-xs text-muted-foreground">tipos de exames monitorados</p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Saúde</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {summary.totalExams > 0 ? Math.round((summary.healthy / summary.totalExams) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">exames dentro do normal</p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exames em Atenção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{summary.warning}</div>
            <p className="text-xs text-muted-foreground">requerem monitoramento</p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{summary.lastUpdate || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">data do último exame</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {/* Health Overview with BMI */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico da Visão Geral da Saúde</CardTitle>
                  <CardDescription>
                    Acompanhe sua taxa de saúde e IMC ao longo do tempo
                  </CardDescription>
                </div>
                <Button onClick={() => setShowBMIDialog(true)} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Atualizar IMC
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={healthOverviewData}>
                    <defs>
                      <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--status-healthy))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--status-healthy))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBMI" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="dateFormatted" 
                      className="text-xs"
                    />
                    <YAxis 
                      yAxisId="left"
                      domain={[0, 100]}
                      className="text-xs"
                      label={{ value: 'Taxa Saúde (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10 } }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      domain={[15, 40]}
                      className="text-xs"
                      label={{ value: 'IMC', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 10 } }}
                    />
                    {/* BMI Reference zones */}
                    <ReferenceArea yAxisId="right" y1={18.5} y2={24.9} fill="hsl(var(--status-healthy))" fillOpacity={0.1} />
                    <ReferenceLine yAxisId="right" y={18.5} stroke="hsl(var(--status-healthy))" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <ReferenceLine yAxisId="right" y={24.9} stroke="hsl(var(--status-healthy))" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <ReferenceLine yAxisId="right" y={30} stroke="hsl(var(--status-danger))" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'Taxa de Saúde') return [`${value}%`, name];
                        if (name === 'IMC') return [value?.toFixed(1), name];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="healthScore"
                      name="Taxa de Saúde"
                      stroke="hsl(var(--status-healthy))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--status-healthy))', strokeWidth: 2 }}
                      connectNulls
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bmi"
                      name="IMC"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* BMI Legend */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Referência IMC:</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>• &lt; 18.5: Abaixo do peso</span>
                  <span className="text-status-healthy">• 18.5 - 24.9: Normal</span>
                  <span>• 25 - 29.9: Sobrepeso</span>
                  <span className="text-status-danger">• ≥ 30: Obesidade</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BMI History Card */}
          {filteredBMIHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Histórico do IMC
                </CardTitle>
                <CardDescription>
                  Suas medições de peso, altura e IMC
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4 mb-4">
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">IMC Atual</p>
                    <p className={`text-2xl font-bold ${bmiStats.current ? getBMICategory(bmiStats.current).status === 'healthy' ? 'text-status-healthy' : bmiStats.current >= 30 ? 'text-status-danger' : 'text-status-warning' : ''}`}>
                      {bmiStats.current?.toFixed(1) || '-'}
                    </p>
                    {bmiStats.current && (
                      <p className="text-xs text-muted-foreground">{getBMICategory(bmiStats.current).label}</p>
                    )}
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Média</p>
                    <p className="text-2xl font-bold">{bmiStats.average?.toFixed(1) || '-'}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Mínimo</p>
                    <p className="text-2xl font-bold">{bmiStats.min?.toFixed(1) || '-'}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Variação</p>
                    <div className="flex items-center justify-center gap-1">
                      {bmiStats.trend === 'up' && <TrendingUp className="h-4 w-4 text-status-warning" />}
                      {bmiStats.trend === 'down' && <TrendingDown className="h-4 w-4 text-status-healthy" />}
                      {bmiStats.trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" />}
                      <p className="text-2xl font-bold">
                        {bmiStats.change !== null ? `${bmiStats.change > 0 ? '+' : ''}${bmiStats.change.toFixed(1)}%` : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* BMI History Timeline */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {filteredBMIHistory.slice().reverse().map((record, idx) => (
                    <div 
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          record.category.status === 'healthy' ? 'bg-status-healthy' :
                          record.category.status === 'danger' ? 'bg-status-danger' : 'bg-status-warning'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{record.fullDate}</p>
                          <p className="text-xs text-muted-foreground">
                            {record.weight}kg • {record.height}cm
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          record.category.status === 'healthy' ? 'text-status-healthy' :
                          record.category.status === 'danger' ? 'text-status-danger' : 'text-status-warning'
                        }`}>
                          {record.bmi.toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">{record.category.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exam Evolution */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução dos Exames</CardTitle>
              <CardDescription>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Selecione um exame" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os exames</SelectItem>
                    {filteredHistories.map(h => (
                      <SelectItem key={h.examName} value={h.examName}>{h.examName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: ptBR })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => format(parseISO(value as string), "d 'de' MMMM, yyyy", { locale: ptBR })}
                    />
                    <Legend />
                    {(selectedExam === 'all' ? filteredHistories.slice(0, 5) : filteredHistories.filter(h => h.examName === selectedExam))
                      .map((h, idx) => (
                        <Area
                          key={h.examName}
                          type="monotone"
                          data={h.history}
                          dataKey="value"
                          name={h.examName}
                          stroke={`hsl(var(--chart-${(idx % 5) + 1}))`}
                          fill={`url(#colorValue)`}
                          strokeWidth={2}
                        />
                      ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Trend Indicators */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {examTrends.slice(0, 6).map((trend, idx) => (
              <Card key={trend.name} className="animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{trend.name}</p>
                      <p className="text-2xl font-bold">
                        {trend.currentValue?.toFixed(1)} <span className="text-sm text-muted-foreground">{trend.unit}</span>
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 ${
                      trend.trend === 'up' ? 'text-red-500' : 
                      trend.trend === 'down' ? 'text-green-500' : 
                      'text-muted-foreground'
                    }`}>
                      {trend.trend === 'up' ? <TrendingUp className="h-5 w-5" /> : 
                       trend.trend === 'down' ? <TrendingDown className="h-5 w-5" /> : 
                       <Minus className="h-5 w-5" />}
                      <span className="text-sm font-medium">{Math.abs(trend.change).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status dos Exames</CardTitle>
                <CardDescription>Distribuição por status de saúde</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exames por Categoria</CardTitle>
                <CardDescription>Distribuição por tipo de exame</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exames por Mês</CardTitle>
              <CardDescription>Quantidade de exames realizados ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyExamCount}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" name="Exames" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Exames</CardTitle>
              <CardDescription>Lista detalhada de todos os exames monitorados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exams.map((exam, idx) => (
                  <div 
                    key={exam.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 animate-slide-up transition-all duration-300 hover:bg-muted"
                    style={{ animationDelay: `${idx * 0.03}s` }}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{exam.name}</p>
                      <p className="text-sm text-muted-foreground">{exam.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">{exam.value} {exam.unit}</p>
                        <p className="text-xs text-muted-foreground">
                          Ref: {exam.referenceMin} - {exam.referenceMax}
                        </p>
                      </div>
                      <Badge variant={
                        exam.status === 'healthy' ? 'default' :
                        exam.status === 'warning' ? 'secondary' : 'destructive'
                      }>
                        {exam.status === 'healthy' ? 'Normal' :
                         exam.status === 'warning' ? 'Atenção' : 'Crítico'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* BMI Update Dialog */}
      <UpdateBMIDialog
        open={showBMIDialog}
        onOpenChange={setShowBMIDialog}
        onSuccess={refetchBMI}
      />
    </div>
  );
};

export default Analytics;
