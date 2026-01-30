import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from 'recharts';
import {
    Activity,
    Droplets,
    Heart,
    Zap,
    Shield,
    Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryData {
    name: string;
    count: number;
    healthy: number;
    warning: number;
    danger: number;
    icon: React.ElementType;
    color: string;
}

interface ExamResult {
    id: string;
    name: string;
    category: string;
    status: 'healthy' | 'warning' | 'danger';
}

interface HealthCategoryChartProps {
    exams: ExamResult[];
    showLegend?: boolean;
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string }> = {
    'Hemograma': { icon: Droplets, color: '#ef4444' },
    'Bioquímica': { icon: Zap, color: '#f59e0b' },
    'Hormônios': { icon: Activity, color: '#8b5cf6' },
    'Lipídeos': { icon: Heart, color: '#ec4899' },
    'Imunologia': { icon: Shield, color: '#10b981' },
    'Geral': { icon: Stethoscope, color: '#3b82f6' },
};

const statusColors = {
    healthy: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
};

/**
 * Gráfico de distribuição de exames por categoria
 */
export const HealthCategoryChart = ({
    exams,
    showLegend = true
}: HealthCategoryChartProps) => {
    const categories = useMemo<CategoryData[]>(() => {
        const categoryMap = new Map<string, CategoryData>();

        exams.forEach(exam => {
            const category = exam.category || 'Geral';
            const config = categoryConfig[category] || categoryConfig['Geral'];

            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    name: category,
                    count: 0,
                    healthy: 0,
                    warning: 0,
                    danger: 0,
                    icon: config.icon,
                    color: config.color,
                });
            }

            const data = categoryMap.get(category)!;
            data.count++;
            data[exam.status]++;
        });

        return Array.from(categoryMap.values())
            .sort((a, b) => b.count - a.count);
    }, [exams]);

    const pieData = useMemo(() => {
        return categories.map(cat => ({
            name: cat.name,
            value: cat.count,
            color: cat.color,
        }));
    }, [categories]);

    const statusDistribution = useMemo(() => {
        const totals = { healthy: 0, warning: 0, danger: 0 };
        exams.forEach(exam => {
            totals[exam.status]++;
        });
        return [
            { name: 'Normal', value: totals.healthy, color: statusColors.healthy },
            { name: 'Atenção', value: totals.warning, color: statusColors.warning },
            { name: 'Alterado', value: totals.danger, color: statusColors.danger },
        ].filter(d => d.value > 0);
    }, [exams]);

    if (exams.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum exame disponível para análise.
                </CardContent>
            </Card>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-popover p-3 rounded-lg shadow-lg border border-border">
                    <p className="font-medium text-sm">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {data.value} exame{data.value !== 1 ? 's' : ''}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category pie chart */}
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 text-center">
                            Por Categoria
                        </h4>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Status pie chart */}
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 text-center">
                            Por Status
                        </h4>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Category legend */}
                {showLegend && (
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {categories.map((category) => (
                            <div
                                key={category.name}
                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                            >
                                <div
                                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${category.color}20` }}
                                >
                                    <category.icon
                                        className="h-4 w-4"
                                        style={{ color: category.color }}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{category.name}</p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <span className="text-status-healthy">{category.healthy}</span>
                                        <span>/</span>
                                        <span className="text-status-warning">{category.warning}</span>
                                        <span>/</span>
                                        <span className="text-status-danger">{category.danger}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
