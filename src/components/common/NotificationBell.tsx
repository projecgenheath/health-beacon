import { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'goal_deadline' | 'goal_achieved' | 'exam_alert';
  title: string;
  message: string;
  date: Date;
  read: boolean;
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch goals near deadline
      const { data: goals } = await supabase
        .from('health_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .not('deadline', 'is', null);

      const notifs: Notification[] = [];
      const today = new Date();

      goals?.forEach((goal) => {
        if (!goal.deadline) return;

        const deadline = parseISO(goal.deadline);
        const daysRemaining = differenceInDays(deadline, today);

        if (daysRemaining >= 0 && daysRemaining <= 7) {
          let message = '';
          if (daysRemaining === 0) {
            message = 'Vence hoje! Hora de fazer seu check-up.';
          } else if (daysRemaining === 1) {
            message = 'Vence amanhã! Agende seu exame.';
          } else {
            message = `Vence em ${daysRemaining} dias (${format(deadline, "d 'de' MMMM", { locale: ptBR })})`;
          }

          notifs.push({
            id: goal.id,
            type: 'goal_deadline',
            title: `Meta: ${goal.exam_name}`,
            message,
            date: deadline,
            read: false,
          });
        }
      });

      // Fetch achieved goals
      const { data: achievedGoals } = await supabase
        .from('health_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'achieved')
        .order('updated_at', { ascending: false })
        .limit(5);

      achievedGoals?.forEach((goal) => {
        notifs.push({
          id: `achieved-${goal.id}`,
          type: 'goal_achieved',
          title: `🎉 Meta alcançada!`,
          message: `${goal.exam_name}: ${goal.current_value} ${goal.unit}`,
          date: parseISO(goal.updated_at),
          read: true,
        });
      });

      // Sort by date, newest first
      notifs.sort((a, b) => b.date.getTime() - a.date.getTime());

      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) markAsRead();
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative transition-all duration-300 hover:scale-110 min-w-[40px] min-h-[40px] p-2 sm:p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary"
          aria-label="Notificações"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 animate-pulse" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-bounce"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="font-semibold">Notificações</h4>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} novas notificações` : 'Nenhuma notificação nova'}
          </p>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 transition-colors hover:bg-muted/50 ${!notif.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notif.type === 'goal_deadline' ? 'bg-yellow-500' :
                      notif.type === 'goal_achieved' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{notif.title}</p>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
