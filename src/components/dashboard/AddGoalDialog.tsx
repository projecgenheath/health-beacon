import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Target } from 'lucide-react';

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COMMON_EXAMS = [
  { name: 'Glicose', unit: 'mg/dL' },
  { name: 'Colesterol Total', unit: 'mg/dL' },
  { name: 'HDL', unit: 'mg/dL' },
  { name: 'LDL', unit: 'mg/dL' },
  { name: 'Triglicerídeos', unit: 'mg/dL' },
  { name: 'Hemoglobina', unit: 'g/dL' },
  { name: 'Vitamina D', unit: 'ng/mL' },
  { name: 'Vitamina B12', unit: 'pg/mL' },
  { name: 'Ferro', unit: 'mcg/dL' },
  { name: 'TSH', unit: 'mUI/L' },
  { name: 'Ácido Úrico', unit: 'mg/dL' },
  { name: 'Creatinina', unit: 'mg/dL' },
];

export const AddGoalDialog = ({ open, onOpenChange }: AddGoalDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [examName, setExamName] = useState('');
  const [customExam, setCustomExam] = useState('');
  const [targetType, setTargetType] = useState('range');
  const [targetValue, setTargetValue] = useState('');
  const [targetMin, setTargetMin] = useState('');
  const [targetMax, setTargetMax] = useState('');
  const [unit, setUnit] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [notes, setNotes] = useState('');
  const [deadline, setDeadline] = useState('');

  const resetForm = () => {
    setExamName('');
    setCustomExam('');
    setTargetType('range');
    setTargetValue('');
    setTargetMin('');
    setTargetMax('');
    setUnit('');
    setCurrentValue('');
    setNotes('');
    setDeadline('');
  };

  const createGoal = useMutation({
    mutationFn: async () => {
      const finalExamName = examName === 'custom' ? customExam : examName;
      
      if (!finalExamName || !unit) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      const goalData = {
        user_id: user?.id,
        exam_name: finalExamName,
        target_type: targetType,
        target_value: targetType === 'range' 
          ? (parseFloat(targetMin) + parseFloat(targetMax)) / 2 
          : parseFloat(targetValue),
        target_min: targetType === 'range' ? parseFloat(targetMin) : null,
        target_max: targetType === 'range' ? parseFloat(targetMax) : null,
        current_value: currentValue ? parseFloat(currentValue) : null,
        unit,
        notes: notes || null,
        deadline: deadline || null,
        status: 'active',
      };

      const { error } = await supabase.from('health_goals').insert(goalData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-goals'] });
      toast.success('Meta criada com sucesso!');
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar meta');
    },
  });

  const handleExamSelect = (value: string) => {
    setExamName(value);
    if (value !== 'custom') {
      const exam = COMMON_EXAMS.find(e => e.name === value);
      if (exam) setUnit(exam.unit);
    } else {
      setUnit('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Nova Meta de Saúde
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Exame / Indicador</Label>
            <Select value={examName} onValueChange={handleExamSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um exame" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_EXAMS.map((exam) => (
                  <SelectItem key={exam.name} value={exam.name}>
                    {exam.name}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Outro (personalizado)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {examName === 'custom' && (
            <div className="space-y-2">
              <Label>Nome do exame</Label>
              <Input
                value={customExam}
                onChange={(e) => setCustomExam(e.target.value)}
                placeholder="Ex: Vitamina K"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Tipo de meta</Label>
            <Select value={targetType} onValueChange={setTargetType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="range">Faixa ideal (mín - máx)</SelectItem>
                <SelectItem value="below">Abaixo de um valor</SelectItem>
                <SelectItem value="above">Acima de um valor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetType === 'range' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor mínimo</Label>
                <Input
                  type="number"
                  value={targetMin}
                  onChange={(e) => setTargetMin(e.target.value)}
                  placeholder="Ex: 70"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor máximo</Label>
                <Input
                  type="number"
                  value={targetMax}
                  onChange={(e) => setTargetMax(e.target.value)}
                  placeholder="Ex: 100"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Valor alvo</Label>
              <Input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Ex: 100"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ex: mg/dL"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor atual (opcional)</Label>
              <Input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="Ex: 85"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prazo (opcional)</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Reduzir açúcar na dieta"
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => createGoal.mutate()}
            disabled={createGoal.isPending}
          >
            {createGoal.isPending ? 'Salvando...' : 'Criar Meta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
