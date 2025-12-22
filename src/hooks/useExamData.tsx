import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { ExamResult, ExamHistory, HealthSummary, ExamStatus } from '@/types/exam';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExamResultRow {
  id: string;
  exam_id: string;
  name: string;
  value: number;
  unit: string;
  reference_min: number | null;
  reference_max: number | null;
  status: string;
  exam_date: string;
  category: string | null;
}

export const useExamData = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [histories, setHistories] = useState<ExamHistory[]>([]);
  const [summary, setSummary] = useState<HealthSummary>({
    totalExams: 0,
    healthy: 0,
    warning: 0,
    danger: 0,
    lastUpdate: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchExamData();
    }
  }, [user]);

  const fetchExamData = async () => {
    if (!user) return;

    try {
      // Fetch all exam results for the user, ordered by date and name
      const { data, error } = await supabase
        .from('exam_results')
        .select('*')
        .eq('user_id', user.id)
        .order('exam_date', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setExams([]);
        setHistories([]);
        setSummary({
          totalExams: 0,
          healthy: 0,
          warning: 0,
          danger: 0,
          lastUpdate: 'Nenhum exame',
        });
        setLoading(false);
        return;
      }

      // Get the most recent exam for each unique exam name
      const latestExamsMap = new Map<string, ExamResultRow>();
      const examsByName = new Map<string, ExamResultRow[]>();

      (data as ExamResultRow[]).forEach((row) => {
        // Build history by exam name
        if (!examsByName.has(row.name)) {
          examsByName.set(row.name, []);
        }
        examsByName.get(row.name)!.push(row);

        // Keep only the latest exam for each name
        if (!latestExamsMap.has(row.name)) {
          latestExamsMap.set(row.name, row);
        }
      });

      // Convert to ExamResult format (latest exams only)
      const latestExams: ExamResult[] = Array.from(latestExamsMap.values()).map((row) => ({
        id: row.id,
        examId: row.exam_id,
        name: row.name,
        value: Number(row.value),
        unit: row.unit,
        referenceMin: row.reference_min ?? 0,
        referenceMax: row.reference_max ?? 100,
        status: row.status as ExamStatus,
        date: row.exam_date,
        category: row.category ?? 'Geral',
      }));

      // Build exam histories
      const examHistories: ExamHistory[] = [];
      examsByName.forEach((rows, examName) => {
        if (rows.length >= 1) {
          // Sort by date ascending for chart display
          const sortedRows = [...rows].sort(
            (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
          );

          const firstRow = sortedRows[0];
          examHistories.push({
            examName,
            unit: firstRow.unit,
            referenceMin: firstRow.reference_min ?? 0,
            referenceMax: firstRow.reference_max ?? 100,
            history: sortedRows.map((r) => ({
              date: r.exam_date,
              value: Number(r.value),
              status: r.status as ExamStatus,
            })),
          });
        }
      });

      // Calculate summary
      const healthy = latestExams.filter((e) => e.status === 'healthy').length;
      const warning = latestExams.filter((e) => e.status === 'warning').length;
      const danger = latestExams.filter((e) => e.status === 'danger').length;

      // Get the most recent date
      const mostRecentDate = data[0]?.exam_date
        ? format(new Date(data[0].exam_date), "d 'de' MMMM, yyyy", { locale: ptBR })
        : '';

      setExams(latestExams);
      setHistories(examHistories);
      setSummary({
        totalExams: latestExams.length,
        healthy,
        warning,
        danger,
        lastUpdate: mostRecentDate,
      });
    } catch (error) {
      console.error('Error fetching exam data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    exams,
    histories,
    summary,
    loading,
    refetch: fetchExamData,
  };
};
