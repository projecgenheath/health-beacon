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
import { Activity, Mail, Lock, User, MapPin, Phone, Heart, FileText, AlertCircle } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

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
      navigate('/');
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

        navigate('/');
      } catch (err) {
        console.error('Unexpected error updating profile:', err);
        toast.success('Conta criada com sucesso!'); // Navigate anyway if auth worked
        navigate('/');
      }
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-slow shadow-glow-primary">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground animate-fade-in">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-8">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-status-healthy/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-accent/10 blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-hero shadow-glow-primary mb-4 animate-float hover:scale-105 transition-spring">
            <Activity className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">MeuExame</h1>
          <p className="text-muted-foreground mt-2">Seu histórico de saúde em um só lugar</p>
        </div>

        <Card className="border-border/50 shadow-lg glass-effect animate-scale-in hover-lift overflow-hidden flex flex-col">
          <Tabs defaultValue="login" className="w-full flex-1 flex flex-col">
            <CardHeader className="pb-4 shrink-0">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-card data-[state=active]:shadow-sm transition-smooth">Entrar</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-card data-[state=active]:shadow-sm transition-smooth">Cadastrar</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-0">
              {/* LOGIN TAB */}
              <TabsContent value="login" className="mt-0 p-6">
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
                    <Label htmlFor="login-password">Senha</Label>
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
              </TabsContent>

              {/* REGISTER TAB */}
              <TabsContent value="register" className="mt-0">
                <div className="px-6 pb-6">
                  <form onSubmit={handleRegister} className="space-y-6 pt-4">

                    {/* Account Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                        <User className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Dados da Conta</h3>
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
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Informações Pessoais</h3>
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
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Endereço</h3>
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
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                        <Phone className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Contato</h3>
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
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                        <Heart className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Saúde</h3>
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
                      className="w-full h-12 mt-6 gradient-primary text-primary-foreground hover:opacity-90 transition-smooth shadow-glow-primary hover:shadow-lg btn-press text-lg font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Criando conta...' : 'Concluir Cadastro'}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
