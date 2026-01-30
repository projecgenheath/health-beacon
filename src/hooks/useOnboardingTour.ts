import { useState, useEffect } from 'react';

/**
 * Hook para controlar exibição do onboarding com tour
 */
export const useOnboardingTour = () => {
    const STORAGE_KEY = 'health-beacon-onboarding-complete';
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const completed = localStorage.getItem(STORAGE_KEY);
        if (!completed) {
            setShowOnboarding(true);
        }
        setIsLoading(false);
    }, []);

    const completeOnboarding = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setShowOnboarding(false);
    };

    const resetOnboarding = () => {
        localStorage.removeItem(STORAGE_KEY);
        setShowOnboarding(true);
    };

    return {
        showOnboarding,
        isLoading,
        completeOnboarding,
        resetOnboarding,
    };
};
