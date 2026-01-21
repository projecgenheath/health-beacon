import { useState, useCallback, useMemo } from 'react';
import { ExamResult, ExamHistory } from '@/types/exam';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExamAnalysis {
    // Overall health score (0-100)
    healthScore: number;
    healthScoreLabel: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';

    // Category breakdown
    categoryBreakdown: {
        category: string;
        healthy: number;
        warning: number;
        danger: number;
        total: number;
        percentage: number;
    }[];

    // Trending markers
    improvingMarkers: string[];
    worseningMarkers: string[];
    stableMarkers: string[];

    // Alerts
    criticalAlerts: {
        examName: string;
        value: number;
        unit: string;
        deviation: number;
        recommendation: string;
    }[];

    // Time insights
    daysSinceLastExam: number;
    examFrequency: 'regular' | 'irregular' | 'pending';
    recommendedNextExam: string;

    // Stats
    totalMarkers: number;
    healthyPercentage: number;
    warningPercentage: number;
    dangerPercentage: number;
}

const defaultAnalysis: ExamAnalysis = {
    healthScore: 0,
    healthScoreLabel: 'Atenção',
    categoryBreakdown: [],
    improvingMarkers: [],
    worseningMarkers: [],
    stableMarkers: [],
    criticalAlerts: [],
    daysSinceLastExam: 0,
    examFrequency: 'pending',
    recommendedNextExam: '',
    totalMarkers: 0,
    healthyPercentage: 0,
    warningPercentage: 0,
    dangerPercentage: 0,
};

/**
 * Hook para análise avançada de exames
 * Calcula score de saúde, tendências e alertas
 */
export const useExamAnalysis = (
    exams: ExamResult[],
    histories: ExamHistory[]
): ExamAnalysis => {
    return useMemo(() => {
        if (!exams || exams.length === 0) {
            return defaultAnalysis;
        }

        // Calculate status counts
        const healthy = exams.filter(e => e.status === 'healthy').length;
        const warning = exams.filter(e => e.status === 'warning').length;
        const danger = exams.filter(e => e.status === 'danger').length;
        const total = exams.length;

        // Calculate percentages
        const healthyPercentage = (healthy / total) * 100;
        const warningPercentage = (warning / total) * 100;
        const dangerPercentage = (danger / total) * 100;

        // Calculate health score (weighted)
        const healthScore = Math.round(
            (healthy * 100 + warning * 50 + danger * 0) / total
        );

        // Determine health score label
        let healthScoreLabel: ExamAnalysis['healthScoreLabel'];
        if (healthScore >= 80) healthScoreLabel = 'Excelente';
        else if (healthScore >= 60) healthScoreLabel = 'Bom';
        else if (healthScore >= 40) healthScoreLabel = 'Atenção';
        else healthScoreLabel = 'Crítico';

        // Category breakdown
        const categoryMap = new Map<string, { healthy: number; warning: number; danger: number }>();
        exams.forEach(exam => {
            const cat = exam.category || 'Geral';
            if (!categoryMap.has(cat)) {
                categoryMap.set(cat, { healthy: 0, warning: 0, danger: 0 });
            }
            const catStats = categoryMap.get(cat)!;
            if (exam.status === 'healthy') catStats.healthy++;
            else if (exam.status === 'warning') catStats.warning++;
            else catStats.danger++;
        });

        const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, stats]) => {
            const catTotal = stats.healthy + stats.warning + stats.danger;
            return {
                category,
                ...stats,
                total: catTotal,
                percentage: (stats.healthy / catTotal) * 100,
            };
        }).sort((a, b) => a.percentage - b.percentage);

        // Analyze trends from histories
        const improvingMarkers: string[] = [];
        const worseningMarkers: string[] = [];
        const stableMarkers: string[] = [];

        histories.forEach(history => {
            if (history.history.length < 2) {
                stableMarkers.push(history.examName);
                return;
            }

            const sorted = [...history.history].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            const current = sorted[0];
            const previous = sorted[1];
            const midRange = (history.referenceMin + history.referenceMax) / 2;

            const currentDistance = Math.abs(current.value - midRange);
            const previousDistance = Math.abs(previous.value - midRange);

            if (currentDistance < previousDistance * 0.95) {
                improvingMarkers.push(history.examName);
            } else if (currentDistance > previousDistance * 1.05) {
                worseningMarkers.push(history.examName);
            } else {
                stableMarkers.push(history.examName);
            }
        });

        // Generate critical alerts
        const criticalAlerts = exams
            .filter(e => e.status === 'danger')
            .map(exam => {
                const midRange = (exam.referenceMin + exam.referenceMax) / 2;
                const range = exam.referenceMax - exam.referenceMin;
                const deviation = ((exam.value - midRange) / (range / 2)) * 100;

                let recommendation = '';
                if (deviation > 0) {
                    recommendation = `Valor ${Math.abs(deviation).toFixed(0)}% acima do esperado. Consulte seu médico.`;
                } else {
                    recommendation = `Valor ${Math.abs(deviation).toFixed(0)}% abaixo do esperado. Consulte seu médico.`;
                }

                return {
                    examName: exam.name,
                    value: exam.value,
                    unit: exam.unit,
                    deviation,
                    recommendation,
                };
            })
            .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

        // Time insights
        const mostRecentDate = exams.reduce((latest, exam) => {
            const examDate = parseISO(exam.date);
            return examDate > latest ? examDate : latest;
        }, new Date(0));

        const daysSinceLastExam = differenceInDays(new Date(), mostRecentDate);

        let examFrequency: ExamAnalysis['examFrequency'] = 'pending';
        if (daysSinceLastExam <= 90) examFrequency = 'regular';
        else if (daysSinceLastExam <= 180) examFrequency = 'irregular';
        else examFrequency = 'pending';

        // Recommend next exam date based on status
        let recommendedDays = 180; // 6 months default
        if (danger > 0) recommendedDays = 30;
        else if (warning > healthy) recommendedDays = 90;

        const nextExamDate = new Date(mostRecentDate);
        nextExamDate.setDate(nextExamDate.getDate() + recommendedDays);
        const recommendedNextExam = format(nextExamDate, "d 'de' MMMM, yyyy", { locale: ptBR });

        return {
            healthScore,
            healthScoreLabel,
            categoryBreakdown,
            improvingMarkers,
            worseningMarkers,
            stableMarkers,
            criticalAlerts,
            daysSinceLastExam,
            examFrequency,
            recommendedNextExam,
            totalMarkers: total,
            healthyPercentage,
            warningPercentage,
            dangerPercentage,
        };
    }, [exams, histories]);
};
