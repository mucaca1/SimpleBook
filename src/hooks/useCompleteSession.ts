import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@evolu/react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { evolu } from "../evolu-init";
import {
    creditTransactions,
    calendarEventEmployees,
    calendarEventCustomers,
    prices,
    services,
} from "../evolu/evolu-query";
import type {
    TCreditTransactionRow,
    TCalendarEventEmployeeRow,
    TCalendarEventCustomerRow,
    TPriceRow,
    TServiceRow,
} from "../evolu/evolu-query";
import type { CalendarEventId } from "../evolu/evolu-db";
import type { CompleteSessionData, CustomerCostPreview } from "../components/eventCalendar/completeSessionTypes";

const UNIT_DURATION_MAP: Record<string, number> = {
    "15m": 15,
    "30m": 30,
    "45m": 45,
    "1h": 60,
    "8h": 480,
    session: 0,
    other: 0,
};

function calculateUnitCount(durationMinutes: number, unitType: string): number {
    const unitDuration = UNIT_DURATION_MAP[unitType];
    if (unitDuration === 0) return 1; // flat rate: session, other
    return Math.ceil(durationMinutes / unitDuration);
}

export function useCompleteSession() {
    const { t } = useTranslation();
    const [isCompleting, setIsCompleting] = useState(false);

    const allCreditTransactions = useQuery(creditTransactions) as TCreditTransactionRow[];
    const allPrices = useQuery(prices) as TPriceRow[];
    const allServices = useQuery(services) as TServiceRow[];
    const allEventEmployees = useQuery(calendarEventEmployees) as TCalendarEventEmployeeRow[];
    const allEventCustomers = useQuery(calendarEventCustomers) as TCalendarEventCustomerRow[];

    const priceMap = useMemo(() => {
        const map = new Map<string, TPriceRow>();
        allPrices.forEach((p) => map.set(String(p.id), p));
        return map;
    }, [allPrices]);

    const serviceMap = useMemo(() => {
        const map = new Map<string, TServiceRow>();
        allServices.forEach((s) => map.set(String(s.id), s));
        return map;
    }, [allServices]);

    const getCustomerBalance = useCallback(
        (customerId: string): number => {
            const txs = (allCreditTransactions ?? []).filter(
                (tx) => String(tx.customerId) === customerId
            );
            return txs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        },
        [allCreditTransactions]
    );

    const getAvailablePreOrders = useCallback(
        (customerId: string, serviceId: string): number => {
            const customerTxs = (allCreditTransactions ?? []).filter(
                (tx) => String(tx.customerId) === customerId
            );

            // Sum preorder additions for this service
            let added = 0;
            for (const tx of customerTxs) {
                if (String(tx.serviceId) !== serviceId) continue;
                const type = tx.transactionType as string | null;
                if (
                    (type === "preorder" || (type === null && tx.serviceId != null)) &&
                    Number(tx.amount) > 0
                ) {
                    added += Number(tx.quantity) || 1;
                }
            }

            // Sum consumed preorders for this service
            let consumed = 0;
            for (const tx of customerTxs) {
                if (String(tx.serviceId) !== serviceId) continue;
                if (tx.transactionType === "consumption") {
                    consumed += Number(tx.quantity) || 1;
                }
            }

            return Math.max(0, added - consumed);
        },
        [allCreditTransactions]
    );

    const getApplicablePrice = useCallback(
        (serviceId: string): TPriceRow | null => {
            const servicePrices = (allPrices ?? []).filter(
                (p) => String(p.serviceId) === serviceId
            );
            if (servicePrices.length === 0) return null;

            const now = dayjs();
            const valid = servicePrices.filter((p) => {
                const validFrom = p.validFrom ? dayjs(String(p.validFrom)) : null;
                const validTo = p.validTo ? dayjs(String(p.validTo)) : null;
                if (validFrom && now.isBefore(validFrom, "day")) return false;
                if (validTo && now.isAfter(validTo, "day")) return false;
                return true;
            });

            return valid[0] ?? servicePrices[0];
        },
        [allPrices]
    );

    const getCustomerCostPreview = useCallback(
        (
            customerId: string,
            eventStart: string,
            eventEnd: string,
            serviceId: string | null
        ): CustomerCostPreview => {
            const noService = !serviceId;
            if (noService) {
                const balance = getCustomerBalance(customerId);
                return {
                    customerId,
                    cost: 0,
                    unitCount: 0,
                    availablePreOrders: 0,
                    preOrdersUsed: 0,
                    creditCharge: 0,
                    currentBalance: balance,
                    balanceAfter: balance,
                    hasWarning: false,
                    noService: true,
                    noPrice: false,
                };
            }

            const price = getApplicablePrice(serviceId);
            if (!price) {
                const balance = getCustomerBalance(customerId);
                return {
                    customerId,
                    cost: 0,
                    unitCount: 0,
                    availablePreOrders: 0,
                    preOrdersUsed: 0,
                    creditCharge: 0,
                    currentBalance: balance,
                    balanceAfter: balance,
                    hasWarning: false,
                    noService: false,
                    noPrice: true,
                };
            }

            const durationMinutes = dayjs(eventEnd).diff(dayjs(eventStart), "minute");
            const unitCount = calculateUnitCount(durationMinutes, String(price.unitType));
            const totalCost = unitCount * Number(price.price);
            const availablePreOrders = getAvailablePreOrders(customerId, serviceId);
            const preOrdersUsed = Math.min(availablePreOrders, unitCount);
            const remainingUnits = unitCount - preOrdersUsed;
            const creditCharge = remainingUnits * Number(price.price);
            const currentBalance = getCustomerBalance(customerId);
            const balanceAfter = currentBalance - totalCost;

            return {
                customerId,
                cost: totalCost,
                unitCount,
                availablePreOrders,
                preOrdersUsed,
                creditCharge,
                currentBalance,
                balanceAfter,
                hasWarning: balanceAfter < 0,
                noService: false,
                noPrice: false,
            };
        },
        [getApplicablePrice, getAvailablePreOrders, getCustomerBalance]
    );

    const completeSession = useCallback(
        async (data: CompleteSessionData): Promise<void> => {
            setIsCompleting(true);
            try {
                const { eventId, serviceId, employeeAttendance, customerAttendance, additionalEmployeeIds, additionalCustomerIds } = data;

                // 1. Add additional employees to the event
                if (additionalEmployeeIds.length > 0) {
                    const currentEmployeeRows = (allEventEmployees ?? []).filter(
                        (r) => String(r.calendarEventId) === eventId
                    );
                    const currentEmployeeIds = currentEmployeeRows.map((r) => String(r.employeeId));
                    const allEmployeeIds = [...new Set([...currentEmployeeIds, ...additionalEmployeeIds])];

                    // Soft-delete removed assignments (none removed, only added)
                    for (const empId of additionalEmployeeIds) {
                        await evolu.insert("calendarEventEmployees", {
                            calendarEventId: eventId as CalendarEventId,
                            employeeId: empId as any,
                            attendance: "present",
                        });
                    }
                }

                // 2. Add additional customers to the event
                if (additionalCustomerIds.length > 0) {
                    for (const custId of additionalCustomerIds) {
                        await evolu.insert("calendarEventCustomers", {
                            calendarEventId: eventId as CalendarEventId,
                            customerId: custId as any,
                            attendance: "present",
                        });
                    }
                }

                // 3. Update attendance on existing employee assignments
                for (const entry of employeeAttendance) {
                    const rows = (allEventEmployees ?? []).filter(
                        (r) =>
                            String(r.calendarEventId) === eventId &&
                            String(r.employeeId) === entry.id
                    );
                    for (const row of rows) {
                        await evolu.update("calendarEventEmployees", {
                            id: row.id,
                            attendance: entry.attendance,
                        });
                    }
                }

                // 4. Update attendance on existing customer assignments
                for (const entry of customerAttendance) {
                    const rows = (allEventCustomers ?? []).filter(
                        (r) =>
                            String(r.calendarEventId) === eventId &&
                            String(r.customerId) === entry.id
                    );
                    for (const row of rows) {
                        await evolu.update("calendarEventCustomers", {
                            id: row.id,
                            attendance: entry.attendance,
                        });
                    }
                }

                // 5. For each present customer, create consumption credit transactions
                const presentCustomers = customerAttendance.filter(
                    (e) => e.attendance === "present"
                );

                if (serviceId && presentCustomers.length > 0) {
                    const price = getApplicablePrice(serviceId);
                    if (price) {
                        const durationMinutes = dayjs(data.eventEnd).diff(dayjs(data.eventStart), "minute");
                        const unitCount = calculateUnitCount(durationMinutes, String(price.unitType));
                        const priceValue = Number(price.price);

                        for (const customer of presentCustomers) {
                            const availablePreOrders = getAvailablePreOrders(customer.id, serviceId);
                            const preOrdersUsed = Math.min(availablePreOrders, unitCount);
                            const remainingUnits = unitCount - preOrdersUsed;

                            // Create consumption transactions for pre-orders used
                            for (let i = 0; i < preOrdersUsed; i++) {
                                await evolu.insert("creditTransactions", {
                                    customerId: customer.id as any,
                                    amount: -priceValue,
                                    date: dayjs().format("YYYY-MM-DD"),
                                    note: `Session: ${data.eventTitle}`,
                                    priceId: price.id,
                                    serviceId: serviceId as any,
                                    quantity: 1,
                                    calendarEventId: eventId as CalendarEventId,
                                    transactionType: "consumption",
                                });
                            }

                            // Create consumption transaction for remaining credit charge
                            if (remainingUnits > 0) {
                                await evolu.insert("creditTransactions", {
                                    customerId: customer.id as any,
                                    amount: -(remainingUnits * priceValue),
                                    date: dayjs().format("YYYY-MM-DD"),
                                    note: `Session: ${data.eventTitle}`,
                                    serviceId: serviceId as any,
                                    quantity: remainingUnits,
                                    calendarEventId: eventId as CalendarEventId,
                                    transactionType: "consumption",
                                });
                            }
                        }
                    }
                }

                // 6. Mark the event as completed
                await evolu.update("calendarEvents", {
                    id: eventId as CalendarEventId,
                    status: "completed",
                    completedAt: dayjs().toISOString(),
                });

                toast.success(t("scheduler.completeSession.toast.completed"));
            } catch (error) {
                console.error("Failed to complete session:", error);
                toast.error(t("scheduler.completeSession.toast.completeError"));
                throw error;
            } finally {
                setIsCompleting(false);
            }
        },
        [allEventEmployees, allEventCustomers, allCreditTransactions, getApplicablePrice, getAvailablePreOrders, t]
    );

    return {
        completeSession,
        getCustomerCostPreview,
        getAvailablePreOrders,
        isCompleting,
        priceMap,
        serviceMap,
        allPrices,
    };
}
