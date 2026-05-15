import { useQuery } from "@evolu/react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { evolu } from "../evolu-init";
import { services } from "../evolu/evolu-query";
import { ServiceFormData } from "../types/service";
import type { TServiceRow } from "../evolu/evolu-query";
import { ServiceId } from "../evolu/evolu-db";

interface UseServiceCrudReturn {
    services: TServiceRow[];
    isLoading: boolean;
    createService: (data: ServiceFormData) => Promise<ServiceId>;
    updateService: (id: ServiceId, data: ServiceFormData) => Promise<void>;
    deleteService: (id: ServiceId) => Promise<void>;
}

export function useServiceCrud(): UseServiceCrudReturn {
    const { t } = useTranslation();

    const result = useQuery(services);

    const createService = async (data: ServiceFormData): Promise<ServiceId> => {
        try {
            const result = await evolu.insert("services", {
                name: data.name,
                description: data.description || null,
                duration: data.duration,
                color: data.color || null,
            });

            if (result.ok) {
                toast.success(t("service.toast.created"));
                return result.value.id;
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to create service:", error);
            toast.error(t("service.toast.createError"));
            throw error;
        }
    };

    const updateService = async (id: string, data: ServiceFormData): Promise<void> => {
        try {
            const result = await evolu.update("services", {
                id,
                name: data.name,
                description: data.description || null,
                duration: data.duration,
                color: data.color || null,
            });

            if (result.ok) {
                toast.success(t("service.toast.updated"));
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to update service:", error);
            toast.error(t("service.toast.updateError"));
            throw error;
        }
    };

    const deleteService = async (id: string): Promise<void> => {
        try {
            const result = await evolu.update("services", {
                id,
                isDeleted: true,
            });

            if (result.ok) {
                toast.success(t("service.toast.deleted"));
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to delete service:", error);
            toast.error(t("service.toast.deleteError"));
            throw error;
        }
    };

    return {
        services: result,
        isLoading: result === undefined || result === null,
        createService,
        updateService,
        deleteService,
    };
}
