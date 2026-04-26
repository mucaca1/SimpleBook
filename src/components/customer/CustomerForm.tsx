import React, { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Box,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
    MenuItem,
    Stack,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { CustomerFormData, Sex } from '../../types/customer';
import { CustomFieldsEditor, CustomFieldsEditorRef } from '../settings/CustomFieldsEditor';
import type { CustomerId } from '../../evolu/evolu-db';

interface CustomerFormProps {
    mode: 'add' | 'edit';
    initialData?: CustomerFormData;
    customerId?: CustomerId | null;
    onSubmit: (data: CustomerFormData, customFieldValues?: Record<string, string | boolean | null>) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

export function CustomerForm({
    mode,
    initialData,
    customerId,
    onSubmit,
    onCancel,
    isSubmitting,
}: CustomerFormProps) {
    const { t } = useTranslation();

    // Ref for accessing CustomFieldsEditor validation and values
    const customFieldsEditorRef = useRef<CustomFieldsEditorRef>(null);

    const SEX_OPTIONS: { value: Sex; label: string }[] = [
        { value: 'male', label: t('customer.form.sexMale') },
        { value: 'female', label: t('customer.form.sexFemale') },
        { value: 'other', label: t('customer.form.sexOther') },
    ];

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CustomerFormData>({
        defaultValues: initialData || {
            firstName: '',
            lastName: '',
            degree: '',
            birthDate: undefined,
            isAdult: false,
            sex: undefined,
            customerId: '',
        },
    });

    // Reset form when initialData changes (e.g., when editing different customer)
    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    const handleFormSubmit = async (data: CustomerFormData) => {
        // Validate custom fields if editor is present
        if (customFieldsEditorRef.current) {
            const isValid = customFieldsEditorRef.current.validate();
            if (!isValid) {
                return; // Stop submission if validation fails
            }
        }

        // Get custom field values
        const customFieldValues = customFieldsEditorRef.current?.getValues();

        // Submit both customer data and custom field values
        await onSubmit(data, customFieldValues);
        // Form will be reset by the parent component closing the modal
    };

    return (
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ width: '100%' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Stack spacing={3}>
                    {/* First Name */}
                    <Controller
                        name="firstName"
                        control={control}
                        rules={{
                            maxLength: {
                                value: 100,
                                message: t('customer.form.validation.firstNameMaxLength'),
                            },
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label={t('customer.form.firstName')}
                                fullWidth
                                error={!!errors.firstName}
                                helperText={errors.firstName?.message}
                                disabled={isSubmitting}
                            />
                        )}
                    />

                    {/* Last Name */}
                    <Controller
                        name="lastName"
                        control={control}
                        rules={{
                            maxLength: {
                                value: 100,
                                message: t('customer.form.validation.lastNameMaxLength'),
                            },
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label={t('customer.form.lastName')}
                                fullWidth
                                error={!!errors.lastName}
                                helperText={errors.lastName?.message}
                                disabled={isSubmitting}
                            />
                        )}
                    />

                    {/* Degree */}
                    <Controller
                        name="degree"
                        control={control}
                        rules={{
                            maxLength: {
                                value: 10,
                                message: t('customer.form.validation.degreeMaxLength'),
                            },
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label={t('customer.form.degree')}
                                fullWidth
                                error={!!errors.degree}
                                helperText={errors.degree?.message}
                                disabled={isSubmitting}
                                placeholder={t('customer.form.placeholder.degree')}
                            />
                        )}
                    />

                    {/* Birth Date */}
                    <Controller
                        name="birthDate"
                        control={control}
                        render={({ field }) => (
                            <MobileDatePicker
                                {...field}
                                label={t('customer.form.birthDate')}
                                value={field.value ? dayjs(field.value) : null}
                                onChange={(date) => {
                                    field.onChange(date ? date.toDate() : undefined);
                                }}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        error: !!errors.birthDate,
                                        helperText: errors.birthDate?.message,
                                        disabled: isSubmitting,
                                    },
                                }}
                            />
                        )}
                    />

                    {/* Is Adult */}
                    <Controller
                        name="isAdult"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={field.value || false}
                                        onChange={field.onChange}
                                        disabled={isSubmitting}
                                    />
                                }
                                label={t('customer.form.isAdult')}
                            />
                        )}
                    />

                    {/* Sex */}
                    <Controller
                        name="sex"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                label={t('customer.form.sex')}
                                fullWidth
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value as Sex)}
                                disabled={isSubmitting}
                            >
                                <MenuItem value="">
                                    <em>{t('customer.form.sexNone')}</em>
                                </MenuItem>
                                {SEX_OPTIONS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    />

                    {/* Customer ID */}
                    <Controller
                        name="customerId"
                        control={control}
                        rules={{
                            maxLength: {
                                value: 50,
                                message: t('customer.form.validation.customerIdMaxLength'),
                            },
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label={t('customer.form.customerId')}
                                fullWidth
                                error={!!errors.customerId}
                                helperText={errors.customerId?.message}
                                disabled={isSubmitting}
                                placeholder={t('customer.form.placeholder.customerId')}
                            />
                        )}
                    />

                    {/* Inline Custom Fields - Integrated like normal fields */}
                    <CustomFieldsEditor
                        ref={customFieldsEditorRef}
                        appliesTo="Customer"
                        customerId={customerId || null}
                        isSubmitting={isSubmitting}
                        inline={true}
                    />

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                        <Button
                            onClick={onCancel}
                            disabled={isSubmitting}
                            variant="outlined"
                        >
                            {t('customer.form.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? t('customer.form.saving')
                                : mode === 'add'
                                ? t('customer.form.addCustomer')
                                : t('customer.form.updateCustomer')}
                        </Button>
                    </Stack>
                </Stack>
            </LocalizationProvider>
        </Box>
    );
}
