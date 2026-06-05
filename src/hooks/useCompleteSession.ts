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
import type { CompleteSessionData, CustomerCostPreview, AttendanceStatus } from "../components/eventCalendar/completeSessionTypes";

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

/** Whether this attendance status should be charged */
function isChargable(attendance: AttendanceStatus): boolean {
    return attendance === "present" || attendance === "absent_charged";
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

    /** Calculate the auto-calculated (default) cost for a customer */
    const getAutoCalculatedCost = useCallback(
        (
            eventStart: string,
            eventEnd: string,
            serviceId: string | null
        ): { cost: number; unitCount: number; pricePerUnit: number } => {
            if (!serviceId) return { cost: 0, unitCount: 0, pricePerUnit: 0 };
            const price = getApplicablePrice(serviceId);
            if (!price) return { cost: 0, unitCount: 0, pricePerUnit: 0 };

            const durationMinutes = dayjs(eventEnd).diff(dayjs(eventStart), "minute");
            const unitCount = calculateUnitCount(durationMinutes, String(price.unitType));
            const pricePerUnit = Number(price.price);
            return { cost: unitCount * pricePerUnit, unitCount, pricePerUnit };
        },
        [getApplicablePrice]
    );

    const getCustomerCostPreview = useCallback(
        (
            customerId: string,
            eventStart: string,
            eventEnd: string,
            serviceId: string | null,
            customPrice: number | null
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
            const autoCost = unitCount * Number(price.price);

            // Use custom price if provided, otherwise auto-calculated
            const totalCost = customPrice !== null ? customPrice : autoCost;

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
                const {
                    eventId, serviceId,
                    employeeAttendance, customerAttendance,
                    additionalEmployeeIds, additionalCustomerIds,
                    customerPriceOverrides,
                } = data;

                // Build a map of custom prices
                const customPriceMap = new Map<string, number>();
                for (const override of customerPriceOverrides) {
                    if (override.customPrice !== null) {
                        customPriceMap.set(override.customerId, override.customPrice);
                    }
                }

                // 1. Add additional employees to the event
                if (additionalEmployeeIds.length > 0) {
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

                // 5. For each chargable customer (present or absent_charged), create credit transactions
                const chargableCustomers = customerAttendance.filter(
                    (e) => isChargable(e.attendance)
                );

                if (serviceId && chargableCustomers.length > 0) {
                    const price = getApplicablePrice(serviceId);
                    if (price) {
                        const durationMinutes = dayjs(data.eventEnd).diff(dayjs(data.eventStart), "minute");
                        const unitCount = calculateUnitCount(durationMinutes, String(price.unitType));
                        const pricePerUnit = Number(price.price);
                        const autoCost = unitCount * pricePerUnit;

                        for (const customer of chargableCustomers) {
                            const customPrice = customPriceMap.get(customer.id) ?? null;
                            const finalCost = customPrice !== null ? customPrice : autoCost;
                            const isNoShow = customer.attendance === "absent_charged";
                            const notePrefix = isNoShow ? `No-show: ${data.eventTitle}` : `Session: ${data.eventTitle}`;

                            // Only use pre-orders when using auto-calculated price (not custom)
                            if (customPrice === null) {
                                const availablePreOrders = getAvailablePreOrders(customer.id, serviceId);
                                const preOrdersUsed = Math.min(availablePreOrders, unitCount);
                                const remainingUnits = unitCount - preOrdersUsed;

                                for (let i = 0; i < preOrdersUsed; i++) {
                                    await evolu.insert("creditTransactions", {
                                        customerId: customer.id as any,
                                        amount: -pricePerUnit,
                                        date: dayjs().format("YYYY-MM-DD"),
                                        note: notePrefix,
                                        priceId: price.id,
                                        serviceId: serviceId as any,
                                        quantity: 1,
                                        calendarEventId: eventId as CalendarEventId,
                                        transactionType: "consumption",
                                    });
                                }

                                if (remainingUnits > 0) {
                                    await evolu.insert("creditTransactions", {
                                        customerId: customer.id as any,
                                        amount: -(remainingUnits * pricePerUnit),
                                        date: dayjs().format("YYYY-MM-DD"),
                                        note: notePrefix,
                                        serviceId: serviceId as any,
                                        quantity: remainingUnits,
                                        calendarEventId: eventId as CalendarEventId,
                                        transactionType: "consumption",
                                    });
                                }
                            } else {
                                // Custom price: single transaction for the whole amount
                                await evolu.insert("creditTransactions", {
                                    customerId: customer.id as any,
                                    amount: -finalCost,
                                    date: dayjs().format("YYYY-MM-DD"),
                                    note: `${notePrefix} (custom price)`,
                                    serviceId: serviceId as any,
                                    quantity: 1,
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
        getAutoCalculatedCost,
        getAvailablePreOrders,
        isCompleting,
        priceMap,
        serviceMap,
        allPrices,
    };
}
