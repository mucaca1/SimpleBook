import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { EventCalendar } from "@mui/x-scheduler";
import { useCalendarEventCrud } from "../hooks/useCalendarEventCrud";

export function HomePage() {
    const { t } = useTranslation();
    const { events, isLoading, handleEventsChange } = useCalendarEventCrud();

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
                sx={{ height: "100%" }}
            />
        </Box>
    );
}
