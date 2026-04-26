import { useCallback } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { EventCalendar } from "@mui/x-scheduler";
import type { EventCalendarPreferences } from "@mui/x-scheduler-headless/models";
import { sk } from "date-fns/locale/sk";
import { useQuery } from "@evolu/react";
import { sqliteFalse } from "@evolu/common";
import { useCalendarEventCrud } from "../hooks/useCalendarEventCrud";
import { skSKSchedulerLocaleText } from "../i18n/locales/sk/scheduler";
import { settings } from "../evolu/evolu-query";
import { evolu } from "../evolu-init";
import type { SettingsId } from "../evolu/evolu-db";

export function HomePage() {
    const { i18n } = useTranslation();
    const { events, isLoading, handleEventsChange } = useCalendarEventCrud();
    const rows = useQuery(settings);
    const settingsRow = rows.length > 1 && rows.length > 0 ? rows[0] : null;

    const isSk = i18n.language === "sk";
    const localeText = isSk ? skSKSchedulerLocaleText : undefined;
    const dateLocale = isSk ? sk : undefined;

    const ampm = settingsRow?.calendarTimeFormat === "12h";
    const showWeekends = settingsRow?.calendarShowWeekends !== sqliteFalse;

    const preferences: Partial<EventCalendarPreferences> = {
        ampm,
        showWeekends,
    };

    const handlePreferencesChange = useCallback(
        (newPrefs: Partial<EventCalendarPreferences>) => {
            if (!settingsRow?.id) return;
            evolu.update("settings", {
                id: settingsRow.id as SettingsId,
                ...(newPrefs.ampm !== undefined && {
                    calendarTimeFormat: newPrefs.ampm ? "12h" : "24h",
                }),
                ...(newPrefs.showWeekends !== undefined && {
                    calendarShowWeekends: newPrefs.showWeekends ? 1 : 0,
                }),
            });
        },
        [settingsRow?.id],
    );

    if (isLoading || !settingsRow) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ height: "calc(100vh - 120px)" }}>
            <EventCalendar
                events={events}
                onEventsChange={handleEventsChange}
                defaultView="week"
                dateLocale={dateLocale}
                localeText={localeText}
                preferences={preferences}
                onPreferencesChange={handlePreferencesChange}
                sx={{ height: "100%" }}
            />
        </Box>
    );
}
