import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Loader2, CheckCircle2, MapPin, Star, DollarSign, Clock, FileUp, ListPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { LocationPicker } from '@/components/LocationPicker';
import { ExamTypeSelector } from '@/components/ExamTypeSelector';
import type { QuotationWithLaboratory, ExamRequest } from '@/types/marketplace';
import { useNavigate } from 'react-router-dom';

export default function RequestExamWithQuotes() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [requestMode, setRequestMode] = useState<'upload' | 'manual'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'emergency'>('normal');
    const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [extractedExams, setExtractedExams] = useState<string[]>([]);
    const [manualExams, setManualExams] = useState<string[]>([]);
    const [examRequest, setExamRequest] = useState<ExamRequest | null>(null);
    const [quotations, setQuotations] = useState<QuotationWithLaboratory[]>([]);

    const [patientProfile, setPatientProfile] = useState<any>(null);

    useEffect(() => {
        if (user) {
            loadPatientProfile();
        }
    }, [user]);

    // Real-time subscription to quotations for this request
    useEffect(() => {
        if (!examRequest) return;

        const subscription = supabase
            .channel('quotations_channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'quotations',
                    filter: `exam_request_id=eq.${examRequest.id}`,
                },
                async (payload) => {
                    console.log('New quotation received:', payload);
                    // Load the full quotation with laboratory info
                    const { data } = await supabase
                        .from('quotations')
                        .select('*, laboratory:profiles!quotations_laboratory_id_fkey(*)')
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        setQuotations((prev) => [...prev, data as any]);
                        toast.success(`Novo orçamento de ${(data as any).laboratory.laboratory_name}!`);
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [examRequest]);

    const loadPatientProfile = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;
            setPatientProfile(data);

            // Pre-fill location if available
            if (data.latitude && data.longitude) {
                const address = [
                    data.address_street,
                    data.address_number,
                    data.address_city,
                    data.address_state,
                ]
                    .filter(Boolean)
                    .join(', ');

                setLocation({
                    lat: data.latitude,
                    lng: data.longitude,
                    address: address || 'Localização atual',
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadAndAnalyze = async () => {
        if (!file || !user || !patientProfile) {
            toast.error('Por favor, selecione um arquivo');
            return;
        }

        setIsUploading(true);
        setIsAnalyzing(true);

        try {
            // Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('exam-requests')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            setIsUploading(false);

            // Call Edge Function to analyze the medical request
            const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
                'analyze-medical-request',
                {
                    body: { filePath: uploadData.path },
                }
            );

            if (analysisError) throw analysisError;

            const exams = analysisData.exams || [];
            setExtractedExams(exams);
            setIsAnalyzing(false);

            if (exams.length === 0) {
                toast.error('Não foi possível extrair exames do pedido médico');
                return;
            }

            toast.success(`${exams.length} exames identificados!`);

            // Create exam request
            await createExamRequest(exams, uploadData.path);

        } catch (error: any) {
            console.error('Error uploading and analyzing:', error);
            toast.error(error.message || 'Erro ao processar pedido');
            setIsUploading(false);
            setIsAnalyzing(false);
        }
    };

    const handleManualSubmit = async () => {
        if (!user || !patientProfile || manualExams.length === 0) {
            toast.error('Por favor, adicione pelo menos um exame');
            return;
        }

        await createExamRequest(manualExams, null);
    };

    const createExamRequest = async (exams: string[], documentUrl: string | null) => {
        try {
            const { data: requestData, error: requestError } = await supabase
                .from('exam_requests')
                .insert({
                    patient_id: patientProfile.id,
                    exam_types: exams,
                    description,
                    urgency_level: urgency,
                    status: 'pending',
                    document_url: documentUrl,
                })
                .select()
                .single();

            if (requestError) throw requestError;

            setExamRequest(requestData);
            toast.success('Pedido enviado! Aguardando orçamentos...');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao criar pedido');
            throw error;
        }
    };

    const handleAcceptQuotation = (quotationId: string) => {
        navigate(`/patient/schedule-appointment?quotationId=${quotationId}`);
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    return (
        <div className="container max-w-6xl mx-auto p-4 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Solicitar Orçamento de Exames</h1>
                <p className="text-muted-foreground">
                    Faça upload do seu pedido médico ou selecione os exames manualmente
                </p>
            </div>

            {/* Request Form */}
            {!examRequest && (
                <Card>
                    <CardHeader>
                        <CardTitle>Novo Pedido de Exames</CardTitle>
                        <CardDescription>
                            Escolha como deseja solicitar seus exames
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={requestMode} onValueChange={(v) => setRequestMode(v as 'upload' | 'manual')}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="upload" className="flex items-center gap-2">
                                    <FileUp className="h-4 w-4" />
                                    Upload de Pedido
                                </TabsTrigger>
                                <TabsTrigger value="manual" className="flex items-center gap-2">
                                    <ListPlus className="h-4 w-4" />
                                    Seleção Manual
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="upload" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="file-upload">Pedido Médico (PDF ou Imagem)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="file-upload"
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={handleFileChange}
                                            disabled={isUploading || isAnalyzing}
                                        />
                                        {file && (
                                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        A IA Gemma 3 27B vai analisar e extrair os exames automaticamente
                                    </p>
                                </div>

                                {extractedExams.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Exames Extraídos ({extractedExams.length})</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {extractedExams.map((exam, idx) => (
                                                <Badge key={idx} variant="secondary">
                                                    {exam}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="description">Observações (Opcional)</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Informações adicionais sobre o pedido"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Urgência</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={urgency === 'normal' ? 'default' : 'outline'}
                                            onClick={() => setUrgency('normal')}
                                        >
                                            Normal
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={urgency === 'urgent' ? 'default' : 'outline'}
                                            onClick={() => setUrgency('urgent')}
                                        >
                                            Urgente
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={urgency === 'emergency' ? 'destructive' : 'outline'}
                                            onClick={() => setUrgency('emergency')}
                                        >
                                            Emergência
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleUploadAndAnalyze}
                                    className="w-full"
                                    disabled={!file || isUploading || isAnalyzing}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Fazendo upload...
                                        </>
                                    ) : isAnalyzing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Analisando com IA...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Enviar e Analisar
                                        </>
                                    )}
                                </Button>
                            </TabsContent>

                            <TabsContent value="manual" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Selecione os Exames</Label>
                                    <ExamTypeSelector
                                        value={manualExams}
                                        onChange={setManualExams}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description-manual">Observações (Opcional)</Label>
                                    <Textarea
                                        id="description-manual"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Informações adicionais sobre o pedido"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Urgência</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={urgency === 'normal' ? 'default' : 'outline'}
                                            onClick={() => setUrgency('normal')}
                                        >
                                            Normal
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={urgency === 'urgent' ? 'default' : 'outline'}
                                            onClick={() => setUrgency('urgent')}
                                        >
                                            Urgente
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={urgency === 'emergency' ? 'destructive' : 'outline'}
                                            onClick={() => setUrgency('emergency')}
                                        >
                                            Emergência
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleManualSubmit}
                                    className="w-full"
                                    disabled={manualExams.length === 0}
                                >
                                    <ListPlus className="mr-2 h-4 w-4" />
                                    Solicitar Orçamentos ({manualExams.length} exames)
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}

            {/* Quotations Section */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Orçamentos Recebidos</CardTitle>
                        <CardDescription>
                            {quotations.length === 0
                                ? 'Aguardando orçamentos dos laboratórios...'
                                : `${quotations.length} orçamento(s) recebido(s)`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!examRequest ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Envie seu pedido médico para receber orçamentos</p>
                            </div>
                        ) : quotations.length === 0 ? (
                            <div className="text-center py-12">
                                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                                <p className="text-muted-foreground">
                                    Aguardando laboratórios enviarem orçamentos...
                                </p>
                                <Progress value={33} className="mt-4" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {quotations
                                    .sort((a, b) => a.total_price - b.total_price)
                                    .map((quotation) => {
                                        const distance =
                                            location && quotation.laboratory.latitude && quotation.laboratory.longitude
                                                ? calculateDistance(
                                                    location.lat,
                                                    location.lng,
                                                    quotation.laboratory.latitude,
                                                    quotation.laboratory.longitude
                                                )
                                                : null;

                                        return (
                                            <Card key={quotation.id} className="overflow-hidden">
                                                <CardHeader className="pb-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-lg">
                                                                {quotation.laboratory.laboratory_name}
                                                            </CardTitle>
                                                            <CardDescription className="flex items-center gap-3 mt-1">
                                                                {distance && (
                                                                    <span className="flex items-center gap-1">
                                                                        <MapPin className="h-3 w-3" />
                                                                        {distance.toFixed(1)} km
                                                                    </span>
                                                                )}
                                                                <span className="flex items-center gap-1">
                                                                    <Star className="h-3 w-3 fill-current" />
                                                                    {quotation.laboratory.average_rating?.toFixed(1) || 'N/A'}
                                                                </span>
                                                            </CardDescription>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-2xl font-bold text-primary">
                                                                R$ {quotation.total_price.toFixed(2)}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                                                <Clock className="h-3 w-3" />
                                                                {quotation.estimated_delivery_days} dias
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    <div className="space-y-1">
                                                        {(quotation.items as any[]).map((item, idx) => (
                                                            <div key={idx} className="flex justify-between text-sm">
                                                                <span>{item.exam_name}</span>
                                                                <span className="text-muted-foreground">
                                                                    R$ {item.price.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {quotation.notes && (
                                                        <p className="text-sm text-muted-foreground border-l-2 pl-3">
                                                            {quotation.notes}
                                                        </p>
                                                    )}

                                                    <Button
                                                        onClick={() => handleAcceptQuotation(quotation.id)}
                                                        className="w-full"
                                                    >
                                                        <DollarSign className="mr-2 h-4 w-4" />
                                                        Aceitar e Agendar
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
