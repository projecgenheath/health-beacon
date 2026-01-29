import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { ExamResult, ExamHistory, HealthSummary, ExamStatus } from '@/types/exam';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getReferenceRange } from '@/data/correlations';

interface ExamResultRow {
  id: string;
  exam_id: string;
  name: string;
  value: number;
  text_value?: string | null;      // Para exames de imagem/patologia
  unit: string;
  reference_min: number | null;
  reference_max: number | null;
  status: string;
  exam_date: string;
  category: string | null;
  exam_type?: string | null;       // laboratory, imaging, pathology
  description?: string | null;
  conclusion?: string | null;
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

  const fetchExamData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch all exam results for the user, ordered by date and name
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          *,
          exams:exam_id (
            file_url,
            file_name
          )
        `)
        .eq('user_id', user.id)
        .order('exam_date', { ascending: false });

      if (error) throw error;

      // Fetch user profile for age/sex context to get better reference ranges
      const { data: profile } = await supabase
        .from('profiles')
        .select('sex, birth_date')
        .eq('user_id', user.id)
        .single();

      const userSex = profile?.sex === 'M' || profile?.sex === 'F' ? profile.sex : 'M';
      const userAge = profile?.birth_date
        ? Math.floor((new Date().getTime() - new Date(profile.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : 35; // Default age if not set

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
      const latestExamsMap = new Map<string, ExamResultRow & { exams?: { file_url: string | null; file_name: string } | null }>();
      const examsByName = new Map<string, ExamResultRow[]>();

      (data as (ExamResultRow & { exams?: { file_url: string | null; file_name: string } | null })[]).forEach((row) => {
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
      const latestExams: ExamResult[] = Array.from(latestExamsMap.values()).map((row) => {
        // Try to get standard reference range if DB values are missing or default (0-100)
        let refMin = row.reference_min;
        let refMax = row.reference_max;

        // Always try to get standard reference range based on age/sex to ensure consistency
        // and fix potential extraction errors (e.g. Hemoglobin 13.5 vs Glycated 5.7)
        const stdRange = getReferenceRange(row.name, userSex as 'M' | 'F', userAge);
        if (stdRange) {
          refMin = stdRange.min;
          refMax = stdRange.max;
        }

        return {
          id: row.id,
          examId: row.exam_id,
          name: row.name,
          value: Number(row.value),
          textValue: row.text_value ?? null,
          unit: row.unit,
          referenceMin: refMin ?? 0,
          referenceMax: refMax ?? 100,
          status: row.status as ExamStatus,
          date: row.exam_date,
          category: row.category ?? 'Geral',
          examType: (row.exam_type as 'laboratory' | 'imaging' | 'pathology') ?? 'laboratory',
          description: row.description ?? null,
          conclusion: row.conclusion ?? null,
          fileUrl: row.exams?.file_url ?? null,
          fileName: row.exams?.file_name ?? null,
        };
      });

      // Build exam histories
      const examHistories: ExamHistory[] = [];
      examsByName.forEach((rows, examName) => {
        if (rows.length >= 1) {
          // Sort by date ascending for chart display
          const sortedRows = [...rows].sort(
            (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
          );

          // IMPORTANT: Use the LATEST row (end of sortedRows) for the metadata (unit, ref range)
          // instead of the oldest one (sortedRows[0])
          const latestRowInHistory = sortedRows[sortedRows.length - 1];

          let hRefMin = latestRowInHistory.reference_min;
          let hRefMax = latestRowInHistory.reference_max;

          const stdRange = getReferenceRange(examName, userSex as 'M' | 'F', userAge);

          if (stdRange) {
            hRefMin = stdRange.min;
            hRefMax = stdRange.max;
          }

          examHistories.push({
            examName,
            unit: latestRowInHistory.unit,
            referenceMin: hRefMin ?? 0,
            referenceMax: hRefMax ?? 100,
            history: sortedRows.map((r) => ({
              date: r.exam_date,
              value: Number(r.value),
              status: r.status as ExamStatus,
            })),
          });
        }
      });

      // Calculate summary - Include 'normal' status in healthy count
      const healthy = latestExams.filter((e) => ['healthy', 'normal'].includes(e.status)).length;
      const warning = latestExams.filter((e) => ['warning', 'abnormal'].includes(e.status)).length;
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
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchExamData();
    }
  }, [user, fetchExamData]);

  return {
    exams,
    histories,
    summary,
    loading,
    refetch: fetchExamData,
  };
};
