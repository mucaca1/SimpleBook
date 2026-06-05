export interface AttendanceEntry {
    id: string;
    attendance: 'present' | 'absent';
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
}
