import { useState, useCallback } from "react";
import { Box, CircularProgress } from "@mui/material";
import dayjs from "dayjs";
import type { SchedulerEvent } from "@mui/x-scheduler/models";
import { useCalendarEventCrud } from "../hooks/useCalendarEventCrud";
import { useServiceCrud } from "../hooks/useServiceCrud";
import { EventList } from "../components/scheduler/EventList";
import { CustomEventCalendar } from "../components/eventCalendar";
import { EventFormPanel } from "../components/eventCalendar/EventFormPanel";
import { saveCustomFieldValuesForCalendarEvent } from "../evolu/customFieldUtils";
import type { CalendarEventId } from "../evolu/evolu-db";
import type { CalendarEventFormData, ExternalDraftData } from "../components/eventCalendar/types";

interface FormState {
    open: boolean;
    mode: "create" | "edit";
    data?: Partial<CalendarEventFormData>;
}

const INITIAL_FORM_STATE: FormState = { open: false, mode: "create" };

export function HomePage() {
    const {
        allEventRows,
        isLoading,
        getEmployeeIdsForEvent,
        getCustomerIdsForEvent,
        createEvent,
        updateEvent,
        deleteEvent,
        assignEmployees,
        assignCustomers,
    } = useCalendarEventCrud();
    const { services } = useServiceCrud();

    const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
    const [draftData, setDraftData] = useState<ExternalDraftData | null>(null);

    const handleDraftChange = useCallback((draft: ExternalDraftData) => {
        setDraftData(draft);
    }, []);

    const handleSlotClick = useCallback((_day: dayjs.Dayjs, startTime: dayjs.Dayjs) => {
        setFormState({
            open: true,
            mode: "create",
            data: {
                start: startTime.toISOString(),
                end: startTime.add(1, "hour").toISOString(),
            },
        });
    }, []);

    const handleEventClick = useCallback((event: SchedulerEvent) => {
        const eventId = String(event.id);
        const employeeIds = getEmployeeIdsForEvent(eventId);
        const customerIds = getCustomerIdsForEvent(eventId);
        const eventRow = allEventRows.find((r) => String(r.id) === eventId);
        setFormState({
            open: true,
            mode: "edit",
            data: {
                id: eventId,
                title: event.title || "",
                description: event.description || "",
                start: event.start,
                end: event.end,
                allDay: event.allDay ?? false,
                color: event.color ?? null,
                resource: event.resource ?? null,
                roomId: eventRow?.roomId ? String(eventRow.roomId) : null,
                employeeIds,
                customerIds,
            },
        });
    }, [getEmployeeIdsForEvent, getCustomerIdsForEvent, allEventRows]);

    const handleFormSave = useCallback(async (formData: CalendarEventFormData) => {
        if (formState.mode === "create") {
            const newId = await createEvent({
                title: formData.title,
                description: formData.description || undefined,
                start: formData.start,
                end: formData.end,
                allDay: formData.allDay || undefined,
                color: formData.color ?? undefined,
                resource: formData.resource ?? undefined,
            }, formData.roomId);
            if (newId) {
                await assignEmployees(newId, formData.employeeIds);
                await assignCustomers(newId, formData.customerIds);
                if (Object.keys(formData.customFieldValues).length > 0) {
                    await saveCustomFieldValuesForCalendarEvent(
                        newId as CalendarEventId,
                        formData.customFieldValues
                    );
                }
            }
        } else if (formData.id) {
            await updateEvent(formData.id, {
                title: formData.title,
                description: formData.description || undefined,
                start: formData.start,
                end: formData.end,
                allDay: formData.allDay || undefined,
                color: formData.color ?? undefined,
                resource: formData.resource ?? undefined,
            }, formData.roomId);
            await assignEmployees(formData.id, formData.employeeIds);
            await assignCustomers(formData.id, formData.customerIds);
            if (Object.keys(formData.customFieldValues).length > 0) {
                await saveCustomFieldValuesForCalendarEvent(
                    formData.id as CalendarEventId,
                    formData.customFieldValues
                );
            }
        }
        setFormState(INITIAL_FORM_STATE);
        setDraftData(null);
    }, [formState.mode, createEvent, updateEvent, assignEmployees, assignCustomers]);

    const handleFormDelete = useCallback(async (id: string) => {
        await deleteEvent(id);
        setFormState(INITIAL_FORM_STATE);
        setDraftData(null);
    }, [deleteEvent]);

    const handleFormClose = useCallback(() => {
        setFormState(INITIAL_FORM_STATE);
        setDraftData(null);
    }, []);

    const handleEditFromList = useCallback((eventRow: typeof allEventRows[number]) => {
        const eventId = String(eventRow.id);
        const employeeIds = getEmployeeIdsForEvent(eventId);
        const customerIds = getCustomerIdsForEvent(eventId);
        setFormState({
            open: true,
            mode: "edit",
            data: {
                id: eventId,
                title: String(eventRow.title ?? ""),
                description: String(eventRow.description ?? ""),
                start: String(eventRow.start),
                end: String(eventRow.end),
                allDay: Boolean(eventRow.allDay),
                color: eventRow.color ? String(eventRow.color) : null,
                resource: eventRow.resource ? String(eventRow.resource) : null,
                roomId: eventRow.roomId ? String(eventRow.roomId) : null,
                employeeIds,
                customerIds,
            },
        });
    }, [getEmployeeIdsForEvent, getCustomerIdsForEvent]);

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", height: "calc(100vh - 120px)", gap: 0 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <CustomEventCalendar
                    sx={{ height: "100%" }}
                    onSlotClick={handleSlotClick}
                    onEventClick={handleEventClick}
                    externalFormOpen={formState.open}
                    externalDraftData={draftData}
                />
            </Box>
            <Box sx={{
                width: 360,
                flexShrink: 0,
                borderLeft: 1,
                borderColor: "divider",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            }}>
                {formState.open ? (
                    <EventFormPanel
                        mode={formState.mode}
                        initialData={formState.data}
                        onSave={handleFormSave}
                        onDelete={handleFormDelete}
                        onClose={handleFormClose}
                        onDraftChange={handleDraftChange}
                    />
                ) : (
                    <Box sx={{ flex: 1, overflowY: "auto", pl: 1 }}>
                        <EventList
                            events={allEventRows}
                            getEmployeeIdsForEvent={getEmployeeIdsForEvent}
                            getCustomerIdsForEvent={getCustomerIdsForEvent}
                            onEditEvent={handleEditFromList}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
}
