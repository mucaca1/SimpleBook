/**
 * Settings-related types
 */

import { SettingsId } from '../evolu/evolu-db';
import { Language, ThemeMode } from './common';

export type CalendarTimeFormat = "12h" | "24h";

/**
 * Settings representation for UI display
 */
export interface Settings {
    id: SettingsId;
    language: Language;
    theme: ThemeMode;
    syncUrl: string | null;
    calendarTimeFormat: CalendarTimeFormat;
    calendarShowWeekends: boolean;
}

/**
 * Data for creating initial settings
 */
export interface SettingsCreateInput {
    language: Language;
    theme: ThemeMode;
    syncUrl?: string | null;
    calendarTimeFormat?: CalendarTimeFormat;
    calendarShowWeekends?: boolean;
}

/**
 * Data for updating settings
 */
export interface SettingsUpdateInput {
    language?: Language;
    theme?: ThemeMode;
    syncUrl?: string | null;
    calendarTimeFormat?: CalendarTimeFormat;
    calendarShowWeekends?: boolean;
}

/**
 * Re-export SettingsId from evolu-db for convenience
 */
export type { SettingsId };
