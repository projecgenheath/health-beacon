import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import type { ExamRequest, Quotation, CollectionAppointment, Profile } from '@/types/marketplace';

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

                // Get pending exam requests (visible to all laboratories)
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


    if (isLoading) {
        return (
            <div className="container max-w-6xl mx-auto p-4">
                <p>Carregando...</p>
            </div>
        );
    }

    const pendingQuotations = sentQuotations.filter(q => q.status === 'pending');
    const acceptedQuotations = sentQuotations.filter(q => q.status === 'accepted');

    return (
        <div className="container max-w-6xl mx-auto p-4 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard do Laboratório</h1>
                <p className="text-muted-foreground">{labProfile?.laboratory_name}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Pedidos Pendentes</CardDescription>
                        <CardTitle className="text-3xl flex items-center gap-2">
                            <FileText className="h-6 w-6 text-blue-500" />
                            {pendingRequests.length}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Novos pedidos disponíveis para orçamento
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Orçamentos Enviados</CardDescription>
                        <CardTitle className="text-3xl flex items-center gap-2">
                            <DollarSign className="h-6 w-6 text-green-500" />
                            {pendingQuotations.length}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Aguardando resposta do paciente
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Orçamentos Aceitos</CardDescription>
                        <CardTitle className="text-3xl flex items-center gap-2">
                            <TrendingUp className="h-6 w-6 text-purple-500" />
                            {acceptedQuotations.length}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Taxa de conversão: {sentQuotations.length > 0 ? ((acceptedQuotations.length / sentQuotations.length) * 100).toFixed(1) : 0}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Agendamentos Hoje</CardDescription>
                        <CardTitle className="text-3xl flex items-center gap-2">
                            <Calendar className="h-6 w-6 text-orange-500" />
                            {todayAppointments.length}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Coletas agendadas para hoje
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Exam Requests */}
            <Card>
                <CardHeader>
                    <CardTitle>Novos Pedidos de Exames</CardTitle>
                    <CardDescription>Pedidos recentes aguardando orçamento</CardDescription>
                </CardHeader>
                <CardContent>
                    {pendingRequests.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            Nenhum pedido pendente no momento
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {pendingRequests.slice(0, 5).map((request) => (
                                <div
                                    key={request.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                                    onClick={() => window.location.href = `/laboratory/requests`}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={
                                                request.urgency_level === 'emergency' ? 'destructive' :
                                                    request.urgency_level === 'urgent' ? 'default' : 'secondary'
                                            }>
                                                {request.urgency_level === 'emergency' ? 'Emergência' :
                                                    request.urgency_level === 'urgent' ? 'Urgente' : 'Normal'}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(request.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {request.exam_types.slice(0, 3).map((exam, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {exam}
                                                </Badge>
                                            ))}
                                            {request.exam_types.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{request.exam_types.length - 3} mais
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={(e) => {
                                        e.stopPropagation();
                                        window.location.href = `/laboratory/requests`;
                                    }}>
                                        Ver Detalhes
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Today's Appointments */}
            {todayAppointments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Agendamentos de Hoje</CardTitle>
                        <CardDescription>Coletas agendadas para hoje</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {todayAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{appointment.scheduled_time}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {appointment.collection_type === 'home' ? '🏠 Coleta Domiciliar' : '🏥 No Laboratório'}
                                        </p>
                                    </div>
                                    <Badge variant={
                                        appointment.status === 'confirmed' ? 'default' :
                                            appointment.status === 'completed' ? 'secondary' : 'outline'
                                    }>
                                        {appointment.status === 'scheduled' ? 'Agendado' :
                                            appointment.status === 'confirmed' ? 'Confirmado' :
                                                appointment.status === 'completed' ? 'Concluído' : appointment.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
