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
            <Card className={cn('glass-card overflow-hidden', className)}>
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {actions.map((action) => (
                            <motion.button
                                key={action.id}
                                onClick={action.action}
                                onMouseEnter={() => setHoveredAction(action.id)}
                                onMouseLeave={() => setHoveredAction(null)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    'flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200',
                                    'focus:outline-none focus:ring-2 focus:ring-primary/50',
                                    action.bgColor
                                )}
                            >
                                <action.icon className={cn('h-6 w-6 mb-2', action.color)} />
                                <span className="text-sm font-medium">{action.label}</span>
                                <motion.span
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{
                                        opacity: hoveredAction === action.id ? 1 : 0,
                                        height: hoveredAction === action.id ? 'auto' : 0,
                                    }}
                                    className="text-xs text-muted-foreground text-center mt-1 line-clamp-2"
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tipo de Upload</DialogTitle>
                        <DialogDescription>
                            Escolha o tipo de documento que deseja enviar
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Button
                            onClick={handleExamResultUpload}
                            variant="outline"
                            className="h-auto flex-col items-start p-4 hover:bg-primary/5"
                        >
                            <div className="flex items-center gap-3 w-full">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <FileCheck className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-semibold">Resultado de Exame</div>
                                    <div className="text-sm text-muted-foreground">
                                        Envie os resultados dos seus exames para análise
                                    </div>
                                </div>
                            </div>
                        </Button>

                        <Button
                            onClick={handleMedicalRequestUpload}
                            variant="outline"
                            className="h-auto flex-col items-start p-4 hover:bg-primary/5"
                        >
                            <div className="flex items-center gap-3 w-full">
                                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <ClipboardList className="h-6 w-6 text-blue-500" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-semibold">Pedido Médico</div>
                                    <div className="text-sm text-muted-foreground">
                                        Envie um pedido médico para solicitar orçamentos
                                    </div>
                                </div>
                            </div>
                        </Button>
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
