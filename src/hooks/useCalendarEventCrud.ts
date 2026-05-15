import { useCallback, useMemo } from "react";
import { useQuery } from "@evolu/react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { sqliteTrue } from "@evolu/common";
import { evolu } from "../evolu-init";
import { calendarEvents, calendarEventEmployees, calendarEventCustomers } from "../evolu/evolu-query";
import type { TCalendarEventRow } from "../evolu/evolu-query";
import type { CalendarEventId, CalendarEventEmployeeId, CalendarEventCustomerId, EmployeeId, CustomerId, RoomId } from "../evolu/evolu-db";
import type { SchedulerEvent, SchedulerEventColor } from "@mui/x-scheduler/models";

function toSchedulerEvent(row: TCalendarEventRow): SchedulerEvent {
    return {
        id: String(row.id),
        title: String(row.title),
        description: row.description != null ? String(row.description) : undefined,
        start: String(row.start),
        end: String(row.end),
        allDay: row.allDay ? true : undefined,
        color: (row.color as SchedulerEventColor) ?? undefined,
        resource: row.resource != null ? String(row.resource) : undefined,
    };
}

export function useCalendarEventCrud() {
    const { t } = useTranslation();
    const rows = useQuery(calendarEvents);
    const assignmentRows = useQuery(calendarEventEmployees);
    const customerAssignmentRows = useQuery(calendarEventCustomers);

    const events: SchedulerEvent[] = useMemo(
        () => (rows ?? []).map(toSchedulerEvent),
        [rows]
    );

    const employeeIdsByEvent = useMemo(() => {
        const map = new Map<string, string[]>();
        for (const row of assignmentRows ?? []) {
            const eventId = String(row.calendarEventId);
            const list = map.get(eventId) ?? [];
            list.push(String(row.employeeId));
            map.set(eventId, list);
        }
        return map;
    }, [assignmentRows]);

    const getEmployeeIdsForEvent = useCallback((eventId: string): string[] => {
        return employeeIdsByEvent.get(eventId) ?? [];
    }, [employeeIdsByEvent]);

    const handleEventsChange = useCallback(
        async (updatedEvents: SchedulerEvent[]) => {
            try {
                const existingIds = new Set((rows ?? []).map((r) => r.id));

                for (const event of updatedEvents) {
                    const id = String(event.id);
                    if (existingIds.has(id as CalendarEventId)) {
                        await evolu.update("calendarEvents", {
                            id: id as CalendarEventId,
                            title: event.title,
                            description: event.description ?? null,
                            start: event.start,
                            end: event.end,
                            allDay: event.allDay ? 1 : 0,
                            color: event.color ?? null,
                            resource: event.resource ?? null,
                            roomId: (event as any).roomId ? ((event as any).roomId as RoomId) : null,
                        });
                        existingIds.delete(id as CalendarEventId);
                    } else {
                        await evolu.insert("calendarEvents", {
                            title: event.title,
                            description: event.description ?? null,
                            start: event.start,
                            end: event.end,
                            allDay: event.allDay ? 1 : 0,
                            color: event.color ?? null,
                            resource: event.resource ?? null,
                        });
                    }
                }

                for (const deletedId of existingIds as Set<string>) {
                    await evolu.update("calendarEvents", {
                        id: deletedId,
                        isDeleted: sqliteTrue,
                    });
                }
            } catch (error) {
                console.error("Failed to sync events:", error);
                toast.error(t("scheduler.toast.syncError"));
            }
        },
        [rows, t]
    );

    const createEvent = useCallback(
        async (event: Omit<SchedulerEvent, "id">, roomId?: string | null): Promise<string | undefined> => {
            try {
                const result = await evolu.insert("calendarEvents", {
                    title: event.title,
                    description: event.description ?? null,
                    start: event.start,
                    end: event.end,
                    allDay: event.allDay ? 1 : 0,
                    color: event.color ?? null,
                    resource: event.resource ?? null,
                    roomId: roomId ? (roomId as RoomId) : null,
                });
                if (result.ok) {
                    toast.success(t("scheduler.toast.created"));
                    return result.value.id as string;
                }
                throw new Error((result as any).error?.message);
            } catch (error) {
                console.error("Failed to create event:", error);
                toast.error(t("scheduler.toast.createError"));
                return undefined;
            }
        },
        [t]
    );

    const deleteEvent = useCallback(
        async (id: string): Promise<void> => {
            try {
                const result = await evolu.update("calendarEvents", {
                    id: id as CalendarEventId,
                    isDeleted: sqliteTrue,
                });
                if (result.ok) {
                    toast.success(t("scheduler.toast.deleted"));
                } else {
                    throw new Error((result as any).error?.message);
                }
            } catch (error) {
                console.error("Failed to delete event:", error);
                toast.error(t("scheduler.toast.deleteError"));
            }
        },
        [t]
    );

    const updateEvent = useCallback(
        async (id: string, data: Partial<SchedulerEvent>, roomId?: string | null): Promise<void> => {
            try {
                await evolu.update("calendarEvents", {
                    id: id as CalendarEventId,
                    ...(data.title !== undefined && { title: data.title }),
                    ...(data.description !== undefined && { description: data.description ?? null }),
                    ...(data.start !== undefined && { start: data.start }),
                    ...(data.end !== undefined && { end: data.end }),
                    ...(data.allDay !== undefined && { allDay: data.allDay ? 1 : 0 }),
                    ...(data.color !== undefined && { color: data.color ?? null }),
                    ...(data.resource !== undefined && { resource: data.resource ?? null }),
                    ...(roomId !== undefined && { roomId: roomId ? (roomId as RoomId) : null }),
                });
            } catch (error) {
                console.error("Failed to update event:", error);
                toast.error(t("scheduler.toast.createError"));
            }
        },
        [t]
    );

    const assignEmployees = useCallback(
        async (eventId: string, newEmployeeIds: string[]) => {
            try {
                const currentAssignments = (assignmentRows ?? [])
                    .filter((r) => String(r.calendarEventId) === eventId);
                const currentEmployeeIds = new Set(currentAssignments.map((r) => String(r.employeeId)));
                const desiredIds = new Set(newEmployeeIds);

                // Soft-delete removed assignments
                for (const row of currentAssignments) {
                    if (!desiredIds.has(String(row.employeeId))) {
                        await evolu.update("calendarEventEmployees", {
                            id: row.id as CalendarEventEmployeeId,
                            isDeleted: sqliteTrue,
                        });
                    }
                }

                // Insert new assignments
                for (const employeeId of newEmployeeIds) {
                    if (!currentEmployeeIds.has(employeeId)) {
                        await evolu.insert("calendarEventEmployees", {
                            calendarEventId: eventId as CalendarEventId,
                            employeeId: employeeId as EmployeeId,
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to assign employees:", error);
                toast.error(t("scheduler.employeeAssignError"));
            }
        },
        [assignmentRows, t]
    );

    const customerIdsByEvent = useMemo(() => {
        const map = new Map<string, string[]>();
        for (const row of customerAssignmentRows ?? []) {
            const eventId = String(row.calendarEventId);
            const list = map.get(eventId) ?? [];
            list.push(String(row.customerId));
            map.set(eventId, list);
        }
        return map;
    }, [customerAssignmentRows]);

    const getCustomerIdsForEvent = useCallback((eventId: string): string[] => {
        return customerIdsByEvent.get(eventId) ?? [];
    }, [customerIdsByEvent]);

    const assignCustomers = useCallback(
        async (eventId: string, newCustomerIds: string[]) => {
            try {
                const currentAssignments = (customerAssignmentRows ?? [])
                    .filter((r) => String(r.calendarEventId) === eventId);
                const currentCustomerIds = new Set(currentAssignments.map((r) => String(r.customerId)));
                const desiredIds = new Set(newCustomerIds);

                for (const row of currentAssignments) {
                    if (!desiredIds.has(String(row.customerId))) {
                        await evolu.update("calendarEventCustomers", {
                            id: row.id as CalendarEventCustomerId,
                            isDeleted: sqliteTrue,
                        });
                    }
                }

                for (const customerId of newCustomerIds) {
                    if (!currentCustomerIds.has(customerId)) {
                        await evolu.insert("calendarEventCustomers", {
                            calendarEventId: eventId as CalendarEventId,
                            customerId: customerId as CustomerId,
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to assign customers:", error);
            }
        },
        [customerAssignmentRows, t]
    );

    const allEventRows = useMemo(() => rows ?? [], [rows]);

    return {
        events,
        allEventRows,
        isLoading: rows === undefined || rows === null,
        handleEventsChange,
        createEvent,
        updateEvent,
        deleteEvent,
        assignEmployees,
        getEmployeeIdsForEvent,
        assignCustomers,
        getCustomerIdsForEvent,
    };
}
