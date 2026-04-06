/**
 * useCustomFieldValues - Custom hook for managing custom field values
 *
 * Handles custom field values for a specific customer including:
 * - Fetching existing values for a customer
 * - Creating new values
 * - Updating existing values
 * - Batch updates for multiple fields
 *
 * All operations use the Evolu database for local-first persistence.
 */

import { useQuery } from "@evolu/react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { evolu } from "../evolu-init";
import { getCustomFieldValuesForCustomer, customFieldValues } from "../evolu/evolu-query";
import type { CustomerId } from "../evolu/evolu-db";
import type { TCustomFieldValueRow } from "../evolu/evolu-query";
import * as Evolu from "@evolu/common";

/**
 * Custom field value input type
 * Maps custom field IDs to their string values
 */
export type CustomFieldValueInput = Record<string, string | null | undefined>;

/**
 * Hook return type
 */
interface UseCustomFieldValuesReturn {
    // Data
    values: TCustomFieldValueRow[];
    isLoading: boolean;

    // Actions
    updateCustomFieldValues: (customerId: CustomerId, values: CustomFieldValueInput) => Promise<void>;
}

/**
 * Custom hook that manages custom field values for a customer
 *
 * Fetches all custom field values for a specific customer and provides
 * functionality to update multiple values at once.
 *
 * Handles both create and update operations:
 * - If a value exists for a custom field, it updates it
 * - If no value exists, it creates a new one
 * - Empty values are still stored (as null) to distinguish from "not set"
 *
 * @param customerId - The customer ID to fetch/update values for (null for new customers)
 * @returns Object containing values data, actions, and loading states
 *
 * @example
 * ```tsx
 * const { values, isLoading, updateCustomFieldValues } = useCustomFieldValues(customerId);
 *
 * // Update multiple custom field values at once
 * await updateCustomFieldValues(customerId, {
 *   "field-id-1": "Some text value",
 *   "field-id-2": "123",
 *   "field-id-3": null, // Clear existing value
 * });
 * ```
 */
export function useCustomFieldValues(customerId: CustomerId | null): UseCustomFieldValuesReturn {
    const { t } = useTranslation();

    // Query custom field values for the specific customer
    const result = useQuery(
        customerId ? getCustomFieldValuesForCustomer(customerId) : customFieldValues
    );

    /**
     * Update custom field values for a customer
     *
     * Creates new values or updates existing ones as needed.
     * Handles batch updates for multiple fields at once.
     *
     * Shows success/error toast notifications
     *
     * @param customerId - The customer ID to update values for
     * @param inputValues - Object mapping custom field IDs to their values
     */
    const updateCustomFieldValues = async (
        customerId: CustomerId,
        inputValues: CustomFieldValueInput
    ): Promise<void> => {
        try {
            // Get existing values for this customer
            const existingValues = result.filter(
                (v) => v.customerId === customerId && v.isDeleted !== Evolu.sqliteTrue
            );

            // Process each custom field value
            for (const [customFieldId, value] of Object.entries(inputValues)) {
                // Find if a value already exists for this custom field and customer
                const existingValue = existingValues.find(
                    (v) => v.customFieldId === customFieldId && v.customerId === customerId
                );

                if (existingValue) {
                    // Update existing value
                    await evolu.update("customFieldValues", {
                        id: existingValue.id,
                        value: value || null,
                    });
                } else {
                    // Create new value
                    await evolu.insert("customFieldValues", {
                        customFieldId,
                        customerId,
                        value: value || null,
                    });
                }
            }

            toast.success(t("customField.values.saved") || "Custom field values saved successfully");
        } catch (error) {
            console.error("Failed to update custom field values:", error);
            toast.error(t("customField.values.saveError") || "Failed to save custom field values");
            throw error;
        }
    };

    return {
        // Data
        values: customerId ? (result as TCustomFieldValueRow[]) : [],
        isLoading: result === undefined || result === null,

        // Actions
        updateCustomFieldValues,
    };
}

/**
 * Type for hook results used in components
 */
export type UseCustomFieldValuesResult = typeof useCustomFieldValues extends (id: CustomerId | null) => infer R ? R : never;
