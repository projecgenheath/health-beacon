import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Upload,
    BarChart3,
    Share2,
    FileText,
    CalendarPlus,
    Target,
    Pill,
    Settings,
    FileCheck,
    ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface QuickAction {
    id: string;
    icon: React.ElementType;
    label: string;
    description: string;
    color: string;
    bgColor: string;
    action: () => void;
}

interface QuickActionsProps {
    onUploadClick?: () => void;
    className?: string;
}

/**
 * Componente de ações rápidas para o dashboard
 * Fornece acesso rápido às principais funcionalidades
 */
export const QuickActions = ({ onUploadClick, className }: QuickActionsProps) => {
    const navigate = useNavigate();
    const [hoveredAction, setHoveredAction] = useState<string | null>(null);
    const [showUploadDialog, setShowUploadDialog] = useState(false);

    const handleUploadClick = () => {
        setShowUploadDialog(true);
    };

    const handleExamResultUpload = () => {
        setShowUploadDialog(false);
        if (onUploadClick) {
            onUploadClick();
        }
    };

    const handleMedicalRequestUpload = () => {
        setShowUploadDialog(false);
        navigate('/patient/request-exam');
    };

    const actions: QuickAction[] = [
        {
            id: 'upload',
            icon: Upload,
            label: 'Upload',
            description: 'Envie um novo exame',
            color: 'text-primary',
            bgColor: 'bg-primary/10 hover:bg-primary/20',
            action: handleUploadClick,
        },
        {
            id: 'compare',
            icon: BarChart3,
            label: 'Comparar',
            description: 'Compare seus exames',
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
            action: () => navigate('/dashboard/compare'),
        },
        {
            id: 'report',
            icon: FileText,
            label: 'Relatório',
            description: 'Gere um relatório PDF',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
            action: () => navigate('/dashboard/reports'),
        },
        {
            id: 'analytics',
            icon: Target,
            label: 'Análises',
            description: 'Veja estatísticas',
            color: 'text-violet-500',
            bgColor: 'bg-violet-500/10 hover:bg-violet-500/20',
            action: () => navigate('/dashboard/analytics'),
        },
    ];

    return (
        <>
            <Card className={cn('glass-card border-none overflow-hidden shadow-lg', className)}>
                <CardContent className="p-3 sm:p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        {actions.map((action) => (
                            <motion.button
                                key={action.id}
                                onClick={action.action}
                                onMouseEnter={() => setHoveredAction(action.id)}
                                onMouseLeave={() => setHoveredAction(null)}
                                whileHover={{ y: -4, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    'group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all duration-300',
                                    'focus:outline-none focus:ring-2 focus:ring-primary/50 overflow-hidden',
                                    'bg-background/40 hover:bg-background/60 shadow-sm border border-border/50'
                                )}
                            >
                                {/* Background glow on hover */}
                                <div className={cn(
                                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                                    action.id === 'upload' ? 'bg-primary' :
                                        action.id === 'compare' ? 'bg-blue-500' :
                                            action.id === 'report' ? 'bg-emerald-500' : 'bg-violet-500'
                                )} />

                                <div className={cn(
                                    'h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-transform duration-300 group-hover:rotate-6',
                                    action.bgColor
                                )}>
                                    <action.icon className={cn('h-5 w-5 sm:h-6 sm:w-6', action.color)} />
                                </div>

                                <span className="text-sm font-semibold tracking-tight">{action.label}</span>

                                <motion.span
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{
                                        opacity: hoveredAction === action.id ? 1 : 0,
                                        height: hoveredAction === action.id ? 'auto' : 0,
                                    }}
                                    className="text-[10px] sm:text-xs text-muted-foreground text-center mt-1 sm:mt-2 line-clamp-1 max-w-[80px] sm:max-w-none"
                                >
                                    {action.description}
                                </motion.span>
                            </motion.button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Upload Type Selection Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl animate-scale-in">
                    <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-bold tracking-tight">Tipo de Upload</DialogTitle>
                            <DialogDescription className="text-base">
                                Escolha o tipo de documento que deseja enviar para sua conta
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleExamResultUpload}
                                className="group relative w-full flex items-center gap-4 p-5 rounded-2xl bg-background/80 hover:bg-background border border-border/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md text-left"
                            >
                                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                    <FileCheck className="h-7 w-7 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">Resultado de Exame</h4>
                                    <p className="text-sm text-muted-foreground leading-snug">
                                        Envie laudos PDF ou fotos de exames já realizados para análise automática.
                                    </p>
                                </div>
                                <div className="h-8 w-8 rounded-full border border-border/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleMedicalRequestUpload}
                                className="group relative w-full flex items-center gap-4 p-5 rounded-2xl bg-background/80 hover:bg-background border border-border/50 hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-md text-left"
                            >
                                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                    <ClipboardList className="h-7 w-7 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-foreground mb-1 group-hover:text-blue-500 transition-colors">Pedido Médico</h4>
                                    <p className="text-sm text-muted-foreground leading-snug">
                                        Envie a solicitação do seu médico para receber orçamentos de laboratórios fixos.
                                    </p>
                                </div>
                                <div className="h-8 w-8 rounded-full border border-border/50 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-primary-foreground transition-all">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </motion.button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-border/20 flex justify-center text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                            Biometric Health Bank • Segurança Garantida
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};


/**
 * Versão compacta das ações rápidas para mobile
 */
export const QuickActionsCompact = ({ onUploadClick }: QuickActionsProps) => {
    const navigate = useNavigate();

    const actions = [
        {
            icon: Upload,
            label: 'Upload',
            color: 'text-primary',
            action: onUploadClick || (() => { }),
        },
        {
            icon: BarChart3,
            label: 'Comparar',
            color: 'text-blue-500',
            action: () => navigate('/dashboard/compare'),
        },
        {
            icon: FileText,
            label: 'Relatório',
            color: 'text-emerald-500',
            action: () => navigate('/dashboard/reports'),
        },
    ];

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {actions.map((action, index) => (
                <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    className="flex items-center gap-2 shrink-0"
                >
                    <action.icon className={cn('h-4 w-4', action.color)} />
                    {action.label}
                </Button>
            ))}
        </div>
    );
};
