import { EmployeeId } from '../evolu/evolu-db';

export interface Employee {
    id: EmployeeId;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
}

export interface EmployeeFormData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
}
