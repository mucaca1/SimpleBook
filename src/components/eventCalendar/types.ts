import type { SchedulerEventColor, SchedulerEvent } from "@mui/x-scheduler/models";
import type { CalendarEventId } from "../../evolu/evolu-db";
import type dayjs from "dayjs";
import type {
    TCalendarEventRow,
    TServiceRow,
    TEmployeeRow,
    TCustomerRow,
    TRoomRow,
    TSettingsRow,
} from "../../evolu/evolu-query";

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
    customerIds: string[];
    customFieldValues: Record<string, string | boolean | null>;
}

export interface ExternalDraftData {
    title: string;
    start: string;
    end: string;
    color: SchedulerEventColor | null;
    allDay: boolean;
}

/** Ref handle for clearing the calendar draft event from the parent */
export interface CalendarRef {
    clearDraft: () => void;
}

export interface CustomEventCalendarProps {
    sx?: object;
    onSlotClick?: (dayjs: dayjs.Dayjs, startTime: dayjs.Dayjs) => void;
    onEventClick?: (event: SchedulerEvent) => void;

    // Data props (from HomePage)
    events: SchedulerEvent[];
    allEventRows: TCalendarEventRow[];
    completedEventIds: Set<string>;
    getEmployeeIdsForEvent: (eventId: string) => string[];
    getCustomerIdsForEvent: (eventId: string) => string[];
    serviceRows: TServiceRow[];
    employeeRows: TEmployeeRow[];
    customerRows: TCustomerRow[];
    roomRows: TRoomRow[];
    settingsRow: TSettingsRow | null;

    // Mutation callbacks (from useCalendarEventCrud)
    createEvent: (
        event: Omit<SchedulerEvent, "id">,
        roomId?: string | null,
    ) => Promise<string | undefined>;
    updateEvent: (
        id: string,
        data: Partial<SchedulerEvent>,
        roomId?: string | null,
    ) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
    assignEmployees: (eventId: string, newEmployeeIds: string[]) => Promise<void>;
}

export interface CustomEventFormDialogProps {
    open: boolean;
    mode: "create" | "edit";
    initialData?: Partial<CalendarEventFormData>;
    onSave: (data: CalendarEventFormData) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onClose: () => void;
}
