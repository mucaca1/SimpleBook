import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import dayjs from 'dayjs';
import type { SchedulerEvent } from '@mui/x-scheduler/models';
import type { SchedulerResource } from '@mui/x-scheduler-headless/models';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@evolu/react';
import { sqliteFalse } from '@evolu/common';
import { useCalendarEventCrud } from '../../hooks/useCalendarEventCrud';
import { useServiceCrud } from '../../hooks/useServiceCrud';
import { updateCalendarTimeFormat, updateCalendarShowWeekends } from '../../hooks/useSettingsSync';
import { settings } from '../../evolu/evolu-query';
import { hexToSchedulerColor } from '../../utils/colorMapping';
import { saveCustomFieldValuesForCalendarEvent } from '../../evolu/customFieldUtils';
import type { CalendarEventId } from '../../evolu/evolu-db';
import { getWeekDays } from './utils';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarWeekView } from './CalendarWeekView';
import { MiniMonthCalendar } from './MiniMonthCalendar';
import { EventFormPopover } from './EventFormPopover';
import type { CalendarEventFormData, CustomEventCalendarProps, ExternalDraftData } from './types';

interface DraftEventData {
    title: string;
    start: string;
    end: string;
    color: SchedulerEvent['color'];
    allDay: boolean;
}

export function CustomEventCalendar({ sx, onSlotClick: onSlotClickExternal, onEventClick: onEventClickExternal, externalFormOpen, externalDraftData }: CustomEventCalendarProps) {
    const { i18n } = useTranslation();
    const {
        events,
        isLoading,
        createEvent,
        updateEvent,
        deleteEvent,
        assignEmployees,
        getEmployeeIdsForEvent,
    } = useCalendarEventCrud();
    const { services } = useServiceCrud();

    // Settings
    const settingsRows = useQuery(settings);
    const settingsRow = settingsRows.length > 0 ? settingsRows[0] : null;
    const ampm = settingsRow?.calendarTimeFormat === '12h';
    const showWeekends = settingsRow?.calendarShowWeekends !== sqliteFalse;
    const locale = i18n.language === 'sk' ? 'sk' : 'en';

    // Calendar state
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [view, setView] = useState<'day' | 'week'>('week');
    const [miniCalendarOpen, setMiniCalendarOpen] = useState(true);

    // Popover state
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [popoverMode, setPopoverMode] = useState<'create' | 'edit'>('create');
    const [popoverAnchorEl, setPopoverAnchorEl] = useState<HTMLElement | null>(null);
    const [popoverData, setPopoverData] = useState<Partial<CalendarEventFormData> | undefined>();

    // Draft event for pre-drawing
    const [draftEvent, setDraftEvent] = useState<SchedulerEvent | null>(null);
    const draftAnchorRef = useRef<HTMLDivElement | null>(null);

    // Clear draft when external form closes
    useEffect(() => {
        if (onSlotClickExternal && !externalFormOpen) {
            setDraftEvent(null);
        }
    }, [onSlotClickExternal, externalFormOpen]);

    // Sync external draft data (from right panel form) to calendar preview
    useEffect(() => {
        if (externalDraftData && externalFormOpen) {
            setDraftEvent(prev => prev ? {
                ...prev,
                title: externalDraftData.title || '(New Event)',
                start: externalDraftData.start,
                end: externalDraftData.end,
                color: externalDraftData.color ?? undefined,
                allDay: externalDraftData.allDay,
            } : null);
        }
    }, [externalDraftData, externalFormOpen]);

    const days = useMemo(() => {
        if (view === 'week') return getWeekDays(currentDate, showWeekends, locale);
        return [currentDate];
    }, [currentDate, view, showWeekends, locale]);

    const resources: SchedulerResource[] = useMemo(
        () => (services ?? []).map((service) => ({
            id: String(service.id),
            title: String(service.name),
            eventColor: hexToSchedulerColor(service.color as string | null | undefined),
        })),
        [services]
    );

    const handleDaySelect = useCallback((date: dayjs.Dayjs) => {
        setCurrentDate(date);
        setView('week');
    }, []);

    const handleTimeFormatChange = useCallback((isAmpm: boolean) => {
        updateCalendarTimeFormat(settingsRow?.id as any, isAmpm ? '12h' : '24h');
    }, [settingsRow?.id]);

    const handleShowWeekendsChange = useCallback((show: boolean) => {
        updateCalendarShowWeekends(settingsRow?.id as any, show ? 1 : 0);
    }, [settingsRow?.id]);

    const handleSlotClick = useCallback((day: dayjs.Dayjs, startTime: dayjs.Dayjs, anchorEl: HTMLElement, _clickEvent: React.MouseEvent) => {
        if (onSlotClickExternal) {
            setDraftEvent({
                id: '__draft__',
                title: '',
                start: startTime.toISOString(),
                end: startTime.add(1, 'hour').toISOString(),
                color: 'teal',
                allDay: false,
            });
            onSlotClickExternal(day, startTime);
            return;
        }
        setPopoverMode('create');
        setPopoverData({
            start: startTime.toISOString(),
            end: startTime.add(1, 'hour').toISOString(),
        });
        setDraftEvent({
            id: '__draft__',
            title: '',
            start: startTime.toISOString(),
            end: startTime.add(1, 'hour').toISOString(),
            color: 'teal',
            allDay: false,
        });
        // Anchor to draft block after it renders, fall back to click position
        requestAnimationFrame(() => {
            setPopoverAnchorEl(draftAnchorRef.current ?? anchorEl);
            setPopoverOpen(true);
        });
    }, [onSlotClickExternal]);

    const handleEventClick = useCallback((event: SchedulerEvent, anchorEl: HTMLElement) => {
        if (onEventClickExternal) {
            setDraftEvent({
                ...event,
                title: event.title || '(New Event)',
            });
            onEventClickExternal(event);
            return;
        }
        const eventId = String(event.id);
        const employeeIds = getEmployeeIdsForEvent(eventId);
        setPopoverMode('edit');
        setPopoverAnchorEl(anchorEl);
        setPopoverData({
            id: eventId,
            title: event.title || '',
            description: event.description || '',
            start: event.start,
            end: event.end,
            allDay: event.allDay ?? false,
            color: event.color ?? null,
            resource: event.resource ?? null,
            employeeIds,
        });
        setDraftEvent(null);
        setPopoverOpen(true);
    }, [getEmployeeIdsForEvent, onEventClickExternal]);

    const handleDraftChange = useCallback((draft: DraftEventData) => {
        setDraftEvent(prev => prev ? {
            ...prev,
            title: draft.title || '(New Event)',
            start: draft.start,
            end: draft.end,
            color: draft.color,
            allDay: draft.allDay,
        } : null);
    }, []);

    const handlePopoverSave = useCallback(async (formData: CalendarEventFormData) => {
        if (popoverMode === 'create') {
            const newId = await createEvent({
                title: formData.title,
                description: formData.description || undefined,
                start: formData.start,
                end: formData.end,
                allDay: formData.allDay || undefined,
                color: formData.color ?? undefined,
                resource: formData.resource ?? undefined,
            });
            if (newId) {
                await assignEmployees(newId, formData.employeeIds);
                if (Object.keys(formData.customFieldValues).length > 0) {
                    await saveCustomFieldValuesForCalendarEvent(
                        newId as CalendarEventId,
                        formData.customFieldValues
                    );
                }
            }
        } else if (formData.id) {
            await updateEvent(formData.id, {
                title: formData.title,
                description: formData.description || undefined,
                start: formData.start,
                end: formData.end,
                allDay: formData.allDay || undefined,
                color: formData.color ?? undefined,
                resource: formData.resource ?? undefined,
            });
            await assignEmployees(formData.id, formData.employeeIds);
            if (Object.keys(formData.customFieldValues).length > 0) {
                await saveCustomFieldValuesForCalendarEvent(
                    formData.id as CalendarEventId,
                    formData.customFieldValues
                );
            }
        }
        setPopoverOpen(false);
        setDraftEvent(null);
    }, [popoverMode, createEvent, updateEvent, assignEmployees]);

    const handlePopoverDelete = useCallback(async (id: string) => {
        await deleteEvent(id);
        setPopoverOpen(false);
        setDraftEvent(null);
    }, [deleteEvent]);

    const handlePopoverClose = useCallback(() => {
        setPopoverOpen(false);
        setDraftEvent(null);
    }, []);

    if (isLoading) return null;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', ...sx }}>
            <CalendarToolbar
                currentDate={currentDate}
                view={view}
                onViewChange={setView}
                onNavigate={setCurrentDate}
                locale={locale}
                miniCalendarOpen={miniCalendarOpen}
                onToggleMiniCalendar={() => setMiniCalendarOpen(prev => !prev)}
                ampm={ampm}
                showWeekends={showWeekends}
                onTimeFormatChange={handleTimeFormatChange}
                onShowWeekendsChange={handleShowWeekendsChange}
            />

            {/* Main content: mini month calendar + scheduler grid */}
            <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
                {miniCalendarOpen && (
                    <Box sx={{
                        flexShrink: 0,
                        borderRight: 1,
                        borderColor: 'divider',
                    }}>
                        <MiniMonthCalendar
                            currentDate={currentDate}
                            events={events}
                            locale={locale}
                            onDaySelect={handleDaySelect}
                        />
                    </Box>
                )}

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <CalendarWeekView
                        days={days}
                        events={events}
                        resources={resources}
                        onSlotClick={handleSlotClick}
                        onEventClick={handleEventClick}
                        ampm={ampm}
                        locale={locale}
                        draftEvent={draftEvent}
                        draftAnchorRef={draftAnchorRef}
                    />
                </Box>
            </Box>

            {!onSlotClickExternal && (
                <EventFormPopover
                    open={popoverOpen}
                    anchorEl={popoverAnchorEl}
                    mode={popoverMode}
                    initialData={popoverData}
                    onSave={handlePopoverSave}
                    onDelete={handlePopoverDelete}
                    onClose={handlePopoverClose}
                    onDraftChange={handleDraftChange}
                />
            )}
        </Box>
    );
}
