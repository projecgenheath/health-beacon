import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, Lock, User, MapPin, Phone, Heart, FileText, AlertCircle } from 'lucide-react';
import logoImg from '@/assets/logo.png';
import { ThemeToggle } from '@/components/ThemeToggle';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

const Auth = () => {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recovery and Reset state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [view, setView] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [formData, setFormData] = useState({
    // Account
    email: '',
    password: '',
    confirmPassword: '',
    // Personal
    full_name: '',
    birth_date: '',
    cpf: '',
    sex: '',
    gender: '',
    ethnicity: '',
    marital_status: '',
    // Address
    address_country: 'Brasil',
    address_state: '',
    address_city: '',
    address_neighborhood: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    // Contact
    phone: '',
    emergency_phone: '',
    // Medical
    weight: '',
    height: '',
    allergies: '',
    chronic_diseases: '',
  });

  useEffect(() => {
    if (user && !loading && view !== 'reset-password') {
      navigate('/dashboard');
    }

    // Check for recovery type in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('type') === 'recovery' || window.location.hash.includes('type=recovery')) {
      setView('reset-password');
    }
  }, [user, loading, navigate, view]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos');
      } else {
        toast.error('Erro ao fazer login. Tente novamente.');
      }
    } else {
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(formData.email);
      passwordSchema.parse(formData.password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (!formData.full_name) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    setIsSubmitting(true);

    // 1. Create Auth User
    const { data, error: signUpError } = await signUp(formData.email, formData.password, formData.full_name);

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
      // 2. Create Profile with all fields
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            full_name: formData.full_name,
            birth_date: formData.birth_date || null,
            cpf: formData.cpf || null,
            sex: formData.sex || null,
            gender: formData.gender || null,
            ethnicity: formData.ethnicity || null,
            marital_status: formData.marital_status || null,
            address_country: formData.address_country || null,
            address_state: formData.address_state || null,
            address_city: formData.address_city || null,
            address_neighborhood: formData.address_neighborhood || null,
            address_street: formData.address_street || null,
            address_number: formData.address_number || null,
            address_complement: formData.address_complement || null,
            phone: formData.phone || null,
            emergency_phone: formData.emergency_phone || null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            height: formData.height ? parseFloat(formData.height) : null,
            allergies: formData.allergies || null,
            chronic_diseases: formData.chronic_diseases || null,
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Profile update error:', profileError);
          // Don't block registration success, but warn user
          toast.warning('Conta criada, mas houve erro ao salvar dados do perfil.');
        } else {
          toast.success('Conta criada com sucesso!');
        }

        navigate('/dashboard');
      } catch (err) {
        console.error('Unexpected error updating profile:', err);
        toast.success('Conta criada com sucesso!'); // Navigate anyway if auth worked
        navigate('/dashboard');
      }
    }

    setIsSubmitting(false);
  };

  const handleRecoveryRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(recoveryEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await resetPassword(recoveryEmail);
    setIsSubmitting(false);

    if (error) {
      toast.error('Erro ao enviar email de recuperação: ' + error.message);
    } else {
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setView('login');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    setIsSubmitting(false);

    if (error) {
      toast.error('Erro ao atualizar senha: ' + error.message);
    } else {
      toast.success('Senha atualizada com sucesso!');
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center animate-pulse-slow">
            <img src={logoImg} alt="BHB Logo" className="h-14 w-14 object-contain" />
          </div>
          <p className="text-muted-foreground animate-fade-in">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-4 py-6 sm:py-8 relative overflow-x-hidden">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <ThemeToggle />
      </div>
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-status-healthy/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative w-full max-w-md sm:max-w-lg md:max-w-2xl">
        <div className="text-center mb-6 sm:mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 mb-3 sm:mb-4 animate-float hover:scale-105 transition-spring">
            <img src={logoImg} alt="BHB Logo" className="w-14 h-14 sm:w-20 sm:h-20 object-contain" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground">BHB</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">Seu histórico de saúde em um só lugar</p>
        </div>

        <Card className="border-border/50 shadow-lg glass-effect animate-scale-in hover-lift overflow-hidden flex flex-col max-h-[calc(100vh-200px)] sm:max-h-none">
          <Tabs defaultValue="login" className="w-full flex-1 flex flex-col">
            <CardHeader className="pb-3 sm:pb-4 shrink-0">
              {(view === 'login' || view === 'register') && (
                <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
                  <TabsTrigger value="login" className="text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm transition-smooth">Entrar</TabsTrigger>
                  <TabsTrigger value="register" className="text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm transition-smooth">Cadastrar</TabsTrigger>
                </TabsList>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {view === 'forgot-password' ? (
                <div className="p-6 space-y-4 animate-fade-in">
                  <div className="space-y-2 text-center mb-4">
                    <h3 className="text-xl font-bold">Recuperar Senha</h3>
                    <p className="text-sm text-muted-foreground">
                      Digite seu email para receber um link de recuperação.
                    </p>
                  </div>
                  <form onSubmit={handleRecoveryRequest} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recovery-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="recovery-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full gradient-primary text-primary-foreground hover:opacity-90 shadow-glow-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar Link de Recuperação'}
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-muted-foreground"
                      onClick={() => setView('login')}
                    >
                      Voltar para o Login
                    </Button>
                  </form>
                </div>
              ) : view === 'reset-password' ? (
                <div className="p-6 space-y-4 animate-fade-in">
                  <div className="space-y-2 text-center mb-4">
                    <h3 className="text-xl font-bold">Nova Senha</h3>
                    <p className="text-sm text-muted-foreground">
                      Crie uma nova senha segura para sua conta.
                    </p>
                  </div>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nova Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-new-password"
                          type="password"
                          placeholder="••••••••"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full gradient-primary text-primary-foreground hover:opacity-90 shadow-glow-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Atualizando...' : 'Atualizar Senha'}
                    </Button>
                  </form>
                </div>
              ) : (
                <>
                  {/* LOGIN TAB */}
                  <TabsContent value="login" className="mt-0 p-6">
                    <div className="space-y-4">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="seu@email.com"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="login-password">Senha</Label>
                            <Button
                              variant="link"
                              className="px-0 h-auto text-xs font-normal text-muted-foreground hover:text-primary transition-colors"
                              type="button"
                              onClick={() => setView('forgot-password')}
                            >
                              Esqueceu sua senha?
                            </Button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="login-password"
                              type="password"
                              placeholder="••••••••"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-smooth shadow-glow-primary hover:shadow-lg btn-press"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Entrando...' : 'Entrar'}
                        </Button>
                      </form>
                    </div>
                  </TabsContent>

                  {/* REGISTER TAB */}
                  <TabsContent value="register" className="mt-0 flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto px-4 sm:px-6 pb-6 max-h-[50vh] sm:max-h-none">
                      <form onSubmit={handleRegister} className="space-y-4 sm:space-y-6 pt-4">

                        {/* Account Info */}
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            <h3 className="font-semibold text-base sm:text-lg">Dados da Conta</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="full_name">Nome Completo *</Label>
                              <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => handleInputChange('full_name', e.target.value)}
                                placeholder="Seu nome completo"
                                required
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="email">Email *</Label>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="seu@email.com"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="password">Senha *</Label>
                              <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                placeholder="••••••••"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                              <Input
                                id="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                placeholder="••••••••"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Personal Info */}
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            <h3 className="font-semibold text-base sm:text-lg">Informações Pessoais</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="birth_date">Data de Nascimento</Label>
                              <Input
                                id="birth_date"
                                type="date"
                                value={formData.birth_date}
                                onChange={(e) => handleInputChange('birth_date', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cpf">CPF</Label>
                              <Input
                                id="cpf"
                                value={formData.cpf}
                                onChange={(e) => handleInputChange('cpf', e.target.value)}
                                placeholder="000.000.000-00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sex">Sexo Biológico</Label>
                              <Select onValueChange={(val) => handleInputChange('sex', val)} value={formData.sex}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="masculino">Masculino</SelectItem>
                                  <SelectItem value="feminino">Feminino</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="gender">Identidade de Gênero</Label>
                              <Select onValueChange={(val) => handleInputChange('gender', val)} value={formData.gender}>
                                <SelectTrigger>
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
                              <Label htmlFor="ethnicity">Etnia/Cor</Label>
                              <Select onValueChange={(val) => handleInputChange('ethnicity', val)} value={formData.ethnicity}>
                                <SelectTrigger>
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
                              <Label htmlFor="marital_status">Estado Civil</Label>
                              <Select onValueChange={(val) => handleInputChange('marital_status', val)} value={formData.marital_status}>
                                <SelectTrigger>
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

                        {/* Address Info */}
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            <h3 className="font-semibold text-base sm:text-lg">Endereço</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="address_country">País</Label>
                              <Input
                                id="address_country"
                                value={formData.address_country}
                                onChange={(e) => handleInputChange('address_country', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address_state">Estado</Label>
                              <Input
                                id="address_state"
                                value={formData.address_state}
                                onChange={(e) => handleInputChange('address_state', e.target.value)}
                                placeholder="UF"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address_city">Cidade</Label>
                              <Input
                                id="address_city"
                                value={formData.address_city}
                                onChange={(e) => handleInputChange('address_city', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address_neighborhood">Bairro</Label>
                              <Input
                                id="address_neighborhood"
                                value={formData.address_neighborhood}
                                onChange={(e) => handleInputChange('address_neighborhood', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="address_street">Rua</Label>
                              <Input
                                id="address_street"
                                value={formData.address_street}
                                onChange={(e) => handleInputChange('address_street', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address_number">Número</Label>
                              <Input
                                id="address_number"
                                value={formData.address_number}
                                onChange={(e) => handleInputChange('address_number', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address_complement">Complemento</Label>
                              <Input
                                id="address_complement"
                                value={formData.address_complement}
                                onChange={(e) => handleInputChange('address_complement', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                            <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            <h3 className="font-semibold text-base sm:text-lg">Contato</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="phone">Telefone</Label>
                              <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="(00) 00000-0000"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="emergency_phone">Contato de Emergência</Label>
                              <Input
                                id="emergency_phone"
                                value={formData.emergency_phone}
                                onChange={(e) => handleInputChange('emergency_phone', e.target.value)}
                                placeholder="(00) 00000-0000"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Medical Info */}
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                            <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            <h3 className="font-semibold text-base sm:text-lg">Saúde</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="weight">Peso (kg)</Label>
                              <Input
                                id="weight"
                                type="number"
                                step="0.1"
                                value={formData.weight}
                                onChange={(e) => handleInputChange('weight', e.target.value)}
                                placeholder="Ex: 70.5"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="height">Altura (cm)</Label>
                              <Input
                                id="height"
                                type="number"
                                value={formData.height}
                                onChange={(e) => handleInputChange('height', e.target.value)}
                                placeholder="Ex: 175"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="allergies">Alergias</Label>
                              <Textarea
                                id="allergies"
                                value={formData.allergies}
                                onChange={(e) => handleInputChange('allergies', e.target.value)}
                                placeholder="Liste suas alergias (opcional)"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="chronic_diseases">Doenças Crônicas / Tratamentos</Label>
                              <Textarea
                                id="chronic_diseases"
                                value={formData.chronic_diseases}
                                onChange={(e) => handleInputChange('chronic_diseases', e.target.value)}
                                placeholder="Liste doenças crônicas ou tratamentos em andamento (opcional)"
                              />
                            </div>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full h-11 sm:h-12 mt-4 sm:mt-6 gradient-primary text-primary-foreground hover:opacity-90 transition-smooth shadow-glow-primary hover:shadow-lg btn-press text-base sm:text-lg font-semibold"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Criando conta...' : 'Concluir Cadastro'}
                        </Button>
                      </form>
                    </div>
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
