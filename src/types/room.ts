import { RoomId } from '../evolu/evolu-db';

export interface Room {
    id: RoomId;
    name: string;
    color?: string;
    maxCapacity: number;
    countChildrenAsPerson: boolean;
}

export interface RoomFormData {
    name: string;
    color?: string;
    maxCapacity: number;
    countChildrenAsPerson: boolean;
}
