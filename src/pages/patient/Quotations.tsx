import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Star, Clock, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { QuotationWithLaboratory, Profile, QuotationItem } from '@/types/marketplace';

export default function Quotations() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [quotations, setQuotations] = useState<QuotationWithLaboratory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [patientProfile, setPatientProfile] = useState<Profile | null>(null);

    // Filters
    const [priceRange, setPriceRange] = useState([0, 10000]);
    const [maxDistance, setMaxDistance] = useState(50);
    const [minRating, setMinRating] = useState(0);
    const [sortBy, setSortBy] = useState<'price' | 'distance' | 'rating'>('price');

    const loadQuotations = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            // Get patient profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (profileError) throw profileError;
            setPatientProfile(profile);

            // Get exam requests for this patient
            const { data: examRequests, error: requestsError } = await supabase
                .from('exam_requests')
                .select('id')
                .eq('patient_id', profile.id);

            if (requestsError) throw requestsError;

            if (!examRequests || examRequests.length === 0) {
                setQuotations([]);
                setIsLoading(false);
                return;
            }

            const requestIds = examRequests.map(r => r.id);

            // Get quotations for these requests with laboratory info
            const { data: quotationsData, error: quotationsError } = await supabase
                .from('quotations')
                .select(`
          *,
          laboratory:profiles!quotations_laboratory_id_fkey(*)
        `)
                .in('exam_request_id', requestIds)
                .eq('status', 'pending');

            if (quotationsError) throw quotationsError;

            // Calculate distance for each quotation
            const quotationsWithDistance = (quotationsData || []).map((q) => {
                const typedQuotation = q as unknown as QuotationWithLaboratory;
                const lab = typedQuotation.laboratory;
                let distance_km: number | null = null;

                if (
                    profile.latitude && profile.longitude &&
                    lab?.latitude && lab?.longitude
                ) {
                    // Simple distance calculation (would use database function in production)
                    const R = 6371; // Earth radius in km
                    const dLat = ((lab.latitude - profile.latitude) * Math.PI) / 180;
                    const dLon = ((lab.longitude - profile.longitude) * Math.PI) / 180;
                    const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos((profile.latitude * Math.PI) / 180) *
                        Math.cos((lab.latitude * Math.PI) / 180) *
                        Math.sin(dLon / 2) *
                        Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    distance_km = R * c;
                }

                return {
                    ...typedQuotation,
                    distance_km,
                };
            });

            setQuotations(quotationsWithDistance);
        } catch (error) {
            console.error('Error loading quotations:', error);
            toast.error('Erro ao carregar orçamentos');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadQuotations();
        }
    }, [user, loadQuotations]);

    const filteredQuotations = quotations
        .filter(q => {
            const priceOk = q.total_price >= priceRange[0] && q.total_price <= priceRange[1];
            const distanceOk = !q.distance_km || q.distance_km <= maxDistance;
            const ratingOk = (q.laboratory?.average_rating || 0) >= minRating;
            return priceOk && distanceOk && ratingOk;
        })
        .sort((a, b) => {
            if (sortBy === 'price') return a.total_price - b.total_price;
            if (sortBy === 'distance') return (a.distance_km || 999) - (b.distance_km || 999);
            if (sortBy === 'rating') return (b.laboratory?.average_rating || 0) - (a.laboratory?.average_rating || 0);
            return 0;
        });

    const handleAcceptQuotation = (quotationId: string) => {
        navigate(`/patient/schedule-appointment?quotationId=${quotationId}`);
    };

    if (isLoading) {
        return (
            <div className="container max-w-6xl mx-auto p-4">
                <p>Carregando orçamentos...</p>
            </div>
        );
    }

    return (
        <div className="container max-w-6xl mx-auto p-4 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Orçamentos Recebidos</h1>
                    <p className="text-muted-foreground">Compare e escolha a melhor opção</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters Sidebar */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Filtros</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Price Range */}
                        <div className="space-y-3">
                            <Label>Faixa de Preço</Label>
                            <Slider
                                value={priceRange}
                                onValueChange={setPriceRange}
                                max={10000}
                                min={0}
                                step={50}
                                className="w-full"
                            />
                            <p className="text-sm text-muted-foreground">
                                R$ {priceRange[0]} - R$ {priceRange[1]}
                            </p>
                        </div>

                        {/* Distance */}
                        <div className="space-y-3">
                            <Label>Distância Máxima</Label>
                            <Slider
                                value={[maxDistance]}
                                onValueChange={(v) => setMaxDistance(v[0])}
                                max={100}
                                min={5}
                                step={5}
                                className="w-full"
                            />
                            <p className="text-sm text-muted-foreground">Até {maxDistance} km</p>
                        </div>

                        {/* Rating */}
                        <div className="space-y-3">
                            <Label>Avaliação Mínima</Label>
                            <Slider
                                value={[minRating]}
                                onValueChange={(v) => setMinRating(v[0])}
                                max={5}
                                min={0}
                                step={0.5}
                                className="w-full"
                            />
                            <p className="text-sm text-muted-foreground">
                                {minRating} {minRating === 1 ? 'estrela' : 'estrelas'}
                            </p>
                        </div>

                        {/* Sort By */}
                        <div className="space-y-2">
                            <Label>Ordenar Por</Label>
                            <Select value={sortBy} onValueChange={(v: 'price' | 'distance' | 'rating') => setSortBy(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="price">Menor Preço</SelectItem>
                                    <SelectItem value="distance">Distância</SelectItem>
                                    <SelectItem value="rating">Avaliação</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Quotations List */}
                <div className="lg:col-span-3 space-y-4">
                    {filteredQuotations.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-muted-foreground">
                                    Nenhum orçamento encontrado com os filtros selecionados
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredQuotations.map((quotation) => (
                            <Card key={quotation.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle>{quotation.laboratory?.laboratory_name}</CardTitle>
                                            <CardDescription className="flex items-center gap-4 mt-1">
                                                {quotation.distance_km && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {quotation.distance_km.toFixed(1)} km
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Star className="h-3 w-3 fill-current" />
                                                    {quotation.laboratory?.average_rating?.toFixed(1) || 'N/A'}
                                                </span>
                                            </CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-primary">
                                                R$ {quotation.total_price.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <Clock className="h-3 w-3" />
                                                {quotation.estimated_delivery_days} dias
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Exam Items */}
                                    <div className="space-y-2">
                                        <Label className="text-sm">Exames Incluídos:</Label>
                                        <div className="space-y-1">
                                            {(quotation.items as unknown as QuotationItem[]).map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span>{item.exam_name}</span>
                                                    <span className="text-muted-foreground">
                                                        R$ {item.price.toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {quotation.notes && (
                                        <div className="text-sm text-muted-foreground border-l-2 pl-3">
                                            {quotation.notes}
                                        </div>
                                    )}

                                    {/* Valid Until */}
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        Válido até {new Date(quotation.valid_until).toLocaleDateString('pt-BR')}
                                    </div>

                                    {/* Accept Button */}
                                    <Button
                                        onClick={() => handleAcceptQuotation(quotation.id)}
                                        className="w-full"
                                    >
                                        Aceitar e Agendar Coleta
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
