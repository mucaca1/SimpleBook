import { CreditTransactionId, CustomerId, EmployeeId, PriceId, ServiceId, CalendarEventId } from '../evolu/evolu-db';

export interface CreditTransaction {
    id: CreditTransactionId;
    customerId: CustomerId;
    employeeId?: EmployeeId;
    amount: number;
    date: string;
    note?: string;
    priceId?: PriceId;
    serviceId?: ServiceId;
    quantity?: number;
    calendarEventId?: CalendarEventId;
    transactionType?: string;
}

export interface CreditTransactionFormData {
    customerId: CustomerId;
    employeeId?: string;
    amount: string;
    date: string;
    note?: string;
    priceId?: string;
    serviceId?: string;
    quantity?: number;
    calendarEventId?: string;
    transactionType?: string;
}
