import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Achievement {
    key: string;
    titleKey: string;
    descKey: string;
    icon: string;
    unlockedAt?: string;
    progress?: number;
    target?: number;
}

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt'>[] = [
    {
        key: 'first_exam',
        titleKey: 'achievements.firstExam',
        descKey: 'achievements.firstExamDesc',
        icon: '🎯',
        target: 1,
    },
    {
        key: 'complete_profile',
        titleKey: 'achievements.completeProfile',
        descKey: 'achievements.completeProfileDesc',
        icon: '👤',
        target: 1,
    },
    {
        key: 'week_streak',
        titleKey: 'achievements.weekStreak',
        descKey: 'achievements.weekStreakDesc',
        icon: '🔥',
        target: 7,
    },
    {
        key: 'healthy_streak',
        titleKey: 'achievements.healthyStreak',
        descKey: 'achievements.healthyStreakDesc',
        icon: '💚',
        target: 30,
    },
    {
        key: 'ten_exams',
        titleKey: 'achievements.tenExams',
        descKey: 'achievements.tenExamsDesc',
        icon: '📚',
        target: 10,
    },
];

export const useAchievements = () => {
    const { user } = useAuth();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [unlockedCount, setUnlockedCount] = useState(0);

    const fetchAchievements = useCallback(async () => {
        if (!user) return;

        try {
            // Fetch unlocked achievements from database
            const { data: unlockedData, error } = await supabase
                .from('achievements')
                .select('achievement_key, unlocked_at')
                .eq('user_id', user.id);

            if (error) throw error;

            const unlockedMap = new Map(
                unlockedData?.map((a) => [a.achievement_key, a.unlocked_at]) || []
            );

            // Fetch progress data
            const { data: examsData } = await supabase
                .from('exam_results')
                .select('id')
                .eq('user_id', user.id);

            const examCount = examsData?.length || 0;

            // Merge definitions with unlocked status
            const merged = ACHIEVEMENT_DEFINITIONS.map((def) => ({
                ...def,
                unlockedAt: unlockedMap.get(def.key),
                progress:
                    def.key === 'first_exam'
                        ? Math.min(examCount, 1)
                        : def.key === 'ten_exams'
                            ? Math.min(examCount, 10)
                            : 0,
            }));

            setAchievements(merged);
            setUnlockedCount(unlockedData?.length || 0);
        } catch (error) {
            console.error('Error fetching achievements:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const unlockAchievement = async (key: string) => {
        if (!user) return false;

        try {
            const { error } = await supabase.from('achievements').upsert(
                {
                    user_id: user.id,
                    achievement_key: key,
                    unlocked_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,achievement_key' }
            );

            if (error) throw error;

            await fetchAchievements();
            return true;
        } catch (error) {
            console.error('Error unlocking achievement:', error);
            return false;
        }
    };

    const checkAndUnlockAchievements = useCallback(async () => {
        if (!user) return;

        // Check first exam
        const { data: exams } = await supabase
            .from('exam_results')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

        if (exams && exams.length > 0) {
            await unlockAchievement('first_exam');
        }

        // Check 10 exams
        const { count } = await supabase
            .from('exam_results')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (count && count >= 10) {
            await unlockAchievement('ten_exams');
        }

        // Check complete profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, birth_date, sex, phone')
            .eq('user_id', user.id)
            .single();

        if (profile?.full_name && profile?.birth_date && profile?.sex && profile?.phone) {
            await unlockAchievement('complete_profile');
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchAchievements();
        }
    }, [user, fetchAchievements]);

    return {
        achievements,
        loading,
        unlockedCount,
        totalCount: ACHIEVEMENT_DEFINITIONS.length,
        refetch: fetchAchievements,
        checkAndUnlockAchievements,
    };
};
