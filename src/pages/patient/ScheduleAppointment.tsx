import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, Building2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Quotation, Profile } from '@/types/marketplace';

interface QuotationWithLaboratory extends Quotation {
    laboratory: Profile;
}

export default function ScheduleAppointment() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const quotationId = searchParams.get('quotationId');

    const [quotation, setQuotation] = useState<QuotationWithLaboratory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [collectionType, setCollectionType] = useState<'in_lab' | 'home'>('in_lab');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState('');
    const [homeAddress, setHomeAddress] = useState('');
    const [notes, setNotes] = useState('');

    const loadQuotation = useCallback(async () => {
        if (!quotationId) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('quotations')
                .select('*, laboratory:profiles!quotations_laboratory_id_fkey(*)')
                .eq('id', quotationId)
                .single();

            if (error) throw error;
            setQuotation(data as unknown as QuotationWithLaboratory);
        } catch (error) {
            console.error('Error loading quotation:', error);
            toast.error('Erro ao carregar orçamento');
            navigate('/patient/quotations');
        } finally {
            setIsLoading(false);
        }
    }, [quotationId, navigate]);

    const loadPatientAddress = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                const fullAddress = [
                    data.address_street,
                    data.address_number,
                    data.address_complement,
                    data.address_neighborhood,
                    data.address_city,
                    data.address_state,
                    data.address_zip,
                ]
                    .filter(Boolean)
                    .join(', ');

                setHomeAddress(fullAddress);
            }
        } catch (error) {
            console.error('Error loading address:', error);
        }
    }, [user]);

    useEffect(() => {
        if (quotationId && user) {
            loadQuotation();
            loadPatientAddress();
        }
    }, [quotationId, user, loadQuotation, loadPatientAddress]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!quotation || !selectedDate || !selectedTime) {
            toast.error('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        if (collectionType === 'home' && !homeAddress.trim()) {
            toast.error('Por favor, informe o endereço para coleta domiciliar');
            return;
        }

        setIsSubmitting(true);
        try {
            // Get patient profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user!.id)
                .single();

            if (profileError) throw profileError;

            // Create appointment
            const { error } = await supabase.from('collection_appointments').insert({
                quotation_id: quotation.id,
                patient_id: profile.id,
                laboratory_id: quotation.laboratory_id,
                scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
                scheduled_time: selectedTime,
                collection_type: collectionType,
                home_address: collectionType === 'home' ? homeAddress : null,
                notes,
                status: 'scheduled',
            });

            if (error) throw error;

            // Update quotation status to accepted
            const { error: quotationError } = await supabase
                .from('quotations')
                .update({ status: 'accepted' })
                .eq('id', quotation.id);

            if (quotationError) throw quotationError;

            // Update exam request status
            const { error: requestError } = await supabase
                .from('exam_requests')
                .update({
                    status: 'accepted',
                    selected_quotation_id: quotation.id
                })
                .eq('id', quotation.exam_request_id);

            if (requestError) throw requestError;

            toast.success('Agendamento realizado com sucesso!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Error creating appointment:', error);
            toast.error('Erro ao criar agendamento');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container max-w-2xl mx-auto p-4">
                <p>Carregando...</p>
            </div>
        );
    }

    if (!quotation) {
        return (
            <div className="container max-w-2xl mx-auto p-4">
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">Orçamento não encontrado</p>
                        <Button className="mt-4" onClick={() => navigate('/patient/quotations')}>
                            Voltar para Orçamentos
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const timeSlots = [
        '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
        '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30', '18:00'
    ];

    return (
        <div className="container max-w-2xl mx-auto p-4 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Agendar Coleta</h1>
                <p className="text-muted-foreground">
                    Complete o agendamento da sua coleta de exames
                </p>
            </div>

            {/* Quotation Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {quotation.laboratory.laboratory_name}
                    </CardTitle>
                    <CardDescription>
                        Total: R$ {quotation.total_price.toFixed(2)}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        {(quotation.items as unknown as Array<{ exam_name: string; price: number }>).map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span>{item.exam_name}</span>
                                <span className="text-muted-foreground">R$ {item.price.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Appointment Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Collection Type */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tipo de Coleta</CardTitle>
                        <CardDescription>
                            Escolha onde deseja realizar a coleta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup value={collectionType} onValueChange={(value: 'in_lab' | 'home') => setCollectionType(value)}>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                                <RadioGroupItem value="in_lab" id="in_lab" />
                                <Label htmlFor="in_lab" className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        <div>
                                            <p className="font-medium">No Laboratório</p>
                                            <p className="text-sm text-muted-foreground">Vá até o laboratório</p>
                                        </div>
                                    </div>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                                <RadioGroupItem value="home" id="home" />
                                <Label htmlFor="home" className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <div>
                                            <p className="font-medium">Coleta Domiciliar</p>
                                            <p className="text-sm text-muted-foreground">
                                                Profissional vai até você
                                            </p>
                                        </div>
                                    </div>
                                </Label>
                            </div>
                        </RadioGroup>
                    </CardContent>
                </Card>

                {/* Home Address if needed */}
                {collectionType === 'home' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Endereço para Coleta</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Digite o endereço completo..."
                                value={homeAddress}
                                onChange={(e) => setHomeAddress(e.target.value)}
                                rows={3}
                                required
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Date Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Data da Coleta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !selectedDate && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? (
                                        format(selectedDate, "PPP", { locale: ptBR })
                                    ) : (
                                        <span>Selecione uma data</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    disabled={(date) => date < new Date() || date < new Date(Date.now() - 86400000)}
                                    initialFocus
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                    </CardContent>
                </Card>

                {/* Time Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Horário</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-2">
                            {timeSlots.map((time) => (
                                <Button
                                    key={time}
                                    type="button"
                                    variant={selectedTime === time ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedTime(time)}
                                    className="w-full"
                                >
                                    <Clock className="h-3 w-3 mr-1" />
                                    {time}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Observações (opcional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Alguma informação adicional..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </CardContent>
                </Card>

                {/* Submit Buttons */}
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/patient/quotations')}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                        {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
