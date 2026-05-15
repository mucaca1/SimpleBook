import * as Evolu from "@evolu/common";
import { evolu } from "../evolu-init";
import type { CustomerId, EmployeeId, CalendarEventId, CalendarEventCustomerId, ServiceId, CreditTransactionId, PriceId } from "./evolu-db";

export const settings: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("settings").select(["id", "language", "theme", "calendarTimeFormat", "calendarShowWeekends", "currency"])
);

export type TSettingsRow = typeof settings.Row;

export const customers: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("customers")
        .selectAll()
        .where("isDeleted", "is not", Evolu.sqliteTrue)
        .orderBy("createdAt", "desc")
);

export type TCustomerRow = typeof customers.Row;

export const customFields: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("customFields")
        .selectAll()
        .where("isDeleted", "is not", Evolu.sqliteTrue)
        .orderBy("createdAt", "desc")
);

export type TCustomFieldRow = typeof customFields.Row;

export const customFieldValues: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("customFieldValues")
        .selectAll()
        .where("isDeleted", "is not", Evolu.sqliteTrue)
);

export type TCustomFieldValueRow = typeof customFieldValues.Row;

export const getCustomFieldValuesForCustomer = (customerId: CustomerId): Evolu.Query =>
    evolu.createQuery((db) =>
        db.selectFrom("customFieldValues")
            .selectAll()
            .where("customerId", "==", customerId)
            .where("isDeleted", "is not", Evolu.sqliteTrue)
    );

export const employees: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("employees")
        .selectAll()
        .where("isDeleted", "is not", Evolu.sqliteTrue)
        .orderBy("createdAt", "desc")
);

export type TEmployeeRow = typeof employees.Row;

export const getCustomFieldValuesForEmployee = (employeeId: EmployeeId): Evolu.Query =>
    evolu.createQuery((db) =>
        db.selectFrom("customFieldValues")
            .selectAll()
            .where("employeeId", "==", employeeId)
            .where("isDeleted", "is not", Evolu.sqliteTrue)
    );

export const calendarEvents: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("calendarEvents")
        .selectAll()
        .where("isDeleted", "is not", Evolu.sqliteTrue)
        .orderBy("start", "asc")
);

export type TCalendarEventRow = typeof calendarEvents.Row;

export const getCustomFieldValuesForCalendarEvent = (calendarEventId: CalendarEventId): Evolu.Query =>
    evolu.createQuery((db) =>
        db.selectFrom("customFieldValues")
            .selectAll()
            .where("calendarEventId", "==", calendarEventId)
            .where("isDeleted", "is not", Evolu.sqliteTrue)
    );

export const calendarEventEmployees: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("calendarEventEmployees")
        .selectAll()
        .where("isDeleted", "is not", Evolu.sqliteTrue)
);

export type TCalendarEventEmployeeRow = typeof calendarEventEmployees.Row;

export const getEmployeesForEvent = (calendarEventId: CalendarEventId): Evolu.Query =>
    evolu.createQuery((db) =>
        db.selectFrom("calendarEventEmployees")
            .selectAll()
            .where("calendarEventId", "==", calendarEventId)
            .where("isDeleted", "is not", Evolu.sqliteTrue)
    );

export const calendarEventCustomers: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("calendarEventCustomers")
        .selectAll()
        .where("isDeleted", "is not", Evolu.sqliteTrue)
);

export type TCalendarEventCustomerRow = typeof calendarEventCustomers.Row;

export const services: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("services")
        .selectAll()
        .where("isDeleted", "is not", Evolu.sqliteTrue)
        .orderBy("createdAt", "desc")
);

export type TServiceRow = typeof services.Row;

export const prices: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("prices")
        .selectAll()
        .where("isDeleted", "is not", Evolu.sqliteTrue)
        .orderBy("createdAt", "desc")
);

export type TPriceRow = typeof prices.Row;

export const getPricesForService = (serviceId: ServiceId): Evolu.Query =>
    evolu.createQuery((db) =>
        db.selectFrom("prices")
            .selectAll()
            .where("serviceId", "==", serviceId)
            .where("isDeleted", "is not", Evolu.sqliteTrue)
            .orderBy("createdAt", "desc")
    );

export const preOrderPrices: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("prices")
        .selectAll()
        .where("preOrderAllowed", "==", 1)
        .where("isDeleted", "is not", Evolu.sqliteTrue)
        .orderBy("createdAt", "desc")
);

export type TPreOrderPriceRow = typeof preOrderPrices.Row;

export const creditTransactions: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("creditTransactions")
        .selectAll()
        .where("isDeleted", "is not", Evolu.sqliteTrue)
        .orderBy("createdAt", "desc")
);

export type TCreditTransactionRow = typeof creditTransactions.Row;

export const getCreditTransactionsForCustomer = (customerId: CustomerId): Evolu.Query =>
    evolu.createQuery((db) =>
        db.selectFrom("creditTransactions")
            .selectAll()
            .where("customerId", "==", customerId)
            .where("isDeleted", "is not", Evolu.sqliteTrue)
            .orderBy("createdAt", "desc")
    );