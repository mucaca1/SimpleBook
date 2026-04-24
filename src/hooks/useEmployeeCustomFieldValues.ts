import { useQuery } from "@evolu/react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { evolu } from "../evolu-init";
import { customFieldValues, getCustomFieldValuesForEmployee } from "../evolu/evolu-query";
import type { EmployeeId } from "../evolu/evolu-db";
import type { TCustomFieldValueRow } from "../evolu/evolu-query";
import * as Evolu from "@evolu/common";

export type CustomFieldValueInput = Record<string, string | null | undefined>;

interface UseEmployeeCustomFieldValuesReturn {
    values: TCustomFieldValueRow[];
    isLoading: boolean;
    updateCustomFieldValues: (employeeId: EmployeeId, values: CustomFieldValueInput) => Promise<void>;
}

export function useEmployeeCustomFieldValues(employeeId: EmployeeId | null): UseEmployeeCustomFieldValuesReturn {
    const { t } = useTranslation();

    const result = useQuery(
        employeeId ? getCustomFieldValuesForEmployee(employeeId) : customFieldValues
    );

    const updateCustomFieldValues = async (
        employeeId: EmployeeId,
        inputValues: CustomFieldValueInput
    ): Promise<void> => {
        try {
            const existingValues = result.filter(
                (v) => v.employeeId === employeeId && v.isDeleted !== Evolu.sqliteTrue
            );

            for (const [customFieldId, value] of Object.entries(inputValues)) {
                const existingValue = existingValues.find(
                    (v) => v.customFieldId === customFieldId && v.employeeId === employeeId
                );

                if (existingValue) {
                    await evolu.update("customFieldValues", {
                        id: existingValue.id,
                        value: value || null,
                    });
                } else {
                    await evolu.insert("customFieldValues", {
                        customFieldId,
                        employeeId,
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
        values: employeeId ? (result as TCustomFieldValueRow[]) : [],
        isLoading: result === undefined || result === null,
        updateCustomFieldValues,
    };
}

export type UseEmployeeCustomFieldValuesResult = typeof useEmployeeCustomFieldValues extends (id: EmployeeId | null) => infer R ? R : never;
