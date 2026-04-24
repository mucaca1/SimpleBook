import React, { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Box,
    TextField,
    Button,
    Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { EmployeeFormData } from '../../types/employee';
import { CustomFieldsEditor, CustomFieldsEditorRef } from '../settings/CustomFieldsEditor';
import type { EmployeeId } from '../../evolu/evolu-db';

interface EmployeeFormProps {
    mode: 'add' | 'edit';
    initialData?: EmployeeFormData;
    employeeId?: EmployeeId | null;
    onSubmit: (data: EmployeeFormData, customFieldValues?: Record<string, string | boolean | null>) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

export function EmployeeForm({
    mode,
    initialData,
    employeeId,
    onSubmit,
    onCancel,
    isSubmitting,
}: EmployeeFormProps) {
    const { t } = useTranslation();

    const customFieldsEditorRef = useRef<CustomFieldsEditorRef>(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EmployeeFormData>({
        defaultValues: initialData || {
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    const handleFormSubmit = async (data: EmployeeFormData) => {
        if (customFieldsEditorRef.current) {
            const isValid = customFieldsEditorRef.current.validate();
            if (!isValid) {
                return;
            }
        }

        const customFieldValues = customFieldsEditorRef.current?.getValues();
        await onSubmit(data, customFieldValues);
    };

    return (
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ width: '100%' }}>
            <Stack spacing={3}>
                {/* First Name */}
                <Controller
                    name="firstName"
                    control={control}
                    rules={{
                        maxLength: {
                            value: 100,
                            message: t('employee.form.validation.firstNameMaxLength'),
                        },
                    }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('employee.form.firstName')}
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
                            message: t('employee.form.validation.lastNameMaxLength'),
                        },
                    }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('employee.form.lastName')}
                            fullWidth
                            error={!!errors.lastName}
                            helperText={errors.lastName?.message}
                            disabled={isSubmitting}
                        />
                    )}
                />

                {/* Phone */}
                <Controller
                    name="phone"
                    control={control}
                    rules={{
                        maxLength: {
                            value: 100,
                            message: t('employee.form.validation.phoneMaxLength'),
                        },
                        pattern: {
                            value: /^[+]?[\d\s\-()]*$/,
                            message: t('employee.form.validation.phoneInvalid'),
                        },
                    }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('employee.form.phone')}
                            fullWidth
                            error={!!errors.phone}
                            helperText={errors.phone?.message}
                            disabled={isSubmitting}
                            placeholder={t('employee.form.placeholder.phone')}
                        />
                    )}
                />

                {/* Email */}
                <Controller
                    name="email"
                    control={control}
                    rules={{
                        maxLength: {
                            value: 100,
                            message: t('employee.form.validation.emailMaxLength'),
                        },
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: t('employee.form.validation.emailInvalid'),
                        },
                    }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('employee.form.email')}
                            fullWidth
                            error={!!errors.email}
                            helperText={errors.email?.message}
                            disabled={isSubmitting}
                            placeholder={t('employee.form.placeholder.email')}
                        />
                    )}
                />

                {/* Inline Custom Fields */}
                <CustomFieldsEditor
                    ref={customFieldsEditorRef}
                    appliesTo="Employee"
                    employeeId={employeeId || null}
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
                        {t('employee.form.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? t('employee.form.saving')
                            : mode === 'add'
                            ? t('employee.form.addEmployee')
                            : t('employee.form.updateEmployee')}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}
