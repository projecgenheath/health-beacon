import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Scale, Ruler, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UpdateBMIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId?: string;
  examDate?: string;
  onSuccess?: () => void;
}

export const UpdateBMIDialog = ({
  open,
  onOpenChange,
  examId,
  examDate,
  onSuccess,
}: UpdateBMIDialogProps) => {
  const { user } = useAuth();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [saving, setSaving] = useState(false);

  // Load last BMI record to pre-fill height
  useEffect(() => {
    const loadLastBMI = async () => {
      if (!user || !open) return;

      const { data } = await supabase
        .from('bmi_history')
        .select('weight, height')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setHeight(data.height?.toString() || '');
        // Don't pre-fill weight as it changes more frequently
      }
    };

    loadLastBMI();
  }, [user, open]);

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w > 0 && h > 0) {
      return (w / Math.pow(h / 100, 2)).toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'text-status-warning' };
    if (bmi < 25) return { label: 'Peso normal', color: 'text-status-healthy' };
    if (bmi < 30) return { label: 'Sobrepeso', color: 'text-status-warning' };
    return { label: 'Obesidade', color: 'text-status-danger' };
  };

  const handleSave = async () => {
    if (!user) return;

    const w = parseFloat(weight);
    const h = parseFloat(height);

    if (!w || w <= 0 || w > 500) {
      toast.error('Peso inválido (deve estar entre 1 e 500 kg)');
      return;
    }

    if (!h || h <= 0 || h > 300) {
      toast.error('Altura inválida (deve estar entre 1 e 300 cm)');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from('bmi_history').insert({
        user_id: user.id,
        weight: w,
        height: h,
        exam_id: examId || null,
        recorded_at: examDate || new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      // Also update profile with latest weight/height
      await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          weight: w,
          height: h,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      toast.success('Medidas atualizadas com sucesso!');
      onOpenChange(false);
      setWeight('');
      onSuccess?.();
    } catch (error) {
      console.error('Error saving BMI:', error);
      toast.error('Erro ao salvar medidas');
    } finally {
      setSaving(false);
    }
  };

  const bmi = calculateBMI();
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Atualizar Medidas
          </DialogTitle>
          <DialogDescription>
            Atualize seu peso e altura para calcular o IMC e acompanhar sua evolução.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="weight" className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              Peso (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="1"
              max="500"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ex: 70.5"
              className="h-12"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="height" className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              Altura (cm)
            </Label>
            <Input
              id="height"
              type="number"
              step="1"
              min="1"
              max="300"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Ex: 175"
              className="h-12"
            />
          </div>

          {/* BMI Preview */}
          {bmi && (
            <div className="rounded-xl bg-muted/50 p-4 text-center animate-scale-in">
              <p className="text-sm text-muted-foreground mb-1">Seu IMC</p>
              <p className={`text-3xl font-bold ${bmiCategory?.color}`}>{bmi}</p>
              <p className={`text-sm font-medium ${bmiCategory?.color}`}>
                {bmiCategory?.label}
              </p>
            </div>
          )}

          {/* BMI Reference */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p className="font-medium">Referência IMC:</p>
            <div className="grid grid-cols-2 gap-1">
              <span>• &lt; 18.5: Abaixo do peso</span>
              <span>• 18.5 - 24.9: Normal</span>
              <span>• 25 - 29.9: Sobrepeso</span>
              <span>• ≥ 30: Obesidade</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !weight || !height}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
