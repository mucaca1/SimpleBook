import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Popover, TextField, FormControlLabel, Checkbox,
    Box, Stack, Typography, Button, CircularProgress,
    List, ListItem, ListItemAvatar, ListItemText, Avatar,
    Divider, IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useEmployeeCrud } from '../../hooks/useEmployeeCrud';
import { useServiceCrud } from '../../hooks/useServiceCrud';
import type { SchedulerEventColor } from '@mui/x-scheduler/models';
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
}: EventFormPopoverProps) {
    const { t } = useTranslation();
    const { employees, isLoading: employeesLoading } = useEmployeeCrud();
    const { services } = useServiceCrud();
    const customFieldRef = useRef<CustomFieldSectionRef>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [start, setStart] = useState<dayjs.Dayjs>(dayjs());
    const [end, setEnd] = useState<dayjs.Dayjs>(dayjs().add(1, 'hour'));
    const [allDay, setAllDay] = useState(false);
    const [color, setColor] = useState<SchedulerEventColor | null>('teal');
    const [resource, setResource] = useState<string | null>(null);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [titleError, setTitleError] = useState('');
    const [employeeSearch, setEmployeeSearch] = useState('');

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
        } else if (open) {
            setTitle('');
            setDescription('');
            setStart(dayjs());
            setEnd(dayjs().add(1, 'hour'));
            setAllDay(false);
            setColor('teal');
            setResource(null);
            setSelectedEmployeeIds(new Set());
        }
        setTitleError('');
        setEmployeeSearch('');
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

    const toggleEmployee = useCallback((id: string) => {
        setSelectedEmployeeIds((prev) => {
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
                employeeIds: Array.from(selectedEmployeeIds),
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
                                    disabled={saving}
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
                                                disabled={saving}
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
