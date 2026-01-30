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
import { Calendar, Search, FileText, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { ExamRequest, Profile, QuotationItem } from '@/types/marketplace';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
                            />
                        ))
                    )}
                </TabsContent>
            </Tabs>

            {/* Quote Dialog */}
            <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Criar Orçamento</DialogTitle>
                        <DialogDescription>
                            Preencha os preços para cada exame solicitado
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Exam Items */}
                        <div className="space-y-3">
                            <Label>Exames e Preços</Label>
                            {quoteItems.map((item, index) => (
                                <Card key={index}>
                                    <CardContent className="p-4 space-y-2">
                                        <div className="font-medium">{item.exam_name}</div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label htmlFor={`price-${index}`}>Preço (R$)</Label>
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
                                                <Label htmlFor={`prep-${index}`}>Preparo (opcional)</Label>
                                                <Input
                                                    id={`prep-${index}`}
                                                    placeholder="Ex: Jejum de 8h"
                                                    value={item.preparation_required || ''}
                                                    onChange={(e) => updateItemPreparation(index, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
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

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmitQuote}>Enviar Orçamento</Button>
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
}: {
    request: ExamRequestWithPatient;
    onCreateQuote: (request: ExamRequestWithPatient) => void;
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
                    <Button onClick={() => onCreateQuote(request)}>
                        Criar Orçamento
                    </Button>
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
