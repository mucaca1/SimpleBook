import { ServiceId } from '../evolu/evolu-db';

export interface Service {
    id: ServiceId;
    name: string;
    description?: string;
    duration: string;
    color?: string;
}

export interface ServiceFormData {
    name: string;
    description?: string;
    duration: string;
    color?: string;
}
