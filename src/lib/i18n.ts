import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from '@/locales/pt-BR.json';
import enUS from '@/locales/en-US.json';
import esES from '@/locales/es-ES.json';

const savedLanguage = localStorage.getItem('language') || 'pt-BR';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            'pt-BR': { translation: ptBR },
            'en-US': { translation: enUS },
            'es-ES': { translation: esES },
        },
        lng: savedLanguage,
        fallbackLng: 'pt-BR',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;

export const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
};

export const languages = [
    { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
];
