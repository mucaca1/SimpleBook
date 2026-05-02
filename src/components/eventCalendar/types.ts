import type { SchedulerEventColor } from "@mui/x-scheduler/models";
import type { CalendarEventId } from "../../evolu/evolu-db";

export interface CalendarEventFormData {
    id?: string;
    title: string;
    description: string;
    start: string;
    end: string;
    allDay: boolean;
    color: SchedulerEventColor | null;
    resource: string | null;
    employeeIds: string[];
    customFieldValues: Record<string, string | boolean | null>;
}

export interface CustomEventCalendarProps {
    sx?: object;
}

export interface CustomEventFormDialogProps {
    open: boolean;
    mode: "create" | "edit";
    initialData?: Partial<CalendarEventFormData>;
    onSave: (data: CalendarEventFormData) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onClose: () => void;
}
