import { CustomFieldId, CustomFieldValueId } from '../evolu/evolu-db';

/**
 * Custom field type enumeration
 */
export type CustomFieldType = 'Text' | 'Number' | 'Date' | 'Yes/No' | 'Dropdown';

/**
 * Entity that custom field applies to
 */
export type CustomFieldAppliesTo = 'Customer' | 'Employee';

/**
 * Custom field definition
 */
export interface CustomField {
    id: CustomFieldId;
    appliesTo: CustomFieldAppliesTo;
    fieldName: string;
    fieldType: CustomFieldType;
    dropdownItems?: string | null;
    placeholder?: string | null;
    helpText?: string | null;
    required: boolean;
    editableAfterInitial: boolean;
    showInTable: boolean;
    containEmptyValue?: boolean | null;
}

/**
 * Form data for creating/updating custom fields
 */
export interface CustomFieldFormData {
    appliesTo: CustomFieldAppliesTo;
    fieldName: string;
    fieldType: CustomFieldType;
    dropdownItems?: string;
    placeholder?: string;
    helpText?: string;
    required: boolean;
    editableAfterInitial: boolean;
    showInTable: boolean;
    containEmptyValue?: boolean;
}

/**
 * Custom field value
 */
export interface CustomFieldValue {
    id: CustomFieldValueId;
    customFieldId: CustomFieldId;
    customerId?: string | null;
    employeeId?: string | null;
    value?: string | null;
}

/**
 * Custom field value with field definition
 */
export interface CustomFieldValueWithField extends CustomFieldValue {
    field: CustomField;
}

/**
 * Type constants for display labels
 */
export const CUSTOM_FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
    'Text': 'Text',
    'Number': 'Number',
    'Date': 'Date',
    'Yes/No': 'Yes/No',
    'Dropdown': 'Dropdown',
};

export const CUSTOM_FIELD_APPLIES_TO_LABELS: Record<CustomFieldAppliesTo, string> = {
    'Customer': 'Customer',
    'Employee': 'Employee',
};

export const CONTAIN_EMPTY_VALUE_LABELS: Record<boolean, string> = {
    true: 'Yes',
    false: 'No',
};
