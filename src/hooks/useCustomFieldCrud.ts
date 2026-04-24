/**
 * useCustomFieldCrud - Custom hook for custom field CRUD operations
 *
 * Provides complete CRUD functionality for custom field management including:
 * - Data fetching with reactive updates
 * - Create, update, and delete mutations
 * - Toast notifications for user feedback
 * - Loading states for UI feedback
 * - Cascade delete of field values when deleting fields
 *
 * All operations use the Evolu database for local-first persistence.
 */

import { useQuery } from "@evolu/react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { evolu } from "../evolu-init";
import { customFields, customFieldValues } from "../evolu/evolu-query";
import { CustomFieldFormData } from "../types/customField";
import { serializeFieldNameTranslations } from "../utils/customFieldTranslations";
import type { TCustomFieldRow } from "../evolu/evolu-query";
import * as Evolu from "@evolu/common";

/**
 * Hook return type
 */
interface UseCustomFieldCrudReturn {
    // Data
    customFields: TCustomFieldRow[];
    isLoading: boolean;

    // Actions
    createCustomField: (data: CustomFieldFormData) => Promise<void>;
    updateCustomField: (id: string, data: CustomFieldFormData) => Promise<void>;
    deleteCustomField: (id: string) => Promise<void>;
}

/**
 * Custom hook that encapsulates all custom field CRUD operations
 *
 * Provides reactive data fetching and mutations with built-in
 * toast notifications and error handling.
 *
 * Handles cascade delete: when a custom field is deleted, all associated
 * custom field values are also deleted to maintain data integrity.
 *
 * @returns Object containing custom field data, actions, and loading states
 *
 * @example
 * ```tsx
 * const {
 *   customFields,
 *   isLoading,
 *   createCustomField,
 *   updateCustomField,
 *   deleteCustomField
 * } = useCustomFieldCrud();
 *
 * // Create a new custom field
 * await createCustomField({
 *   appliesTo: "Customer",
 *   fieldName: "Insurance Number",
 *   fieldType: "Text",
 *   required: true,
 *   editableAfterInitial: false,
 *   showInTable: true
 * });
 * ```
 */
export function useCustomFieldCrud(): UseCustomFieldCrudReturn {
    const { t } = useTranslation();

    // Query custom fields from Evolu database
    const result = useQuery(customFields);

    /**
     * Create a new custom field
     *
     * Shows success/error toast notifications
     *
     * @param data - Custom field form data (without id)
     */
    const createCustomField = async (data: CustomFieldFormData): Promise<void> => {
        try {
            const result = await evolu.insert("customFields", {
                appliesTo: data.appliesTo || null,
                fieldName: data.fieldName || null,
                fieldType: data.fieldType || null,
                fieldNameTranslations: serializeFieldNameTranslations(data.fieldNameTranslations),
                dropdownItems: data.dropdownItems || null,
                placeholder: data.placeholder || null,
                helpText: data.helpText || null,
                required: Evolu.booleanToSqliteBoolean(data.required || false),
                editableAfterInitial: Evolu.booleanToSqliteBoolean(data.editableAfterInitial || false),
                showInTable: Evolu.booleanToSqliteBoolean(data.showInTable || false),
                containEmptyValue: Evolu.booleanToSqliteBoolean(data.containEmptyValue || false),
            });

            if (result.ok) {
                toast.success(t("customField.toast.created") || "Custom field created successfully");
            } else {
                toast.error(t("customField.toast.createError") || "Failed to create custom field");
            }
        } catch (error) {
            console.error("Failed to create custom field:", error);
            toast.error(t("customField.toast.createError") || "Failed to create custom field");
            throw error;
        }
    };

    /**
     * Update an existing custom field
     *
     * Shows success/error toast notifications
     *
     * @param id - Custom field ID to update
     * @param data - Updated custom field form data
     */
    const updateCustomField = async (id: string, data: CustomFieldFormData): Promise<void> => {
        try {
            const result = await evolu.update("customFields", {
                id,
                appliesTo: data.appliesTo || null,
                fieldName: data.fieldName || null,
                fieldType: data.fieldType || null,
                fieldNameTranslations: serializeFieldNameTranslations(data.fieldNameTranslations),
                dropdownItems: data.dropdownItems || null,
                placeholder: data.placeholder || null,
                helpText: data.helpText || null,
                required: Evolu.booleanToSqliteBoolean(data.required || false),
                editableAfterInitial: Evolu.booleanToSqliteBoolean(data.editableAfterInitial || false),
                showInTable: Evolu.booleanToSqliteBoolean(data.showInTable || false),
                containEmptyValue: Evolu.booleanToSqliteBoolean(data.containEmptyValue || false),
            });

            if (result.ok) {
                toast.success(t("customField.toast.updated") || "Custom field updated successfully");
            } else {
                toast.error(t("customField.toast.updateError") || "Failed to update custom field");
            }
        } catch (error) {
            console.error("Failed to update custom field:", error);
            toast.error(t("customField.toast.updateError") || "Failed to update custom field");
            throw error;
        }
    };

    /**
     * Delete a custom field
     *
     * Performs soft delete on the custom field and cascades the delete
     * to all associated custom field values to maintain data integrity.
     *
     * Shows success/error toast notifications
     *
     * @param id - Custom field ID to delete
     */
    const deleteCustomField = async (id: string): Promise<void> => {
        try {
            // First, soft delete all associated custom field values (cascade delete)
            const valuesResult = useQuery(customFieldValues);
            const valuesToDelete = valuesResult.filter(
                (value) => value.customFieldId === id && value.isDeleted !== Evolu.sqliteTrue
            );

            for (const value of valuesToDelete) {
                await evolu.update("customFieldValues", {
                    id: value.id,
                    isDeleted: Evolu.sqliteTrue,
                });
            }

            // Then, soft delete the custom field itself
            const result = await evolu.update("customFields", {
                id,
                isDeleted: Evolu.sqliteTrue,
            });

            if (result.ok) {
                toast.success(t("customField.toast.deleted") || "Custom field deleted successfully");
            } else {
                toast.error(t("customField.toast.deleteError") || "Failed to delete custom field");
            }
        } catch (error) {
            console.error("Failed to delete custom field:", error);
            toast.error(t("customField.toast.deleteError") || "Failed to delete custom field");
            throw error;
        }
    };

    return {
        // Data
        customFields: result as TCustomFieldRow[],
        isLoading: result === undefined || result === null,

        // Actions
        createCustomField,
        updateCustomField,
        deleteCustomField,
    };
}

/**
 * Type for hook results used in components
 */
export type UseCustomFieldCrudResult = typeof useCustomFieldCrud extends () => infer R ? R : never;
