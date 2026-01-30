import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Clock, User, Phone } from 'lucide-react';
import { toast } from 'sonner';
import type { CollectionAppointment, Profile } from '@/types/marketplace';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentWithPatient extends CollectionAppointment {
    patient: Profile;
}

export default function LaboratoryAppointments() {
    const { user } = useAuth();
    const { profile } = useUserType();
    const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadAppointments = useCallback(async () => {
        if (!user || !profile) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('collection_appointments')
                .select('*, patient:profiles!collection_appointments_patient_id_fkey(*)')
                .eq('laboratory_id', profile.id)
                .order('scheduled_date', { ascending: true })
                .order('scheduled_time', { ascending: true });

            if (error) throw error;

            setAppointments(data || []);
        } catch (error) {
            console.error('Error loading appointments:', error);
            toast.error('Erro ao carregar agendamentos');
        } finally {
            setIsLoading(false);
        }
    }, [user, profile]);

    useEffect(() => {
        if (user && profile) {
            loadAppointments();
        }
    }, [user, profile, loadAppointments]);


    const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('collection_appointments')
                .update({ status: newStatus })
                .eq('id', appointmentId);

            if (error) throw error;

            toast.success('Status atualizado com sucesso');
            loadAppointments();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Erro ao atualizar status');
        }
    };

    if (isLoading) {
        return (
            <div className="container max-w-6xl mx-auto p-4">
                <p>Carregando agendamentos...</p>
            </div>
        );
    }

    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(
        (a) => a.scheduled_date === today && a.status !== 'cancelled' && a.status !== 'completed'
    );
    const upcomingAppointments = appointments.filter(
        (a) => a.scheduled_date > today && a.status !== 'cancelled' && a.status !== 'completed'
    );
    const completedAppointments = appointments.filter((a) => a.status === 'completed');

    return (
        <div className="container max-w-6xl mx-auto p-4 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Agendamentos</h1>
                <p className="text-muted-foreground">Gerencie os agendamentos de coleta</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Hoje</CardDescription>
                        <CardTitle className="text-3xl">{todayAppointments.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Agendamentos para hoje</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Próximos</CardDescription>
                        <CardTitle className="text-3xl">{upcomingAppointments.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Agendamentos futuros</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Concluídos</CardDescription>
                        <CardTitle className="text-3xl">{completedAppointments.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Este mês</p>
                    </CardContent>
                </Card>
            </div>

            {/* Appointments Tabs */}
            <Tabs defaultValue="today" className="w-full">
                <TabsList>
                    <TabsTrigger value="today">Hoje ({todayAppointments.length})</TabsTrigger>
                    <TabsTrigger value="upcoming">Próximos ({upcomingAppointments.length})</TabsTrigger>
                    <TabsTrigger value="completed">Concluídos ({completedAppointments.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="space-y-4 mt-4">
                    {todayAppointments.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                Nenhum agendamento para hoje
                            </CardContent>
                        </Card>
                    ) : (
                        todayAppointments.map((appointment) => (
                            <AppointmentCard
                                key={appointment.id}
                                appointment={appointment}
                                onUpdateStatus={handleUpdateStatus}
                            />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="upcoming" className="space-y-4 mt-4">
                    {upcomingAppointments.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                Nenhum agendamento futuro
                            </CardContent>
                        </Card>
                    ) : (
                        upcomingAppointments.map((appointment) => (
                            <AppointmentCard
                                key={appointment.id}
                                appointment={appointment}
                                onUpdateStatus={handleUpdateStatus}
                            />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4 mt-4">
                    {completedAppointments.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                Nenhum agendamento concluído
                            </CardContent>
                        </Card>
                    ) : (
                        completedAppointments.map((appointment) => (
                            <AppointmentCard
                                key={appointment.id}
                                appointment={appointment}
                                onUpdateStatus={handleUpdateStatus}
                            />
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Appointment Card Component
function AppointmentCard({
    appointment,
    onUpdateStatus,
}: {
    appointment: AppointmentWithPatient;
    onUpdateStatus: (id: string, status: string) => void;
}) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <Badge variant="outline">Agendado</Badge>;
            case 'confirmed':
                return <Badge variant="default">Confirmado</Badge>;
            case 'completed':
                return <Badge variant="secondary">Concluído</Badge>;
            case 'cancelled':
                return <Badge variant="destructive">Cancelado</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const canConfirm = appointment.status === 'scheduled';
    const canComplete = appointment.status === 'confirmed' || appointment.status === 'scheduled';
    const canCancel = appointment.status !== 'completed' && appointment.status !== 'cancelled';

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            {getStatusBadge(appointment.status)}
                            <Badge variant={appointment.collection_type === 'home' ? 'default' : 'outline'}>
                                {appointment.collection_type === 'home' ? '🏠 Domiciliar' : '🏥 No Laboratório'}
                            </Badge>
                        </div>
                        <CardTitle className="text-lg">
                            {format(new Date(appointment.scheduled_date), "EEEE, d 'de' MMMM", {
                                locale: ptBR,
                            })}
                        </CardTitle>
                        <CardDescription>
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {appointment.scheduled_time}
                            </div>
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {canConfirm && (
                            <Button
                                size="sm"
                                onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
                            >
                                Confirmar
                            </Button>
                        )}
                        {canComplete && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onUpdateStatus(appointment.id, 'completed')}
                            >
                                Concluir
                            </Button>
                        )}
                        {canCancel && (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onUpdateStatus(appointment.id, 'cancelled')}
                            >
                                Cancelar
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Patient Info */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{appointment.patient.full_name || 'Paciente'}</span>
                    </div>
                    {appointment.patient.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{appointment.patient.phone}</span>
                        </div>
                    )}
                </div>

                {/* Address for home collection */}
                {appointment.collection_type === 'home' && appointment.home_address && (
                    <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{appointment.home_address}</span>
                    </div>
                )}

                {/* Notes */}
                {appointment.notes && (
                    <div className="text-sm text-muted-foreground border-l-2 pl-3">
                        <strong>Observações:</strong> {appointment.notes}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
