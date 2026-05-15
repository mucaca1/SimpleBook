/**
 * useSettingsSync - Custom hook for syncing Evolu settings with i18n and theme
 *
 * Handles synchronization between:
 * - Evolu database settings
 * - i18next language state
 * - ThemeContext theme state
 *
 * This ensures settings persist across sessions and stay in sync
 * when changed from either the database or UI.
 */

import { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueries, useQuery } from "@evolu/react";
import { ThemeContext } from "../context/ThemeContext";
import { Language } from "../types/common";
import { ThemeMode } from "../types/common";
import { settings } from "../evolu/evolu-query";
import { evolu } from "../evolu-init";
import { SettingsId } from "../evolu/evolu-db";

/**
 * Hook return type
 */
interface UseSettingsSyncReturn {
    isInitialized: boolean;
    language: Language | null;
    theme: ThemeMode | null;
    currency: string | null;
    id: SettingsId | null;
}

/**
 * Custom hook that synchronizes Evolu settings with i18n and theme contexts
 */
export function useSettingsSync(): UseSettingsSyncReturn {
    const { i18n } = useTranslation();
    const { mode, setTheme } = useContext(ThemeContext);

    // Query settings from Evolu database
    const result = useQuery(settings);

    // Extract settings row
    const settingsRow = result.length > 1 && result.length > 0 ? result[0] : null;

    // Sync language when settings change
    useEffect(() => {
        if (settingsRow && settingsRow.language) {
            const dbLanguage = settingsRow.language as Language;
            if (i18n.language !== dbLanguage) {
                i18n.changeLanguage(dbLanguage);
            }
        }
    }, [settingsRow, i18n]);

    // Sync theme when settings change
    useEffect(() => {
        if (settingsRow && settingsRow.theme) {
            const dbTheme = settingsRow.theme as ThemeMode;
            if (mode !== dbTheme) {
                setTheme(dbTheme);
            }
        }
    }, [settingsRow, mode, setTheme]);

    return {
        isInitialized: settingsRow !== null,
        language: settingsRow?.language as Language | null,
        theme: settingsRow?.theme as ThemeMode | null,
        currency: settingsRow?.currency as string | null,
        id: settingsRow?.id as SettingsId | null,
    };
}

/**
 * Type for query results used in App.tsx
 */
export type SettingsQueryResult = typeof useSettingsSync extends () => infer R ? R : never;

/**
 * Helper to check if settings exist (user has completed welcome flow)
 */
export function useHasSettings(): boolean {
    const result = useQueries([settings]);
    return result.length > 1 && result[1].length > 0;
}

/**
 * Get raw query results for pages that need both todos and settings
 */
export function useAppQueries() {
    return useQueries([settings]);
}

/**
 * Update the language setting in the database
 *
 * Persists the language change to the Evolu database.
 * The useSettingsSync hook will automatically sync the change
 * to i18next, causing the UI to update.
 *
 * Shows success/error toast notifications
 *
 * @param language - The language to set ("en" or "sk")
 *
 * @example
 * ```tsx
 * // In a component
 * const handleLanguageChange = (newLanguage: Language) => {
 *   await updateLanguage(newLanguage);
 * };
 * ```
 */
export async function updateLanguage(id: SettingsId | null, language: string): Promise<void> {
    try {
        if (id) {
            // Update existing settings
            const updateResult = await evolu.update("settings", {
                id: id,
                language,
            });

            if (!updateResult.ok) {
                throw new Error(updateResult.error.message);
            }
        }
    } catch (error) {
        console.error("Failed to update language:", error);
        throw error;
    }
}

/**
 * Update the theme setting in the database
 *
 * Persists the theme change to the Evolu database.
 * The useSettingsSync hook will automatically sync the change
 * to ThemeContext, causing the UI to update.
 *
 * Shows success/error toast notifications
 *
 * @param theme - The theme mode to set ("light" or "dark")
 *
 * @example
 * ```tsx
 * // In a component
 * const handleThemeChange = (newTheme: ThemeMode) => {
 *   await updateTheme(newTheme);
 * };
 * ```
 */
export async function updateTheme(id: SettingsId | null, theme: string): Promise<void> {
    try {
        if (id) {
            const updateResult = await evolu.update("settings", {
                id: id,
                theme,
            });

            if (!updateResult.ok) {
                throw new Error(updateResult.error.message);
            }
        }
    } catch (error) {
        console.error("Failed to update theme:", error);
        throw error;
    }
}

export async function updateCurrency(id: SettingsId | null, currency: string): Promise<void> {
    try {
        if (id) {
            const updateResult = await evolu.update("settings", {
                id: id,
                currency,
            });

            if (!updateResult.ok) {
                throw new Error(updateResult.error.message);
            }
        }
    } catch (error) {
        console.error("Failed to update currency:", error);
        throw error;
    }
}

export async function updateCalendarTimeFormat(id: SettingsId | null, calendarTimeFormat: string): Promise<void> {
    try {
        if (id) {
            const updateResult = await evolu.update("settings", {
                id: id,
                calendarTimeFormat
            });

            if (!updateResult.ok) {
                throw new Error(updateResult.error.message);
            }
        }
    } catch (error) {
        console.error("Failed to update calendar time format:", error);
        throw error;
    }
}

export async function updateCalendarShowWeekends(id: SettingsId | null, calendarShowWeekends: number): Promise<void> {
    try {
        if (id) {
            const updateResult = await evolu.update("settings", {
                id: id,
                calendarShowWeekends,
            });

            if (!updateResult.ok) {
                throw new Error(updateResult.error.message);
            }
        }
    } catch (error) {
        console.error("Failed to update calendar show weekends:", error);
        console.error("Failed to update currency:", error);
        throw error;
    }
}
