/**
 * Custom Field Utilities
 *
 * Helper functions for managing custom field values outside of React components.
 * These utilities can be called from callbacks, event handlers, and non-React code.
 */

import { evolu } from '../evolu-init';
import type { CustomerId, EmployeeId, CalendarEventId } from './evolu-db';
import { getCustomFieldValuesForCustomer, getCustomFieldValuesForEmployee, getCustomFieldValuesForCalendarEvent } from './evolu-query';
import type { TCustomFieldValueRow } from './evolu-query';

export type CustomFieldValueInput = Record<string, string | boolean | null>;

/**
 * Save custom field values for a customer
 *
 * This function can be called outside of React components to save custom field values.
 * It handles both creating new values and updating existing ones.
 *
 * @param customerId - The customer ID to save values for
 * @param inputValues - Object mapping custom field IDs to their values
 * @returns Promise that resolves when all values are saved
 *
 * @example
 * ```ts
 * await saveCustomFieldValuesForCustomer(customerId, {
 *   "field-id-1": "Some text value",
 *   "field-id-2": "123",
 *   "field-id-3": true,
 * });
 * ```
 */
export async function saveCustomFieldValuesForCustomer(
    customerId: CustomerId,
    inputValues: CustomFieldValueInput
): Promise<void> {
    // Query using Evolu's loadQuery API
    try {
        // Get existing values for this customer
        const { rows: existingValues } = await evolu.loadQuery(
            getCustomFieldValuesForCustomer(customerId)
        );

        // Create a map of existing values for easy lookup
        const existingValuesMap = new Map<string, string>();
        existingValues?.forEach((v: TCustomFieldValueRow) => {
            existingValuesMap.set(v.customFieldId, v.id);
        });

        // Process each custom field value
        for (const [customFieldId, value] of Object.entries(inputValues)) {
            const existingValueId = existingValuesMap.get(customFieldId);

            // Convert boolean to string for storage
            const stringValue =
                typeof value === 'boolean' ? (value ? 'true' : 'false') : value || null;

            if (existingValueId) {
                // Update existing value
                await evolu.update('customFieldValues', {
                    id: existingValueId,
                    value: stringValue,
                });
            } else {
                // Create new value
                await evolu.insert('customFieldValues', {
                    customFieldId,
                    customerId,
                    value: stringValue,
                });
            }
        }
    } catch (error) {
        console.error('Failed to save custom field values:', error);
        throw error;
    }
}

export async function saveCustomFieldValuesForEmployee(
    employeeId: EmployeeId,
    inputValues: CustomFieldValueInput
): Promise<void> {
    try {
        const { rows: existingValues } = await evolu.loadQuery(
            getCustomFieldValuesForEmployee(employeeId)
        );

        const existingValuesMap = new Map<string, string>();
        existingValues?.forEach((v: TCustomFieldValueRow) => {
            existingValuesMap.set(v.customFieldId, v.id);
        });

        for (const [customFieldId, value] of Object.entries(inputValues)) {
            const existingValueId = existingValuesMap.get(customFieldId);

            const stringValue =
                typeof value === 'boolean' ? (value ? 'true' : 'false') : value || null;

            if (existingValueId) {
                await evolu.update('customFieldValues', {
                    id: existingValueId,
                    value: stringValue,
                });
            } else {
                await evolu.insert('customFieldValues', {
                    customFieldId,
                    employeeId,
                    value: stringValue,
                });
            }
        }
    } catch (error) {
        console.error('Failed to save custom field values for employee:', error);
        throw error;
    }
}

export async function saveCustomFieldValuesForCalendarEvent(
    calendarEventId: CalendarEventId,
    inputValues: CustomFieldValueInput
): Promise<void> {
    try {
        const { rows: existingValues } = await evolu.loadQuery(
            getCustomFieldValuesForCalendarEvent(calendarEventId)
        );

        const existingValuesMap = new Map<string, string>();
        existingValues?.forEach((v: TCustomFieldValueRow) => {
            existingValuesMap.set(v.customFieldId, v.id);
        });

        for (const [customFieldId, value] of Object.entries(inputValues)) {
            const existingValueId = existingValuesMap.get(customFieldId);

            const stringValue =
                typeof value === 'boolean' ? (value ? 'true' : 'false') : value || null;

            if (existingValueId) {
                await evolu.update('customFieldValues', {
                    id: existingValueId,
                    value: stringValue,
                });
            } else {
                await evolu.insert('customFieldValues', {
                    customFieldId,
                    calendarEventId,
                    value: stringValue,
                });
            }
        }
    } catch (error) {
        console.error('Failed to save custom field values for calendar event:', error);
        throw error;
    }
}
