import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ChartLine, Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingStep {
    icon: React.ElementType;
    titleKey: string;
    descKey: string;
    color: string;
}

const steps: OnboardingStep[] = [
    {
        icon: Upload,
        titleKey: 'onboarding.step1Title',
        descKey: 'onboarding.step1Desc',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        icon: ChartLine,
        titleKey: 'onboarding.step2Title',
        descKey: 'onboarding.step2Desc',
        color: 'from-green-500 to-emerald-500',
    },
    {
        icon: Sparkles,
        titleKey: 'onboarding.step3Title',
        descKey: 'onboarding.step3Desc',
        color: 'from-violet-500 to-purple-500',
    },
];

interface OnboardingProps {
    onComplete: () => void;
}

export const Onboarding = ({ onComplete }: OnboardingProps) => {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('onboarding_completed', 'true');
        setTimeout(onComplete, 300);
    };

    const step = steps[currentStep];
    const StepIcon = step.icon;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
                >
                    {/* Skip button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="max-w-lg mx-auto px-6 text-center">
                        {/* Progress dots */}
                        <div className="flex justify-center gap-2 mb-8">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        'h-2 rounded-full transition-all duration-300',
                                        idx === currentStep
                                            ? 'w-8 bg-primary'
                                            : idx < currentStep
                                                ? 'w-2 bg-primary/50'
                                                : 'w-2 bg-muted'
                                    )}
                                />
                            ))}
                        </div>

                        {/* Icon */}
                        <motion.div
                            key={currentStep}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            className={cn(
                                'mx-auto mb-8 h-24 w-24 rounded-3xl flex items-center justify-center',
                                `bg-gradient-to-br ${step.color}`
                            )}
                        >
                            <StepIcon className="h-12 w-12 text-white" />
                        </motion.div>

                        {/* Content */}
                        <motion.div
                            key={`content-${currentStep}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-2xl font-bold mb-4">{t(step.titleKey)}</h2>
                            <p className="text-muted-foreground mb-8 leading-relaxed">
                                {t(step.descKey)}
                            </p>
                        </motion.div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <Button onClick={handleNext} size="lg" className="w-full gap-2">
                                {currentStep === steps.length - 1
                                    ? t('onboarding.getStarted')
                                    : t('common.next')}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                            {currentStep < steps.length - 1 && (
                                <Button
                                    variant="ghost"
                                    onClick={handleSkip}
                                    className="text-muted-foreground"
                                >
                                    {t('onboarding.skip')}
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


