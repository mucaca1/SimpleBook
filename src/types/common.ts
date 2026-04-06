/**
 * Common/shared types used across the application
 */

/**
 * Supported language codes
 */
export type Language = 'en' | 'sk';

/**
 * Theme mode options
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Language display names mapping
 */
export const LANGUAGE_LABELS: Record<Language, string> = {
    en: 'English',
    sk: 'Slovak',
};

/**
 * Theme mode display names mapping
 */
export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
    light: 'Light',
    dark: 'Dark',
};
