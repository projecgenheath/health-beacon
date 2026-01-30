import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    Bell,
    Plus,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Trash2,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, addMonths, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExamReminder {
    id: string;
    examType: string;
    frequencyMonths: number;
    lastDone: string | null;
    nextDue: string;
    isOverdue: boolean;
    daysUntilDue: number;
}

const frequencyOptions = [
    { value: '3', label: 'A cada 3 meses' },
    { value: '6', label: 'A cada 6 meses' },
    { value: '12', label: 'Anualmente' },
    { value: '24', label: 'A cada 2 anos' },
];

/**
 * Widget de lembretes de exames periódicos
 */
export const ExamRemindersWidget = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [reminders, setReminders] = useState<ExamReminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newExamType, setNewExamType] = useState('');
    const [newFrequency, setNewFrequency] = useState('12');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchReminders = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('exam_reminders')
                .select('*')
                .eq('user_id', user.id)
                .order('next_due', { ascending: true });

            if (error) throw error;

            const mappedReminders: ExamReminder[] = (data || []).map(r => {
                const lastDone = r.last_done ? new Date(r.last_done) : null;
                const nextDue = lastDone
                    ? addMonths(lastDone, r.frequency_months)
                    : new Date();
                const isOverdue = isPast(nextDue);
                const daysUntilDue = differenceInDays(nextDue, new Date());

                return {
                    id: r.id,
                    examType: r.exam_type,
                    frequencyMonths: r.frequency_months,
                    lastDone: r.last_done,
                    nextDue: nextDue.toISOString(),
                    isOverdue,
                    daysUntilDue,
                };
            });

            setReminders(mappedReminders);
        } catch (error) {
            console.error('Error fetching reminders:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        fetchReminders();
    }, [user, fetchReminders]);

    const handleAddReminder = async () => {
        if (!user || !newExamType.trim()) return;

        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('exam_reminders')
                .insert({
                    user_id: user.id,
                    exam_type: newExamType.trim(),
                    frequency_months: parseInt(newFrequency),
                    next_due: new Date().toISOString(),
                });

            if (error) throw error;

            toast({
                title: 'Lembrete criado',
                description: `Você será lembrado de fazer ${newExamType}.`,
            });

            setNewExamType('');
            setNewFrequency('12');
            setIsDialogOpen(false);
            fetchReminders();
        } catch (error) {
            console.error('Error adding reminder:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível criar o lembrete.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReminder = async (id: string) => {
        try {
            const { error } = await supabase
                .from('exam_reminders')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setReminders(prev => prev.filter(r => r.id !== id));
            toast({
                title: 'Lembrete removido',
            });
        } catch (error) {
            console.error('Error deleting reminder:', error);
        }
    };

    const handleMarkAsDone = async (id: string) => {
        try {
            const { error } = await supabase
                .from('exam_reminders')
                .update({
                    last_done: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Exame marcado como realizado',
            });

            fetchReminders();
        } catch (error) {
            console.error('Error updating reminder:', error);
        }
    };

    const getDueStatus = (reminder: ExamReminder) => {
        if (reminder.isOverdue) {
            return { label: 'Atrasado', variant: 'destructive' as const, icon: AlertTriangle };
        }
        if (reminder.daysUntilDue <= 30) {
            return { label: 'Em breve', variant: 'warning' as const, icon: Clock };
        }
        return { label: 'Em dia', variant: 'outline' as const, icon: CheckCircle2 };
    };

    const overdueCount = reminders.filter(r => r.isOverdue).length;
    const upcomingCount = reminders.filter(r => !r.isOverdue && r.daysUntilDue <= 30).length;

    return (
        <Card className="glass-card">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        Lembretes de Exames
                    </CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-1">
                                <Plus className="h-4 w-4" />
                                Novo
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Novo Lembrete</DialogTitle>
                                <DialogDescription>
                                    Configure um lembrete para exames periódicos.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="exam-type">Tipo de Exame</Label>
                                    <Input
                                        id="exam-type"
                                        value={newExamType}
                                        onChange={(e) => setNewExamType(e.target.value)}
                                        placeholder="Ex: Hemograma completo"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="frequency">Frequência</Label>
                                    <Select value={newFrequency} onValueChange={setNewFrequency}>
                                        <SelectTrigger id="frequency">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {frequencyOptions.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleAddReminder}
                                    disabled={isSubmitting || !newExamType.trim()}
                                >
                                    Criar Lembrete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Summary badges */}
                {(overdueCount > 0 || upcomingCount > 0) && (
                    <div className="flex items-center gap-2 mt-2">
                        {overdueCount > 0 && (
                            <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {overdueCount} atrasado{overdueCount !== 1 ? 's' : ''}
                            </Badge>
                        )}
                        {upcomingCount > 0 && (
                            <Badge variant="outline" className="gap-1 border-status-warning text-status-warning">
                                <Clock className="h-3 w-3" />
                                {upcomingCount} em breve
                            </Badge>
                        )}
                    </div>
                )}
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : reminders.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum lembrete configurado.</p>
                        <p className="text-xs mt-1">Crie lembretes para exames periódicos.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reminders.map((reminder) => {
                            const status = getDueStatus(reminder);
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={reminder.id}
                                    className={cn(
                                        'flex items-center justify-between p-3 rounded-xl border',
                                        reminder.isOverdue && 'bg-status-danger/5 border-status-danger/20',
                                        !reminder.isOverdue && reminder.daysUntilDue <= 30 && 'bg-status-warning/5 border-status-warning/20',
                                        !reminder.isOverdue && reminder.daysUntilDue > 30 && 'bg-muted/50 border-border',
                                    )}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{reminder.examType}</span>
                                            <Badge variant={status.variant} className="gap-1 text-xs">
                                                <StatusIcon className="h-3 w-3" />
                                                {status.label}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {reminder.isOverdue ? (
                                                <span className="text-status-danger">
                                                    Atrasado há {Math.abs(reminder.daysUntilDue)} dias
                                                </span>
                                            ) : (
                                                <span>
                                                    Próximo: {format(new Date(reminder.nextDue), "d 'de' MMMM", { locale: ptBR })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleMarkAsDone(reminder.id)}
                                            title="Marcar como realizado"
                                        >
                                            <CheckCircle2 className="h-4 w-4 text-status-healthy" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleDeleteReminder(reminder.id)}
                                            title="Remover lembrete"
                                        >
                                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
