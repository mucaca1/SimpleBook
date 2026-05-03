import { CreditTransactionId, CustomerId, EmployeeId } from '../evolu/evolu-db';

export interface CreditTransaction {
    id: CreditTransactionId;
    customerId: CustomerId;
    employeeId?: EmployeeId;
    amount: number;
    date: string;
    note?: string;
}

export interface CreditTransactionFormData {
    customerId: CustomerId;
    employeeId?: string;
    amount: string;
    date: string;
    note?: string;
}
