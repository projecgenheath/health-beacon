import { useState, useEffect } from 'react';

// Hook to manage onboarding state
export const useOnboarding = () => {
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isFirstVisit, setIsFirstVisit] = useState(false);

    useEffect(() => {
        const completed = localStorage.getItem('onboarding_completed');
        if (!completed) {
            setShowOnboarding(true);
            setIsFirstVisit(true);
        }
    }, []);

    const completeOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem('onboarding_completed', 'true');
    };

    const resetOnboarding = () => {
        localStorage.removeItem('onboarding_completed');
        setShowOnboarding(true);
    };

    return {
        showOnboarding,
        isFirstVisit,
        completeOnboarding,
        resetOnboarding,
    };
};
