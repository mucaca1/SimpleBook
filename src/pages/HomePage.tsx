import { useState, useCallback, useRef, Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import dayjs from "dayjs";
import type { SchedulerEvent } from "@mui/x-scheduler/models";
import { useCalendarEventCrud } from "../hooks/useCalendarEventCrud";
import { useHomeData } from "../hooks/useHomeData";
import { EventList } from "../components/scheduler/EventList";
import { CustomEventCalendar } from "../components/eventCalendar";
import { EventFormPanel } from "../components/eventCalendar/EventFormPanel";
import { CompleteSessionDialog } from "../components/eventCalendar/CompleteSessionDialog";
import { saveCustomFieldValuesForCalendarEvent } from "../evolu/customFieldUtils";
import type { CalendarEventId } from "../evolu/evolu-db";
import type { CalendarEventFormData, CalendarRef } from "../components/eventCalendar/types";

interface FormState {
    open: boolean;
    mode: "create" | "edit";
    data?: Partial<CalendarEventFormData>;
}

const INITIAL_FORM_STATE: FormState = { open: false, mode: "create" };

export function HomePage() {
    // All reference data in ONE useQueries call (one suspension)
    const homeData = useHomeData();

    // Event data + mutation functions (queries cached from useHomeData, zero extra Suspense)
    const {
        allEventRows,
        isLoading: eventsLoading,
        getEmployeeIdsForEvent,
        getCustomerIdsForEvent,
        createEvent,
        updateEvent,
        deleteEvent,
        assignEmployees,
        assignCustomers,
        isEventCompleted,
        completedEventIds,
        events,
    } = useCalendarEventCrud();

    // Calendar ref for draft clearing (avoids re-rendering calendar on panel toggle)
    const calendarRef = useRef<CalendarRef>(null);

    const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);

    // Complete session dialog state
    const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
    const [completeDialogEventId, setCompleteDialogEventId] = useState<string | null>(null);

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
        calendarRef.current?.clearDraft();
    }, [formState.mode, createEvent, updateEvent, assignEmployees, assignCustomers]);

    const handleFormDelete = useCallback(async (id: string) => {
        await deleteEvent(id);
        setFormState(INITIAL_FORM_STATE);
        calendarRef.current?.clearDraft();
    }, [deleteEvent]);

    const handleFormClose = useCallback(() => {
        setFormState(INITIAL_FORM_STATE);
        calendarRef.current?.clearDraft();
    }, []);

    const handleOpenCompleteSession = useCallback(() => {
        if (formState.data?.id) {
            setCompleteDialogEventId(formState.data.id);
            setCompleteDialogOpen(true);
        }
    }, [formState.data?.id]);

    const handleCloseCompleteSession = useCallback(() => {
        setCompleteDialogOpen(false);
        setCompleteDialogEventId(null);
        // Close the form panel too after completion
        setFormState(INITIAL_FORM_STATE);
        calendarRef.current?.clearDraft();
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

    if (eventsLoading || homeData.isLoading) {
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
                    ref={calendarRef}
                    sx={{ height: "100%" }}
                    onSlotClick={handleSlotClick}
                    onEventClick={handleEventClick}
                    events={events}
                    allEventRows={allEventRows}
                    completedEventIds={completedEventIds}
                    getEmployeeIdsForEvent={getEmployeeIdsForEvent}
                    getCustomerIdsForEvent={getCustomerIdsForEvent}
                    serviceRows={homeData.serviceRows}
                    employeeRows={homeData.employeeRows}
                    customerRows={homeData.customerRows}
                    roomRows={homeData.roomRows}
                    settingsRow={homeData.settingsRow}
                    createEvent={createEvent}
                    updateEvent={updateEvent}
                    deleteEvent={deleteEvent}
                    assignEmployees={assignEmployees}
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
                    // Local Suspense: the per-event custom-field-values query inside
                    // CustomFieldSection suspends on first open of a given event.
                    // Without this boundary it bubbles up to RootPage and remounts the
                    // whole calendar. Keep it local so only the panel suspends.
                    <Suspense fallback={null}>
                        <EventFormPanel
                            mode={formState.mode}
                            initialData={formState.data}
                            onSave={handleFormSave}
                            onDelete={handleFormDelete}
                            onClose={handleFormClose}
                            onCompleteSession={formState.mode === 'edit' && formState.data?.id ? handleOpenCompleteSession : undefined}
                            isCompleted={formState.data?.id ? isEventCompleted(formState.data.id) : false}
                            employees={homeData.employeeRows}
                            customers={homeData.customerRows}
                            services={homeData.serviceRows}
                            rooms={homeData.roomRows}
                        />
                    </Suspense>
                ) : (
                    <Box sx={{ flex: 1, overflowY: "auto", pl: 1 }}>
                        <EventList
                            events={allEventRows}
                            getEmployeeIdsForEvent={getEmployeeIdsForEvent}
                            getCustomerIdsForEvent={getCustomerIdsForEvent}
                            onEditEvent={handleEditFromList}
                            completedEventIds={completedEventIds}
                            employees={homeData.employeeRows}
                            customers={homeData.customerRows}
                        />
                    </Box>
                )}
            </Box>

            {/* Complete Session Dialog */}
            {completeDialogOpen && completeDialogEventId && formState.data && (
                <CompleteSessionDialog
                    open={completeDialogOpen}
                    onClose={handleCloseCompleteSession}
                    eventId={completeDialogEventId}
                    eventTitle={formState.data.title || ''}
                    eventStart={formState.data.start || dayjs().toISOString()}
                    eventEnd={formState.data.end || dayjs().add(1, 'hour').toISOString()}
                    serviceId={formState.data.resource || null}
                    assignedEmployeeIds={formState.data.employeeIds || []}
                    assignedCustomerIds={formState.data.customerIds || []}
                    employees={homeData.employeeRows}
                    customers={homeData.customerRows}
                    currency={homeData.currency}
                />
            )}
        </Box>
    );
}
