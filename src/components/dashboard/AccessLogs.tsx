import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Monitor, Smartphone, Globe, Clock, MapPin } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AccessLog {
    id: string;
    ip_address: string | null;
    user_agent: string | null;
    logged_at: string;
}

export const AccessLogs = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('access_logs')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('logged_at', { ascending: false })
                    .limit(20);

                if (error) throw error;
                setLogs(data || []);
            } catch (error) {
                console.error('Error fetching access logs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [user]);

    const parseUserAgent = (ua: string | null) => {
        if (!ua) return { device: 'Desconhecido', browser: 'Desconhecido' };

        const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
        const isTablet = /iPad|Tablet/i.test(ua);

        let browser = 'Navegador';
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';

        let device = 'Desktop';
        if (isTablet) device = 'Tablet';
        else if (isMobile) device = 'Mobile';

        return { device, browser };
    };

    const getDeviceIcon = (ua: string | null) => {
        const { device } = parseUserAgent(ua);
        if (device === 'Mobile') return <Smartphone className="h-4 w-4" />;
        return <Monitor className="h-4 w-4" />;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Histórico de Acessos
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

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Histórico de Acessos
                </CardTitle>
                <CardDescription>
                    Últimos 20 acessos à sua conta
                </CardDescription>
            </CardHeader>
            <CardContent>
                {logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum registro de acesso</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-3">
                            {logs.map((log, index) => {
                                const { device, browser } = parseUserAgent(log.user_agent);
                                const isCurrentSession = index === 0;

                                return (
                                    <div
                                        key={log.id}
                                        className={`p-4 rounded-xl border transition-colors ${isCurrentSession
                                                ? 'bg-primary/5 border-primary/30'
                                                : 'bg-muted/30 border-border/50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                    {getDeviceIcon(log.user_agent)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{device}</span>
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            {browser}
                                                        </Badge>
                                                        {isCurrentSession && (
                                                            <Badge className="text-[10px] bg-primary">
                                                                Atual
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {log.ip_address && (
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                                            <MapPin className="h-3 w-3" />
                                                            <span>{log.ip_address}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>
                                                        {formatDistanceToNow(new Date(log.logged_at), {
                                                            addSuffix: true,
                                                            locale: ptBR,
                                                        })}
                                                    </span>
                                                </div>
                                                <span className="text-xs">
                                                    {format(new Date(log.logged_at), 'dd/MM/yyyy HH:mm', {
                                                        locale: ptBR,
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
};
