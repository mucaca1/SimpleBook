import { useQueries } from "@evolu/react";
import { sqliteFalse } from "@evolu/common";
import {
    services,
    employees,
    customers,
    rooms,
    settings,
} from "../evolu/evolu-query";
import type {
    TServiceRow,
    TEmployeeRow,
    TCustomerRow,
    TRoomRow,
    TSettingsRow,
} from "../evolu/evolu-query";

export interface HomeData {
    serviceRows: TServiceRow[];
    employeeRows: TEmployeeRow[];
    customerRows: TCustomerRow[];
    roomRows: TRoomRow[];
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
 * Event queries (calendarEvents, calendarEventEmployees, calendarEventCustomers)
 * stay in useCalendarEventCrud — no overlap.
 */
export function useHomeData(): HomeData {
    const [serviceRows, employeeRows, customerRows, roomRows, settingsRows] =
        useQueries([services, employees, customers, rooms, settings]);

    const settingsRow: TSettingsRow | null =
        settingsRows.length > 0 ? settingsRows[0] : null;

    return {
        serviceRows,
        employeeRows,
        customerRows,
        roomRows,
        settingsRow,
        isLoading: serviceRows == null,
        ampm: settingsRow?.calendarTimeFormat === "12h",
        showWeekends: settingsRow?.calendarShowWeekends !== sqliteFalse,
        currency: (settingsRow?.currency as string | null) ?? null,
    };
}
