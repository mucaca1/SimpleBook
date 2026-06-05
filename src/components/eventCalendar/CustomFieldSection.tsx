import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@evolu/react';
import {
    Box, Stack, TextField, FormControlLabel, Checkbox,
    MenuItem, Select, Typography, FormControl, FormHelperText,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import * as Evolu from '@evolu/common';
import { customFields, getCustomFieldValuesForCalendarEvent } from '../../evolu/evolu-query';
import type { TCustomFieldRow, TCustomFieldValueRow } from '../../evolu/evolu-query';
import type { CalendarEventId } from '../../evolu/evolu-db';
import { getTranslatedFieldName } from '../../utils/customFieldTranslations';
import type { Language } from '../../types/common';

export interface CustomFieldSectionRef {
    validate: () => boolean;
    getValues: () => Record<string, string | boolean | null>;
}

interface CustomFieldSectionProps {
    eventId: CalendarEventId | null;
    onValuesChange: (values: Record<string, string | boolean | null>) => void;
    disabled: boolean;
}

interface FieldValuesState {
    [fieldId: string]: string | boolean | null;
}

interface ValidationErrorsState {
    [fieldId: string]: string;
}

export const CustomFieldSection = React.forwardRef<
    CustomFieldSectionRef,
    CustomFieldSectionProps
>(({ eventId, onValuesChange, disabled }, ref) => {
    const { t, i18n } = useTranslation();
    const currentLanguage = (i18n.language?.split('-')[0] || 'en') as Language;

    const allCustomFields = useQuery(customFields) as TCustomFieldRow[];
    const filteredFields = allCustomFields.filter(
        (field) => field.appliesTo === 'CalendarEvent'
    );

    // Memoize parameterized query to avoid re-creating on every render
    const eventValuesQuery = useMemo(
        () => eventId ? getCustomFieldValuesForCalendarEvent(eventId) : customFields,
        [eventId]
    );

    const existingValues = useQuery(eventValuesQuery) as TCustomFieldValueRow[];

    const [fieldValues, setFieldValues] = useState<FieldValuesState>({});
    const [validationErrors, setValidationErrors] = useState<ValidationErrorsState>({});
    const fieldValuesRef = useRef(fieldValues);

    useEffect(() => {
        fieldValuesRef.current = fieldValues;
        onValuesChange(fieldValues);
    }, [fieldValues, onValuesChange]);

    useEffect(() => {
        if (existingValues && existingValues.length > 0) {
            const initialValues: FieldValuesState = {};
            existingValues.forEach((v) => {
                if (v.value !== null && v.value !== undefined && v.calendarEventId) {
                    initialValues[v.customFieldId] = v.value;
                }
            });
            setFieldValues(initialValues);
        }
    }, [existingValues]);

    const handleFieldValueChange = (fieldId: string, value: string | boolean | null) => {
        setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
        if (validationErrors[fieldId]) {
            setValidationErrors((prev) => {
                const next = { ...prev };
                delete next[fieldId];
                return next;
            });
        }
    };

    const validate = (): boolean => {
        const errors: ValidationErrorsState = {};
        let isValid = true;
        const currentValues = fieldValuesRef.current;

        filteredFields.forEach((field) => {
            if (field.required === Evolu.sqliteTrue) {
                const value = currentValues[field.id];
                const hasValue =
                    value !== null && value !== undefined && value !== '' &&
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

    React.useImperativeHandle(ref, () => ({
        validate,
        getValues: () => fieldValuesRef.current,
    }));

    if (filteredFields.length === 0) return null;

    const renderFieldInput = (field: TCustomFieldRow) => {
        const value = fieldValues[field.id] ?? null;
        const error = validationErrors[field.id];
        const required = field.required === Evolu.sqliteTrue;
        const label = (
            <span>
                {getTranslatedFieldName(field.fieldName, field.fieldNameTranslations, currentLanguage)}
                {required && <span style={{ color: 'red' }}> *</span>}
            </span>
        );

        switch (field.fieldType) {
            case 'Text':
                return (
                    <TextField
                        label={label}
                        value={value || ''}
                        onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                        fullWidth
                        placeholder={field.placeholder || undefined}
                        disabled={disabled}
                        error={!!error}
                        helperText={error || field.helpText || ''}
                        size="small"
                    />
                );
            case 'Number':
                return (
                    <TextField
                        type="number"
                        label={label}
                        value={value || ''}
                        onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                        fullWidth
                        placeholder={field.placeholder || undefined}
                        disabled={disabled}
                        error={!!error}
                        helperText={error || field.helpText || ''}
                        size="small"
                    />
                );
            case 'Date':
                return (
                    <MobileDatePicker
                        label={label}
                        value={value ? dayjs(value as string) : null}
                        onChange={(date) =>
                            handleFieldValueChange(field.id, date ? date.format('YYYY-MM-DD') : null)
                        }
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                placeholder: field.placeholder || undefined,
                                disabled,
                                error: !!error,
                                helperText: error || field.helpText || '',
                                size: 'small',
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
                                    onChange={(e) => handleFieldValueChange(field.id, e.target.checked)}
                                    disabled={disabled}
                                    size="small"
                                />
                            }
                            label={label}
                        />
                        {error && <FormHelperText error sx={{ ml: 0 }}>{error}</FormHelperText>}
                    </Box>
                );
            case 'Dropdown': {
                let dropdownOptions: string[] = [];
                try {
                    dropdownOptions = field.dropdownItems ? JSON.parse(field.dropdownItems) : [];
                } catch { /* ignore */ }
                const hasEmptyValue = field.containEmptyValue === Evolu.sqliteTrue;
                return (
                    <FormControl fullWidth disabled={disabled} error={!!error} size="small">
                        <Typography variant="body2" sx={{ mb: 0.5 }}>{label}</Typography>
                        <Select
                            value={value || ''}
                            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                            displayEmpty
                        >
                            {hasEmptyValue && (
                                <MenuItem value=""><em>&nbsp;</em></MenuItem>
                            )}
                            <MenuItem value="" disabled={required || hasEmptyValue}>
                                <em>{field.placeholder || t('customField.selectOption')}</em>
                            </MenuItem>
                            {dropdownOptions.map((option, index) => (
                                <MenuItem key={index} value={option}>{option}</MenuItem>
                            ))}
                        </Select>
                        {error && <FormHelperText>{error}</FormHelperText>}
                        {!error && field.helpText && <FormHelperText>{field.helpText}</FormHelperText>}
                    </FormControl>
                );
            }
            default:
                return (
                    <TextField
                        label={label}
                        value={value || ''}
                        onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                        fullWidth
                        disabled={disabled}
                        error={!!error}
                        helperText={error || field.helpText || ''}
                        size="small"
                    />
                );
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                    {t('scheduler.eventForm.customFields')}
                </Typography>
                {filteredFields.map((field) => (
                    <Box key={field.id}>
                        {renderFieldInput(field)}
                    </Box>
                ))}
            </Stack>
        </LocalizationProvider>
    );
});

CustomFieldSection.displayName = 'CustomFieldSection';
