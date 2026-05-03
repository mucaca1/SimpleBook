import { createEvolu, getOrThrow, SimpleName } from "@evolu/common";
import { evoluReactWebDeps } from "@evolu/react-web";
import { Schema } from "./evolu/evolu-db";
import { createUseEvolu } from "@evolu/react";

// localStorage key for database version tracking
const DB_VERSION_KEY = "evolu_db_version";

// Current database version - increment when schema changes require migration
const CURRENT_DB_VERSION = 8;

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