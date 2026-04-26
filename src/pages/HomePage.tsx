import React from "react";
import { Box, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { EventCalendar } from "@mui/x-scheduler";
import { sk } from "date-fns/locale/sk";
import { useCalendarEventCrud } from "../hooks/useCalendarEventCrud";
import { skSKSchedulerLocaleText } from "../i18n/locales/sk/scheduler";

export function HomePage() {
    const { i18n } = useTranslation();
    const { events, isLoading, handleEventsChange } = useCalendarEventCrud();
    const isSk = i18n.language === "sk";
    const localeText = isSk ? skSKSchedulerLocaleText : undefined;
    const dateLocale = isSk ? sk : undefined;

    if (isLoading) {
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
                sx={{ height: "100%" }}
            />
        </Box>
    );
}
