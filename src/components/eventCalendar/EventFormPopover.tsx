import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Popover, TextField, FormControlLabel, Checkbox,
    Box, Stack, Typography, Button, CircularProgress,
    Avatar,
    Divider, IconButton, Autocomplete, Chip,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import type { SchedulerEventColor } from '@mui/x-scheduler/models';
import type { TEmployeeRow, TCustomerRow, TServiceRow, TRoomRow } from '../../evolu/evolu-query';
import { CustomFieldSection } from './CustomFieldSection';
import type { CustomFieldSectionRef } from './CustomFieldSection';
import type { CalendarEventFormData } from './types';
import { getEventColor } from './utils';

const EVENT_COLORS: SchedulerEventColor[] = [
    'red', 'pink', 'purple', 'indigo', 'blue', 'teal',
    'green', 'lime', 'amber', 'orange', 'grey',
];

interface EventFormPopoverProps {
    open: boolean;
    anchorEl: HTMLElement | null;
    mode: 'create' | 'edit';
    initialData?: Partial<CalendarEventFormData>;
    onSave: (data: CalendarEventFormData) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onClose: () => void;
    onDraftChange?: (draft: { title: string; start: string; end: string; color: SchedulerEventColor | null; allDay: boolean }) => void;
    // Data props (from CustomEventCalendar — no internal queries)
    employees: TEmployeeRow[];
    customers: TCustomerRow[];
    services: TServiceRow[];
    rooms: TRoomRow[];
}

export function EventFormPopover({
    open,
    anchorEl,
    mode,
    initialData,
    onSave,
    onDelete,
    onClose,
    onDraftChange,
    employees,
    customers,
    services,
    rooms,
}: EventFormPopoverProps) {
    const { t } = useTranslation();
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

    const employeeOptions = useMemo(() => (employees ?? []).map((e) => ({
        id: String(e.id),
        label: `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || '?',
        firstName: e.firstName,
        lastName: e.lastName,
    })), [employees]);

    const customerOptions = useMemo(() => (customers ?? []).map((c) => ({
        id: String(c.id),
        label: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || '?',
        firstName: c.firstName,
        lastName: c.lastName,
    })), [customers]);

    useEffect(() => {
        if (open && initialData) {
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
        } else if (open) {
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
    }, [open, initialData]);

    // Push draft changes for pre-drawing
    useEffect(() => {
        if (open && onDraftChange) {
            onDraftChange({
                title,
                start: start.toISOString(),
                end: end.toISOString(),
                color,
                allDay,
            });
        }
    }, [open, title, start, end, color, allDay, onDraftChange]);

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
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{
                paper: {
                    sx: {
                        width: 400,
                        maxHeight: '80vh',
                        overflow: 'auto',
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    },
                },
            }}
        >
            <Box sx={{ p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600 }}>
                        {mode === 'create'
                            ? t('scheduler.eventForm.createEvent')
                            : t('scheduler.eventForm.editEvent')}
                    </Typography>
                    <IconButton size="small" onClick={onClose} disabled={saving}>
                        <Close fontSize="small" />
                    </IconButton>
                </Box>

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
                            disabled={saving}
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
                                    disabled={saving}
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
                            disabled={saving}
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
                            disabled={saving}
                            size="small"
                        />

                        <Divider />

                        {/* Employee Assignment */}
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                            {t('scheduler.eventForm.employees')}
                        </Typography>
                        {employeeOptions.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                                {t('scheduler.noEmployees')}
                            </Typography>
                        ) : (
                            <Autocomplete
                                multiple
                                size="small"
                                options={employeeOptions}
                                getOptionLabel={(option) => option.label}
                                value={employeeOptions.filter((o) => selectedEmployeeIds.has(o.id))}
                                onChange={(_, newValue) => {
                                    setSelectedEmployeeIds(new Set(newValue.map((v) => v.id)));
                                }}
                                limitTags={3}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder={t('scheduler.eventForm.searchEmployees')} size="small" />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => {
                                        const { key, ...rest } = getTagProps({ index });
                                        return (
                                            <Chip
                                                key={key}
                                                label={option.label}
                                                size="small"
                                                avatar={<Avatar sx={{ width: 20, height: 20, fontSize: 9 }}>{getInitials(option)}</Avatar>}
                                                {...rest}
                                            />
                                        );
                                    })
                                }
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ width: 24, height: 24, fontSize: 10 }}>{getInitials(option)}</Avatar>
                                            <Typography variant="body2" fontSize="0.75rem">
                                                {option.label === '?' ? t('scheduler.unnamedEmployee') : option.label}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                                disabled={saving}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                            />
                        )}

                        <Divider />

                        {/* Customer Assignment */}
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                            {t('scheduler.eventForm.customers')}
                        </Typography>
                        {customerOptions.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                                {t('scheduler.noCustomers')}
                            </Typography>
                        ) : (
                            <Autocomplete
                                multiple
                                size="small"
                                options={customerOptions}
                                getOptionLabel={(option) => option.label}
                                value={customerOptions.filter((o) => selectedCustomerIds.has(o.id))}
                                onChange={(_, newValue) => {
                                    setSelectedCustomerIds(new Set(newValue.map((v) => v.id)));
                                }}
                                limitTags={3}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder={t('scheduler.eventForm.searchCustomers')} size="small" />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => {
                                        const { key, ...rest } = getTagProps({ index });
                                        return (
                                            <Chip
                                                key={key}
                                                label={option.label}
                                                size="small"
                                                avatar={<Avatar sx={{ width: 20, height: 20, fontSize: 9 }}>{getInitials(option)}</Avatar>}
                                                {...rest}
                                            />
                                        );
                                    })
                                }
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ width: 24, height: 24, fontSize: 10 }}>{getInitials(option)}</Avatar>
                                            <Typography variant="body2" fontSize="0.75rem">
                                                {option.label === '?' ? t('scheduler.unnamedCustomer') : option.label}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                                disabled={saving}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                            />
                        )}

                        {/* Custom Fields */}
                        <CustomFieldSection
                            ref={customFieldRef}
                            eventId={mode === 'edit' && initialData?.id ? initialData.id as any : null}
                            onValuesChange={() => {}}
                            disabled={saving}
                        />
                    </Stack>
                </LocalizationProvider>

                {/* Action buttons */}
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    {mode === 'edit' && onDelete && (
                        <Button
                            onClick={handleDelete}
                            color="error"
                            disabled={saving}
                            size="small"
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            {t('scheduler.eventForm.delete')}
                        </Button>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button
                        onClick={onClose}
                        disabled={saving}
                        size="small"
                        sx={{ textTransform: 'none' }}
                    >
                        {t('scheduler.eventForm.cancel')}
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving}
                        size="small"
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {saving ? <CircularProgress size={16} color="inherit" /> : t('scheduler.eventForm.save')}
                    </Button>
                </Box>
            </Box>
        </Popover>
    );
}
