import { useCallback, useMemo } from "react";
import { useQuery } from "@evolu/react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { evolu } from "../evolu-init";
import { calendarEvents } from "../evolu/evolu-query";
import type { TCalendarEventRow } from "../evolu/evolu-query";
import type { CalendarEventId } from "../evolu/evolu-db";
import type { SchedulerEvent, SchedulerEventColor } from "@mui/x-scheduler/models";

function toSchedulerEvent(row: TCalendarEventRow): SchedulerEvent {
    return {
        id: row.id,
        title: row.title,
        description: row.description ?? undefined,
        start: row.start,
        end: row.end,
        allDay: row.allDay ? true : undefined,
        color: (row.color as SchedulerEventColor) ?? undefined,
        resource: row.resource ?? undefined,
    };
}

export function useCalendarEventCrud() {
    const { t } = useTranslation();
    const rows = useQuery(calendarEvents);

    const events: SchedulerEvent[] = useMemo(
        () => (rows ?? []).map(toSchedulerEvent),
        [rows]
    );

    const handleEventsChange = useCallback(
        async (updatedEvents: SchedulerEvent[]) => {
            try {
                const existingIds = new Set((rows ?? []).map((r) => r.id));

                const currentMap = new Map<string, SchedulerEvent>();
                for (const e of updatedEvents) {
                    currentMap.set(String(e.id), e);
                }

                for (const event of updatedEvents) {
                    const id = String(event.id);
                    if (existingIds.has(id as CalendarEventId)) {
                        await evolu.update("calendarEvents", {
                            id: id as CalendarEventId,
                            title: event.title,
                            description: event.description ?? null,
                            start: event.start,
                            end: event.end,
                            allDay: event.allDay ?? false,
                            color: event.color ?? null,
                            resource: event.resource ?? null,
                        });
                        existingIds.delete(id as CalendarEventId);
                    }
                }

                for (const deletedId of existingIds) {
                    await evolu.update("calendarEvents", {
                        id: deletedId,
                        isDeleted: true,
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
        async (event: Omit<SchedulerEvent, "id">): Promise<string | undefined> => {
            try {
                const result = await evolu.insert("calendarEvents", {
                    title: event.title,
                    description: event.description ?? null,
                    start: event.start,
                    end: event.end,
                    allDay: event.allDay ?? false,
                    color: event.color ?? null,
                    resource: event.resource ?? null,
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
                    isDeleted: true,
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

    return {
        events,
        isLoading: rows === undefined || rows === null,
        handleEventsChange,
        createEvent,
        deleteEvent,
    };
}
