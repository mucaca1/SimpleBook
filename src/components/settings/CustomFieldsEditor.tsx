/**
 * CustomFieldsEditor - Component for rendering custom fields in customer form
 *
 * Displays all custom fields that apply to customers with appropriate input controls.
 * Handles field type rendering (Text, Number, Date, Yes/No, Dropdown).
 * Enforces required validation and respects editableAfterInitial flag.
 *
 * Uses useCustomFieldValues hook for fetching and saving field values.
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@evolu/react';
import {
    Box,
    Stack,
    TextField,
    FormControlLabel,
    Checkbox,
    MenuItem,
    Select,
    Typography,
    FormControl,
    FormHelperText,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { customFields } from '../../evolu/evolu-query';
import { useCustomFieldValues } from '../../hooks/useCustomFieldValues';
import type { TCustomFieldRow } from '../../evolu/evolu-query';
import type { CustomerId } from '../../evolu/evolu-db';
import * as Evolu from '@evolu/common';

interface CustomFieldsEditorProps {
    customerId: CustomerId | null;
    isSubmitting: boolean;
    inline?: boolean; // If true, render fields inline without section header and boxes
}

/**
 * Custom field value state interface
 */
interface CustomFieldValuesState {
    [customFieldId: string]: string | boolean | null;
}

/**
 * Custom field validation error state
 */
interface ValidationErrorsState {
    [customFieldId: string]: string;
}

export const CustomFieldsEditor = React.forwardRef<
    CustomFieldsEditorRef,
    CustomFieldsEditorProps
