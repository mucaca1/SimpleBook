/**
 * useCustomerCrud - Custom hook for customer CRUD operations
 *
 * Provides complete CRUD functionality for customer management including:
 * - Data fetching with reactive updates
 * - Create, update, and delete mutations
 * - Toast notifications for user feedback
 * - Loading states for UI feedback
 *
 * All operations use the Evolu database for local-first persistence.
 */

import { useQuery } from "@evolu/react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { evolu } from "../evolu-init";
import { customers } from "../evolu/evolu-query";
import { CustomerFormData } from "../types/customer";
import type { TCustomerRow } from "../evolu/evolu-query";
import * as Evolu from "@evolu/common";

/**
 * Hook return type
 */
interface UseCustomerCrudReturn {
    // Data
    customers: TCustomerRow[];
    isLoading: boolean;

    // Actions
    createCustomer: (data: CustomerFormData) => Promise<string | null>;
    updateCustomer: (id: string, data: CustomerFormData) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
}

/**
 * Custom hook that encapsulates all customer CRUD operations
 *
 * Provides reactive data fetching and mutations with built-in
 * toast notifications and error handling.
 *
 * @returns Object containing customer data, actions, and loading states
 *
 * @example
 * ```tsx
 * const {
 *   customers,
 *   isLoading,
 *   createCustomer,
 *   updateCustomer,
 *   deleteCustomer,
 *   isCreating,
 *   isUpdating,
 *   isDeleting
 * } = useCustomerCrud();
 *
 * // Create a new customer
 * await createCustomer({
 *   firstName: "John",
 *   lastName: "Doe",
 *   birthDate: new Date("1990-01-01"),
 *   sex: "male"
 * });
 * ```
 */
export function useCustomerCrud(): UseCustomerCrudReturn {
    const { t } = useTranslation();

    // Query customers from Evolu database
    const result = useQuery(customers);

    /**
     * Create a new customer
     *
     * Shows success/error toast notifications
     *
     * @param data - Customer form data (without id)
     * @returns The ID of the created customer, or null if failed
     */
    const createCustomer = async (data: CustomerFormData): Promise<string | null> => {
        try {
            const result = await evolu.insert("customers", {
                firstName: data.firstName || null,
                lastName: data.lastName || null,
                degree: data.degree || null,
                birthDate: data.birthDate?.toISOString() || null,
                isAdult: Evolu.booleanToSqliteBoolean(data.isAdult || false),
                sex: data.sex || null,
                customerId: data.customerId || null,
            });

            if (result.ok) {
                toast.success(t("customer.toast.created"));
                return result.id || null;
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to create customer:", error);
            toast.error(t("customer.toast.createError"));
            throw error;
        }
    };

    /**
     * Update an existing customer
     *
     * Shows success/error toast notifications
     *
     * @param id - Customer ID to update
     * @param data - Updated customer form data
     */
    const updateCustomer = async (id: string, data: CustomerFormData): Promise<void> => {
        try {
            const result = await evolu.update("customers", {
                id,
                firstName: data.firstName || null,
                lastName: data.lastName || null,
                degree: data.degree || null,
                birthDate: data.birthDate?.toISOString() || null,
                isAdult: Evolu.booleanToSqliteBoolean(data.isAdult || false),
                sex: data.sex || null,
                customerId: data.customerId || null,
            });

            if (result.ok) {
                toast.success(t("customer.toast.updated"));
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to update customer:", error);
            toast.error(t("customer.toast.updateError"));
            throw error;
        }
    };

    /**
     * Delete a customer
     *
     * Shows success/error toast notifications
     *
     * @param id - Customer ID to delete
     */
    const deleteCustomer = async (id: string): Promise<void> => {
        try {
            const result = await evolu.update("customers", {
                id,
                isDeleted: Evolu.sqliteTrue,
            });

            if (result.ok) {
                toast.success(t("customer.toast.deleted"));
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to delete customer:", error);
            toast.error(t("customer.toast.deleteError"));
            throw error;
        }
    };

    return {
        // Data
        customers: result,
        isLoading: result === undefined || result === null, // Proper loading detection

        // Actions
        createCustomer,
        updateCustomer,
        deleteCustomer,
    };
}

/**
 * Type for hook results used in components
 */
export type UseCustomerCrudResult = typeof useCustomerCrud extends () => infer R ? R : never;
