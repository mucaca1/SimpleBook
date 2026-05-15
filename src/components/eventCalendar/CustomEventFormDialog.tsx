import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, FormControl, InputLabel, Select, MenuItem, Checkbox,
    FormControlLabel, Box, Stack, Typography, Divider, CircularProgress,
    List, ListItem, ListItemAvatar, ListItemText, Avatar,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useEmployeeCrud } from '../../hooks/useEmployeeCrud';
import { useServiceCrud } from '../../hooks/useServiceCrud';
import type { SchedulerEventColor } from '@mui/x-scheduler/models';
import type { CustomEventFormDialogProps } from './types';
import { CustomFieldSection } from './CustomFieldSection';
import type { CustomFieldSectionRef } from './CustomFieldSection';
import type { CalendarEventFormData } from './types';

const EVENT_COLORS: { value: SchedulerEventColor; label: string }[] = [
    { value: 'red', label: 'Red' },
    { value: 'pink', label: 'Pink' },
    { value: 'purple', label: 'Purple' },
    { value: 'indigo', label: 'Indigo' },
    { value: 'blue', label: 'Blue' },
    { value: 'teal', label: 'Teal' },
    { value: 'green', label: 'Green' },
    { value: 'lime', label: 'Lime' },
    { value: 'amber', label: 'Amber' },
    { value: 'orange', label: 'Orange' },
    { value: 'grey', label: 'Grey' },
];

export function CustomEventFormDialog({
    open,
    mode,
    initialData,
    onSave,
    onDelete,
    onClose,
}: CustomEventFormDialogProps) {
    const { t } = useTranslation();
    const { employees, isLoading: employeesLoading } = useEmployeeCrud();
    const { services } = useServiceCrud();
    const customFieldRef = useRef<CustomFieldSectionRef>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [start, setStart] = useState<dayjs.Dayjs>(dayjs());
    const [end, setEnd] = useState<dayjs.Dayjs>(dayjs().add(1, 'hour'));
    const [allDay, setAllDay] = useState(false);
    const [color, setColor] = useState<SchedulerEventColor | null>(null);
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
            setColor(initialData.color ?? null);
            setResource(initialData.resource ?? null);
            setSelectedEmployeeIds(new Set(initialData.employeeIds || []));
        } else if (open) {
            setTitle('');
            setDescription('');
            setStart(dayjs());
            setEnd(dayjs().add(1, 'hour'));
            setAllDay(false);
            setColor(null);
            setResource(null);
            setSelectedEmployeeIds(new Set());
        }
        setTitleError('');
        setEmployeeSearch('');
    }, [open, initialData]);

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
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {mode === 'create'
                    ? t('scheduler.eventForm.createEvent')
                    : t('scheduler.eventForm.editEvent')}
            </DialogTitle>
            <DialogContent dividers>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        {/* Standard Fields */}
                        <TextField
                            label={t('scheduler.eventForm.title')}
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
                        />

                        <TextField
                            label={t('scheduler.eventForm.description')}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            disabled={saving}
                            size="small"
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <DateTimePicker
                                label={t('scheduler.eventForm.startDate')}
                                value={start}
                                onChange={(v) => v && setStart(v)}
                                slotProps={{
                                    textField: { fullWidth: true, size: 'small', disabled: saving },
                                }}
                            />
                            <DateTimePicker
                                label={t('scheduler.eventForm.endDate')}
                                value={end}
                                onChange={(v) => v && setEnd(v)}
                                slotProps={{
                                    textField: { fullWidth: true, size: 'small', disabled: saving },
                                }}
                            />
                        </Box>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={allDay}
                                    onChange={(e) => setAllDay(e.target.checked)}
                                    disabled={saving}
                                    size="small"
                                />
                            }
                            label={t('scheduler.eventForm.allDay')}
                        />

                        <FormControl fullWidth size="small">
                            <InputLabel>{t('scheduler.eventForm.color')}</InputLabel>
                            <Select
                                value={color || ''}
                                onChange={(e) => setColor((e.target.value || null) as SchedulerEventColor | null)}
                                label={t('scheduler.eventForm.color')}
                                disabled={saving}
                            >
                                <MenuItem value="">
                                    <em>{t('scheduler.eventForm.noService')}</em>
                                </MenuItem>
                                {EVENT_COLORS.map((c) => (
                                    <MenuItem key={c.value} value={c.value}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 16, height: 16, borderRadius: '50%',
                                                    bgcolor: `${c.value}.main`,
                                                }}
                                            />
                                            {c.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Service / Resource */}
                        <FormControl fullWidth size="small">
                            <InputLabel>{t('scheduler.eventForm.service')}</InputLabel>
                            <Select
                                value={resource || ''}
                                onChange={(e) => setResource(e.target.value || null)}
                                label={t('scheduler.eventForm.service')}
                                disabled={saving}
                            >
                                <MenuItem value="">
                                    <em>{t('scheduler.eventForm.noService')}</em>
                                </MenuItem>
                                {(services ?? []).map((s) => (
                                    <MenuItem key={String(s.id)} value={String(s.id)}>
                                        {String(s.name)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Divider />

                        {/* Employee Assignment */}
                        <Typography variant="subtitle2" color="text.secondary">
                            {t('scheduler.eventForm.employees')}
                        </Typography>
                        {employeesLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                                <CircularProgress size={20} />
                            </Box>
                        ) : (employees ?? []).length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
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
                                    sx={{ mb: 1 }}
                                />
                                <List dense disablePadding sx={{ maxHeight: 200, overflow: 'auto' }}>
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
                                            sx={{ cursor: saving ? 'default' : 'pointer', '&:hover': { bgcolor: 'action.hover' }, py: 0 }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                                                    {getInitials(emp)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={`${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || t('scheduler.unnamedEmployee')}
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

                        <Divider />

                        {/* Custom Fields */}
                        <CustomFieldSection
                            ref={customFieldRef}
                            eventId={mode === 'edit' && initialData?.id ? initialData.id as any : null}
                            onValuesChange={() => {}}
                            disabled={saving}
                        />
                    </Stack>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                {mode === 'edit' && onDelete && (
                    <Button onClick={handleDelete} color="error" disabled={saving}>
                        {t('common.delete')}
                    </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose} disabled={saving}>
                    {t('common.cancel')}
                </Button>
                <Button onClick={handleSave} variant="contained" disabled={saving}>
                    {saving ? <CircularProgress size={20} /> : t('common.save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
