import { createEvolu, getOrThrow, SimpleName } from "@evolu/common";
import { evoluReactWebDeps } from "@evolu/react-web";
import { Schema } from "./evolu/evolu-db";
import { createUseEvolu } from "@evolu/react";

// localStorage key for database version tracking
const DB_VERSION_KEY = "evolu_db_version";

// Current database version - increment when schema changes require migration
const CURRENT_DB_VERSION = 12;

/**
 * Get the current database version from localStorage
 */
function getDatabaseVersion(): number {
    try {
        const version = localStorage.getItem(DB_VERSION_KEY);
        return version ? parseInt(version, 10) : 1;
    } catch {
        return 1;
    }
}

/**
 * Check if database needs to be reset due to schema migration
 *
 * Version history:
 * - Version 1: Initial schema without owner (no evolu_message table)
 * - Version 2: Added owner support (enables evolu_message table for time-travel)
 * - Version 3: Added Customer table for customer management feature
 * - Version 4: Added CustomFields and CustomFieldValues tables for custom fields feature
 * - Version 5: Added CalendarEvents table for scheduler feature
 * - Version 6: Added calendarTimeFormat and calendarShowWeekends to Settings
 * - Version 7: Added Services table for service type management
 * - Version 8: Added Prices table and currency setting for pricing management
 * - Version 9: Added CreditTransaction table for customer credit ledger feature
 * - Version 10: Added priceId, serviceId, quantity to CreditTransaction for pre-order service
 * - Version 11: Added status/completedAt to CalendarEvent, attendance to junction tables,
 *   changed CreditTransaction.amount to FiniteNumber, added calendarEventId and transactionType
 * - Version 12: Added database indexes for query performance optimization
 */
function needsDatabaseReset(): boolean {
    const currentVersion = getDatabaseVersion();
    return currentVersion < CURRENT_DB_VERSION;
}

/**
 * Reset database if migration is needed
 *
 * This is called when the database schema version changes and requires
 * a full reset. This is necessary when adding critical features like
 * the owner support which enables the evolu_message table.
 */
async function migrateDatabaseIfNeeded(evoluInstance: ReturnType<typeof createEvolu<any>>): Promise<void> {
    if (needsDatabaseReset()) {
        console.warn("Database migration required. Resetting to enable time-travel feature...");

        try {
            // Reset the owner which will recreate the database with the new schema
            await evoluInstance.resetAppOwner({ reload: false });

            // Update the version marker
            try {
                localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION.toString());
            } catch (e) {
                console.warn("Failed to save database version:", e);
            }

            console.log("Database migration completed. Please reload the page.");
            // Reload to apply changes
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error("Failed to migrate database:", error);
        }
    }
}

