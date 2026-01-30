import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
    Mail, Lock, User, MapPin, Phone, Heart,
    ArrowRight, ArrowLeft, Check, Sparkles,
    Calendar, Shield, FileText, Scale, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import logoImg from '@/assets/logo.svg';
import { TermsOfService, PrivacyPolicy, DataSharingConsent } from '@/components/legal';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

interface FormData {
    // User type
    user_type: 'patient' | 'laboratory';
    // Account
    email: string;
    password: string;
    confirmPassword: string;
    // Personal
    full_name: string;
    birth_date: string;
    cpf: string;
    sex: string;
    gender: string;
    ethnicity: string;
    marital_status: string;
    // Laboratory
    laboratory_name: string;
    cnpj: string;
    // Address
    address_country: string;
    address_state: string;
    address_city: string;
    address_neighborhood: string;
    address_street: string;
    address_number: string;
    address_complement: string;
    // Contact
    phone: string;
    emergency_phone: string;
    // Medical
    weight: string;
    height: string;
    allergies: string;
    chronic_diseases: string;
    // Terms acceptance
    acceptTermsOfService: boolean;
    acceptPrivacyPolicy: boolean;
    acceptDataSharing: boolean;
    acceptAILimitations: boolean;
}

const STEPS = [
    { id: 1, title: 'Conta', icon: Mail, description: 'Credenciais de acesso' },
    { id: 2, title: 'Pessoal', icon: User, description: 'Suas informações' },
    { id: 3, title: 'Endereço', icon: MapPin, description: 'Onde você mora' },
    { id: 4, title: 'Contato', icon: Phone, description: 'Como te encontrar' },
    { id: 5, title: 'Saúde', icon: Heart, description: 'Seu perfil médico' },
    { id: 6, title: 'Termos', icon: Scale, description: 'Aceite obrigatório' },
];

// CPF mask
const formatCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

// CNPJ mask
const formatCNPJ = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

// Phone mask
const formatPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

