import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    BellOff,
    BellRing,
    CheckCircle2,
    AlertCircle,
    Smartphone,
    Mail,
    Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface NotificationSettingsProps {
    emailNotifications?: boolean;
    digestFrequency?: 'none' | 'weekly' | 'monthly';
    onEmailNotificationsChange?: (enabled: boolean) => void;
    onDigestFrequencyChange?: (frequency: 'none' | 'weekly' | 'monthly') => void;
}

/**
 * Componente de configurações de notificações
 * Gerencia push notifications, email e digest
 */
export const NotificationSettings = ({
    emailNotifications = true,
    digestFrequency = 'none',
    onEmailNotificationsChange,
    onDigestFrequencyChange,
}: NotificationSettingsProps) => {
    const {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        requestPermission,
        subscribe,
        unsubscribe,
        sendTestNotification,
    } = useNotifications();

    const handlePushToggle = async () => {
        if (!isSupported) return;

        if (isSubscribed) {
            await unsubscribe();
        } else {
            if (permission !== 'granted') {
                const granted = await requestPermission();
                if (!granted) return;
            }
            await subscribe();
        }
    };

    const getPermissionBadge = () => {
        if (!isSupported) {
            return (
                <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Não suportado
                </Badge>
            );
        }

        switch (permission) {
            case 'granted':
                return (
                    <Badge className="bg-status-healthy/10 text-status-healthy border-status-healthy/20 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Permitido
                    </Badge>
                );
            case 'denied':
                return (
                    <Badge variant="destructive" className="gap-1">
                        <BellOff className="h-3 w-3" />
                        Bloqueado
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="gap-1">
                        <Bell className="h-3 w-3" />
                        Não configurado
                    </Badge>
                );
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notificações
                </CardTitle>
                <CardDescription>
                    Configure como você deseja receber alertas e lembretes
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Push Notifications */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Smartphone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <Label className="text-base font-medium">Notificações Push</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receba alertas em tempo real no navegador
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {getPermissionBadge()}
                            <Switch
                                checked={isSubscribed}
                                onCheckedChange={handlePushToggle}
                                disabled={!isSupported || permission === 'denied' || isLoading}
                                aria-label="Ativar notificações push"
                            />
                        </div>
                    </div>

                    {isSubscribed && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={sendTestNotification}
                            className="ml-[52px]"
                        >
                            <BellRing className="h-4 w-4 mr-2" />
                            Enviar notificação de teste
                        </Button>
                    )}

                    {permission === 'denied' && (
                        <div className="ml-[52px] p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            <AlertCircle className="h-4 w-4 inline mr-2" />
                            Notificações bloqueadas. Altere nas configurações do navegador.
                        </div>
                    )}
                </div>

                <div className="border-t border-border" />

                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <Label className="text-base font-medium">Notificações por Email</Label>
                            <p className="text-sm text-muted-foreground">
                                Receba alertas importantes por email
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={emailNotifications}
                        onCheckedChange={onEmailNotificationsChange}
                        aria-label="Ativar notificações por email"
                    />
                </div>

                <div className="border-t border-border" />

                {/* Digest Frequency */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <Label className="text-base font-medium">Resumo Periódico</Label>
                            <p className="text-sm text-muted-foreground">
                                Receba um resumo dos seus exames
                            </p>
                        </div>
                    </div>
                    <Select
                        value={digestFrequency}
                        onValueChange={(v) => onDigestFrequencyChange?.(v as 'none' | 'weekly' | 'monthly')}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Desativado</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Notification types info */}
                <div className="mt-6 p-4 rounded-xl bg-muted/50">
                    <h4 className="text-sm font-medium mb-3">Você receberá notificações sobre:</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-status-healthy" />
                            Resultados de exames processados
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-status-healthy" />
                            Alertas de valores fora do normal
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-status-healthy" />
                            Lembretes de exames periódicos
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-status-healthy" />
                            Metas de saúde alcançadas
                        </li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};
