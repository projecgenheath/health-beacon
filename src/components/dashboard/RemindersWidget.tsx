import { useTranslation } from 'react-i18next';
import { useReminders } from '@/hooks/useReminders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, Calendar, AlertTriangle, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const RemindersWidget = () => {
    const { t } = useTranslation();
    const { reminders, loading, overdueCount, dueSoonCount, markAsDone, toggleReminder } = useReminders();

    const handleMarkAsDone = async (examType: string) => {
        const success = await markAsDone(examType);
        if (success) {
            toast.success(`${examType} marcado como realizado!`);
        } else {
            toast.error('Erro ao atualizar');
        }
    };

    const handleToggle = async (examType: string, enabled: boolean) => {
        await toggleReminder(examType, enabled);
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        {t('reminders.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const enabledReminders = reminders.filter((r) => r.enabled);
    const overdueReminders = enabledReminders.filter((r) => r.status === 'overdue');
    const dueSoonReminders = enabledReminders.filter((r) => r.status === 'due_soon');

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            {t('reminders.title')}
                        </CardTitle>
                        <CardDescription>
                            {overdueCount > 0 && (
                                <span className="text-status-danger">{overdueCount} atrasado(s)</span>
                            )}
                            {overdueCount > 0 && dueSoonCount > 0 && ' • '}
                            {dueSoonCount > 0 && (
                                <span className="text-status-warning">{dueSoonCount} próximo(s)</span>
                            )}
                            {overdueCount === 0 && dueSoonCount === 0 && 'Tudo em dia!'}
                        </CardDescription>
                    </div>
                    {overdueCount > 0 && (
                        <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {overdueCount}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {/* Overdue reminders first */}
                    {overdueReminders.map((reminder) => (
                        <ReminderItem
                            key={reminder.id}
                            reminder={reminder}
                            onMarkAsDone={handleMarkAsDone}
                            onToggle={handleToggle}
                        />
                    ))}

                    {/* Due soon reminders */}
                    {dueSoonReminders.map((reminder) => (
                        <ReminderItem
                            key={reminder.id}
                            reminder={reminder}
                            onMarkAsDone={handleMarkAsDone}
                            onToggle={handleToggle}
                        />
                    ))}

                    {/* Show first 3 OK reminders collapsed */}
                    {enabledReminders
                        .filter((r) => r.status === 'ok')
                        .slice(0, 3)
                        .map((reminder) => (
                            <ReminderItem
                                key={reminder.id}
                                reminder={reminder}
                                onMarkAsDone={handleMarkAsDone}
                                onToggle={handleToggle}
                                compact
                            />
                        ))}
                </div>
            </CardContent>
        </Card>
    );
};

interface ReminderItemProps {
    reminder: ReturnType<typeof useReminders>['reminders'][0];
    onMarkAsDone: (examType: string) => void;
    onToggle: (examType: string, enabled: boolean) => void;
    compact?: boolean;
}

const ReminderItem = ({ reminder, onMarkAsDone, onToggle, compact }: ReminderItemProps) => {
    const { t } = useTranslation();

    const getStatusColor = () => {
        switch (reminder.status) {
            case 'overdue':
                return 'border-status-danger/30 bg-status-danger/5';
            case 'due_soon':
                return 'border-status-warning/30 bg-status-warning/5';
            default:
                return 'border-border/50 bg-muted/30';
        }
    };

    const getStatusBadge = () => {
        switch (reminder.status) {
            case 'overdue':
                return (
                    <Badge variant="destructive" className="text-[10px]">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                        Atrasado
                    </Badge>
                );
            case 'due_soon':
                return (
                    <Badge variant="secondary" className="text-[10px] bg-status-warning/20 text-status-warning border-status-warning/30">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        Em breve
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary" className="text-[10px] bg-status-healthy/20 text-status-healthy border-status-healthy/30">
                        <Check className="h-2.5 w-2.5 mr-0.5" />
                        Em dia
                    </Badge>
                );
        }
    };

    if (compact) {
        return (
            <div className={cn('p-3 rounded-lg border transition-colors', getStatusColor())}>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{reminder.exam_type}</span>
                    {getStatusBadge()}
                </div>
            </div>
        );
    }

    return (
        <div className={cn('p-4 rounded-xl border transition-colors', getStatusColor())}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{reminder.exam_type}</h4>
                        {getStatusBadge()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {reminder.last_done ? (
                            <span>
                                {t('reminders.lastDone')}:{' '}
                                {formatDistanceToNow(parseISO(reminder.last_done), {
                                    addSuffix: true,
                                    locale: ptBR,
                                })}
                            </span>
                        ) : (
                            <span>{t('reminders.neverDone')}</span>
                        )}
                    </div>
                    {reminder.status === 'overdue' && reminder.days_overdue && (
                        <p className="text-xs text-status-danger mt-1">
                            {reminder.days_overdue} dias de atraso
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMarkAsDone(reminder.exam_type)}
                        className="h-8 text-xs"
                    >
                        <Check className="h-3 w-3 mr-1" />
                        {t('reminders.markAsDone')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
