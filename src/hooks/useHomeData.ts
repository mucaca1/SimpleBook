import { useQueries } from "@evolu/react";
import { sqliteFalse } from "@evolu/common";
import {
    services,
    employees,
    customers,
    rooms,
    settings,
    customFields,
} from "../evolu/evolu-query";
import type {
    TServiceRow,
    TEmployeeRow,
    TCustomerRow,
    TRoomRow,
    TSettingsRow,
    TCustomFieldRow,
} from "../evolu/evolu-query";

export interface HomeData {
    serviceRows: TServiceRow[];
    employeeRows: TEmployeeRow[];
    customerRows: TCustomerRow[];
    roomRows: TRoomRow[];
    customFieldRows: TCustomFieldRow[];
    settingsRow: TSettingsRow | null;
    isLoading: boolean;
    ampm: boolean;
    showWeekends: boolean;
    currency: string | null;
}

/**
 * Batch all reference-data queries needed by the home (calendar) page
 * into a single useQueries call — one React Suspense suspension.
 *
 * `customFields` is included here purely to warm Evolu's cache at page load.
 * CustomFieldSection (rendered inside EventFormPanel) calls `useQuery(customFields)`
 * on its own; if that query is cold when the form first opens, it suspends and
 * bubbles up to the RootPage Suspense boundary, remounting the whole calendar.
 * Pre-fetching here makes that a synchronous cache hit.
 *
 * Event queries (calendarEvents, calendarEventEmployees, calendarEventCustomers)
 * stay in useCalendarEventCrud — no overlap.
 */
export function useHomeData(): HomeData {
    const [serviceRows, employeeRows, customerRows, roomRows, settingsRows, customFieldRows] =
        useQueries([services, employees, customers, rooms, settings, customFields]);

    const settingsRow: TSettingsRow | null =
        settingsRows.length > 0 ? settingsRows[0] : null;

    return {
        serviceRows,
        employeeRows,
        customerRows,
        roomRows,
        customFieldRows,
        settingsRow,
        isLoading: serviceRows == null,
        ampm: settingsRow?.calendarTimeFormat === "12h",
        showWeekends: settingsRow?.calendarShowWeekends !== sqliteFalse,
        currency: (settingsRow?.currency as string | null) ?? null,
    };
}
