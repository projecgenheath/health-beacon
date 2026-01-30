import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FileText,
    DollarSign,
    Calendar,
    TrendingUp,
    ChevronRight,
    Search,
    Clock,
    User
} from 'lucide-react';
import type { ExamRequest, Quotation, CollectionAppointment, Profile } from '@/types/marketplace';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { cn } from '@/lib/utils';

export default function LaboratoryDashboard() {
    const { user } = useAuth();
    const [labProfile, setLabProfile] = useState<Profile | null>(null);
    const [pendingRequests, setPendingRequests] = useState<ExamRequest[]>([]);
    const [sentQuotations, setSentQuotations] = useState<Quotation[]>([]);
    const [todayAppointments, setTodayAppointments] = useState<CollectionAppointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!user) return;

            setIsLoading(true);
            try {
                // Get laboratory profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('user_type', 'laboratory')
                    .single();

                if (profileError) throw profileError;
                setLabProfile(profile);

                // Get pending exam requests
                const { data: requests, error: requestsError } = await supabase
                    .from('exam_requests')
                    .select('*')
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!requestsError) {
                    setPendingRequests(requests || []);
                }

                // Get quotations sent by this laboratory
                const { data: quotations, error: quotationsError } = await supabase
                    .from('quotations')
                    .select('*')
                    .eq('laboratory_id', profile.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!quotationsError) {
                    setSentQuotations(quotations || []);
                }

                // Get today's appointments
                const today = new Date().toISOString().split('T')[0];
                const { data: appointments, error: appointmentsError } = await supabase
                    .from('collection_appointments')
                    .select('*')
                    .eq('laboratory_id', profile.id)
                    .eq('scheduled_date', today)
                    .order('scheduled_time', { ascending: true });

                if (!appointmentsError) {
                    setTodayAppointments(appointments || []);
                }
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            loadDashboardData();
        }
    }, [user]);

    // Dummy data for charts - in a real app, this would come from the backend
    const chartData = useMemo(() => [
        { name: "Seg", conversao: 4, agendamentos: 8 },
        { name: "Ter", conversao: 3, agendamentos: 12 },
        { name: "Qua", conversao: 7, agendamentos: 10 },
        { name: "Qui", conversao: 5, agendamentos: 15 },
        { name: "Sex", conversao: 9, agendamentos: 18 },
        { name: "Sab", conversao: 6, agendamentos: 5 },
        { name: "Dom", conversao: 2, agendamentos: 1 },
    ], []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const pendingQuotations = sentQuotations.filter(q => q.status === 'pending');
    const acceptedQuotations = sentQuotations.filter(q => q.status === 'accepted');

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        {labProfile?.laboratory_name}
                        <Badge variant="outline" className="text-[10px] py-0">Laboratório Parceiro</Badge>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => window.location.href = '/laboratory/appointments'}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Minha Agenda
                    </Button>
                    <Button size="sm" onClick={() => window.location.href = '/laboratory/requests'}>
                        <Search className="mr-2 h-4 w-4" />
                        Buscar Pedidos
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="glass-card overflow-hidden group">
                    <CardHeader className="pb-2 relative">
                        <div className="absolute top-4 right-4 h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                            <FileText className="h-6 w-6 text-blue-500" />
                        </div>
                        <CardDescription className="font-medium">Oportunidades</CardDescription>
                        <CardTitle className="text-3xl font-bold">{pendingRequests.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Novos pedidos disponíveis
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card overflow-hidden group">
                    <CardHeader className="pb-2 relative">
                        <div className="absolute top-4 right-4 h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                            <DollarSign className="h-6 w-6 text-amber-500" />
                        </div>
                        <CardDescription className="font-medium">Orçamentos Pendentes</CardDescription>
                        <CardTitle className="text-3xl font-bold">{pendingQuotations.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-status-healthy" />
                            Aguardando pacientes
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card overflow-hidden group">
                    <CardHeader className="pb-2 relative">
                        <div className="absolute top-4 right-4 h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                            <TrendingUp className="h-6 w-6 text-purple-500" />
                        </div>
                        <CardDescription className="font-medium">Conversão</CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            {sentQuotations.length > 0 ? ((acceptedQuotations.length / sentQuotations.length) * 100).toFixed(0) : 0}%
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            {acceptedQuotations.length} aceitos de {sentQuotations.length}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card overflow-hidden group">
                    <CardHeader className="pb-2 relative">
                        <div className="absolute top-4 right-4 h-12 w-12 rounded-full bg-status-healthy/10 flex items-center justify-center transition-transform group-hover:scale-110">
                            <Calendar className="h-6 w-6 text-status-healthy" />
                        </div>
                        <CardDescription className="font-medium">Agendamento Hoje</CardDescription>
                        <CardTitle className="text-3xl font-bold">{todayAppointments.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            Prontos para atendimento
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Areas */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Productivity Chart */}
                    <Card className="glass-card border-none shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Produtividade Semanal</CardTitle>
                                <CardDescription>Conversões vs Agendamentos</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon">
                                <TrendingUp className="h-4 w-4 text-primary" />
                            </Button>
                        </CardHeader>
                        <CardContent className="h-[300px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorAgend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.5)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            borderRadius: '12px',
                                            border: '1px solid hsl(var(--border))',
                                            boxShadow: 'var(--shadow-md)'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="conversao"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCons)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="agendamentos"
                                        stroke="hsl(var(--secondary))"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorAgend)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* New Requests Section */}
                    <Card className="glass-card border-none shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Oportunidades Recentes</CardTitle>
                                <CardDescription>Novos pedidos filtrados para seu laboratório</CardDescription>
                            </div>
                            <Button variant="link" onClick={() => window.location.href = '/laboratory/requests'}>
                                Ver todos <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {pendingRequests.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 scale-in">
                                        <FileText className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">Nenhuma nova oportunidade no momento.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingRequests.slice(0, 5).map((request, idx) => (
                                        <div
                                            key={request.id}
                                            className={cn(
                                                "group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border border-border/50 hover:bg-secondary/30 transition-all duration-200 cursor-pointer animate-slide-up",
                                                idx === 0 && "stagger-1",
                                                idx === 1 && "stagger-2",
                                                idx === 2 && "stagger-3",
                                                idx === 3 && "stagger-4",
                                                idx === 4 && "stagger-5",
                                            )}
                                            onClick={() => window.location.href = `/laboratory/requests`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={cn(
                                                    "p-2 rounded-xl mt-1",
                                                    request.urgency_level === 'emergency' ? "bg-destructive/10 text-destructive" :
                                                        request.urgency_level === 'urgent' ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600"
                                                )}>
                                                    <Clock className="h-5 w-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-foreground">
                                                            {request.exam_types.length > 1 ? `${request.exam_types[0]} +${request.exam_types.length - 1}` : request.exam_types[0]}
                                                        </span>
                                                        <Badge variant={
                                                            request.urgency_level === 'emergency' ? 'destructive' :
                                                                request.urgency_level === 'urgent' ? 'default' : 'secondary'
                                                        } className="text-[10px] uppercase">
                                                            {request.urgency_level === 'emergency' ? 'Emergência' :
                                                                request.urgency_level === 'urgent' ? 'Urgente' : 'Normal'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            Publicado {new Date(request.created_at).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 md:mt-0 flex items-center gap-2 self-end md:self-auto">
                                                <Button variant="outline" size="sm" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Enviar Orçamento
                                                </Button>
                                                <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                                                    <ChevronRight className="h-4 w-4 text-primary" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (Widgets) */}
                <div className="space-y-8">
                    {/* Today's Agenda */}
                    <Card className="glass-card border-none shadow-lg overflow-hidden">
                        <CardHeader className="bg-primary/5 pb-6">
                            <div className="flex items-center justify-between mb-2">
                                <CardTitle className="text-lg">Agenda de Hoje</CardTitle>
                                <Badge className="bg-primary/20 text-primary border-none">
                                    {todayAppointments.length} Total
                                </Badge>
                            </div>
                            <CardDescription>Atendimentos confirmados para hoje</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {todayAppointments.length === 0 ? (
                                <div className="text-center py-10 px-6">
                                    <Calendar className="h-10 w-10 text-muted-foreground opacity-20 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground italic">Sem atendimentos agendados para hoje.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/30">
                                    {todayAppointments.map((appointment) => (
                                        <div
                                            key={appointment.id}
                                            className="p-4 hover:bg-accent/30 transition-colors flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-background border border-border/50 min-w-[60px]">
                                                    <span className="text-sm font-bold text-primary">{appointment.scheduled_time}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">HORA</span>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-semibold flex items-center gap-1.5">
                                                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                                                        Paciente #...{appointment.id.slice(-4)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {appointment.collection_type === 'home' ? '🏠 Domiciliar' : '🏥 Unidade'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] capitalize group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                {appointment.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="p-4 bg-muted/30">
                                <Button variant="ghost" className="w-full text-xs h-8" onClick={() => window.location.href = '/laboratory/appointments'}>
                                    Acessar Agenda Completa
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Suggestions / Help */}
                    <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-none shadow-md overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp className="h-16 w-16" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-primary">
                                <TrendingUp className="h-5 w-5" />
                                Dica BHB
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed">
                                Laboratórios que respondem orçamentos em menos de <b>15 minutos</b> têm uma taxa de aceitação <b>45% maior</b>.
                            </p>
                            <Button variant="link" className="p-0 h-auto text-xs mt-3 text-primary font-bold">
                                Como destacar seus orçamentos? →
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

