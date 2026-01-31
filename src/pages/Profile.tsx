import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, User, Calendar, Users, Camera, Upload, Bell, MapPin, Phone, Heart, FileText, Lock, Database } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ProfileData {
  full_name: string | null;
  birth_date: string | null;
  cpf: string | null;
  sex: string | null;
  gender: string | null;
  ethnicity: string | null;
  marital_status: string | null;
  avatar_url: string | null;
  email_notifications: boolean;
  digest_frequency: 'none' | 'weekly' | 'monthly';
  // Address
  address_country: string | null;
  address_state: string | null;
  address_city: string | null;
  address_neighborhood: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  // Contact
  phone: string | null;
  emergency_phone: string | null;
  // Medical
  weight: number | null;
  height: number | null;
  allergies: string | null;
  chronic_diseases: string | null;
  // Integration
  db_codigo_apoiado: string | null;
  db_senha_integracao: string | null;
  user_type: 'patient' | 'laboratory' | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    birth_date: '',
    cpf: '',
    sex: '',
    gender: '',
    ethnicity: '',
    marital_status: '',
    avatar_url: null,
    email_notifications: true,
    digest_frequency: 'none',
    address_country: 'Brasil',
    address_state: '',
    address_city: '',
    address_neighborhood: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    phone: '',
    emergency_phone: '',
    weight: null,
    height: null,
    allergies: '',
    chronic_diseases: '',
    db_codigo_apoiado: '',
    db_senha_integracao: '',
    user_type: null,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user!.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const profileData = data as any;
          setProfile({
            full_name: profileData.full_name || '',
            birth_date: profileData.birth_date || '',
            cpf: profileData.cpf || '',
            sex: profileData.sex || '',
            gender: profileData.gender || '',
            ethnicity: profileData.ethnicity || '',
            marital_status: profileData.marital_status || '',
            avatar_url: profileData.avatar_url || null,
            email_notifications: profileData.email_notifications ?? true,
            digest_frequency: (profileData.digest_frequency as 'none' | 'weekly' | 'monthly') || 'none',
            address_country: profileData.address_country || 'Brasil',
            address_state: profileData.address_state || '',
            address_city: profileData.address_city || '',
            address_neighborhood: profileData.address_neighborhood || '',
            address_street: profileData.address_street || '',
            address_number: profileData.address_number || '',
            address_complement: profileData.address_complement || '',
            phone: profileData.phone || '',
            emergency_phone: profileData.emergency_phone || '',
            weight: profileData.weight || null,
            height: profileData.height || null,
            allergies: profileData.allergies || '',
            chronic_diseases: profileData.chronic_diseases || '',
            db_codigo_apoiado: profileData.db_codigo_apoiado || '',
            db_senha_integracao: profileData.db_senha_integracao || '',
            user_type: profileData.user_type || null,
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      if (profile.avatar_url) {
        await supabase.storage.from('avatars').remove([profile.avatar_url]);
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          avatar_url: filePath,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (updateError) throw updateError;

      setProfile((prev) => ({ ...prev, avatar_url: filePath }));
      toast.success('Foto atualizada com sucesso!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao atualizar foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleDigestChange = async (value: 'none' | 'weekly' | 'monthly') => {
    setProfile((prev) => ({ ...prev, digest_frequency: value }));

    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          digest_frequency: value,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      const digestText = value === 'none' ? 'desativado' : value === 'weekly' ? 'semanal' : 'mensal';
      toast.success(`Resumo ${digestText} configurado`);
    } catch (error) {
      console.error('Error updating digest:', error);
      toast.error('Erro ao atualizar preferências');
    }
  };

  const handleNotificationToggle = async (checked: boolean) => {
    setProfile((prev) => ({ ...prev, email_notifications: checked }));

    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          email_notifications: checked,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success(checked ? 'Notificações ativadas' : 'Notificações desativadas');
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Erro ao atualizar preferências');
      setProfile((prev) => ({ ...prev, email_notifications: !checked }));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(profile.avatar_url);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container flex h-16 items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Meu Perfil</h1>
            <p className="text-xs text-muted-foreground">Gerencie suas informações</p>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-4xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Avatar & Basic Info Card */}
          <div className="rounded-2xl bg-card p-6 shadow-md animate-slide-up">
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className={cn(
                  "h-24 w-24 rounded-full overflow-hidden flex items-center justify-center",
                  avatarUrl ? "" : "bg-primary/10"
                )}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-primary" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className={cn(
                    "absolute inset-0 rounded-full flex items-center justify-center",
                    "bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity",
                    "cursor-pointer"
                  )}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-6 w-6 text-background animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-background" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="mt-3 text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Upload className="h-4 w-4" />
                {uploadingAvatar ? 'Enviando...' : 'Alterar foto'}
              </button>
              <div className="mt-2 text-center">
                <p className="font-medium text-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Nome completo
                </Label>
                <Input
                  id="full_name"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Data de nascimento
                </Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={profile.birth_date || ''}
                  onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={profile.cpf || ''}
                  onChange={(e) => setProfile({ ...profile, cpf: e.target.value })}
                  className="h-12 rounded-xl"
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Sexo Biológico
                </Label>
                <Select
                  value={profile.sex || ''}
                  onValueChange={(value) => setProfile({ ...profile, sex: value })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
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
                <Select
                  value={profile.gender || ''}
                  onValueChange={(val) => setProfile({ ...profile, gender: val })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
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
                <Select
                  value={profile.ethnicity || ''}
                  onValueChange={(val) => setProfile({ ...profile, ethnicity: val })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
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
                <Select
                  value={profile.marital_status || ''}
                  onValueChange={(val) => setProfile({ ...profile, marital_status: val })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
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

          {/* Address Section */}
          <div className="rounded-2xl bg-card p-6 shadow-md animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-border/50">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Endereço</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_country">País</Label>
                <Input
                  id="address_country"
                  value={profile.address_country || ''}
                  onChange={(e) => setProfile({ ...profile, address_country: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_state">Estado</Label>
                <Input
                  id="address_state"
                  value={profile.address_state || ''}
                  onChange={(e) => setProfile({ ...profile, address_state: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_city">Cidade</Label>
                <Input
                  id="address_city"
                  value={profile.address_city || ''}
                  onChange={(e) => setProfile({ ...profile, address_city: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_neighborhood">Bairro</Label>
                <Input
                  id="address_neighborhood"
                  value={profile.address_neighborhood || ''}
                  onChange={(e) => setProfile({ ...profile, address_neighborhood: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_street">Rua</Label>
                <Input
                  id="address_street"
                  value={profile.address_street || ''}
                  onChange={(e) => setProfile({ ...profile, address_street: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_number">Número</Label>
                <Input
                  id="address_number"
                  value={profile.address_number || ''}
                  onChange={(e) => setProfile({ ...profile, address_number: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_complement">Complemento</Label>
                <Input
                  id="address_complement"
                  value={profile.address_complement || ''}
                  onChange={(e) => setProfile({ ...profile, address_complement: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="rounded-2xl bg-card p-6 shadow-md animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-border/50">
              <Phone className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Contato</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_phone">Contato de Emergência</Label>
                <Input
                  id="emergency_phone"
                  value={profile.emergency_phone || ''}
                  onChange={(e) => setProfile({ ...profile, emergency_phone: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Health Section */}
          <div className="rounded-2xl bg-card p-6 shadow-md animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-border/50">
              <Heart className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Dados de Saúde</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={profile.weight ?? ''}
                  onChange={(e) => setProfile({ ...profile, weight: e.target.value ? parseFloat(e.target.value) : null })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={profile.height ?? ''}
                  onChange={(e) => setProfile({ ...profile, height: e.target.value ? parseFloat(e.target.value) : null })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="allergies">Alergias</Label>
                <Textarea
                  id="allergies"
                  value={profile.allergies || ''}
                  onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                  className="min-h-[100px] rounded-xl"
                  placeholder="Liste suas alergias..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="chronic_diseases">Doenças Crônicas / Tratamentos</Label>
                <Textarea
                  id="chronic_diseases"
                  value={profile.chronic_diseases || ''}
                  onChange={(e) => setProfile({ ...profile, chronic_diseases: e.target.value })}
                  className="min-h-[100px] rounded-xl"
                  placeholder="Descreva doenças crônicas ou tratamentos em andamento..."
                />
              </div>
            </div>
          </div>

          {/* Integration Section (Laboratories Only) */}
          {profile.user_type === 'laboratory' && (
            <div className="rounded-2xl bg-card p-6 shadow-md animate-slide-up" style={{ animationDelay: '175ms' }}>
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-border/50">
                <Database className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Integração DB Diagnósticos</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="db_codigo_apoiado">Código do Apoiado</Label>
                  <Input
                    id="db_codigo_apoiado"
                    value={profile.db_codigo_apoiado || ''}
                    onChange={(e) => setProfile({ ...profile, db_codigo_apoiado: e.target.value })}
                    className="h-12 rounded-xl font-mono"
                    placeholder="Ex: 123456"
                    type="password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db_senha_integracao">Senha de Integração</Label>
                  <Input
                    id="db_senha_integracao"
                    value={profile.db_senha_integracao || ''}
                    onChange={(e) => setProfile({ ...profile, db_senha_integracao: e.target.value })}
                    className="h-12 rounded-xl font-mono"
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
                <p className="md:col-span-2 text-sm text-muted-foreground">
                  Estas credenciais são usadas para enviar pedidos e receber resultados diretamente da Diagnósticos do Brasil.
                  Elas são armazenadas de forma segura.
                </p>
              </div>
            </div>
          )}

          {/* Notification Preferences Card */}
          <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Notificações
              </CardTitle>
              <CardDescription>
                Gerencie suas preferências de notificação por email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-alerts" className="text-base">
                    Alertas de exames
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receba emails quando seus resultados apresentarem valores alterados ou que requerem atenção
                  </p>
                </div>
                <Switch
                  id="email-alerts"
                  checked={profile.email_notifications}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="digest-frequency" className="text-base">
                    Resumo por email
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receba um resumo periódico de todos os seus exames
                  </p>
                </div>
                <Select
                  value={profile.digest_frequency}
                  onValueChange={handleDigestChange}
                  disabled={!profile.email_notifications}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Desativado</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={saving}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-medium text-lg fixed bottom-6 left-0 right-0 mx-auto max-w-md shadow-lg z-50 md:static md:max-w-none md:shadow-none"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Salvando alterações...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
          {/* Spacer for fixed bottom button on mobile */}
          <div className="h-16 md:hidden"></div>
        </form>
      </main>
    </div >
  );
};

export default Profile;
