import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, User, Calendar, Users, Camera, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ProfileData {
  full_name: string | null;
  birth_date: string | null;
  sex: string | null;
  avatar_url: string | null;
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
    sex: '',
    avatar_url: null,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, birth_date, sex, avatar_url')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          birth_date: data.birth_date || '',
          sex: data.sex || '',
          avatar_url: data.avatar_url || null,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Delete old avatar if exists
      if (profile.avatar_url) {
        await supabase.storage.from('avatars').remove([profile.avatar_url]);
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update profile with new avatar URL
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
          full_name: profile.full_name || null,
          birth_date: profile.birth_date || null,
          sex: profile.sex || null,
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
            onClick={() => navigate('/')}
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

      <main className="container py-6 max-w-lg">
        <div className="rounded-2xl bg-card p-6 shadow-md animate-slide-up">
          {/* Avatar section */}
          <div className="flex flex-col items-center mb-6">
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
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="mt-3 text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Upload className="h-4 w-4" />
              {uploadingAvatar ? 'Enviando...' : 'Alterar foto'}
            </button>
            <div className="mt-2 text-center">
              <p className="font-medium text-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                {profile.full_name || 'Adicione seu nome'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nome completo
              </Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Seu nome completo"
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
              <Label htmlFor="sex" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Sexo
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
                  <SelectItem value="outro">Outro</SelectItem>
                  <SelectItem value="prefiro_nao_informar">Prefiro não informar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
