import { PriceId, ServiceId } from '../evolu/evolu-db';

export interface Price {
    id: PriceId;
    serviceId: ServiceId;
    price: string;
    unitType: string;
    actualInTime: boolean;
    validFrom?: string;
    validTo?: string;
    preOrderAllowed: boolean;
    expirationAction?: string;
}

export interface PriceFormData {
    serviceId: string;
    price: string;
    unitType: string;
    actualInTime: boolean;
    validFrom?: Date;
    validTo?: Date;
    preOrderAllowed: boolean;
    expirationAction?: string;
}

export const UNIT_TYPES = [
    { value: '15m', label: '15 min' },
    { value: '30m', label: '30 min' },
    { value: '45m', label: '45 min' },
    { value: '1h', label: '1 hour' },
    { value: '8h', label: '8 hours' },
    { value: 'session', label: '1 session' },
    { value: 'other', label: 'Other' },
] as const;

export type UnitType = typeof UNIT_TYPES[number]['value'];

export const CURRENCIES = [
    { value: 'EUR', symbol: '€', label: 'EUR (€)' },
    { value: 'USD', symbol: '$', label: 'USD ($)' },
    { value: 'GBP', symbol: '£', label: 'GBP (£)' },
    { value: 'CZK', symbol: 'Kč', label: 'CZK (Kč)' },
    { value: 'HUF', symbol: 'Ft', label: 'HUF (Ft)' },
    { value: 'PLN', symbol: 'zł', label: 'PLN (zł)' },
    { value: 'RON', symbol: 'lei', label: 'RON (lei)' },
    { value: 'CHF', symbol: 'Fr', label: 'CHF (Fr)' },
    { value: 'SEK', symbol: 'kr', label: 'SEK (kr)' },
    { value: 'NOK', symbol: 'kr', label: 'NOK (kr)' },
    { value: 'DKK', symbol: 'kr', label: 'DKK (kr)' },
    { value: 'UAH', symbol: '₴', label: 'UAH (₴)' },
    { value: 'RSD', symbol: 'din', label: 'RSD (din)' },
    { value: 'HRK', symbol: 'kn', label: 'HRK (kn)' },
    { value: 'BGN', symbol: 'лв', label: 'BGN (лв)' },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['value'];

export const EXPIRATION_ACTIONS = [
    { value: 'keepPreorders', label: 'Keep preorders' },
    { value: 'cancelPreorders', label: 'Cancel preorders' },
    { value: 'payDifference', label: 'Need pay difference' },
] as const;

export type ExpirationAction = typeof EXPIRATION_ACTIONS[number]['value'];

export function getCurrencySymbol(code: string): string {
    return CURRENCIES.find(c => c.value === code)?.symbol ?? code;
}