export const RegisterWizard = () => {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const [formData, setFormData] = useState<FormData>({
        user_type: 'patient',
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        birth_date: '',
        cpf: '',
        sex: '',
        gender: '',
        ethnicity: '',
        marital_status: '',
        laboratory_name: '',
        cnpj: '',
        address_country: 'Brasil',
        address_state: '',
        address_city: '',
        address_neighborhood: '',
        address_street: '',
        address_number: '',
        address_complement: '',
        phone: '',
        emergency_phone: '',
        weight: '',
        height: '',
        allergies: '',
        chronic_diseases: '',
        // Terms acceptance
        acceptTermsOfService: false,
        acceptPrivacyPolicy: false,
        acceptDataSharing: false,
        acceptAILimitations: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (field: keyof FormData, value: string) => {
        // Apply masks
        if (field === 'cpf') {
            value = formatCPF(value);
        } else if (field === 'cnpj') {
            value = formatCNPJ(value);
        } else if (field === 'phone' || field === 'emergency_phone') {
            value = formatPhone(value);
        }

        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 1:
                // Common validations
                if (!formData.email) {
                    newErrors.email = 'Email é obrigatório';
                } else {
                    try {
                        emailSchema.parse(formData.email);
                    } catch {
                        newErrors.email = 'Email inválido';
                    }
                }
                if (!formData.password) {
                    newErrors.password = 'Senha é obrigatória';
                } else if (formData.password.length < 6) {
                    newErrors.password = 'Mínimo 6 caracteres';
                }
                if (formData.password !== formData.confirmPassword) {
                    newErrors.confirmPassword = 'Senhas não coincidem';
                }

                // Patient-specific validations
                if (formData.user_type === 'patient') {
                    if (!formData.full_name) newErrors.full_name = 'Nome é obrigatório';
                    if (!formData.cpf) {
                        newErrors.cpf = 'CPF é obrigatório';
                    } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
                        newErrors.cpf = 'CPF deve ter 11 dígitos';
                    }
                    if (!formData.birth_date) {
                        newErrors.birth_date = 'Data de nascimento é obrigatória';
                    }
                }

                // Laboratory-specific validations
                if (formData.user_type === 'laboratory') {
                    if (!formData.laboratory_name) newErrors.laboratory_name = 'Nome do laboratório é obrigatório';
                    if (!formData.cnpj) {
                        newErrors.cnpj = 'CNPJ é obrigatório';
                    } else if (formData.cnpj.replace(/\D/g, '').length !== 14) {
                        newErrors.cnpj = 'CNPJ deve ter 14 dígitos';
                    }
                }
                break;
            case 6:
                if (!formData.acceptTermsOfService) {
                    newErrors.acceptTermsOfService = 'Você deve aceitar os Termos de Uso';
                }
                if (!formData.acceptPrivacyPolicy) {
                    newErrors.acceptPrivacyPolicy = 'Você deve aceitar a Política de Privacidade';
                }
                if (!formData.acceptDataSharing) {
                    newErrors.acceptDataSharing = 'Você deve aceitar o Termo de Consentimento';
                }
                if (!formData.acceptAILimitations) {
                    newErrors.acceptAILimitations = 'Você deve reconhecer as limitações da IA';
                }
                break;
            // Other steps are optional, no required validation
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            if (!completedSteps.includes(currentStep)) {
                setCompletedSteps(prev => [...prev, currentStep]);
            }
            if (currentStep < STEPS.length) {
                setDirection('forward');
                setCurrentStep(prev => prev + 1);
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setDirection('backward');
            setCurrentStep(prev => prev - 1);
        }
    };

    const goToStep = (step: number) => {
        if (step < currentStep || completedSteps.includes(step - 1) || step === 1) {
            setDirection(step > currentStep ? 'forward' : 'backward');
            setCurrentStep(step);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setIsSubmitting(true);

        // Check if CPF is available before creating account (patient only)
        if (formData.user_type === 'patient' && formData.cpf) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: cpfCheck, error: cpfError } = await (supabase as any)
                    .rpc('check_cpf_available', { p_cpf: formData.cpf });

                if (cpfError) {
                    console.error('CPF check error:', cpfError);
                } else if (cpfCheck && !cpfCheck.available) {
                    toast.error(cpfCheck.message || 'Este CPF já está cadastrado no sistema');
                    setIsSubmitting(false);
                    // Go back to step 1 to fix the CPF
                    setCurrentStep(1);
                    setErrors(prev => ({ ...prev, cpf: cpfCheck.message || 'CPF já cadastrado' }));
                    return;
                }
            } catch (err) {
                console.error('Error checking CPF:', err);
                // Continue with registration if check fails (it will be caught by DB constraint)
            }
        }

        // Use laboratory_name for laboratories, full_name for patients
        const displayName = formData.user_type === 'laboratory' ? formData.laboratory_name : formData.full_name;
        const { data, error: signUpError } = await signUp(formData.email, formData.password, displayName);

        if (signUpError) {
            setIsSubmitting(false);
            if (signUpError.message.includes('already registered')) {
                toast.error('Este email já está cadastrado');
            } else {
                toast.error('Erro ao criar conta: ' + signUpError.message);
            }
            return;
        }

        if (data?.user) {
            try {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        user_id: data.user.id,
                        user_type: formData.user_type,
                        // Common fields
                        full_name: formData.user_type === 'laboratory' ? formData.laboratory_name : formData.full_name,
                        birth_date: formData.user_type === 'patient' ? (formData.birth_date || null) : null,
                        cpf: formData.user_type === 'patient' ? (formData.cpf.replace(/\D/g, '') || null) : null,
                        sex: formData.sex || null,
                        gender: formData.gender || null,
                        ethnicity: formData.ethnicity || null,
                        marital_status: formData.marital_status || null,
                        // Laboratory-specific fields
                        laboratory_name: formData.user_type === 'laboratory' ? formData.laboratory_name : null,
                        cnpj: formData.user_type === 'laboratory' ? (formData.cnpj.replace(/\D/g, '') || null) : null,
                        // Address
                        address_country: formData.address_country || null,
                        address_state: formData.address_state || null,
                        address_city: formData.address_city || null,
                        address_neighborhood: formData.address_neighborhood || null,
                        address_street: formData.address_street || null,
                        address_number: formData.address_number || null,
                        address_complement: formData.address_complement || null,
                        // Contact
                        phone: formData.phone.replace(/\D/g, '') || null,
                        emergency_phone: formData.emergency_phone.replace(/\D/g, '') || null,
                        // Medical (patient only)
                        weight: formData.user_type === 'patient' ? (formData.weight ? parseFloat(formData.weight) : null) : null,
                        height: formData.user_type === 'patient' ? (formData.height ? parseFloat(formData.height) : null) : null,
                        allergies: formData.user_type === 'patient' ? (formData.allergies || null) : null,
                        chronic_diseases: formData.user_type === 'patient' ? (formData.chronic_diseases || null) : null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', data.user.id);

                if (profileError) {
                    console.error('Profile update error:', profileError);
                    toast.warning(`Conta criada, mas houve erro ao salvar dados do perfil: ${profileError.message}`);
                } else {
                    toast.success('Conta criada com sucesso! 🎉');
                }

                // Redirect based on user type
                if (formData.user_type === 'laboratory') {
                    navigate('/laboratory/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } catch (err) {
                console.error('Unexpected error updating profile:', err);
                toast.success('Conta criada com sucesso!');
                // Redirect based on user type even on error
                if (formData.user_type === 'laboratory') {
                    navigate('/laboratory/dashboard');
                } else {
                    navigate('/dashboard');
                }
            }
        }

        setIsSubmitting(false);
    };

    const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    {STEPS.map((step, index) => {
                        const StepIcon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = completedSteps.includes(step.id);
                        const isClickable = step.id < currentStep || completedSteps.includes(step.id - 1) || step.id === 1;

                        return (
                            <button
                                key={step.id}
                                onClick={() => goToStep(step.id)}
                                disabled={!isClickable}
                                className={cn(
                                    "flex flex-col items-center gap-2 transition-all duration-300 group relative",
                                    isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                                        "border-2 shadow-lg",
                                        isActive && "bg-primary border-primary text-primary-foreground scale-110 shadow-glow-primary",
                                        isCompleted && !isActive && "bg-status-healthy border-status-healthy text-white",
                                        !isActive && !isCompleted && "bg-secondary/50 border-border text-muted-foreground",
                                        isClickable && !isActive && "hover:scale-105 hover:border-primary/50"
                                    )}
                                >
                                    {isCompleted && !isActive ? (
                                        <Check className="h-5 w-5 animate-scale-in" />
                                    ) : (
                                        <StepIcon className="h-5 w-5" />
                                    )}
                                </div>
                                <div className="text-center hidden sm:block">
                                    <p className={cn(
                                        "text-xs font-medium transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {step.title}
                                    </p>
                                </div>

                                {/* Connector line */}
                                {index < STEPS.length - 1 && (
                                    <div className="absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-0.5 bg-border -z-10">
                                        <div
                                            className="h-full bg-primary transition-all duration-500"
                                            style={{ width: isCompleted ? '100%' : '0%' }}
                                        />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Progress text */}
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        Etapa {currentStep} de {STEPS.length}: <span className="font-medium text-foreground">{STEPS[currentStep - 1].description}</span>
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card className="border-border/50 shadow-xl glass-effect overflow-hidden">
                <CardContent className="p-6">
                    <div
                        className={cn(
                            "transition-all duration-500 ease-out",
                            direction === 'forward' ? "animate-slide-up" : "animate-fade-in"
                        )}
                        key={currentStep}
                    >
                        {/* Step 1: Account */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                                        <Mail className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Dados da Conta</h3>
                                        <p className="text-sm text-muted-foreground">Informações para acessar sua conta</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* User Type Selection */}
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-primary" />
                                            Tipo de Cadastro *
                                        </Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange('user_type', 'patient')}
                                                className={cn(
                                                    "p-4 border-2 rounded-xl transition-all hover:scale-105",
                                                    formData.user_type === 'patient'
                                                        ? "border-primary bg-primary/10 shadow-glow-primary"
                                                        : "border-border hover:border-primary/50"
                                                )}
                                            >
                                                <Heart className="h-6 w-6 mx-auto mb-2 text-primary" />
                                                <p className="font-medium">Paciente</p>
                                                <p className="text-xs text-muted-foreground mt-1">Pessoa física</p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange('user_type', 'laboratory')}
                                                className={cn(
                                                    "p-4 border-2 rounded-xl transition-all hover:scale-105",
                                                    formData.user_type === 'laboratory'
                                                        ? "border-primary bg-primary/10 shadow-glow-primary"
                                                        : "border-border hover:border-primary/50"
                                                )}
                                            >
                                                <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                                                <p className="font-medium">Laboratório</p>
                                                <p className="text-xs text-muted-foreground mt-1">Pessoa jurídica</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Name field - conditional based on user type */}
                                    {formData.user_type === 'patient' ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="full_name" className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-primary" />
                                                Nome Completo *
                                            </Label>
                                            <Input
                                                id="full_name"
                                                value={formData.full_name}
                                                onChange={(e) => handleInputChange('full_name', e.target.value)}
                                                placeholder="João da Silva"
                                                className={cn(
                                                    "transition-all",
                                                    errors.full_name && "border-destructive focus:ring-destructive",
                                                    formData.full_name && !errors.full_name && "border-status-healthy"
                                                )}
                                            />
                                            {errors.full_name && (
                                                <p className="text-xs text-destructive animate-fade-in">{errors.full_name}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label htmlFor="laboratory_name" className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                Nome do Laboratório *
                                            </Label>
                                            <Input
                                                id="laboratory_name"
                                                value={formData.laboratory_name}
                                                onChange={(e) => handleInputChange('laboratory_name', e.target.value)}
                                                placeholder="Laboratório Saúde+"
                                                className={cn(
                                                    "transition-all",
                                                    errors.laboratory_name && "border-destructive focus:ring-destructive",
                                                    formData.laboratory_name && !errors.laboratory_name && "border-status-healthy"
                                                )}
                                            />
                                            {errors.laboratory_name && (
                                                <p className="text-xs text-destructive animate-fade-in">{errors.laboratory_name}</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-primary" />
                                            Email *
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            placeholder="seu@email.com"
                                            className={cn(
                                                "transition-all",
                                                errors.email && "border-destructive focus:ring-destructive",
                                                formData.email && !errors.email && "border-status-healthy"
                                            )}
                                        />
                                        {errors.email && (
                                            <p className="text-xs text-destructive animate-fade-in">{errors.email}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="flex items-center gap-2">
                                                <Lock className="h-4 w-4 text-primary" />
                                                Senha *
                                            </Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => handleInputChange('password', e.target.value)}
                                                placeholder="••••••••"
                                                className={cn(
                                                    "transition-all",
                                                    errors.password && "border-destructive focus:ring-destructive",
                                                    formData.password && formData.password.length >= 6 && !errors.password && "border-status-healthy"
                                                )}
                                            />
                                            {errors.password && (
                                                <p className="text-xs text-destructive animate-fade-in">{errors.password}</p>
                                            )}
                                            {formData.password && formData.password.length < 6 && !errors.password && (
                                                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-primary" />
                                                Confirmar Senha *
                                            </Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                                placeholder="••••••••"
                                                className={cn(
                                                    "transition-all",
                                                    errors.confirmPassword && "border-destructive focus:ring-destructive",
                                                    formData.confirmPassword && formData.password === formData.confirmPassword && "border-status-healthy"
                                                )}
                                            />
                                            {errors.confirmPassword && (
                                                <p className="text-xs text-destructive animate-fade-in">{errors.confirmPassword}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* CPF/CNPJ and Birth Date - Conditional fields */}
                                    {formData.user_type === 'patient' ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="cpf" className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                    CPF *
                                                </Label>
                                                <Input
                                                    id="cpf"
                                                    value={formData.cpf}
                                                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                                                    placeholder="000.000.000-00"
                                                    maxLength={14}
                                                    className={cn(
                                                        "transition-all",
                                                        errors.cpf && "border-destructive focus:ring-destructive",
                                                        formData.cpf.replace(/\D/g, '').length === 11 && !errors.cpf && "border-status-healthy"
                                                    )}
                                                />
                                                {errors.cpf && (
                                                    <p className="text-xs text-destructive animate-fade-in">{errors.cpf}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    O CPF é utilizado para identificação única e recuperação de conta
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="birth_date" className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                    Data de Nascimento *
                                                </Label>
                                                <Input
                                                    id="birth_date"
                                                    type="date"
                                                    value={formData.birth_date}
                                                    onChange={(e) => handleInputChange('birth_date', e.target.value)}
                                                    className={cn(
                                                        "transition-all",
                                                        errors.birth_date && "border-destructive focus:ring-destructive",
                                                        formData.birth_date && !errors.birth_date && "border-status-healthy"
                                                    )}
                                                />
                                                {errors.birth_date && (
                                                    <p className="text-xs text-destructive animate-fade-in">{errors.birth_date}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label htmlFor="cnpj" className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                CNPJ *
                                            </Label>
                                            <Input
                                                id="cnpj"
                                                value={formData.cnpj}
                                                onChange={(e) => handleInputChange('cnpj', e.target.value)}
                                                placeholder="00.000.000/0000-00"
                                                maxLength={18}
                                                className={cn(
                                                    "transition-all",
                                                    errors.cnpj && "border-destructive focus:ring-destructive",
                                                    formData.cnpj.replace(/\D/g, '').length === 14 && !errors.cnpj && "border-status-healthy"
                                                )}
                                            />
                                            {errors.cnpj && (
                                                <p className="text-xs text-destructive animate-fade-in">{errors.cnpj}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                O CNPJ é utilizado para identificação única do laboratório
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Personal Info */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                                        <User className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Informações Pessoais</h3>
                                        <p className="text-sm text-muted-foreground">Dados para seu perfil médico</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Sexo Biológico</Label>
                                        <Select onValueChange={(val) => handleInputChange('sex', val)} value={formData.sex}>
                                            <SelectTrigger className={cn(formData.sex && "border-status-healthy")}>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="M">Masculino</SelectItem>
                                                <SelectItem value="F">Feminino</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Identidade de Gênero</Label>
                                        <Select onValueChange={(val) => handleInputChange('gender', val)} value={formData.gender}>
                                            <SelectTrigger className={cn(formData.gender && "border-status-healthy")}>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cisgenero">Cisgênero</SelectItem>
                                                <SelectItem value="transgenero">Transgênero</SelectItem>
                                                <SelectItem value="nao_binario">Não-binário</SelectItem>
                                                <SelectItem value="outro">Outro</SelectItem>
                                                <SelectItem value="prefiro_nao_informar">Prefiro não informar</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Etnia/Cor</Label>
                                        <Select onValueChange={(val) => handleInputChange('ethnicity', val)} value={formData.ethnicity}>
                                            <SelectTrigger className={cn(formData.ethnicity && "border-status-healthy")}>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="branca">Branca</SelectItem>
                                                <SelectItem value="preta">Preta</SelectItem>
                                                <SelectItem value="parda">Parda</SelectItem>
                                                <SelectItem value="amarela">Amarela</SelectItem>
                                                <SelectItem value="indigena">Indígena</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Estado Civil</Label>
                                        <Select onValueChange={(val) => handleInputChange('marital_status', val)} value={formData.marital_status}>
                                            <SelectTrigger className={cn(formData.marital_status && "border-status-healthy")}>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                                                <SelectItem value="casado">Casado(a)</SelectItem>
                                                <SelectItem value="separado">Separado(a)</SelectItem>
                                                <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                                                <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Address */}
                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                                        <MapPin className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Endereço</h3>
                                        <p className="text-sm text-muted-foreground">Onde você mora</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>País</Label>
                                        <Input
                                            value={formData.address_country}
                                            onChange={(e) => handleInputChange('address_country', e.target.value)}
                                            className={cn(formData.address_country && "border-status-healthy")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Estado</Label>
                                        <Input
                                            value={formData.address_state}
                                            onChange={(e) => handleInputChange('address_state', e.target.value)}
                                            placeholder="UF"
                                            maxLength={2}
                                            className={cn(formData.address_state && "border-status-healthy")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Cidade</Label>
                                        <Input
                                            value={formData.address_city}
                                            onChange={(e) => handleInputChange('address_city', e.target.value)}
                                            className={cn(formData.address_city && "border-status-healthy")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Bairro</Label>
                                        <Input
                                            value={formData.address_neighborhood}
                                            onChange={(e) => handleInputChange('address_neighborhood', e.target.value)}
                                            className={cn(formData.address_neighborhood && "border-status-healthy")}
                                        />
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>Rua</Label>
                                        <Input
                                            value={formData.address_street}
                                            onChange={(e) => handleInputChange('address_street', e.target.value)}
                                            className={cn(formData.address_street && "border-status-healthy")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Número</Label>
                                        <Input
                                            value={formData.address_number}
                                            onChange={(e) => handleInputChange('address_number', e.target.value)}
                                            className={cn(formData.address_number && "border-status-healthy")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Complemento</Label>
                                        <Input
                                            value={formData.address_complement}
                                            onChange={(e) => handleInputChange('address_complement', e.target.value)}
                                            placeholder="Apt, Bloco, etc."
                                            className={cn(formData.address_complement && "border-status-healthy")}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Contact */}
                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                                        <Phone className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Contato</h3>
                                        <p className="text-sm text-muted-foreground">Como podemos te encontrar</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-primary" />
                                            Telefone
                                        </Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            placeholder="(00) 00000-0000"
                                            maxLength={15}
                                            className={cn(formData.phone.length === 15 && "border-status-healthy")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_phone" className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-primary" />
                                            Contato de Emergência
                                        </Label>
                                        <Input
                                            id="emergency_phone"
                                            value={formData.emergency_phone}
                                            onChange={(e) => handleInputChange('emergency_phone', e.target.value)}
                                            placeholder="(00) 00000-0000"
                                            maxLength={15}
                                            className={cn(formData.emergency_phone.length === 15 && "border-status-healthy")}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Health */}
                        {currentStep === 5 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                                        <Heart className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Saúde</h3>
                                        <p className="text-sm text-muted-foreground">Seu perfil médico</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Peso (kg)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={formData.weight}
                                            onChange={(e) => handleInputChange('weight', e.target.value)}
                                            placeholder="Ex: 70.5"
                                            className={cn(formData.weight && "border-status-healthy")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Altura (cm)</Label>
                                        <Input
                                            type="number"
                                            value={formData.height}
                                            onChange={(e) => handleInputChange('height', e.target.value)}
                                            placeholder="Ex: 175"
                                            className={cn(formData.height && "border-status-healthy")}
                                        />
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>Alergias</Label>
                                        <Textarea
                                            value={formData.allergies}
                                            onChange={(e) => handleInputChange('allergies', e.target.value)}
                                            placeholder="Liste suas alergias conhecidas..."
                                            className={cn(formData.allergies && "border-status-healthy")}
                                        />
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>Doenças Crônicas / Tratamentos</Label>
                                        <Textarea
                                            value={formData.chronic_diseases}
                                            onChange={(e) => handleInputChange('chronic_diseases', e.target.value)}
                                            placeholder="Liste doenças crônicas ou tratamentos em andamento..."
                                            className={cn(formData.chronic_diseases && "border-status-healthy")}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 6: Terms and Consent */}
                        {currentStep === 6 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                                        <Scale className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Termos e Consentimentos</h3>
                                        <p className="text-sm text-muted-foreground">Leia e aceite os termos obrigatórios</p>
                                    </div>
                                </div>

                                {/* AI Warning Banner */}
                                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-6">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-amber-700 dark:text-amber-400">Aviso Importante sobre Inteligência Artificial</h4>
                                            <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                                                As análises geradas por IA nesta plataforma são meramente informativas e
                                                <strong> PODEM CONTER ERROS, IMPRECISÕES OU FALHAS</strong>. Elas NÃO substituem
                                                a avaliação de um profissional de saúde qualificado. SEMPRE consulte um médico
                                                para diagnósticos e tratamentos.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Terms of Service */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            Termos de Uso
                                        </h4>
                                        <TermsOfService />
                                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                            <Checkbox
                                                id="acceptTermsOfService"
                                                checked={formData.acceptTermsOfService}
                                                onCheckedChange={(checked) =>
                                                    setFormData(prev => ({ ...prev, acceptTermsOfService: checked === true }))
                                                }
                                                className={cn(errors.acceptTermsOfService && "border-destructive")}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label
                                                    htmlFor="acceptTermsOfService"
                                                    className="text-sm font-medium leading-none cursor-pointer"
                                                >
                                                    Li e aceito os Termos de Uso *
                                                </label>
                                                {errors.acceptTermsOfService && (
                                                    <p className="text-xs text-destructive">{errors.acceptTermsOfService}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Privacy Policy */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-primary" />
                                            Política de Privacidade
                                        </h4>
                                        <PrivacyPolicy />
                                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                            <Checkbox
                                                id="acceptPrivacyPolicy"
                                                checked={formData.acceptPrivacyPolicy}
                                                onCheckedChange={(checked) =>
                                                    setFormData(prev => ({ ...prev, acceptPrivacyPolicy: checked === true }))
                                                }
                                                className={cn(errors.acceptPrivacyPolicy && "border-destructive")}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label
                                                    htmlFor="acceptPrivacyPolicy"
                                                    className="text-sm font-medium leading-none cursor-pointer"
                                                >
                                                    Li e aceito a Política de Privacidade *
                                                </label>
                                                {errors.acceptPrivacyPolicy && (
                                                    <p className="text-xs text-destructive">{errors.acceptPrivacyPolicy}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Sharing Consent */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <Heart className="h-4 w-4 text-primary" />
                                            Termo de Consentimento para Dados de Saúde
                                        </h4>
                                        <DataSharingConsent />
                                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                            <Checkbox
                                                id="acceptDataSharing"
                                                checked={formData.acceptDataSharing}
                                                onCheckedChange={(checked) =>
                                                    setFormData(prev => ({ ...prev, acceptDataSharing: checked === true }))
                                                }
                                                className={cn(errors.acceptDataSharing && "border-destructive")}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label
                                                    htmlFor="acceptDataSharing"
                                                    className="text-sm font-medium leading-none cursor-pointer"
                                                >
                                                    Li e aceito o Termo de Consentimento para Compartilhamento de Dados de Saúde *
                                                </label>
                                                {errors.acceptDataSharing && (
                                                    <p className="text-xs text-destructive">{errors.acceptDataSharing}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Limitations Acknowledgment */}
                                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="acceptAILimitations"
                                                checked={formData.acceptAILimitations}
                                                onCheckedChange={(checked) =>
                                                    setFormData(prev => ({ ...prev, acceptAILimitations: checked === true }))
                                                }
                                                className={cn(
                                                    "mt-0.5",
                                                    errors.acceptAILimitations && "border-destructive"
                                                )}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label
                                                    htmlFor="acceptAILimitations"
                                                    className="text-sm font-bold leading-tight cursor-pointer text-destructive"
                                                >
                                                    Reconheço que as análises de IA podem apresentar erros e falhas *
                                                </label>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Confirmo que estou ciente de que a Inteligência Artificial utilizada nesta
                                                    plataforma pode cometer erros, apresentar imprecisões e gerar resultados
                                                    incorretos. Entendo que devo SEMPRE consultar um profissional de saúde
                                                    qualificado para obter diagnósticos, tratamentos e orientações médicas,
                                                    e que não devo basear decisões médicas exclusivamente nas análises da IA.
                                                </p>
                                                {errors.acceptAILimitations && (
                                                    <p className="text-xs text-destructive font-medium">{errors.acceptAILimitations}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className={cn(
                                "gap-2 transition-all",
                                currentStep === 1 && "opacity-50"
                            )}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Anterior
                        </Button>

                        {currentStep < STEPS.length ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                className="gap-2 gradient-primary text-primary-foreground hover:opacity-90 shadow-glow-primary"
                            >
                                Próximo
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="gap-2 gradient-primary text-primary-foreground hover:opacity-90 shadow-glow-primary min-w-[160px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Criando conta...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        Concluir Cadastro
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Skip optional steps - go to terms (step 6 is mandatory) */}
                    {currentStep > 1 && currentStep < STEPS.length - 1 && (
                        <div className="text-center mt-4">
                            <Button
                                type="button"
                                variant="link"
                                onClick={() => {
                                    // Mark current step as completed and skip to Terms (step 6)
                                    setCompletedSteps(prev => [...prev, currentStep]);
                                    setDirection('forward');
                                    setCurrentStep(STEPS.length); // Go to last step (Terms)
                                }}
                                className="text-muted-foreground text-sm"
                            >
                                Pular etapas opcionais e ir para os Termos
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default RegisterWizard;
