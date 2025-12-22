import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, ArrowLeft, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ExamStatus } from '@/types/exam';

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

const CompareExams = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [availableDates, setAvailableDates] = useState<ExamDate[]>([]);
  const [date1, setDate1] = useState<string>('');
  const [date2, setDate2] = useState<string>('');
  const [results1, setResults1] = useState<ExamResultRow[]>([]);
  const [results2, setResults2] = useState<ExamResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAvailableDates();
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 pb-20">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Comparar Exames</h1>
          <p className="text-muted-foreground">Compare seus resultados entre duas datas diferentes</p>
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
      </main>
    </div>
  );
};

export default CompareExams;
