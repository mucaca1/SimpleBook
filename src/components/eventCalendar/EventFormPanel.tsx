import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    TextField, FormControlLabel, Checkbox,
    Box, Stack, Typography, Button, CircularProgress,
    List, ListItem, ListItemAvatar, ListItemText, Avatar,
    Divider, IconButton, Autocomplete, Chip,
} from '@mui/material';
import { Close, CheckCircle, Lock } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useEmployeeCrud } from '../../hooks/useEmployeeCrud';
import { useCustomerCrud } from '../../hooks/useCustomerCrud';
import { useServiceCrud } from '../../hooks/useServiceCrud';
import { useRoomCrud } from '../../hooks/useRoomCrud';
import type { SchedulerEventColor } from '@mui/x-scheduler/models';
import { CustomFieldSection } from './CustomFieldSection';
import type { CustomFieldSectionRef } from './CustomFieldSection';
import type { CalendarEventFormData } from './types';
import { getEventColor } from './utils';

const EVENT_COLORS: SchedulerEventColor[] = [
    'red', 'pink', 'purple', 'indigo', 'blue', 'teal',
    'green', 'lime', 'amber', 'orange', 'grey',
];

interface EventFormPanelProps {
    mode: 'create' | 'edit';
    initialData?: Partial<CalendarEventFormData>;
    onSave: (data: CalendarEventFormData) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onClose: () => void;
    onDraftChange?: (draft: { title: string; start: string; end: string; color: SchedulerEventColor | null; allDay: boolean }) => void;
    onCompleteSession?: () => void;
    isCompleted?: boolean;
}

