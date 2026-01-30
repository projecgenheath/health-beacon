import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    BeakerIcon,
    Calendar,
    Search,
    Filter,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    PlusCircle,
    FileText,
    User,
    Phone,
    Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
    ExamRequest,
    ExamProcedure,
    RequestStatus,
    LabRequestStats,
} from '@/types/lab-requests';

interface ExamRequestWithProcedures extends ExamRequest {
    procedures: ExamProcedure[];
}

export default function LabRequests() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<ExamRequestWithProcedures[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<ExamRequestWithProcedures[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
    const [stats, setStats] = useState<LabRequestStats>({
        total_requests: 0,
        pending_requests: 0,
        in_progress_requests: 0,
        completed_today: 0,
        pending_results: 0,
        critical_results: 0,
        pending_recollections: 0,
    });

    // Load statistics
    const loadStats = useCallback(async () => {
        if (!user) return;

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get all requests for this laboratory
            const { data: allRequests, error } = await supabase
                .from('lab_production_requests' as any)
                .select('*, procedures:lab_production_procedures(*)')
                .eq('laboratory_id', user.id);

            if (error) throw error;

            const pending = allRequests?.filter((r) => r.status === 'pending').length || 0;
            const inProgress =
                allRequests?.filter((r) =>
                    ['collected', 'in_transit', 'received', 'in_analysis'].includes(r.status)
                ).length || 0;
            const completedToday =
                allRequests?.filter(
                    (r) => r.completed_at && new Date(r.completed_at) >= today
                ).length || 0;

            setStats({
                total_requests: allRequests?.length || 0,
                pending_requests: pending,
                in_progress_requests: inProgress,
                completed_today: completedToday,
                pending_results: 0, // Would need to query exam_procedures
                critical_results: 0, // Would need to query exam_results
                pending_recollections:
                    allRequests?.filter((r) => r.status === 'pending_recollect').length || 0,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }, [user]);

    // Load requests
    const loadRequests = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('lab_production_requests' as any)
                .select('*, procedures:lab_production_procedures(*)')
                .eq('laboratory_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Cast data to expected type since we are bypassing client types
            const typedData = (data || []) as unknown as ExamRequestWithProcedures[];

            setRequests(typedData);
            setFilteredRequests(typedData);
            await loadStats();
        } catch (error) {
            console.error('Error loading requests:', error);
            toast.error('Erro ao carregar requisições');
        } finally {
            setIsLoading(false);
        }
    }, [user, loadStats]);

    useEffect(() => {
        if (user) {
            loadRequests();
        }
    }, [user, loadRequests]);

    // Filter requests
    useEffect(() => {
        let filtered = requests;

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (req) =>
                    req.patient_name.toLowerCase().includes(query) ||
                    req.request_number.toLowerCase().includes(query) ||
                    req.patient_cpf?.includes(query) ||
                    req.procedures.some((p) =>
                        p.procedure_name.toLowerCase().includes(query)
                    )
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter((req) => req.status === statusFilter);
        }

        setFilteredRequests(filtered);
    }, [searchQuery, statusFilter, requests]);

    if (isLoading) {
        return (
            <div className="container max-w-7xl mx-auto p-4">
                <p>Carregando requisições...</p>
            </div>
        );
    }

    return (
        <div className="container max-w-7xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BeakerIcon className="h-8 w-8 text-primary" />
                        Requisições de Exames
                    </h1>
                    <p className="text-muted-foreground">
                        Gerencie as requisições e acompanhe os procedimentos
                    </p>
                </div>
                <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nova Requisição
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total de Requisições"
                    value={stats.total_requests}
                    icon={FileText}
                    variant="default"
                />
                <StatsCard
                    title="Pendentes"
                    value={stats.pending_requests}
                    icon={Clock}
                    variant="warning"
                />
                <StatsCard
                    title="Em Andamento"
                    value={stats.in_progress_requests}
                    icon={BeakerIcon}
                    variant="info"
                />
                <StatsCard
                    title="Concluídos Hoje"
                    value={stats.completed_today}
                    icon={CheckCircle}
                    variant="success"
                />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por paciente, número ou exame..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as RequestStatus | 'all')}
                >
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="collected">Coletado</SelectItem>
                        <SelectItem value="in_analysis">Em análise</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled_temp">Cancelado (Temp)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Requests List */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList>
                    <TabsTrigger value="all">Todas ({filteredRequests.length})</TabsTrigger>
                    <TabsTrigger value="urgent">
                        Urgentes (
                        {filteredRequests.filter((r) => r.priority === 'urgent' || r.priority === 'stat').length}
                        )
                    </TabsTrigger>
                    <TabsTrigger value="today">
                        Hoje (
                        {
                            filteredRequests.filter((r) =>
                                new Date(r.created_at).toDateString() === new Date().toDateString()
                            ).length
                        }
                        )
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-4">
                    {filteredRequests.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>Nenhuma requisição encontrada</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredRequests.map((request) => (
                            <RequestCard key={request.id} request={request} onUpdate={loadRequests} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="urgent" className="space-y-4 mt-4">
                    {filteredRequests
                        .filter((r) => r.priority === 'urgent' || r.priority === 'stat')
                        .map((request) => (
                            <RequestCard key={request.id} request={request} onUpdate={loadRequests} />
                        ))}
                </TabsContent>

                <TabsContent value="today" className="space-y-4 mt-4">
                    {filteredRequests
                        .filter((r) => new Date(r.created_at).toDateString() === new Date().toDateString())
                        .map((request) => (
                            <RequestCard key={request.id} request={request} onUpdate={loadRequests} />
                        ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Statistics Card Component
function StatsCard({
    title,
    value,
    icon: Icon,
    variant = 'default',
}: {
    title: string;
    value: number;
    icon: any;
    variant?: 'default' | 'warning' | 'info' | 'success';
}) {
    const variantColors = {
        default: 'from-blue-500 to-cyan-500',
        warning: 'from-amber-500 to-orange-500',
        info: 'from-violet-500 to-purple-500',
        success: 'from-emerald-500 to-green-500',
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">{title}</p>
                        <p className="text-3xl font-bold">{value}</p>
                    </div>
                    <div
                        className={`h-12 w-12 rounded-xl bg-gradient-to-br ${variantColors[variant]} flex items-center justify-center`}
                    >
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Request Card Component
function RequestCard({
    request,
    onUpdate,
}: {
    request: ExamRequestWithProcedures;
    onUpdate: () => void;
}) {
    const getStatusBadge = (status: RequestStatus) => {
        const statusConfig = {
            pending: { label: 'Pendente', variant: 'secondary' as const },
            collected: { label: 'Coletado', variant: 'default' as const },
            in_transit: { label: 'Em Trânsito', variant: 'default' as const },
            received: { label: 'Recebido', variant: 'default' as const },
            in_analysis: { label: 'Em Análise', variant: 'default' as const },
            technical_release: { label: 'Liberação Técnica', variant: 'default' as const },
            clinical_release: { label: 'Liberação Clínica', variant: 'default' as const },
            completed: { label: 'Concluído', variant: 'default' as const },
            cancelled_temp: { label: 'Cancelado (Temp)', variant: 'destructive' as const },
            cancelled_def: { label: 'Cancelado (Def)', variant: 'destructive' as const },
            pending_recollect: { label: 'Recoleta Pendente', variant: 'destructive' as const },
            mpp_temporary: { label: 'MPP Temporário', variant: 'secondary' as const },
        };

        const config = statusConfig[status] || statusConfig.pending;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getPriorityBadge = (priority: 'routine' | 'urgent' | 'stat') => {
        if (priority === 'stat')
            return (
                <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    STAT
                </Badge>
            );
        if (priority === 'urgent')
            return (
                <Badge variant="default" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Urgente
                </Badge>
            );
        return <Badge variant="outline">Rotina</Badge>;
    };

    return (
        <Card className="hover:shadow-lg transition-all">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {getStatusBadge(request.status)}
                            {getPriorityBadge(request.priority)}
                        </div>
                        <CardTitle className="text-xl">
                            Requisição #{request.request_number}
                        </CardTitle>
                        <CardDescription>
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(request.created_at), "d 'de' MMMM 'às' HH:mm", {
                                    locale: ptBR,
                                })}
                            </div>
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            Detalhes
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Etiquetas
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Patient Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                    <div className="space-y-1">
                        <p className="text-sm font-medium flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Paciente
                        </p>
                        <p className="text-sm">{request.patient_name}</p>
                        {request.patient_cpf && (
                            <p className="text-xs text-muted-foreground">CPF: {request.patient_cpf}</p>
                        )}
                    </div>
                    {request.patient_phone && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                Contato
                            </p>
                            <p className="text-sm">{request.patient_phone}</p>
                            {request.patient_email && (
                                <p className="text-xs text-muted-foreground">{request.patient_email}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Procedures */}
                <div>
                    <p className="text-sm font-medium mb-3">
                        Exames Solicitados ({request.procedures.length})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {request.procedures.map((procedure) => (
                            <div
                                key={procedure.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <BeakerIcon className="h-4 w-4 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">{procedure.procedure_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {procedure.procedure_code}
                                        </p>
                                    </div>
                                </div>
                                {procedure.result_available ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clinical Indication */}
                {request.clinical_indication && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="text-sm font-medium mb-1">Indicação Clínica</p>
                        <p className="text-sm text-muted-foreground">{request.clinical_indication}</p>
                    </div>
                )}

                {/* Additional Notes */}
                {request.additional_notes && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                        <p className="text-sm font-medium mb-1">Observações</p>
                        <p className="text-sm text-muted-foreground">{request.additional_notes}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
