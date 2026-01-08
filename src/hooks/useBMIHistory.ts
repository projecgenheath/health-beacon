import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BMIRecord {
  id: string;
  weight: number;
  height: number;
  bmi: number;
  recorded_at: string;
  exam_id: string | null;
  created_at: string;
}

export interface BMIStats {
  current: number | null;
  average: number | null;
  min: number | null;
  max: number | null;
  trend: 'up' | 'down' | 'stable' | null;
  change: number | null;
}

export const useBMIHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<BMIRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BMIStats>({
    current: null,
    average: null,
    min: null,
    max: null,
    trend: null,
    change: null,
  });

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bmi_history')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      const records = (data || []) as BMIRecord[];
      setHistory(records);

      // Calculate stats
      if (records.length > 0) {
        const bmis = records.map((r) => r.bmi);
        const current = bmis[bmis.length - 1];
        const average = bmis.reduce((a, b) => a + b, 0) / bmis.length;
        const min = Math.min(...bmis);
        const max = Math.max(...bmis);

        let trend: 'up' | 'down' | 'stable' | null = null;
        let change: number | null = null;

        if (records.length >= 2) {
          const previous = bmis[bmis.length - 2];
          change = ((current - previous) / previous) * 100;

          if (Math.abs(change) < 1) {
            trend = 'stable';
          } else if (change > 0) {
            trend = 'up';
          } else {
            trend = 'down';
          }
        }

        setStats({
          current,
          average,
          min,
          max,
          trend,
          change,
        });
      }
    } catch (error) {
      console.error('Error fetching BMI history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Abaixo do peso', status: 'warning' as const };
    if (bmi < 25) return { label: 'Peso normal', status: 'healthy' as const };
    if (bmi < 30) return { label: 'Sobrepeso', status: 'warning' as const };
    return { label: 'Obesidade', status: 'danger' as const };
  };

  return {
    history,
    stats,
    loading,
    refetch: fetchHistory,
    getBMICategory,
  };
};
