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

import { useContext, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQueries, useQuery } from "@evolu/react";
import { ThemeContext } from "../context/ThemeContext";
import { Language } from "../types/common";
import { ThemeMode } from "../types/common";
import { settings } from "../evolu/evolu-query";

/**
 * Hook return type
 */
interface UseSettingsSyncReturn {
    isInitialized: boolean;
    language: Language | null;
    theme: ThemeMode | null;
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
