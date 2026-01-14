import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { differenceInDays, differenceInMonths, parseISO, addMonths } from 'date-fns';

export interface ExamReminder {
    id: string;
    exam_type: string;
    frequency_months: number;
    last_done: string | null;
    next_due: string | null;
    enabled: boolean;
    days_overdue?: number;
    status: 'ok' | 'due_soon' | 'overdue';
}

const DEFAULT_REMINDERS = [
    { exam_type: 'Hemograma Completo', frequency_months: 12 },
    { exam_type: 'Glicemia de Jejum', frequency_months: 12 },
    { exam_type: 'Colesterol Total e Frações', frequency_months: 12 },
    { exam_type: 'TSH / T4 Livre', frequency_months: 12 },
    { exam_type: 'Vitamina D', frequency_months: 12 },
    { exam_type: 'Vitamina B12', frequency_months: 12 },
    { exam_type: 'Creatinina / Ureia', frequency_months: 12 },
    { exam_type: 'TGO / TGP (Fígado)', frequency_months: 12 },
];

export const useReminders = () => {
    const { user } = useAuth();
    const [reminders, setReminders] = useState<ExamReminder[]>([]);
    const [loading, setLoading] = useState(true);

    const calculateStatus = (lastDone: string | null, frequencyMonths: number): { status: ExamReminder['status']; daysOverdue: number } => {
        if (!lastDone) {
            return { status: 'overdue', daysOverdue: 365 };
        }

        const lastDate = parseISO(lastDone);
        const nextDue = addMonths(lastDate, frequencyMonths);
        const today = new Date();
        const daysUntilDue = differenceInDays(nextDue, today);

        if (daysUntilDue < 0) {
            return { status: 'overdue', daysOverdue: Math.abs(daysUntilDue) };
        } else if (daysUntilDue <= 30) {
            return { status: 'due_soon', daysOverdue: 0 };
        }
        return { status: 'ok', daysOverdue: 0 };
    };

    const fetchReminders = useCallback(async () => {
        if (!user) return;

        try {
            // Fetch user's exam reminders
            const { data: savedReminders, error } = await supabase
                .from('exam_reminders')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            // Get last exam dates from exam_results
            const { data: examResults } = await supabase
                .from('exam_results')
                .select('name, exam_date')
                .eq('user_id', user.id)
                .order('exam_date', { ascending: false });

            // Create a map of latest exam dates by type
            const latestExamDates = new Map<string, string>();
            (examResults || []).forEach((result) => {
                const normalized = result.name.toUpperCase();
                if (!latestExamDates.has(normalized)) {
                    latestExamDates.set(normalized, result.exam_date);
                }
            });

            // Merge saved reminders with defaults
            const reminderMap = new Map(
                (savedReminders || []).map((r) => [r.exam_type, r])
            );

            const merged: ExamReminder[] = DEFAULT_REMINDERS.map((def) => {
                const saved = reminderMap.get(def.exam_type);
                const lastDone = saved?.last_done || findLatestDate(def.exam_type, latestExamDates);
                const { status, daysOverdue } = calculateStatus(lastDone, def.frequency_months);

                return {
                    id: saved?.id || `default-${def.exam_type}`,
                    exam_type: def.exam_type,
                    frequency_months: saved?.frequency_months || def.frequency_months,
                    last_done: lastDone,
                    next_due: lastDone ? addMonths(parseISO(lastDone), def.frequency_months).toISOString() : null,
                    enabled: saved?.enabled ?? true,
                    days_overdue: daysOverdue,
                    status,
                };
            });

            // Sort by status priority (overdue first, then due_soon, then ok)
            merged.sort((a, b) => {
                const priority = { overdue: 0, due_soon: 1, ok: 2 };
                return priority[a.status] - priority[b.status];
            });

            setReminders(merged);
        } catch (error) {
            console.error('Error fetching reminders:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const findLatestDate = (examType: string, dateMap: Map<string, string>): string | null => {
        const upper = examType.toUpperCase();
        for (const [name, date] of dateMap.entries()) {
            if (name.includes(upper) || upper.includes(name)) {
                return date;
            }
        }
        return null;
    };

    const markAsDone = async (examType: string) => {
        if (!user) return false;

        const today = new Date().toISOString().split('T')[0];

        try {
            const { error } = await supabase.from('exam_reminders').upsert(
                {
                    user_id: user.id,
                    exam_type: examType,
                    last_done: today,
                    next_due: addMonths(new Date(), 12).toISOString(),
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,exam_type', ignoreDuplicates: false }
            );

            if (error) throw error;

            await fetchReminders();
            return true;
        } catch (error) {
            console.error('Error marking as done:', error);
            return false;
        }
    };

    const toggleReminder = async (examType: string, enabled: boolean) => {
        if (!user) return false;

        try {
            const { error } = await supabase.from('exam_reminders').upsert(
                {
                    user_id: user.id,
                    exam_type: examType,
                    enabled,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,exam_type', ignoreDuplicates: false }
            );

            if (error) throw error;

            await fetchReminders();
            return true;
        } catch (error) {
            console.error('Error toggling reminder:', error);
            return false;
        }
    };

    useEffect(() => {
        if (user) {
            fetchReminders();
        }
    }, [user, fetchReminders]);

    return {
        reminders,
        loading,
        overdueCount: reminders.filter((r) => r.status === 'overdue' && r.enabled).length,
        dueSoonCount: reminders.filter((r) => r.status === 'due_soon' && r.enabled).length,
        markAsDone,
        toggleReminder,
        refetch: fetchReminders,
    };
};
