import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Share2, Copy, Check, Link, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShareExamDialogProps {
    examId?: string;
    shareAll?: boolean;
    trigger?: React.ReactNode;
}

export const ShareExamDialog = ({ examId, shareAll = false, trigger }: ShareExamDialogProps) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [expiresIn, setExpiresIn] = useState('24');

    const generateShareLink = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Generate a unique token
            const token = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));

            // Save to database
            const { error } = await supabase.from('shared_links').insert({
                user_id: user.id,
                exam_id: shareAll ? null : examId,
                token,
                expires_at: expiresAt.toISOString(),
            });

            if (error) throw error;

            // Generate the share URL
            const baseUrl = window.location.origin;
            const link = `${baseUrl}/shared/${token}`;
            setShareLink(link);
            toast.success(t('share.linkGenerated'));
        } catch (error) {
            console.error('Error generating share link:', error);
            toast.error('Erro ao gerar link');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!shareLink) return;

        try {
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            toast.success(t('share.linkCopied'));
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error('Erro ao copiar');
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setShareLink(null);
            setCopied(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Share2 className="h-4 w-4" />
                        {t('share.title')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" />
                        {t('share.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('share.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!shareLink ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="expires">{t('share.expiresIn')}</Label>
                                <Select value={expiresIn} onValueChange={setExpiresIn}>
                                    <SelectTrigger id="expires">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="24">24 {t('share.hours')}</SelectItem>
                                        <SelectItem value="48">48 {t('share.hours')}</SelectItem>
                                        <SelectItem value="168">7 {t('share.days')}</SelectItem>
                                        <SelectItem value="720">30 {t('share.days')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Eye className="h-4 w-4" />
                                    <span>
                                        {shareAll
                                            ? 'Todos os seus exames serão compartilhados'
                                            : 'Apenas este exame será compartilhado'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                                    <Clock className="h-4 w-4" />
                                    <span>O link expirará automaticamente após o período selecionado</span>
                                </div>
                            </div>

                            <Button
                                onClick={generateShareLink}
                                disabled={loading}
                                className="w-full gap-2"
                            >
                                <Link className="h-4 w-4" />
                                {loading ? 'Gerando...' : t('share.generateLink')}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="p-4 rounded-xl bg-status-healthy/10 border border-status-healthy/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Check className="h-5 w-5 text-status-healthy" />
                                    <span className="font-medium text-status-healthy">
                                        {t('share.linkGenerated')}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Compartilhe este link com seu médico. Ele expirará em{' '}
                                    {parseInt(expiresIn) < 48
                                        ? `${expiresIn} horas`
                                        : `${Math.floor(parseInt(expiresIn) / 24)} dias`}
                                    .
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    value={shareLink}
                                    readOnly
                                    className="font-mono text-xs"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={copyToClipboard}
                                    className={cn(
                                        'shrink-0 transition-colors',
                                        copied && 'bg-status-healthy text-white'
                                    )}
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>

                            <Button variant="outline" onClick={() => setShareLink(null)} className="w-full">
                                Gerar novo link
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
