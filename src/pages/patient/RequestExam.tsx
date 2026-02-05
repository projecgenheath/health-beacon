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
import { Upload, FileText, Loader2, CheckCircle2, MapPin, Star, DollarSign, Clock, FileUp, ListPlus, X, Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LocationPicker } from '@/components/common/LocationPicker';
import { ExamTypeSelector } from '@/components/exams/ExamTypeSelector';
import type { QuotationWithLaboratory, ExamRequest, Profile, QuotationItem } from '@/types/marketplace';
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

    const [patientProfile, setPatientProfile] = useState<Profile | null>(null);

    useEffect(() => {
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
                        const typedData = data as unknown as QuotationWithLaboratory;
                        setQuotations((prev) => [...prev, typedData]);
                        toast.success(`Novo orçamento de ${typedData.laboratory.laboratory_name}!`);
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [examRequest?.id]);


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

        } catch (error: unknown) {
            console.error('Error uploading and analyzing:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pedido';
            toast.error(errorMessage);
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
                    urgency_level: urgency as string,
                    status: 'pending',
                    document_url: documentUrl,
                })
                .select()
                .single();

            if (requestError) throw requestError;

            setExamRequest(requestData);
            toast.success('Pedido enviado! Aguardando orçamentos...');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao criar pedido';
            toast.error(errorMessage);
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
        <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
                    <X className="h-6 w-6" /> {/* Should be ArrowLeft based on image, but using X or ArrowLeft is fine */}
                </Button>
                <h1 className="text-xl font-bold flex-1 text-center pr-10">Nova Solicitação</h1>
            </div>

            {/* Upload Card */}
            {!examRequest && (
                <>
                    <div className="relative border-2 border-dashed border-slate-700 bg-slate-800/50 rounded-3xl p-8 text-center space-y-4 hover:bg-slate-800/80 transition-colors">
                        <div className="mx-auto w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                            <Upload className="h-8 w-8 text-sky-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Upload da Receita</h3>
                        <p className="text-sm text-slate-400 max-w-[200px] mx-auto">
                            Arraste seu arquivo aqui ou toque para abrir a câmera (PDF, JPG, PNG)
                        </p>

                        <div className="pt-4">
                            <Label htmlFor="file-upload" className="cursor-pointer">
                                <span className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-sky-500/20 block">
                                    Selecionar Arquivo
                                </span>
                                <Input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    disabled={isUploading || isAnalyzing}
                                />
                            </Label>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 justify-center text-xs text-emerald-500/80">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Seus dados de saúde estão criptografados e seguros</span>
                    </div>

                    <div className="text-center">
                        <Button
                            variant="link"
                            className="text-sky-500 font-medium"
                            onClick={() => setRequestMode('manual')}
                        >
                            Não tenho o arquivo? Digite manualmente
                        </Button>
                    </div>

                    {/* Analysis Success Card */}
                    {extractedExams.length > 0 && (
                        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2 text-white font-bold">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
                                    <span>Análise concluída com sucesso</span>
                                </div>
                                <span className="text-xs font-bold text-slate-400">100%</span>
                            </div>
                            <Progress value={100} className="h-1.5 bg-slate-700 text-emerald-500" />
                            <p className="text-xs text-slate-400 mt-2">{extractedExams.length} exames identificados na receita médica.</p>
                        </div>
                    )}

                    {/* Identified Items */}
                    {(extractedExams.length > 0 || manualExams.length > 0) && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">Itens Identificados</h3>
                                <Button variant="link" className="text-sky-500 text-sm h-auto p-0">Editar Lista</Button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {[...extractedExams, ...manualExams].map((exam, idx) => (
                                    <div key={idx} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors text-sm font-medium border border-slate-700">
                                        <span>{exam}</span>
                                        <button className="text-slate-500 hover:text-white">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                <Button variant="outline" className="rounded-xl border-dashed border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800">
                                    + ADICIONAR
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Urgency Level */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-white">Nível de Urgência</h3>
                            <p className="text-sm text-slate-400">Quando você precisa dos resultados?</p>
                        </div>

                        <div className="space-y-3">
                            <div
                                className={cn("p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all",
                                    urgency === 'normal' ? "bg-slate-800 border-sky-500 ring-1 ring-sky-500" : "bg-slate-800/50 border-slate-700 hover:bg-slate-800")}
                                onClick={() => setUrgency('normal')}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", urgency === 'normal' ? "border-sky-500" : "border-slate-500")}>
                                        {urgency === 'normal' && <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-white">Normal</div>
                                        <div className="text-xs text-slate-400">Até 7 dias úteis</div>
                                    </div>
                                </div>
                                <Calendar className="h-5 w-5 text-sky-500" />
                            </div>

                            <div
                                className={cn("p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all",
                                    urgency === 'urgent' ? "bg-slate-800 border-sky-500 ring-1 ring-sky-500" : "bg-slate-800/50 border-slate-700 hover:bg-slate-800")}
                                onClick={() => setUrgency('urgent')}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", urgency === 'urgent' ? "border-sky-500" : "border-slate-500")}>
                                        {urgency === 'urgent' && <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-white">Urgente</div>
                                        <div className="text-xs text-slate-400">Resultado em 48h</div>
                                    </div>
                                </div>
                                <Clock className="h-5 w-5 text-slate-400" />
                            </div>

                            <div
                                className={cn("p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all",
                                    urgency === 'emergency' ? "bg-slate-800 border-sky-500 ring-1 ring-sky-500" : "bg-slate-800/50 border-slate-700 hover:bg-slate-800")}
                                onClick={() => setUrgency('emergency')}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", urgency === 'emergency' ? "border-sky-500" : "border-slate-500")}>
                                        {urgency === 'emergency' && <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-white">Emergência</div>
                                        <div className="text-xs text-slate-400">Necessidade imediata (Hoje)</div>
                                    </div>
                                </div>
                                <AlertTriangle className="h-5 w-5 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Bottom Button */}
            {!examRequest && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800">
                    <div className="max-w-md mx-auto">
                        <Button
                            onClick={requestMode === 'upload' ? handleUploadAndAnalyze : handleManualSubmit}
                            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold h-14 rounded-2xl shadow-lg shadow-sky-500/20 text-lg"
                            disabled={!file && requestMode === 'upload' || (requestMode === 'manual' && manualExams.length === 0)}
                        >
                            Solicitar Orçamentos
                            <FileUp className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            )}


            {/* Quotations Section (Image 3) */}
            {examRequest && (
                <div className="space-y-6">
                    <Card className="bg-slate-800 border-slate-700 text-white">
                        <CardHeader>
                            <CardTitle>Orçamentos Recebidos</CardTitle>
                            <CardDescription className="text-slate-400">
                                {quotations.length === 0
                                    ? 'Aguardando orçamentos dos laboratórios...'
                                    : `${quotations.length} orçamento(s) recebido(s)`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {quotations.length === 0 ? (
                                <div className="text-center py-12">
                                    <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-sky-500" />
                                    <p className="text-slate-400">
                                        Aguardando laboratórios...
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {quotations.map((quotation) => (
                                        <Card key={quotation.id} className="bg-slate-700/50 border-slate-600 overflow-hidden">
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-lg text-white">{quotation.laboratory.laboratory_name}</h4>
                                                        <div className="flex items-center gap-2 text-xs text-slate-300">
                                                            <div className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> 4.8</div>
                                                            <span>•</span>
                                                            <div>2.1 km</div>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-none">Melhor Preço</Badge>
                                                </div>

                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <div className="text-xs text-slate-400">Total do orçamento</div>
                                                        <div className="text-2xl font-bold text-sky-500">R$ {quotation.total_price.toFixed(2)}</div>
                                                    </div>
                                                    <Button
                                                        onClick={() => handleAcceptQuotation(quotation.id)}
                                                        className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl"
                                                    >
                                                        Agendar
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );

}
