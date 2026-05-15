import { useQuery } from "@evolu/react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { evolu } from "../evolu-init";
import { prices } from "../evolu/evolu-query";
import { PriceFormData } from "../types/price";
import { PriceId } from "../evolu/evolu-db";
import * as Evolu from "@evolu/common";

interface UsePriceCrudReturn {
    prices: typeof prices.Row[] | undefined;
    isLoading: boolean;
    createPrice: (data: PriceFormData) => Promise<PriceId>;
    updatePrice: (id: PriceId, data: PriceFormData) => Promise<void>;
    deletePrice: (id: PriceId) => Promise<void>;
}

export function usePriceCrud(): UsePriceCrudReturn {
    const { t } = useTranslation();

    const result = useQuery(prices);

    const createPrice = async (data: PriceFormData): Promise<PriceId> => {
        try {
            const hasActualDates = data.validFrom || data.validTo;

            let validFromValue = null;
            if (data.validFrom) {
                const dateResult = Evolu.DateIso.from(new Date(data.validFrom).toISOString());
                if (dateResult.ok) {
                    validFromValue = dateResult.value;
                }
            }

            let validToValue = null;
            if (data.validTo) {
                const dateResult = Evolu.DateIso.from(new Date(data.validTo).toISOString());
                if (dateResult.ok) {
                    validToValue = dateResult.value;
                }
            }
            
            const result = await evolu.insert("prices", {
                serviceId: data.serviceId,
                price: parseFloat(data.price),
                unitType: data.unitType,
                actualInTime: Evolu.booleanToSqliteBoolean(hasActualDates ? true : data.actualInTime),
                validFrom: validFromValue,
                validTo: validToValue,
                preOrderAllowed: Evolu.booleanToSqliteBoolean(data.preOrderAllowed),
                expirationAction: data.preOrderAllowed ? (data.expirationAction || null) : null,
            });

            if (result.ok) {
                toast.success(t("prices.toast.created"));
                return result.value.id;
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to create price:", error);
            toast.error(t("prices.toast.createError"));
            throw error;
        }
    };

    const updatePrice = async (id: PriceId, data: PriceFormData): Promise<void> => {
        try {
            const hasActualDates = data.validFrom || data.validTo;

            let validFromValue = null;
            if (data.validFrom) {
                const dateResult = Evolu.DateIso.from(new Date(data.validFrom).toISOString());
                if (dateResult.ok) {
                    validFromValue = dateResult.value;
                }
            }

            let validToValue = null;
            if (data.validTo) {
                const dateResult = Evolu.DateIso.from(new Date(data.validTo).toISOString());
                if (dateResult.ok) {
                    validToValue = dateResult.value;
                }
            }
            
            const result = await evolu.update("prices", {
                id,
                serviceId: data.serviceId,
                price: parseFloat(data.price),
                unitType: data.unitType,
                actualInTime: Evolu.booleanToSqliteBoolean(hasActualDates ? true : data.actualInTime),
                validFrom: validFromValue,
                validTo: validToValue,
                preOrderAllowed: Evolu.booleanToSqliteBoolean(data.preOrderAllowed),
                expirationAction: data.preOrderAllowed ? (data.expirationAction || null) : null,
            });

            if (result.ok) {
                toast.success(t("prices.toast.updated"));
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to update price:", error);
            toast.error(t("prices.toast.updateError"));
            throw error;
        }
    };

    const deletePrice = async (id: PriceId): Promise<void> => {
        try {
            const result = await evolu.update("prices", {
                id,
                isDeleted: 1,
            });

            if (result.ok) {
                toast.success(t("prices.toast.deleted"));
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to delete price:", error);
            toast.error(t("prices.toast.deleteError"));
            throw error;
        }
    };

    return {
        prices: result,
        isLoading: result === undefined || result === null,
        createPrice,
        updatePrice,
        deletePrice,
    };
}
