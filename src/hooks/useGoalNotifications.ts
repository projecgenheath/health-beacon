import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Goal {
  id: string;
  exam_name: string;
  deadline: string | null;
  target_value: number;
  current_value: number | null;
  status: string;
  notes: string | null;
}

export const useGoalNotifications = () => {
  const { user } = useAuth();
  const hasChecked = useRef(false);

  const checkGoalsNearDeadline = useCallback(async () => {
    if (!user || hasChecked.current) return;
    
    try {
      const { data: goals, error } = await supabase
        .from('health_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .not('deadline', 'is', null);

      if (error) throw error;

      if (!goals || goals.length === 0) return;

      const today = new Date();
      const notifications: Goal[] = [];

      goals.forEach((goal: Goal) => {
        if (!goal.deadline) return;
        
        const deadline = parseISO(goal.deadline);
        const daysRemaining = differenceInDays(deadline, today);
        
        // Notify if deadline is within 7 days
        if (daysRemaining >= 0 && daysRemaining <= 7) {
          notifications.push(goal);
        }
      });

      // Show notifications
      if (notifications.length > 0) {
        notifications.forEach((goal, index) => {
          setTimeout(() => {
            const deadline = parseISO(goal.deadline!);
            const daysRemaining = differenceInDays(deadline, today);
            
            let message = '';
            if (daysRemaining === 0) {
              message = `A meta "${goal.exam_name}" vence hoje!`;
            } else if (daysRemaining === 1) {
              message = `A meta "${goal.exam_name}" vence amanhã!`;
            } else {
              message = `A meta "${goal.exam_name}" vence em ${daysRemaining} dias (${format(deadline, "d 'de' MMMM", { locale: ptBR })})`;
            }

            toast.warning('🎯 Meta próxima do prazo', {
              description: message,
              duration: 8000,
              action: {
                label: 'Ver metas',
                onClick: () => {
                  const element = document.getElementById('health-goals-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                },
              },
            });
          }, index * 1500); // Stagger notifications
        });
      }

      hasChecked.current = true;
    } catch (error) {
      console.error('Error checking goal notifications:', error);
    }
  }, [user]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'granted') return true;
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }, []);

  // Send browser notification
  const sendBrowserNotification = useCallback(async (title: string, body: string) => {
    const hasPermission = await requestNotificationPermission();
    
    if (hasPermission) {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }, [requestNotificationPermission]);

  useEffect(() => {
    // Small delay to ensure auth is ready
    const timer = setTimeout(() => {
      checkGoalsNearDeadline();
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkGoalsNearDeadline]);

  return {
    checkGoalsNearDeadline,
    requestNotificationPermission,
    sendBrowserNotification,
  };
};
