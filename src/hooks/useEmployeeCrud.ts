import { useQuery } from "@evolu/react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { evolu } from "../evolu-init";
import { employees } from "../evolu/evolu-query";
import { EmployeeFormData } from "../types/employee";
import type { TEmployeeRow } from "../evolu/evolu-query";
import { EmployeeId } from "../evolu/evolu-db";

interface UseEmployeeCrudReturn {
    employees: TEmployeeRow[];
    isLoading: boolean;
    createEmployee: (data: EmployeeFormData) => Promise<EmployeeId>;
    updateEmployee: (id: EmployeeId, data: EmployeeFormData) => Promise<void>;
    deleteEmployee: (id: EmployeeId) => Promise<void>;
}

export function useEmployeeCrud(): UseEmployeeCrudReturn {
    const { t } = useTranslation();

    const result = useQuery(employees);

    const createEmployee = async (data: EmployeeFormData): Promise<EmployeeId> => {
        try {
            const result = await evolu.insert("employees", {
                firstName: data.firstName || null,
                lastName: data.lastName || null,
                phone: data.phone || null,
                email: data.email || null,
            });

            if (result.ok) {
                toast.success(t("employee.toast.created"));
                return result.value.id;
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to create employee:", error);
            toast.error(t("employee.toast.createError"));
            throw error;
        }
    };

    const updateEmployee = async (id: string, data: EmployeeFormData): Promise<void> => {
        try {
            const result = await evolu.update("employees", {
                id,
                firstName: data.firstName || null,
                lastName: data.lastName || null,
                phone: data.phone || null,
                email: data.email || null,
            });

            if (result.ok) {
                toast.success(t("employee.toast.updated"));
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to update employee:", error);
            toast.error(t("employee.toast.updateError"));
            throw error;
        }
    };

    const deleteEmployee = async (id: string): Promise<void> => {
        try {
            const result = await evolu.update("employees", {
                id,
                isDeleted: true,
            });

            if (result.ok) {
                toast.success(t("employee.toast.deleted"));
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to delete employee:", error);
            toast.error(t("employee.toast.deleteError"));
            throw error;
        }
    };

    return {
        employees: result,
        isLoading: result === undefined || result === null,
        createEmployee,
        updateEmployee,
        deleteEmployee,
    };
}

export type UseEmployeeCrudResult = typeof useEmployeeCrud extends () => infer R ? R : never;