export function EventFormPanel({
    mode,
    initialData,
    onSave,
    onDelete,
    onClose,
    onDraftChange,
    onCompleteSession,
    isCompleted,
}: EventFormPanelProps) {
    const { t } = useTranslation();
    const { employees, isLoading: employeesLoading } = useEmployeeCrud();
    const { customers, isLoading: customersLoading } = useCustomerCrud();
    const { services } = useServiceCrud();
    const { rooms } = useRoomCrud();
    const customFieldRef = useRef<CustomFieldSectionRef>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [start, setStart] = useState<dayjs.Dayjs>(dayjs());
    const [end, setEnd] = useState<dayjs.Dayjs>(dayjs().add(1, 'hour'));
    const [allDay, setAllDay] = useState(false);
    const [color, setColor] = useState<SchedulerEventColor | null>('teal');
    const [resource, setResource] = useState<string | null>(null);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
    const [roomId, setRoomId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [titleError, setTitleError] = useState('');
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');

    const isLocked = saving || !!isCompleted;

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setDescription(initialData.description || '');
            setStart(initialData.start ? dayjs(initialData.start) : dayjs());
            setEnd(initialData.end ? dayjs(initialData.end) : dayjs().add(1, 'hour'));
            setAllDay(initialData.allDay ?? false);
            setColor(initialData.color ?? 'teal');
            setResource(initialData.resource ?? null);
            setSelectedEmployeeIds(new Set(initialData.employeeIds || []));
            setSelectedCustomerIds(new Set(initialData.customerIds || []));
            setRoomId(initialData.roomId ?? null);
        } else {
            setTitle('');
            setDescription('');
            setStart(dayjs());
            setEnd(dayjs().add(1, 'hour'));
            setAllDay(false);
            setColor('teal');
            setResource(null);
            setSelectedEmployeeIds(new Set());
            setSelectedCustomerIds(new Set());
            setRoomId(null);
        }
        setTitleError('');
        setEmployeeSearch('');
        setCustomerSearch('');
    }, [initialData]);

    useEffect(() => {
        if (onDraftChange) {
            onDraftChange({
                title,
                start: start.toISOString(),
                end: end.toISOString(),
                color,
                allDay,
            });
        }
    }, [title, start, end, color, allDay, onDraftChange]);

    const toggleEmployee = useCallback((id: string) => {
        setSelectedEmployeeIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleCustomer = useCallback((id: string) => {
        setSelectedCustomerIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const handleSave = async () => {
        if (!title.trim()) {
            setTitleError(t('scheduler.eventForm.titleRequired'));
            return;
        }
        const customValid = customFieldRef.current?.validate() ?? true;
        if (!customValid) return;

        setSaving(true);
        try {
            const customValues = customFieldRef.current?.getValues() ?? {};
            const formData: CalendarEventFormData = {
                ...(mode === 'edit' && initialData?.id ? { id: initialData.id } : {}),
                title: title.trim(),
                description,
                start: start.toISOString(),
                end: end.toISOString(),
                allDay,
                color,
                resource,
                roomId,
                employeeIds: Array.from(selectedEmployeeIds),
                customerIds: Array.from(selectedCustomerIds),
                customFieldValues: customValues,
            };
            await onSave(formData);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (initialData?.id && onDelete) {
            setSaving(true);
            try {
                await onDelete(initialData.id);
            } finally {
                setSaving(false);
            }
        }
    };

    const getInitials = (emp: { firstName?: string | null; lastName?: string | null }) => {
        const f = emp.firstName?.[0] ?? '';
        const l = emp.lastName?.[0] ?? '';
        return `${f}${l}`.trim() || '?';
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600 }}>
                    {mode === 'create'
                        ? t('scheduler.eventForm.createEvent')
                        : t('scheduler.eventForm.editEvent')}
                </Typography>
                {isCompleted && (
                    <Chip
                        size="small"
                        icon={<Lock sx={{ fontSize: 12 }} />}
                        label={t('scheduler.completeSession.completed')}
                        color="success"
                        variant="outlined"
                        sx={{ mr: 1, fontSize: '0.65rem', height: 22 }}
                    />
                )}
                <IconButton size="small" onClick={onClose} disabled={isLocked}>
                    <Close fontSize="small" />
                </IconButton>
            </Box>

            {/* Scrollable form content */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Stack spacing={1.5}>
                        {/* Title */}
                        <TextField
                            placeholder={t('scheduler.eventForm.title')}
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (titleError) setTitleError('');
                            }}
                            fullWidth
                            required
                            error={!!titleError}
                            helperText={titleError}
                            disabled={isLocked}
                            size="small"
                            autoFocus
                            variant="outlined"
                        />

                        {/* Date & Time */}
                        <Box>
                            <DateTimePicker
                                label={t('scheduler.eventForm.startDate')}
                                value={start}
                                onChange={(v) => v && setStart(v)}
                                slotProps={{
                                    textField: { fullWidth: true, size: 'small', disabled: saving },
                                }}
                            />
                        </Box>
                        <Box>
                            <DateTimePicker
                                label={t('scheduler.eventForm.endDate')}
                                value={end}
                                onChange={(v) => v && setEnd(v)}
                                slotProps={{
                                    textField: { fullWidth: true, size: 'small', disabled: saving },
                                }}
                            />
                        </Box>

                        {/* All Day toggle */}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={allDay}
                                    onChange={(e) => setAllDay(e.target.checked)}
                                    disabled={isLocked}
                                    size="small"
                                />
                            }
                            label={
                                <Typography variant="body2">
                                    {t('scheduler.eventForm.allDay')}
                                </Typography>
                            }
                        />

                        <Divider />

                        {/* Service / Resource */}
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                            {t('scheduler.eventForm.service')}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {(services ?? []).map((s) => {
                                const isSelected = resource === String(s.id);
                                const serviceColor = (s.color as string) || '#00897B';
                                return (
                                    <Box
                                        key={String(s.id)}
                                        onClick={() => !saving && setResource(isSelected ? null : String(s.id))}
                                        sx={{
                                            px: 1.5, py: 0.5,
                                            borderRadius: 1,
                                            border: `1px solid ${isSelected ? serviceColor : 'rgba(0,0,0,0.12)'}`,
                                            bgcolor: isSelected ? serviceColor : 'transparent',
                                            color: isSelected ? '#fff' : 'text.primary',
                                            cursor: saving ? 'default' : 'pointer',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            transition: 'all 150ms',
                                            '&:hover': { opacity: 0.85 },
                                        }}
                                    >
                                        {String(s.name)}
                                    </Box>
                                );
                            })}
                        </Box>

                        {/* Color swatches */}
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em', mt: 0.5 }}>
                            {t('scheduler.eventForm.color')}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {EVENT_COLORS.map((c) => (
                                <Box
                                    key={c}
                                    onClick={() => !saving && setColor(color === c ? null : c)}
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        bgcolor: getEventColor(c),
                                        cursor: saving ? 'default' : 'pointer',
                                        border: color === c ? '2px solid #000' : '2px solid transparent',
                                        transition: 'border-color 150ms, transform 150ms',
                                        '&:hover': { transform: 'scale(1.15)' },
                                    }}
                                />
                            ))}
                        </Box>

                        <Divider />

                        {/* Room */}
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                            {t('scheduler.eventForm.room')}
                        </Typography>
                        <Autocomplete
                            size="small"
                            options={(rooms ?? []).map((r) => ({ id: String(r.id), label: String(r.name), color: r.color }))}
                            getOptionLabel={(option) => option.label}
                            value={(rooms ?? []).map((r) => ({ id: String(r.id), label: String(r.name), color: r.color })).find((r) => r.id === roomId) ?? null}
                            onChange={(_e, newValue) => setRoomId(newValue?.id ?? null)}
                            renderInput={(params) => (
                                <TextField {...params} placeholder={t('scheduler.eventForm.selectRoom')} size="small" />
                            )}
                            renderOption={(props, option) => (
                                <li {...props}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {option.color && (
                                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: option.color }} />
                                        )}
                                        {option.label}
                                    </Box>
                                </li>
                            )}
                            disabled={isLocked}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                        />

                        <Divider />

                        {/* Description */}
                        <TextField
                            placeholder={t('scheduler.eventForm.description')}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            disabled={isLocked}
                            size="small"
                        />

                        <Divider />

                        {/* Employee Assignment */}
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                            {t('scheduler.eventForm.employees')}
                        </Typography>
                        {employeesLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                                <CircularProgress size={20} />
                            </Box>
                        ) : (employees ?? []).length === 0 ? (
                            <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                                {t('scheduler.noEmployees')}
                            </Typography>
                        ) : (
                            <>
                                <TextField
                                    size="small"
                                    placeholder={t('scheduler.eventForm.searchEmployees')}
                                    value={employeeSearch}
                                    onChange={(e) => setEmployeeSearch(e.target.value)}
                                    fullWidth
                                    disabled={isLocked}
                                    sx={{ mb: 0.5 }}
                                />
                                <List dense disablePadding sx={{ maxHeight: 150, overflow: 'auto' }}>
                                {(employees ?? [])
                                    .filter((emp) => {
                                        if (!employeeSearch.trim()) return true;
                                        const name = `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim().toLowerCase();
                                        return name.includes(employeeSearch.trim().toLowerCase());
                                    })
                                    .map((emp) => {
                                    const id = String(emp.id);
                                    return (
                                        <ListItem
                                            key={id}
                                            onClick={() => !saving && toggleEmployee(id)}
                                            sx={{ cursor: saving ? 'default' : 'pointer', '&:hover': { bgcolor: 'action.hover' }, py: 0, px: 0.5 }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar sx={{ width: 24, height: 24, fontSize: 10 }}>
                                                    {getInitials(emp)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" fontSize="0.75rem">
                                                        {`${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || t('scheduler.unnamedEmployee')}
                                                    </Typography>
                                                }
                                            />
                                            <Checkbox
                                                edge="end"
                                                checked={selectedEmployeeIds.has(id)}
                                                tabIndex={-1}
                                                size="small"
                                                disabled={isLocked}
                                            />
                                        </ListItem>
                                    );
                                })}
                            </List>
                            </>
                        )}

                        <Divider />

                        {/* Customer Assignment */}
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                            {t('scheduler.eventForm.customers')}
                        </Typography>
                        {customersLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                                <CircularProgress size={20} />
                            </Box>
                        ) : (customers ?? []).length === 0 ? (
                            <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                                {t('scheduler.noCustomers')}
                            </Typography>
                        ) : (
                            <>
                                <TextField
                                    size="small"
                                    placeholder={t('scheduler.eventForm.searchCustomers')}
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    fullWidth
                                    disabled={isLocked}
                                    sx={{ mb: 0.5 }}
                                />
                                <List dense disablePadding sx={{ maxHeight: 150, overflow: 'auto' }}>
                                {(customers ?? [])
                                    .filter((cust) => {
                                        if (!customerSearch.trim()) return true;
                                        const name = `${cust.firstName ?? ''} ${cust.lastName ?? ''}`.trim().toLowerCase();
                                        return name.includes(customerSearch.trim().toLowerCase());
                                    })
                                    .map((cust) => {
                                    const id = String(cust.id);
                                    return (
                                        <ListItem
                                            key={id}
                                            onClick={() => !saving && toggleCustomer(id)}
                                            sx={{ cursor: saving ? 'default' : 'pointer', '&:hover': { bgcolor: 'action.hover' }, py: 0, px: 0.5 }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar sx={{ width: 24, height: 24, fontSize: 10 }}>
                                                    {getInitials(cust)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" fontSize="0.75rem">
                                                        {`${cust.firstName ?? ''} ${cust.lastName ?? ''}`.trim() || t('scheduler.unnamedCustomer')}
                                                    </Typography>
                                                }
                                            />
                                            <Checkbox
                                                edge="end"
                                                checked={selectedCustomerIds.has(id)}
                                                tabIndex={-1}
                                                size="small"
                                                disabled={isLocked}
                                            />
                                        </ListItem>
                                    );
                                })}
                            </List>
                            </>
                        )}

                        {/* Custom Fields */}
                        <CustomFieldSection
                            ref={customFieldRef}
                            eventId={mode === 'edit' && initialData?.id ? initialData.id as any : null}
                            onValuesChange={() => {}}
                            disabled={isLocked}
                        />
                    </Stack>
                </LocalizationProvider>
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1, px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
                {isCompleted ? (
                    <>
                        <Box sx={{ flex: 1 }} />
                        <Button
                            onClick={onClose}
                            size="small"
                            sx={{ textTransform: 'none' }}
                        >
                            {t('scheduler.eventForm.cancel')}
                        </Button>
                    </>
                ) : (
                    <>
                        {mode === 'edit' && onDelete && (
                            <Button
                                onClick={handleDelete}
                                color="error"
                                disabled={isLocked}
                                size="small"
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                {t('scheduler.eventForm.delete')}
                            </Button>
                        )}
                        {mode === 'edit' && onCompleteSession && (
                            <Button
                                onClick={onCompleteSession}
                                color="success"
                                variant="outlined"
                                disabled={isLocked}
                                size="small"
                                startIcon={<CheckCircle sx={{ fontSize: 16 }} />}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                {t('scheduler.completeSession.button')}
                            </Button>
                        )}
                        <Box sx={{ flex: 1 }} />
                        <Button
                            onClick={onClose}
                            disabled={isLocked}
                            size="small"
                            sx={{ textTransform: 'none' }}
                        >
                            {t('scheduler.eventForm.cancel')}
                        </Button>
                        <Button
                            onClick={handleSave}
                            variant="contained"
                            disabled={isLocked}
                            size="small"
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            {saving ? <CircularProgress size={16} color="inherit" /> : t('scheduler.eventForm.save')}
                        </Button>
                    </>
                )}
            </Box>
        </Box>
    );
}
