import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    Upload,
    TrendingUp,
    Bell,
    Share2,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Sparkles,
    ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
    id: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    title: string;
    description: string;
    feature?: string;
}

const onboardingSteps: OnboardingStep[] = [
    {
        id: 'upload',
        icon: Upload,
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        title: 'Faça upload dos seus exames',
        description: 'Arraste PDFs ou imagens de exames para a área de upload. Nossa IA extrai automaticamente os resultados.',
        feature: 'Suporte a PDF, PNG, JPG e câmera',
    },
    {
        id: 'trending',
        icon: TrendingUp,
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-500',
        title: 'Acompanhe suas tendências',
        description: 'Veja a evolução dos seus marcadores ao longo do tempo com gráficos interativos e insights personalizados.',
        feature: 'Análise de IA incluída',
    },
    {
        id: 'alerts',
        icon: Bell,
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-500',
        title: 'Receba alertas inteligentes',
        description: 'Seja notificado quando seus valores estiverem fora do normal ou quando for hora de repetir um exame.',
        feature: 'Push, email e lembretes',
    },
    {
        id: 'share',
        icon: Share2,
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        title: 'Compartilhe com seu médico',
        description: 'Gere links seguros para compartilhar seus exames com profissionais de saúde.',
        feature: 'Links expiráveis e seguros',
    },
];

interface OnboardingTourProps {
    onComplete: () => void;
    onSkip?: () => void;
}

/**
 * Tour de onboarding com steps animados
 */
export const OnboardingTour = ({ onComplete, onSkip }: OnboardingTourProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1);

    const step = onboardingSteps[currentStep];
    const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
    const isLastStep = currentStep === onboardingSteps.length - 1;

    const goToNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        }
    };

    const goToPrev = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        }
    };

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction > 0 ? -300 : 300,
            opacity: 0,
        }),
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-lg overflow-hidden">
                <CardContent className="p-0">
                    {/* Progress bar */}
                    <div className="p-4 border-b border-border">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">
                                Passo {currentStep + 1} de {onboardingSteps.length}
                            </span>
                            {onSkip && (
                                <Button variant="ghost" size="sm" onClick={onSkip}>
                                    Pular tour
                                </Button>
                            )}
                        </div>
                        <Progress value={progress} className="h-1.5" />
                    </div>

                    {/* Step content */}
                    <div className="relative h-[320px] overflow-hidden">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={step.id}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className="absolute inset-0 p-8 flex flex-col items-center text-center"
                            >
                                {/* Icon */}
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className={cn(
                                        'h-20 w-20 rounded-2xl flex items-center justify-center mb-6',
                                        step.iconBg
                                    )}
                                >
                                    <step.icon className={cn('h-10 w-10', step.iconColor)} />
                                </motion.div>

                                {/* Title */}
                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-xl font-bold mb-3"
                                >
                                    {step.title}
                                </motion.h2>

                                {/* Description */}
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-muted-foreground mb-4"
                                >
                                    {step.description}
                                </motion.p>

                                {/* Feature tag */}
                                {step.feature && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10"
                                    >
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium text-primary">
                                            {step.feature}
                                        </span>
                                    </motion.div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Step indicators */}
                    <div className="flex items-center justify-center gap-2 py-4">
                        {onboardingSteps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setDirection(index > currentStep ? 1 : -1);
                                    setCurrentStep(index);
                                }}
                                className={cn(
                                    'h-2 rounded-full transition-all',
                                    index === currentStep
                                        ? 'w-8 bg-primary'
                                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                )}
                                aria-label={`Ir para passo ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between p-4 border-t border-border">
                        <Button
                            variant="ghost"
                            onClick={goToPrev}
                            disabled={currentStep === 0}
                            className="gap-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                        </Button>

                        <Button onClick={goToNext} className="gap-2">
                            {isLastStep ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Começar
                                </>
                            ) : (
                                <>
                                    Próximo
                                    <ChevronRight className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