export const evolu = createEvolu(evoluReactWebDeps)(Schema, {
    reloadUrl: "/",
    name: getOrThrow(SimpleName.from("simple-book")),

    ...((process.env.NODE_ENV === "development") && {
        transports: [
            {
                type: "WebSocket",
                url: "http://localhost:4000"
            }
        ]
    }),

    indexes: (create) => [
        // --- customers ---
        // customers: WHERE isDeleted != true ORDER BY createdAt DESC
        create("customers_isDeleted_createdAt").on("customers").column("isDeleted").column("createdAt"),

        // --- employees ---
        // employees: WHERE isDeleted != true ORDER BY createdAt DESC
        create("employees_isDeleted_createdAt").on("employees").column("isDeleted").column("createdAt"),

        // --- customFields ---
        // customFields: WHERE isDeleted != true ORDER BY createdAt DESC
        create("customFields_isDeleted_createdAt").on("customFields").column("isDeleted").column("createdAt"),

        // --- customFieldValues ---
        // customFieldValues: WHERE isDeleted != true
        create("customFieldValues_isDeleted").on("customFieldValues").column("isDeleted"),
        // getCustomFieldValuesForCustomer: WHERE customerId = ? AND isDeleted != true
        create("customFieldValues_customerId_isDeleted").on("customFieldValues").column("customerId").column("isDeleted"),
        // getCustomFieldValuesForEmployee: WHERE employeeId = ? AND isDeleted != true
        create("customFieldValues_employeeId_isDeleted").on("customFieldValues").column("employeeId").column("isDeleted"),
        // getCustomFieldValuesForCalendarEvent: WHERE calendarEventId = ? AND isDeleted != true
        create("customFieldValues_calendarEventId_isDeleted").on("customFieldValues").column("calendarEventId").column("isDeleted"),

        // --- calendarEvents ---
        // calendarEvents: WHERE isDeleted != true ORDER BY start ASC
        create("calendarEvents_isDeleted_start").on("calendarEvents").column("isDeleted").column("start"),

        // --- calendarEventEmployees ---
        // calendarEventEmployees: WHERE isDeleted != true
        create("calendarEventEmployees_isDeleted").on("calendarEventEmployees").column("isDeleted"),
        // getEmployeesForEvent: WHERE calendarEventId = ? AND isDeleted != true
        create("calendarEventEmployees_calendarEventId_isDeleted").on("calendarEventEmployees").column("calendarEventId").column("isDeleted"),

        // --- calendarEventCustomers ---
        // calendarEventCustomers: WHERE isDeleted != true
        create("calendarEventCustomers_isDeleted").on("calendarEventCustomers").column("isDeleted"),
        // queried by calendarEventId in components
        create("calendarEventCustomers_calendarEventId_isDeleted").on("calendarEventCustomers").column("calendarEventId").column("isDeleted"),

        // --- services ---
        // services: WHERE isDeleted != true ORDER BY createdAt DESC
        create("services_isDeleted_createdAt").on("services").column("isDeleted").column("createdAt"),

        // --- rooms ---
        // rooms: WHERE isDeleted != true ORDER BY createdAt DESC
        create("rooms_isDeleted_createdAt").on("rooms").column("isDeleted").column("createdAt"),

        // --- prices ---
        // prices: WHERE isDeleted != true ORDER BY createdAt DESC
        create("prices_isDeleted_createdAt").on("prices").column("isDeleted").column("createdAt"),
        // getPricesForService: WHERE serviceId = ? AND isDeleted != true ORDER BY createdAt DESC
        create("prices_serviceId_isDeleted_createdAt").on("prices").column("serviceId").column("isDeleted").column("createdAt"),
        // preOrderPrices: WHERE preOrderAllowed = 1 AND isDeleted != true ORDER BY createdAt DESC
        create("prices_preOrderAllowed_isDeleted_createdAt").on("prices").column("preOrderAllowed").column("isDeleted").column("createdAt"),

        // --- creditTransactions ---
        // creditTransactions: WHERE isDeleted != true ORDER BY createdAt DESC
        create("creditTransactions_isDeleted_createdAt").on("creditTransactions").column("isDeleted").column("createdAt"),
        // getCreditTransactionsForCustomer: WHERE customerId = ? AND isDeleted != true ORDER BY createdAt DESC
        create("creditTransactions_customerId_isDeleted_createdAt").on("creditTransactions").column("customerId").column("isDeleted").column("createdAt"),
        // getConsumptionTransactionsForEvent: WHERE calendarEventId = ? AND isDeleted != true ORDER BY createdAt DESC
        create("creditTransactions_calendarEventId_isDeleted_createdAt").on("creditTransactions").column("calendarEventId").column("isDeleted").column("createdAt"),
    ],

    enableLogging: true,
});

// Trigger migration if needed (async, don't block initialization)
migrateDatabaseIfNeeded(evolu);

export const useEvolu = createUseEvolu(evolu);

/**
 * Subscribe to unexpected Evolu errors (database, network, sync issues). These
 * should not happen in normal operation, so always log them for debugging. Show
 * users a friendly error message instead of technical details.
 */
evolu.subscribeError(() => {
    const error = evolu.getError();
    if (!error) return;

    alert("🚨 Evolu error occurred! Check the console.");
    // eslint-disable-next-line no-console
    console.error(error);
});