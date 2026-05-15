import type { SchedulerEventColor, SchedulerEvent } from "@mui/x-scheduler/models";
import type { CalendarEventId } from "../../evolu/evolu-db";
import type dayjs from "dayjs";

export interface CalendarEventFormData {
    id?: string;
    title: string;
    description: string;
    start: string;
    end: string;
    allDay: boolean;
    color: SchedulerEventColor | null;
    resource: string | null;
    roomId?: string | null;
    employeeIds: string[];
    customFieldValues: Record<string, string | boolean | null>;
}

export interface ExternalDraftData {
    title: string;
    start: string;
    end: string;
    color: SchedulerEventColor | null;
    allDay: boolean;
}

export interface CustomEventCalendarProps {
    sx?: object;
    onSlotClick?: (day: dayjs.Dayjs, startTime: dayjs.Dayjs) => void;
    onEventClick?: (event: SchedulerEvent) => void;
    externalFormOpen?: boolean;
    externalDraftData?: ExternalDraftData | null;
}

export interface CustomEventFormDialogProps {
    open: boolean;
    mode: "create" | "edit";
    initialData?: Partial<CalendarEventFormData>;
    onSave: (data: CalendarEventFormData) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onClose: () => void;
}
