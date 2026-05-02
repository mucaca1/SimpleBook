import { Box, CircularProgress } from "@mui/material";
import { useCalendarEventCrud } from "../hooks/useCalendarEventCrud";
import { EventList } from "../components/scheduler/EventList";
import { CustomEventCalendar } from "../components/eventCalendar";

export function HomePage() {
    const {
        allEventRows,
        isLoading,
        getEmployeeIdsForEvent,
    } = useCalendarEventCrud();

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", height: "calc(100vh - 120px)", gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <CustomEventCalendar sx={{ height: "100%" }} />
            </Box>
            <Box sx={{
                width: 320,
                flexShrink: 0,
                overflowY: "auto",
                borderLeft: 1,
                borderColor: "divider",
                pl: 1,
            }}>
                <EventList
                    events={allEventRows}
                    getEmployeeIdsForEvent={getEmployeeIdsForEvent}
                    onAssignClick={() => {}}
                />
            </Box>
        </Box>
    );
}
