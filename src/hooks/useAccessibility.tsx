import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface AccessibilitySettings {
    reducedMotion: boolean;
    highContrast: boolean;
    largeText: boolean;
    screenReaderMode: boolean;
}

interface AccessibilityContextType {
    settings: AccessibilitySettings;
    updateSetting: <K extends keyof AccessibilitySettings>(
        key: K,
        value: AccessibilitySettings[K]
    ) => void;
    resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReaderMode: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

const STORAGE_KEY = 'health-beacon-a11y-settings';

/**
 * Provider de acessibilidade
 * Gerencia configurações de acessibilidade do usuário
 */
export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<AccessibilitySettings>(() => {
        // Load from localStorage
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    return { ...defaultSettings, ...JSON.parse(stored) };
                } catch {
                    return defaultSettings;
                }
            }
        }
        return defaultSettings;
    });

    // Detect system preferences
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        // Only auto-set if user hasn't explicitly set a preference
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored && mediaQuery.matches) {
            setSettings(prev => ({ ...prev, reducedMotion: true }));
        }

        const handleChange = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                setSettings(prev => ({ ...prev, reducedMotion: e.matches }));
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Apply settings to document
    useEffect(() => {
        const html = document.documentElement;

        // Reduced motion
        if (settings.reducedMotion) {
            html.classList.add('reduce-motion');
        } else {
            html.classList.remove('reduce-motion');
        }

        // High contrast
        if (settings.highContrast) {
            html.classList.add('high-contrast');
        } else {
            html.classList.remove('high-contrast');
        }

        // Large text
        if (settings.largeText) {
            html.classList.add('large-text');
        } else {
            html.classList.remove('large-text');
        }

        // Screen reader mode (adds extra context)
        if (settings.screenReaderMode) {
            html.setAttribute('data-screen-reader', 'true');
        } else {
            html.removeAttribute('data-screen-reader');
        }
    }, [settings]);

    // Persist settings
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    const updateSetting = <K extends keyof AccessibilitySettings>(
        key: K,
        value: AccessibilitySettings[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings }}>
            {children}
        </AccessibilityContext.Provider>
    );
};

/**
 * Hook para acessar configurações de acessibilidade
 */
export const useAccessibility = (): AccessibilityContextType => {
    const context = useContext(AccessibilityContext);

    if (!context) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }

    return context;
};

/**
 * Hook simplificado para verificar preferência de movimento reduzido
 */
export const usePrefersReducedMotion = (): boolean => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const handleChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return prefersReducedMotion;
};