>(({ customerId, isSubmitting, inline = false }, ref) => {
    const { t } = useTranslation();

    // Fetch all custom fields
    const allCustomFields = useQuery(customFields) as TCustomFieldRow[];

    // Filter to only Customer fields
    const customerFields = allCustomFields.filter(
        (field) => field.appliesTo === 'Customer' && field.isDeleted !== Evolu.sqliteTrue
    );

    // Fetch existing values for this customer
    const { values } = useCustomFieldValues(customerId);

    // Local state for field values
    const [fieldValues, setFieldValues] = useState<CustomFieldValuesState>({});
    const [validationErrors, setValidationErrors] = useState<ValidationErrorsState>({});

    // Initialize field values from database
    useEffect(() => {
        if (values && values.length > 0) {
            const initialValues: CustomFieldValuesState = {};
            values.forEach((value) => {
                // Convert Yes/No string values to boolean for checkbox
                if (value.value !== null && value.value !== undefined) {
                    initialValues[value.customFieldId] = value.value;
                }
            });
            setFieldValues(initialValues);
        }
    }, [values]);

    // Check if a field should be disabled (editableAfterInitial logic)
    const isFieldDisabled = (field: TCustomFieldRow): boolean => {
        // Disable if isSubmitting
        if (isSubmitting) return true;

        // If editing (customerId exists) and field is not editable after initial
        if (customerId && field.editableAfterInitial === Evolu.sqliteTrue) {
            // Check if this field already has a value
            const hasValue = values.some(
                (v) => v.customFieldId === field.id && v.value !== null && v.value !== ''
            );
            return hasValue;
        }

        return false;
    };

    // Handle field value change
    const handleFieldValueChange = (fieldId: string, value: string | boolean | null) => {
        setFieldValues((prev) => ({
            ...prev,
            [fieldId]: value,
        }));

        // Clear validation error for this field
        if (validationErrors[fieldId]) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldId];
                return newErrors;
            });
        }
    };

    // Validate required fields
    const validateRequiredFields = (): boolean => {
        const errors: ValidationErrorsState = {};
        let isValid = true;

        customerFields.forEach((field) => {
            if (field.required === Evolu.sqliteTrue) {
                const value = fieldValues[field.id];
                const hasValue =
                    value !== null &&
                    value !== undefined &&
                    value !== '' &&
                    !(typeof value === 'boolean' && !value);

                if (!hasValue) {
                    errors[field.id] = t('customField.validation.required') || 'This field is required';
                    isValid = false;
                }
            }
        });

        setValidationErrors(errors);
        return isValid;
    };

    // Expose validation function to parent component
    React.useImperativeHandle(
        ref,
        () => ({
            validate: validateRequiredFields,
            getValues: () => fieldValues,
        }),
        [fieldValues, validationErrors]
    );

    // Don't render if no customer fields exist
    if (customerFields.length === 0) {
        return null;
    }

    // Render input control based on field type
    const renderFieldInput = (field: TCustomFieldRow) => {
        const value = fieldValues[field.id] || null;
        const disabled = isFieldDisabled(field);
        const error = validationErrors[field.id];
        const required = field.required === Evolu.sqliteTrue;
        const label = (
            <span>
                {field.fieldName}
                {required && <span style={{ color: 'red' }}> *</span>}
            </span>
        );

        switch (field.fieldType) {
            case 'Text':
                return (
                    <TextField
                        label={inline ? label : undefined}
                        value={value || ''}
                        onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                        fullWidth
                        placeholder={field.placeholder || undefined}
                        disabled={disabled}
                        error={!!error}
                        helperText={error || (inline ? field.helpText : field.helpText) || ''}
                        multiline={field.helpText && field.helpText.length > 50}
                    />
                );

            case 'Number':
                return (
                    <TextField
                        type="number"
                        label={inline ? label : undefined}
                        value={value || ''}
                        onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                        fullWidth
                        placeholder={field.placeholder || undefined}
                        disabled={disabled}
                        error={!!error}
                        helperText={error || (inline ? field.helpText : field.helpText) || ''}
                    />
                );

            case 'Date':
                return (
                    <MobileDatePicker
                        label={inline ? label : undefined}
                        value={value ? dayjs(value as string) : null}
                        onChange={(date) =>
                            handleFieldValueChange(field.id, date ? date.toDate() : null)
                        }
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                placeholder: field.placeholder || undefined,
                                disabled,
                                error: !!error,
                                helperText: error || (inline ? field.helpText : field.helpText) || '',
                            },
                        }}
                        disabled={disabled}
                    />
                );

            case 'Yes/No':
                return (
                    <Box>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={value === 'true' || value === true}
                                    onChange={(e) =>
                                        handleFieldValueChange(field.id, e.target.checked)
                                    }
                                    disabled={disabled}
                                />
                            }
                            label={inline ? label : (field.helpText || field.fieldName)}
                        />
                        {error && (
                            <FormHelperText error sx={{ ml: 0 }}>
                                {error}
                            </FormHelperText>
                        )}
                        {!error && inline && field.helpText && (
                            <FormHelperText>{field.helpText}</FormHelperText>
                        )}
                    </Box>
                );

            case 'Dropdown':
                let dropdownOptions: string[] = [];
                try {
                    dropdownOptions = field.dropdownItems
                        ? JSON.parse(field.dropdownItems)
                        : [];
                } catch (e) {
                    console.error('Failed to parse dropdown items:', e);
                }

                const hasEmptyValue = field.containEmptyValue === Evolu.sqliteTrue;

                return (
                    <FormControl fullWidth disabled={disabled} error={!!error}>
                        {inline && <Typography variant="body1" sx={{ mb: 1 }}>{label}</Typography>}
                        <Select
                            value={value || ''}
                            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                            displayEmpty
                        >
                            {hasEmptyValue && (
                                <MenuItem value="">
                                    <em>&nbsp;</em>
                                </MenuItem>
                            )}
                            <MenuItem value="" disabled={required || hasEmptyValue}>
                                <em>
                                    {field.placeholder ||
                                    t('customField.selectOption') ||
                                    'Select an option'}
                                </em>
                            </MenuItem>
                            {dropdownOptions.map((option, index) => (
                                <MenuItem key={index} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </Select>
                        {error && <FormHelperText>{error}</FormHelperText>}
                        {!error && field.helpText && (
                            <FormHelperText>{field.helpText}</FormHelperText>
                        )}
                    </FormControl>
                );

            default:
                return (
                    <TextField
                        label={inline ? label : undefined}
                        value={value || ''}
                        onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                        fullWidth
                        disabled={disabled}
                        error={!!error}
                        helperText={error || (inline ? field.helpText : field.helpText) || ''}
                    />
                );
        }
    };

    // Inline mode: render fields as normal form fields
    if (inline) {
        return (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                {customerFields.map((field) => (
                    <Box key={field.id}>
                        {renderFieldInput(field)}
                    </Box>
                ))}
            </LocalizationProvider>
        );
    }

    // Standard mode: render fields in a section with boxes
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={3}>
                <Typography variant="h6" gutterBottom>
                    {t('customer.form.customFieldsSection') || 'Custom Fields'}
                </Typography>

                {customerFields.map((field) => (
                    <Box
                        key={field.id}
                        sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            backgroundColor: 'background.paper',
                        }}
                    >
                        <Stack spacing={1}>
                            <Typography variant="subtitle1" fontWeight="medium">
                                {field.fieldName}
                                {field.required === Evolu.sqliteTrue && (
                                    <span style={{ color: 'red' }}> *</span>
                                )}
                            </Typography>

                            {renderFieldInput(field)}

                            {field.helpText && field.fieldType !== 'Yes/No' && !validationErrors[field.id] && (
                                <Typography variant="caption" color="textSecondary">
                                    {field.helpText}
                                </Typography>
                            )}

                            {field.editableAfterInitial === Evolu.sqliteTrue &&
                                isFieldDisabled(field) && (
                                    <Typography variant="caption" color="textSecondary">
                                        {t('customField.fieldNotEditable') ||
                                            'This field cannot be edited after initial entry'}
                                    </Typography>
                                )}
                        </Stack>
                    </Box>
                ))}
            </Stack>
        </LocalizationProvider>
    );
});

CustomFieldsEditor.displayName = 'CustomFieldsEditor';

/**
 * Type for the ref that can be used to access validation and values
 */
export interface CustomFieldsEditorRef {
    validate: () => boolean;
    getValues: () => CustomFieldValuesState;
}
