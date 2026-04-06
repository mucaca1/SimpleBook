import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from "./locales/en/translation.json";
import sk from "./locales/sk/translation.json";

const savedLang = localStorage.getItem('i18nextLng') || 'en';

i18n
    .use(LanguageDetector) // auto-detect language
    .use(initReactI18next)  // bind i18n to React
    .init({
        lng: savedLang,
        fallbackLng: 'sk',
        interpolation: {
            escapeValue: false, // react already escapes
        },
        resources: {
            en: { translation: en },
            sk: { translation: sk },
        },
    });

export default i18n;