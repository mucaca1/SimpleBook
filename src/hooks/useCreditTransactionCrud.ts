import { useQuery } from "@evolu/react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { evolu } from "../evolu-init";
import { creditTransactions } from "../evolu/evolu-query";
import { CreditTransactionFormData } from "../types/creditTransaction";
import { CreditTransactionId } from "../evolu/evolu-db";
import type { TCreditTransactionRow } from "../evolu/evolu-query";

interface UseCreditTransactionCrudReturn {
    creditTransactions: TCreditTransactionRow[];
    isLoading: boolean;
    addCredit: (data: CreditTransactionFormData) => Promise<CreditTransactionId>;
    deleteCreditTransaction: (id: CreditTransactionId) => Promise<void>;
}

export function useCreditTransactionCrud(): UseCreditTransactionCrudReturn {
    const { t } = useTranslation();

    const result = useQuery(creditTransactions);

    const addCredit = async (data: CreditTransactionFormData): Promise<CreditTransactionId> => {
        try {
            const result = await evolu.insert("creditTransactions", {
                customerId: data.customerId,
                employeeId: data.employeeId || null,
                amount: parseFloat(data.amount),
                date: data.date,
                note: data.note || null,
                priceId: data.priceId || null,
                serviceId: data.serviceId || null,
                quantity: data.quantity || null,
                calendarEventId: data.calendarEventId || null,
                transactionType: data.transactionType || null,
            });

            if (result.ok) {
                toast.success(t("creditLedger.toast.created"));
                return result.value.id;
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to add credit:", error);
            toast.error(t("creditLedger.toast.createError"));
            throw error;
        }
    };

    const deleteCreditTransaction = async (id: CreditTransactionId): Promise<void> => {
        try {
            const result = await evolu.update("creditTransactions", {
                id,
                isDeleted: 1,
            });

            if (result.ok) {
                toast.success(t("creditLedger.toast.deleted"));
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to delete credit transaction:", error);
            toast.error(t("creditLedger.toast.deleteError"));
            throw error;
        }
    };

    return {
        creditTransactions: result,
        isLoading: result === undefined || result === null,
        addCredit,
        deleteCreditTransaction,
    };
}
