export type AttendanceStatus = 'present' | 'absent' | 'absent_charged';

export interface AttendanceEntry {
    id: string;
    attendance: AttendanceStatus;
}

export interface CustomerCostPreview {
    customerId: string;
    cost: number;
    unitCount: number;
    availablePreOrders: number;
    preOrdersUsed: number;
    creditCharge: number;
    currentBalance: number;
    balanceAfter: number;
    hasWarning: boolean;
    noService: boolean;
    noPrice: boolean;
}

export interface CustomerPriceOverride {
    customerId: string;
    customPrice: number | null;  // null = use auto-calculated price
}

export interface CompleteSessionData {
    eventId: string;
    eventTitle: string;
    eventStart: string;
    eventEnd: string;
    serviceId: string | null;
    employeeAttendance: AttendanceEntry[];
    customerAttendance: AttendanceEntry[];
    additionalEmployeeIds: string[];
    additionalCustomerIds: string[];
    customerPriceOverrides: CustomerPriceOverride[];
}
