import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, TextField, Button, MenuItem, Stack, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { CreditTransactionFormData } from '../../types/creditTransaction';
import { CustomerId } from '../../evolu/evolu-db';
import { TEmployeeRow, TServiceRow, TPreOrderPriceRow } from '../../evolu/evolu-query';
import { UNIT_TYPES } from '../../types/price';

interface PreOrderFormData {
    date: string;
    serviceId: string;
    priceId: string;
    quantity: string;
    amount: string;
    employeeId: string;
    note: string;
}

interface AddPreOrderFormProps {
    customerId: CustomerId;
    employees: TEmployeeRow[];
    currencySymbol: string;
    services: TServiceRow[];
    preOrderPrices: TPreOrderPriceRow[];
    onSubmit: (data: CreditTransactionFormData) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

export function AddPreOrderForm({
    customerId,
    employees,
    currencySymbol,
    services,
    preOrderPrices,
    onSubmit,
    onCancel,
    isSubmitting,
}: AddPreOrderFormProps) {
    const { t } = useTranslation();
    const amountManuallyEdited = useRef(false);

    const servicesWithPreOrder = useMemo(() => {
        const serviceIds = new Set(preOrderPrices.map(p => p.serviceId as string));
        return services.filter(s => serviceIds.has(s.id as string));
    }, [services, preOrderPrices]);

    const pricesForServiceMap = useMemo(() => {
        const map = new Map<string, TPreOrderPriceRow[]>();
        preOrderPrices.forEach(p => {
            const list = map.get(p.serviceId as string) || [];
            list.push(p);
            map.set(p.serviceId as string, list);
        });
        return map;
    }, [preOrderPrices]);

    const priceMap = useMemo(() => {
        const map = new Map<string, TPreOrderPriceRow>();
        preOrderPrices.forEach(p => map.set(p.id as string, p));
        return map;
    }, [preOrderPrices]);

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<PreOrderFormData>({
        defaultValues: {
            date: dayjs().format('YYYY-MM-DD'),
            serviceId: '',
            priceId: '',
            quantity: '1',
            amount: '',
            employeeId: '',
            note: '',
        },
    });

    const watchedServiceId = watch('serviceId');
    const watchedPriceId = watch('priceId');
    const watchedQuantity = watch('quantity');

    const pricesForService = useMemo(() => {
        return pricesForServiceMap.get(watchedServiceId) || [];
    }, [watchedServiceId, pricesForServiceMap]);

    const selectedPrice = useMemo(() => {
        return priceMap.get(watchedPriceId);
    }, [watchedPriceId, priceMap]);

    const unitLabel = useMemo(() => {
        if (!selectedPrice) return '';
        const ut = UNIT_TYPES.find(u => u.value === selectedPrice.unitType);
        return ut ? t(`prices.unitTypes.${ut.value}`, ut.label) : selectedPrice.unitType;
    }, [selectedPrice, t]);

    const autoAmount = useMemo(() => {
        if (!selectedPrice) return '';
        const qty = parseInt(watchedQuantity) || 1;
        return (parseFloat(String(selectedPrice.price)) * qty).toFixed(2);
    }, [selectedPrice, watchedQuantity]);

    const handleServiceChange = useCallback((serviceId: string) => {
        setValue('serviceId', serviceId);
        setValue('priceId', '');
        setValue('amount', '');
        amountManuallyEdited.current = false;

        const prices = pricesForServiceMap.get(serviceId) || [];
        if (prices.length === 1) {
            setValue('priceId', prices[0].id as string);
            const qty = parseInt(watchedQuantity) || 1;
            setValue('amount', (parseFloat(String(prices[0].price)) * qty).toFixed(2));
        }
    }, [setValue, pricesForServiceMap, watchedQuantity]);

    const handlePriceChange = useCallback((priceId: string) => {
        setValue('priceId', priceId);
        if (!amountManuallyEdited.current) {
            const price = priceMap.get(priceId);
            if (price) {
                const qty = parseInt(watchedQuantity) || 1;
                setValue('amount', (parseFloat(String(price.price)) * qty).toFixed(2));
            }
        }
    }, [setValue, priceMap, watchedQuantity]);

    const handleQuantityChange = useCallback((qty: string) => {
        setValue('quantity', qty);
        if (!amountManuallyEdited.current && watchedPriceId) {
            const price = priceMap.get(watchedPriceId);
            if (price) {
                setValue('amount', (parseFloat(String(price.price)) * parseInt(qty || '1')).toFixed(2));
            }
        }
    }, [setValue, priceMap, watchedPriceId]);

    const handleAmountChange = useCallback(() => {
        amountManuallyEdited.current = true;
    }, []);

    const handleFormSubmit = async (data: PreOrderFormData) => {
        await onSubmit({
            customerId,
            employeeId: data.employeeId || undefined,
            amount: data.amount,
            date: data.date,
            note: data.note || undefined,
            priceId: data.priceId || undefined,
            serviceId: data.serviceId || undefined,
            quantity: parseInt(data.quantity) || undefined,
        });
    };

    if (servicesWithPreOrder.length === 0) {
        return (
            <Box>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {t('creditLedger.form.noPreOrderPrices')}
                </Typography>
                <Button variant="outlined" onClick={onCancel}>
                    {t('common.cancel')}
                </Button>
            </Box>
        );
    }

    return (
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ maxWidth: 500 }}>
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
                    name="serviceId"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            select
                            label={t('creditLedger.form.service')}
                            required
                            size="small"
                            error={!!errors.serviceId}
                            onChange={(e) => handleServiceChange(e.target.value)}
                        >
                            <MenuItem value="" disabled>
                                <em>{t('creditLedger.form.selectService')}</em>
                            </MenuItem>
                            {servicesWithPreOrder.map((s) => (
                                <MenuItem key={s.id} value={s.id}>
                                    {s.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                />

                {watchedServiceId && (
                    <Controller
                        name="priceId"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                label={t('creditLedger.form.price')}
                                required
                                size="small"
                                error={!!errors.priceId}
                                onChange={(e) => handlePriceChange(e.target.value)}
                            >
                                <MenuItem value="" disabled>
                                    <em>{t('creditLedger.form.selectPrice')}</em>
                                </MenuItem>
                                {pricesForService.map((p) => (
                                    <MenuItem key={p.id} value={p.id}>
                                        {currencySymbol}{p.price} / {UNIT_TYPES.find(u => u.value === p.unitType)?.label || p.unitType}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                )}

                {selectedPrice && (
                    <Typography variant="body2" color="text.secondary">
                        {t('creditLedger.form.unitPrice')}: {currencySymbol}{selectedPrice.price} / {unitLabel}
                    </Typography>
                )}

                <Controller
                    name="quantity"
                    control={control}
                    rules={{ required: true, min: { value: 1, message: 'Min 1' } }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('creditLedger.form.quantity')}
                            type="number"
                            required
                            inputProps={{ min: 1, step: 1 }}
                            size="small"
                            error={!!errors.quantity}
                            helperText={errors.quantity?.message}
                            onChange={(e) => handleQuantityChange(e.target.value)}
                        />
                    )}
                />

                <Controller
                    name="amount"
                    control={control}
                    rules={{ required: true, min: { value: 0.01, message: 'Amount must be greater than 0' } }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={`${t('creditLedger.form.amountAuto')} (${currencySymbol})`}
                            type="number"
                            required
                            inputProps={{ min: 0.01, step: 0.01 }}
                            size="small"
                            error={!!errors.amount}
                            helperText={errors.amount?.message || (autoAmount && amountManuallyEdited.current ? t('creditLedger.form.amountAuto') : undefined)}
                            onChange={(e) => {
                                handleAmountChange();
                                field.onChange(e);
                            }}
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
                        disabled={isSubmitting || !watchedServiceId || !watchedPriceId}
                    >
                        {isSubmitting ? <CircularProgress size={24} /> : t('creditLedger.form.addPreOrder')}
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
