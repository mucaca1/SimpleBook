import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, TextField, Button, MenuItem, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { CreditTransactionFormData } from '../../types/creditTransaction';
import { CustomerId } from '../../evolu/evolu-db';
import { TEmployeeRow } from '../../evolu/evolu-query';
import { getCurrencySymbol } from '../../types/price';

interface AddCreditFormProps {
    customerId: CustomerId;
    employees: TEmployeeRow[];
    currencySymbol: string;
    onSubmit: (data: CreditTransactionFormData) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

export function AddCreditForm({
    customerId,
    employees,
    currencySymbol,
    onSubmit,
    onCancel,
    isSubmitting,
}: AddCreditFormProps) {
    const { t } = useTranslation();

    const { control, handleSubmit, formState: { errors } } = useForm<CreditTransactionFormData>({
        defaultValues: {
            customerId,
            employeeId: '',
            amount: '',
            date: dayjs().format('YYYY-MM-DD'),
            note: '',
        },
    });

    const handleFormSubmit = async (data: CreditTransactionFormData) => {
        await onSubmit({
            ...data,
            customerId,
        });
    };

    return (
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ maxWidth: 400 }}>
            <Stack spacing={2}>
                <Controller
                    name="date"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('creditLedger.form.date')}
                            type="date"
                            required
                            InputLabelProps={{ shrink: true }}
                            size="small"
                            error={!!errors.date}
                        />
                    )}
                />
                <Controller
                    name="amount"
                    control={control}
                    rules={{
                        required: true,
                        min: { value: 0.01, message: 'Amount must be greater than 0' },
                    }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={`${t('creditLedger.form.amount')} (${currencySymbol})`}
                            type="number"
                            required
                            inputProps={{ min: 0.01, step: 0.01 }}
                            size="small"
                            error={!!errors.amount}
                            helperText={errors.amount?.message}
                        />
                    )}
                />
                <Controller
                    name="employeeId"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            select
                            label={t('creditLedger.form.employee')}
                            size="small"
                            helperText={employees.length === 0 ? t('creditLedger.form.noEmployees') : undefined}
                        >
                            <MenuItem value="">
                                <em>—</em>
                            </MenuItem>
                            {employees.map((emp) => (
                                <MenuItem key={emp.id} value={emp.id}>
                                    {emp.firstName || ''} {emp.lastName || ''}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                />
                <Controller
                    name="note"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('creditLedger.form.note')}
                            placeholder={t('creditLedger.form.notePlaceholder')}
                            multiline
                            rows={2}
                            size="small"
                        />
                    )}
                />
                <Stack direction="row" spacing={1}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? t('common.saving') : t('creditLedger.form.addCredit')}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        {t('common.cancel')}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}
