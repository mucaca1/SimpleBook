import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    Avatar,
    IconButton,
    Autocomplete,
    TextField,
    Tooltip,
    Chip,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
} from '@mui/material';
import { Close, Add, CheckCircle, Warning, Info } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useEmployeeCrud } from '../../hooks/useEmployeeCrud';
import { useCustomerCrud } from '../../hooks/useCustomerCrud';
import { useCompleteSession } from '../../hooks/useCompleteSession';
import { useSettingsSync } from '../../hooks/useSettingsSync';
import { getCurrencySymbol } from '../../types/price';
import type { AttendanceEntry, CustomerCostPreview, CompleteSessionData } from './completeSessionTypes';

interface CompleteSessionDialogProps {
    open: boolean;
    onClose: () => void;
    eventId: string;
    eventTitle: string;
    eventStart: string;
    eventEnd: string;
    serviceId: string | null;
    assignedEmployeeIds: string[];
    assignedCustomerIds: string[];
}

export function CompleteSessionDialog({
    open,
    onClose,
    eventId,
    eventTitle,
    eventStart,
    eventEnd,
    serviceId,
    assignedEmployeeIds,
    assignedCustomerIds,
}: CompleteSessionDialogProps) {
    const { t } = useTranslation();
    const { employees } = useEmployeeCrud();
    const { customers } = useCustomerCrud();
    const { completeSession, getCustomerCostPreview, isCompleting } = useCompleteSession();
    const { currency } = useSettingsSync();

    const currencySymbol = getCurrencySymbol(currency || 'EUR');

    // Attendance state
    const [employeeAttendance, setEmployeeAttendance] = useState<Map<string, 'present' | 'absent'>>(new Map());
    const [customerAttendance, setCustomerAttendance] = useState<Map<string, 'present' | 'absent'>>(new Map());
    const [additionalEmployeeIds, setAdditionalEmployeeIds] = useState<Set<string>>(new Set());
    const [additionalCustomerIds, setAdditionalCustomerIds] = useState<Set<string>>(new Set());
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [showAddCustomer, setShowAddCustomer] = useState(false);

    // Initialize attendance from assigned persons when dialog opens
    useEffect(() => {
        if (open) {
            const empMap = new Map<string, 'present' | 'absent'>();
            assignedEmployeeIds.forEach((id) => empMap.set(id, 'present'));
            setEmployeeAttendance(empMap);

            const custMap = new Map<string, 'present' | 'absent'>();
            assignedCustomerIds.forEach((id) => custMap.set(id, 'present'));
            setCustomerAttendance(custMap);

            setAdditionalEmployeeIds(new Set());
            setAdditionalCustomerIds(new Set());
            setShowAddEmployee(false);
            setShowAddCustomer(false);
        }
    }, [open, assignedEmployeeIds, assignedCustomerIds]);

    // Cost previews for present customers
    const costPreviews = useMemo(() => {
        const previews = new Map<string, CustomerCostPreview>();
        customerAttendance.forEach((attendance, customerId) => {
            if (attendance === 'present') {
                previews.set(
                    customerId,
                    getCustomerCostPreview(customerId, eventStart, eventEnd, serviceId)
                );
            }
        });
        return previews;
    }, [customerAttendance, eventStart, eventEnd, serviceId, getCustomerCostPreview]);

    // Employee and customer maps for display
    const employeeMap = useMemo(() => {
        const map = new Map<string, { name: string; initials: string }>();
        for (const emp of employees ?? []) {
            const name = `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || '?';
            const initials = `${String(emp.firstName ?? '')[0]}${String(emp.lastName ?? '')[0]}`.trim() || '?';
            map.set(String(emp.id), { name, initials });
        }
        return map;
    }, [employees]);

    const customerMap = useMemo(() => {
        const map = new Map<string, { name: string; initials: string }>();
        for (const cust of customers ?? []) {
            const name = `${cust.firstName ?? ''} ${cust.lastName ?? ''}`.trim() || '?';
            const initials = `${String(cust.firstName ?? '')[0]}${String(cust.lastName ?? '')[0]}`.trim() || '?';
            map.set(String(cust.id), { name, initials });
        }
        return map;
    }, [customers]);

    const toggleEmployeeAttendance = useCallback((id: string) => {
        setEmployeeAttendance((prev) => {
            const next = new Map(prev);
            const current = next.get(id);
            next.set(id, current === 'present' ? 'absent' : 'present');
            return next;
        });
    }, []);

    const toggleCustomerAttendance = useCallback((id: string) => {
        setCustomerAttendance((prev) => {
            const next = new Map(prev);
            const current = next.get(id);
            next.set(id, current === 'present' ? 'absent' : 'present');
            return next;
        });
    }, []);

    const addExtraEmployee = useCallback((empId: string) => {
        setAdditionalEmployeeIds((prev) => new Set(prev).add(empId));
        setEmployeeAttendance((prev) => {
            const next = new Map(prev);
            next.set(empId, 'present');
            return next;
        });
        setShowAddEmployee(false);
    }, []);

    const addExtraCustomer = useCallback((custId: string) => {
        setAdditionalCustomerIds((prev) => new Set(prev).add(custId));
        setCustomerAttendance((prev) => {
            const next = new Map(prev);
            next.set(custId, 'present');
            return next;
        });
        setShowAddCustomer(false);
    }, []);

    const allEmployeeIds = useMemo(() => [...assignedEmployeeIds, ...additionalEmployeeIds], [assignedEmployeeIds, additionalEmployeeIds]);
    const allCustomerIds = useMemo(() => [...assignedCustomerIds, ...additionalCustomerIds], [assignedCustomerIds, additionalCustomerIds]);

    // Available employees/customers for the "add" pickers (exclude already listed)
    const availableEmployeesForAdd = useMemo(
        () => (employees ?? []).filter((e) => !allEmployeeIds.includes(String(e.id))),
        [employees, allEmployeeIds]
    );
    const availableCustomersForAdd = useMemo(
        () => (customers ?? []).filter((c) => !allCustomerIds.includes(String(c.id))),
        [customers, allCustomerIds]
    );

    const hasWarnings = useMemo(() => {
        let has = false;
        costPreviews.forEach((p) => { if (p.hasWarning) has = true; });
        return has;
    }, [costPreviews]);

    const handleConfirm = async () => {
        const empAttendance: AttendanceEntry[] = [];
        employeeAttendance.forEach((attendance, id) => {
            empAttendance.push({ id, attendance });
        });

        const custAttendance: AttendanceEntry[] = [];
        customerAttendance.forEach((attendance, id) => {
            custAttendance.push({ id, attendance });
        });

        const data: CompleteSessionData = {
            eventId,
            eventTitle,
            eventStart,
            eventEnd,
            serviceId,
            employeeAttendance: empAttendance,
            customerAttendance: custAttendance,
            additionalEmployeeIds: Array.from(additionalEmployeeIds),
            additionalCustomerIds: Array.from(additionalCustomerIds),
        };

        try {
            await completeSession(data);
            onClose();
        } catch {
            // Error handled in hook
        }
    };

    const formatTime = (iso: string) => dayjs(iso).format('HH:mm');
    const fmt = `${formatTime(eventStart)} – ${formatTime(eventEnd)}`;

    return (
        <Dialog
            open={open}
            onClose={isCompleting ? undefined : onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { maxHeight: '90vh' } }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="success" />
                <Typography variant="h6" sx={{ flex: 1 }}>
                    {t('scheduler.completeSession.title')}
                </Typography>
                <IconButton size="small" onClick={onClose} disabled={isCompleting}>
                    <Close fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 2 }}>
                {/* Session info header */}
                <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        {eventTitle || t('scheduler.eventForm.title')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {dayjs(eventStart).format('DD.MM.YYYY')} • {fmt}
                    </Typography>
                </Paper>

                {/* EMPLOYEES section */}
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                    {t('scheduler.completeSession.employees')}
                </Typography>
                <List dense disablePadding sx={{ mb: 1 }}>
                    {allEmployeeIds.map((id) => {
                        const person = employeeMap.get(id);
                        const attendance = employeeAttendance.get(id);
                        return (
                            <ListItem
                                key={id}
                                disablePadding
                                sx={{ py: 0.25 }}
                                secondaryAction={
                                    <ToggleButtonGroup
                                        size="small"
                                        value={attendance || 'present'}
                                        exclusive
                                        onChange={(_, v) => { if (v) toggleEmployeeAttendance(id); }}
                                    >
                                        <ToggleButton value="present" sx={{ px: 1, py: 0.25, fontSize: '0.7rem' }}>
                                            {t('scheduler.completeSession.present')}
                                        </ToggleButton>
                                        <ToggleButton value="absent" sx={{ px: 1, py: 0.25, fontSize: '0.7rem' }}>
                                            {t('scheduler.completeSession.absent')}
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ width: 28, height: 28, fontSize: 11 }}>
                                        {person?.initials || '?'}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2" fontSize="0.8rem">
                                            {person?.name || t('scheduler.unnamedEmployee')}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        );
                    })}
                </List>

                {/* Add employee button */}
                {!showAddEmployee ? (
                    <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={() => setShowAddEmployee(true)}
                        sx={{ mb: 2, textTransform: 'none' }}
                    >
                        {t('scheduler.completeSession.addEmployee')}
                    </Button>
                ) : (
                    <Box sx={{ mb: 2 }}>
                        <Autocomplete
                            size="small"
                            options={availableEmployeesForAdd.map((e) => ({ id: String(e.id), label: `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || '?' }))}
                            getOptionLabel={(o) => o.label}
                            onChange={(_, val) => { if (val) addExtraEmployee(val.id); }}
                            renderInput={(params) => (
                                <TextField {...params} placeholder={t('scheduler.completeSession.addEmployee')} size="small" autoFocus />
                            )}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            sx={{ mb: 0.5 }}
                        />
                        <Button size="small" onClick={() => setShowAddEmployee(false)}>
                            {t('common.cancel')}
                        </Button>
                    </Box>
                )}

                <Divider sx={{ my: 1.5 }} />

                {/* CUSTOMERS section */}
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                    {t('scheduler.completeSession.customers')}
                </Typography>
                <List dense disablePadding sx={{ mb: 1 }}>
                    {allCustomerIds.map((id) => {
                        const person = customerMap.get(id);
                        const attendance = customerAttendance.get(id);
                        const preview = attendance === 'present' ? costPreviews.get(id) : null;

                        return (
                            <Box key={id}>
                                <ListItem
                                    disablePadding
                                    sx={{ py: 0.25 }}
                                    secondaryAction={
                                        <ToggleButtonGroup
                                            size="small"
                                            value={attendance || 'present'}
                                            exclusive
                                            onChange={(_, v) => { if (v) toggleCustomerAttendance(id); }}
                                        >
                                            <ToggleButton value="present" sx={{ px: 1, py: 0.25, fontSize: '0.7rem' }}>
                                                {t('scheduler.completeSession.present')}
                                            </ToggleButton>
                                            <ToggleButton value="absent" sx={{ px: 1, py: 0.25, fontSize: '0.7rem' }}>
                                                {t('scheduler.completeSession.absent')}
                                            </ToggleButton>
                                        </ToggleButtonGroup>
                                    }
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ width: 28, height: 28, fontSize: 11 }}>
                                            {person?.initials || '?'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" fontSize="0.8rem">
                                                {person?.name || t('scheduler.unnamedCustomer')}
                                            </Typography>
                                        }
                                    />
                                </ListItem>

                                {/* Cost summary for present customers */}
                                {preview && (
                                    <Box sx={{ pl: 5.5, pr: 2, pb: 0.5 }}>
                                        <Tooltip
                                            title={
                                                <Box>
                                                    <Typography variant="caption" display="block">
                                                        {t('scheduler.completeSession.cost')}: {currencySymbol}{preview.cost.toFixed(2)}
                                                    </Typography>
                                                    <Typography variant="caption" display="block">
                                                        {t('scheduler.completeSession.currentBalance')}: {currencySymbol}{preview.currentBalance.toFixed(2)}
                                                    </Typography>
                                                    <Typography variant="caption" display="block">
                                                        {t('scheduler.completeSession.balanceAfter')}: {currencySymbol}{preview.balanceAfter.toFixed(2)}
                                                    </Typography>
                                                    {preview.availablePreOrders > 0 && (
                                                        <Typography variant="caption" display="block">
                                                            {t('scheduler.completeSession.preOrderAvailable', { count: preview.availablePreOrders })}
                                                        </Typography>
                                                    )}
                                                    {preview.preOrdersUsed > 0 && (
                                                        <Typography variant="caption" display="block" color="success.main">
                                                            Pre-orders used: {preview.preOrdersUsed}
                                                        </Typography>
                                                    )}
                                                    {preview.creditCharge > 0 && (
                                                        <Typography variant="caption" display="block">
                                                            Credit charge: {currencySymbol}{preview.creditCharge.toFixed(2)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                            arrow
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                                                {preview.noService ? (
                                                    <Chip
                                                        size="small"
                                                        icon={<Info sx={{ fontSize: 14 }} />}
                                                        label={t('scheduler.completeSession.noServiceWarning')}
                                                        color="default"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.65rem', height: 20, '& .MuiChip-label': { px: 0.5 } }}
                                                    />
                                                ) : preview.noPrice ? (
                                                    <Chip
                                                        size="small"
                                                        icon={<Info sx={{ fontSize: 14 }} />}
                                                        label={t('scheduler.completeSession.noPriceWarning')}
                                                        color="default"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.65rem', height: 20, '& .MuiChip-label': { px: 0.5 } }}
                                                    />
                                                ) : (
                                                    <>
                                                        <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                                                            {currencySymbol}{preview.cost.toFixed(2)}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                                                            • {t('scheduler.completeSession.balanceAfter')}: {currencySymbol}{preview.balanceAfter.toFixed(2)}
                                                        </Typography>
                                                        {preview.hasWarning && (
                                                            <Warning sx={{ fontSize: 14, color: 'warning.main' }} />
                                                        )}
                                                    </>
                                                )}
                                            </Box>
                                        </Tooltip>

                                        {/* Warning message for insufficient credit */}
                                        {preview.hasWarning && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                <Warning sx={{ fontSize: 12, color: 'warning.main' }} />
                                                <Typography variant="caption" color="warning.main" fontSize="0.65rem">
                                                    {t('scheduler.completeSession.insufficientWarning')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </List>

                {/* Add customer button */}
                {!showAddCustomer ? (
                    <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={() => setShowAddCustomer(true)}
                        sx={{ mb: 1, textTransform: 'none' }}
                    >
                        {t('scheduler.completeSession.addCustomer')}
                    </Button>
                ) : (
                    <Box sx={{ mb: 1 }}>
                        <Autocomplete
                            size="small"
                            options={availableCustomersForAdd.map((c) => ({ id: String(c.id), label: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || '?' }))}
                            getOptionLabel={(o) => o.label}
                            onChange={(_, val) => { if (val) addExtraCustomer(val.id); }}
                            renderInput={(params) => (
                                <TextField {...params} placeholder={t('scheduler.completeSession.addCustomer')} size="small" autoFocus />
                            )}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            sx={{ mb: 0.5 }}
                        />
                        <Button size="small" onClick={() => setShowAddCustomer(false)}>
                            {t('common.cancel')}
                        </Button>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 2, py: 1.5 }}>
                {hasWarnings && (
                    <Chip
                        size="small"
                        icon={<Warning sx={{ fontSize: 14 }} />}
                        label={t('scheduler.completeSession.insufficientWarning')}
                        color="warning"
                        variant="outlined"
                        sx={{ mr: 'auto', fontSize: '0.7rem', height: 24 }}
                    />
                )}
                {!hasWarnings && <Box sx={{ flex: 1 }} />}
                <Button onClick={onClose} disabled={isCompleting} size="small">
                    {t('common.cancel')}
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color="success"
                    disabled={isCompleting}
                    size="small"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    {isCompleting ? <CircularProgress size={16} color="inherit" /> : t('scheduler.completeSession.confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
