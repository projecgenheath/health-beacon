import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Search, FileText, Clock, AlertCircle, Server, Eye, Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { ExamRequest, Profile, QuotationItem } from '@/types/marketplace';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DiagnosticosBrasilService } from '@/services/diagnosticos-brasil/service';
import type { DBPedido } from '@/services/diagnosticos-brasil/types';

interface ExamRequestWithPatient extends ExamRequest {
    patient: Profile;
    distance_km?: number;
}

export default function LaboratoryRequests() {
    const { user } = useAuth();
    const { profile } = useUserType();
    const [requests, setRequests] = useState<ExamRequestWithPatient[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<ExamRequestWithPatient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<ExamRequestWithPatient | null>(null);
    const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);

    // DB Integration State
    const [isDBDialogOpen, setIsDBDialogOpen] = useState(false);
    const [dbXmlPreview, setDbXmlPreview] = useState('');

    // Quote form state
    const [quoteItems, setQuoteItems] = useState<QuotationItem[]>([]);
    const [deliveryDays, setDeliveryDays] = useState<number>(3);
    const [notes, setNotes] = useState('');
    const [validDays, setValidDays] = useState<number>(7);

    // Simple Haversine distance calculation
    const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }, []);

    const loadRequests = useCallback(async () => {
        if (!user || !profile) return;

        setIsLoading(true);
        try {
            // Get all pending exam requests
            const { data, error } = await supabase
                .from('exam_requests')
                .select('*, patient:profiles!exam_requests_patient_id_fkey(*)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Calculate distances if laboratory has location
            let requestsWithDistance = data || [];
            if (profile.latitude && profile.longitude) {
                requestsWithDistance = (data || []).map((req) => {
                    if (req.patient.latitude && req.patient.longitude) {
                        const distance = calculateDistance(
                            profile.latitude!,
                            profile.longitude!,
                            req.patient.latitude,
                            req.patient.longitude
                        );
                        return { ...req, distance_km: distance };
                    }
                    return req;
                });
            }

            setRequests(requestsWithDistance);
            setFilteredRequests(requestsWithDistance);
        } catch (error) {
            console.error('Error loading requests:', error);
            toast.error('Erro ao carregar pedidos');
        } finally {
            setIsLoading(false);
        }
    }, [user, profile, calculateDistance]);

    useEffect(() => {
        if (user && profile) {
            loadRequests();
        }
    }, [user, profile, loadRequests]);

    useEffect(() => {
        // Filter requests based on search query
        if (searchQuery.trim() === '') {
            setFilteredRequests(requests);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredRequests(
                requests.filter(
                    (req) =>
                        req.exam_types.some((exam) => exam.toLowerCase().includes(query)) ||
                        req.description?.toLowerCase().includes(query)
                )
            );
        }
    }, [searchQuery, requests]);



    const handleCreateQuote = (request: ExamRequestWithPatient) => {
        setSelectedRequest(request);
        // Initialize quote items from exam types
        const initialItems: QuotationItem[] = request.exam_types.map((examType) => ({
            exam_name: examType,
            price: 0,
            preparation_required: '',
        }));
        setQuoteItems(initialItems);
        setIsQuoteDialogOpen(true);
    };

    const handleSubmitQuote = async () => {
        if (!selectedRequest || !profile) return;

        // Validate that all items have prices
        if (quoteItems.some((item) => item.price <= 0)) {
            toast.error('Por favor, preencha todos os preços');
            return;
        }

        const totalPrice = quoteItems.reduce((sum, item) => sum + item.price, 0);
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validDays);

        try {
            const { error } = await supabase.from('quotations').insert({
                exam_request_id: selectedRequest.id,
                laboratory_id: profile.id,
                total_price: totalPrice,
                items: quoteItems,
                estimated_delivery_days: deliveryDays,
                notes,
                valid_until: validUntil.toISOString().split('T')[0],
                status: 'pending',
            });

            if (error) throw error;

            toast.success('Orçamento enviado com sucesso!');
            setIsQuoteDialogOpen(false);
            setSelectedRequest(null);
            loadRequests(); // Reload to update request status
        } catch (error) {
            console.error('Error submitting quote:', error);
            toast.error('Erro ao enviar orçamento');
        }
    };

    const handleSendToDB = async (request: ExamRequestWithPatient) => {
        if (!profile?.db_codigo_apoiado || !profile?.db_senha_integracao) {
            toast.error('Configure suas credenciais da DB Diagnósticos no perfil primeiro.');
            // In a real app, redirect to settings or open settings dialog
            return;
        }

        const dbPedido = DiagnosticosBrasilService.mapExamRequestToDB(
            request.id,
            request.id.slice(0, 8), // Use a simplified ID for ticket number
            request.patient,
            request.exam_types
        );

        const service = new DiagnosticosBrasilService({
            codigoApoiado: profile.db_codigo_apoiado,
            senhaIntegracao: profile.db_senha_integracao,
            ambiente: 'homologacao'
        });

        const xml = service.generateRecebeAtendimentoXML(dbPedido);
        setDbXmlPreview(xml);
        setSelectedRequest(request); // Keep track of which request we are sending
        setIsDBDialogOpen(true);
    };

    const confirmSendToDB = async () => {
        // Simulate API call
        toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
            loading: 'Enviando para Diagnósticos do Brasil...',
            success: 'Pedido enviado com sucesso para o Apoio!',
            error: 'Erro ao enviar pedido.'
        });
        setIsDBDialogOpen(false);
    };

    const updateItemPrice = (index: number, price: string) => {
        const newItems = [...quoteItems];
        newItems[index].price = parseFloat(price) || 0;
        setQuoteItems(newItems);
    };

    const updateItemPreparation = (index: number, preparation: string) => {
        const newItems = [...quoteItems];
        newItems[index].preparation_required = preparation;
        setQuoteItems(newItems);
    };

    const updateItemName = (index: number, name: string) => {
        const newItems = [...quoteItems];
        newItems[index].exam_name = name;
        setQuoteItems(newItems);
    };

    const handleAddItem = () => {
        setQuoteItems([
            ...quoteItems,
            { exam_name: '', price: 0, preparation_required: '' }
        ]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...quoteItems];
        newItems.splice(index, 1);
        setQuoteItems(newItems);
    };

    const getDocumentUrl = (path: string | null) => {
        if (!path) return null;
        return supabase.storage.from('exam-requests').getPublicUrl(path).data.publicUrl;
    };

    if (isLoading) {
        return (
            <div className="container max-w-6xl mx-auto p-4">
                <p>Carregando pedidos...</p>
            </div>
        );
    }

    const urgentRequests = filteredRequests.filter(
        (r) => r.urgency_level === 'urgent' || r.urgency_level === 'emergency'
    );
    const normalRequests = filteredRequests.filter((r) => r.urgency_level === 'normal');

    return (
        <div className="container max-w-6xl mx-auto p-4 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Pedidos de Exames</h1>
                <p className="text-muted-foreground">Gerencie os pedidos recebidos e envie orçamentos</p>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por tipo de exame..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Tabs for filtering */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList>
                    <TabsTrigger value="all">
                        Todos ({filteredRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="urgent">
                        Urgentes ({urgentRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="normal">
                        Normais ({normalRequests.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-4">
                    {filteredRequests.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                Nenhum pedido encontrado
                            </CardContent>
                        </Card>
                    ) : (
                        filteredRequests.map((request) => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                onCreateQuote={handleCreateQuote}
                                onSendToDB={handleSendToDB}
                            />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="urgent" className="space-y-4 mt-4">
                    {urgentRequests.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                Nenhum pedido urgente
                            </CardContent>
                        </Card>
                    ) : (
                        urgentRequests.map((request) => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                onCreateQuote={handleCreateQuote}
                                onSendToDB={handleSendToDB}
                            />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="normal" className="space-y-4 mt-4">
                    {normalRequests.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                Nenhum pedido normal
                            </CardContent>
                        </Card>
                    ) : (
                        normalRequests.map((request) => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                onCreateQuote={handleCreateQuote}
                                onSendToDB={handleSendToDB}
                            />
                        ))
                    )}
                </TabsContent>
            </Tabs>

            {/* Quote Dialog */}
            <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Criar Orçamento</DialogTitle>
                        <DialogDescription>
                            Preencha os preços para cada exame solicitado
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Document Preview Section */}
                        {selectedRequest?.document_url && (
                            <div className="space-y-2">
                                <Label>Pedido Médico (Original)</Label>
                                <div className="border rounded-lg p-2 h-[500px] bg-slate-50 overflow-hidden relative group flex items-center justify-center">
                                    {selectedRequest.document_url.toLowerCase().endsWith('.pdf') ? (
                                        <iframe
                                            src={getDocumentUrl(selectedRequest.document_url)!}
                                            className="w-full h-full"
                                            title="Documento do Pedido"
                                        />
                                    ) : (
                                        <img
                                            src={getDocumentUrl(selectedRequest.document_url)!}
                                            className="max-w-full max-h-full object-contain"
                                            alt="Documento do Pedido"
                                        />
                                    )}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" variant="secondary" asChild>
                                            <a href={getDocumentUrl(selectedRequest.document_url)!} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Abrir
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Compare os exames identificados com a imagem original.
                                </p>
                            </div>
                        )}

                        <div className={selectedRequest?.document_url ? "" : "col-span-2"}>
                            <div className="space-y-4">
                                {/* Exam Items */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label>Exames e Preços</Label>
                                        <Button size="sm" variant="outline" onClick={handleAddItem}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Adicionar Exame
                                        </Button>
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                                        {quoteItems.map((item, index) => (
                                            <Card key={index} className="relative group">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6"
                                                    onClick={() => handleRemoveItem(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <CardContent className="p-4 space-y-3">
                                                    <div>
                                                        <Label htmlFor={`name-${index}`} className="text-xs text-muted-foreground">Nome do Exame</Label>
                                                        <Input
                                                            id={`name-${index}`}
                                                            value={item.exam_name}
                                                            onChange={(e) => updateItemName(index, e.target.value)}
                                                            placeholder="Nome do exame"
                                                            className="font-medium"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label htmlFor={`price-${index}`} className="text-xs text-muted-foreground">Preço (R$)</Label>
                                                            <Input
                                                                id={`price-${index}`}
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                placeholder="0.00"
                                                                value={item.price || ''}
                                                                onChange={(e) => updateItemPrice(index, e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor={`prep-${index}`} className="text-xs text-muted-foreground">Preparo</Label>
                                                            <Input
                                                                id={`prep-${index}`}
                                                                placeholder="Ex: Jejum"
                                                                value={item.preparation_required || ''}
                                                                onChange={(e) => updateItemPreparation(index, e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                                    <span className="font-semibold">Total:</span>
                                    <span className="text-xl font-bold">
                                        R$ {quoteItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                                    </span>
                                </div>

                                {/* Delivery Days */}
                                <div>
                                    <Label htmlFor="delivery-days">Prazo de Entrega (dias)</Label>
                                    <Input
                                        id="delivery-days"
                                        type="number"
                                        min="1"
                                        value={deliveryDays}
                                        onChange={(e) => setDeliveryDays(parseInt(e.target.value) || 1)}
                                    />
                                </div>

                                {/* Valid Days */}
                                <div>
                                    <Label htmlFor="valid-days">Validade do Orçamento (dias)</Label>
                                    <Input
                                        id="valid-days"
                                        type="number"
                                        min="1"
                                        value={validDays}
                                        onChange={(e) => setValidDays(parseInt(e.target.value) || 1)}
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <Label htmlFor="notes">Observações (opcional)</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Informações adicionais sobre o orçamento..."
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmitQuote}>Enviar Orçamento</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DB Integration Dialog */}
            <Dialog open={isDBDialogOpen} onOpenChange={setIsDBDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Enviar para Apoio (DB Diagnósticos)</DialogTitle>
                        <DialogDescription>
                            Revise o XML gerado antes de enviar para a integração.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto max-h-[400px] text-xs font-mono">
                        <pre>{dbXmlPreview}</pre>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDBDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={confirmSendToDB} className="bg-blue-600 hover:bg-blue-700">
                            <Server className="mr-2 h-4 w-4" />
                            Confirmar Envio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Request Card Component
function RequestCard({
    request,
    onCreateQuote,
    onSendToDB,
}: {
    request: ExamRequestWithPatient;
    onCreateQuote: (request: ExamRequestWithPatient) => void;
    onSendToDB: (request: ExamRequestWithPatient) => void;
}) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge
                                variant={
                                    request.urgency_level === 'emergency'
                                        ? 'destructive'
                                        : request.urgency_level === 'urgent'
                                            ? 'default'
                                            : 'secondary'
                                }
                            >
                                {request.urgency_level === 'emergency'
                                    ? 'Emergência'
                                    : request.urgency_level === 'urgent'
                                        ? 'Urgente'
                                        : 'Normal'}
                            </Badge>
                            {request.distance_km && (
                                <Badge variant="outline">
                                    {request.distance_km.toFixed(1)} km
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-lg">
                            Pedido #{request.id.slice(0, 8)}
                        </CardTitle>
                        <CardDescription>
                            <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3" />
                                {format(new Date(request.created_at), "d 'de' MMMM 'às' HH:mm", {
                                    locale: ptBR,
                                })}
                            </div>
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {request.document_url && (
                            <Button variant="secondary" size="sm" asChild>
                                <a href={supabase.storage.from('exam-requests').getPublicUrl(request.document_url).data.publicUrl} target="_blank" rel="noopener noreferrer">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Ver Pedido
                                </a>
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => onSendToDB(request)}>
                            <Server className="mr-2 h-4 w-4" />
                            Apoio DB
                        </Button>
                        <Button onClick={() => onCreateQuote(request)}>
                            Criar Orçamento
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Exam Types */}
                <div>
                    <p className="text-sm font-medium mb-2">Exames Solicitados:</p>
                    <div className="flex flex-wrap gap-1">
                        {request.exam_types.map((exam, idx) => (
                            <Badge key={idx} variant="outline">
                                {exam}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Description */}
                {request.description && (
                    <div>
                        <p className="text-sm font-medium mb-1">Observações:</p>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                    </div>
                )}

                {/* Preferred Date */}
                {request.preferred_date && (
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                            Data preferencial:{' '}
                            {format(new Date(request.preferred_date), "d 'de' MMMM 'de' yyyy", {
                                locale: ptBR,
                            })}
                        </span>
                    </div>
                )}

                {/* Patient Location */}
                {request.patient.address_city && (
                    <div className="text-sm text-muted-foreground">
                        📍 {request.patient.address_city}, {request.patient.address_state}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
