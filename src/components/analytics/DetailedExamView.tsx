import { useState } from 'react';
import {
    ArrowLeft,
    Calendar,
    Info,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    MapPin,
    Plus
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Mock Data
const examTypes = ['Vitamina D', 'LDL', 'Glicose', 'Hemoglobina'];

const performanceData = [
    { month: 'Jan', value: 30 },
    { month: 'Mar', value: 35 },
    { month: 'Mai', value: 32 },
    { month: 'Jul', value: 50 },
    { month: 'Set', value: 55 },
    { month: 'Nov', value: 70 },
    { month: 'Dez', value: 80 }, // Extended slightly for visual
];

const historyData = [
    { id: 1, date: '24 Mai', location: 'Laboratório Central', city: 'São Paulo, SP', value: 32, status: 'Normal' },
    { id: 2, date: '10 Jan', location: 'Laboratório Central', city: 'São Paulo, SP', value: 28, status: 'Baixo' },
];

export const DetailedExamView = () => {
    const navigate = useNavigate();
    const [selectedExam, setSelectedExam] = useState('Vitamina D');

    return (
        <div className="min-h-screen bg-background pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 mb-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-slate-800"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="w-6 h-6 text-foreground" />
                </Button>
                <h1 className="text-lg font-bold text-foreground">Progresso da Saúde</h1>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-800">
                    <Calendar className="w-6 h-6 text-foreground" />
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto px-4 pb-4 scrollbar-hide">
                {examTypes.map((type) => (
                    <button
                        key={type}
                        onClick={() => setSelectedExam(type)}
                        className={cn(
                            "px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
                            selectedExam === type
                                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        )}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div className="px-4 space-y-6">
                {/* Title Section */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-bold text-foreground">Vitamina D - 25 Hidroxi</h2>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <Info className="w-4 h-4 text-sky-500" />
                        <span>Faixa normal: 30-100 ng/mL</span>
                    </div>
                </div>

                {/* Main Chart Card */}
                <Card className="bg-slate-900 border-none shadow-xl rounded-3xl overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="text-sm text-slate-400 mb-1">Nível Atual</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">45</span>
                                    <span className="text-slate-400">ng/mL</span>
                                </div>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-none px-3 py-1.5">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                +12%
                            </Badge>
                        </div>

                        {/* Chart */}
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        cursor={{ stroke: '#0ea5e9', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#0ea5e9"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Trend Analysis */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-4">Análise de Tendência</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-5"></div>
                            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">ATUAL</div>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-2xl font-bold text-white">45</span>
                                <span className="text-slate-500 text-xs">ng/mL</span>
                            </div>
                            <div className="text-xs text-slate-500">12 Nov, 2023</div>
                        </div>

                        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-5"></div>
                            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">ANTERIOR</div>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-2xl font-bold text-white">32</span>
                                <span className="text-slate-500 text-xs">ng/mL</span>
                            </div>
                            <div className="text-xs text-slate-500">24 Mai, 2023</div>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Histórico</h3>
                        <Button variant="link" className="text-sky-500 text-sm h-auto p-0">Ver Todos</Button>
                    </div>

                    <div className="space-y-3">
                        {historyData.map((item) => (
                            <div key={item.id} className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between border border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-800 rounded-xl p-2.5 text-center min-w-[3.5rem]">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{item.date.split(' ')[0]}</div>
                                        <div className="text-lg font-bold text-white">{item.date.split(' ')[1]}</div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{item.location}</div>
                                        <div className="flex items-center text-xs text-slate-400 mt-1">
                                            <MapPin className="w-3 h-3 mr-1" />
                                            {item.city}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-white mb-1">{item.value}</div>
                                    <Badge
                                        className={cn(
                                            "border-none text-[10px] px-2 py-0.5",
                                            item.status === 'Normal' ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-500"
                                        )}
                                    >
                                        {item.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 left-4 right-4 z-50">
                <Button
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white h-14 rounded-2xl shadow-xl shadow-sky-500/20 text-lg font-bold"
                    onClick={() => navigate('/patient/schedule-appointment')}
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Agendar Novo Exame
                </Button>
            </div>
        </div>
    );
};
