import React, { useState, useCallback, useMemo, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Box } from '@mui/material';
import dayjs from 'dayjs';
import type { SchedulerEvent } from '@mui/x-scheduler/models';
import type { SchedulerResource } from '@mui/x-scheduler-headless/models';
import { useTranslation } from 'react-i18next';
import { sqliteFalse } from '@evolu/common';
import { updateCalendarTimeFormat, updateCalendarShowWeekends } from '../../hooks/useSettingsSync';
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

export const CustomEventCalendar = React.memo(forwardRef(function CustomEventCalendar({
    sx,
    onSlotClick: onSlotClickExternal,
    onEventClick: onEventClickExternal,
    // Data props
    events,
    allEventRows,
    completedEventIds,
    getEmployeeIdsForEvent,
    getCustomerIdsForEvent,
    serviceRows,
    employeeRows,
    customerRows,
    roomRows,
    settingsRow,
    // Mutation callbacks
    createEvent: createEventCb,
    updateEvent: updateEventCb,
    deleteEvent: deleteEventCb,
    assignEmployees: assignEmployeesCb,
}: CustomEventCalendarProps, ref) {
    const { i18n } = useTranslation();

    const ampm = settingsRow?.calendarTimeFormat === '12h';
    const showWeekends = settingsRow?.calendarShowWeekends !== sqliteFalse;
    const locale = i18n.language === 'sk' ? 'sk' : 'en';

    // Expose clearDraft to parent via ref (avoids re-rendering calendar on panel toggle)
    const [draftEvent, setDraftEvent] = useState<SchedulerEvent | null>(null);
    useImperativeHandle(ref, () => ({
        clearDraft: () => setDraftEvent(null),
    }));

    const draftAnchorRef = useRef<HTMLDivElement | null>(null);

    // Calendar state
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [view, setView] = useState<'day' | 'week'>('week');
    const [miniCalendarOpen, setMiniCalendarOpen] = useState(true);

    // Popover state
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [popoverMode, setPopoverMode] = useState<'create' | 'edit'>('create');
    const [popoverAnchorEl, setPopoverAnchorEl] = useState<HTMLElement | null>(null);
    const [popoverData, setPopoverData] = useState<Partial<CalendarEventFormData> | undefined>();

    const days = useMemo(() => {
        if (view === 'week') return getWeekDays(currentDate, showWeekends, locale);
        return [currentDate];
    }, [currentDate, view, showWeekends, locale]);

    // Filter state
    const [employeeFilter, setEmployeeFilter] = useState<string[]>([]);
    const [customerFilter, setCustomerFilter] = useState<string[]>([]);
    const [roomFilter, setRoomFilter] = useState<string[]>([]);

    // Filter options for the toolbar
    const employeeOptions = useMemo(() =>
        (employeeRows ?? []).map((e) => ({
            id: String(e.id),
            label: `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || '?',
        })),
        [employeeRows]
    );

    const customerOptions = useMemo(() =>
        (customerRows ?? []).map((c) => ({
            id: String(c.id),
            label: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || '?',
        })),
        [customerRows]
    );

    const roomOptions = useMemo(() =>
        (roomRows ?? []).map((r) => ({
            id: String(r.id),
            label: r.name ?? '?',
        })),
        [roomRows]
    );

    // Build roomId lookup from event rows
    const eventRoomMap = useMemo(() => {
        const map = new Map<string, string | null>();
        for (const row of allEventRows) {
            map.set(String(row.id), row.roomId ? String(row.roomId) : null);
        }
        return map;
    }, [allEventRows]);

    // Filtered events
    const filteredEvents = useMemo(() => {
        const hasFilters = employeeFilter.length > 0 || customerFilter.length > 0 || roomFilter.length > 0;
        if (!hasFilters) return events;

        return events.filter((event) => {
            const eventId = String(event.id);

            // Employee filter
            if (employeeFilter.length > 0) {
                const assigned = getEmployeeIdsForEvent(eventId);
                if (!assigned.some((id) => employeeFilter.includes(id))) return false;
            }

            // Customer filter
            if (customerFilter.length > 0) {
                const assigned = getCustomerIdsForEvent(eventId);
                if (!assigned.some((id) => customerFilter.includes(id))) return false;
            }

            // Room filter
            if (roomFilter.length > 0) {
                const eventRoom = eventRoomMap.get(eventId);
                if (!eventRoom || !roomFilter.includes(eventRoom)) return false;
            }

            return true;
        });
    }, [events, employeeFilter, customerFilter, roomFilter, getEmployeeIdsForEvent, getCustomerIdsForEvent, eventRoomMap]);

    const resources: SchedulerResource[] = useMemo(
        () => (serviceRows ?? []).map((service) => ({
            id: String(service.id),
            title: String(service.name),
            eventColor: hexToSchedulerColor(service.color as string | null | undefined),
        })),
        [serviceRows]
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
            const newId = await createEventCb({
                title: formData.title,
                description: formData.description || undefined,
                start: formData.start,
                end: formData.end,
                allDay: formData.allDay || undefined,
                color: formData.color ?? undefined,
                resource: formData.resource ?? undefined,
            });
            if (newId) {
                await assignEmployeesCb(newId, formData.employeeIds);
                if (Object.keys(formData.customFieldValues).length > 0) {
                    await saveCustomFieldValuesForCalendarEvent(
                        newId as CalendarEventId,
                        formData.customFieldValues
                    );
                }
            }
        } else if (formData.id) {
            await updateEventCb(formData.id, {
                title: formData.title,
                description: formData.description || undefined,
                start: formData.start,
                end: formData.end,
                allDay: formData.allDay || undefined,
                color: formData.color ?? undefined,
                resource: formData.resource ?? undefined,
            });
            await assignEmployeesCb(formData.id, formData.employeeIds);
            if (Object.keys(formData.customFieldValues).length > 0) {
                await saveCustomFieldValuesForCalendarEvent(
                    formData.id as CalendarEventId,
                    formData.customFieldValues
                );
            }
        }
        setPopoverOpen(false);
        setDraftEvent(null);
    }, [popoverMode, createEventCb, updateEventCb, assignEmployeesCb]);

    const handlePopoverDelete = useCallback(async (id: string) => {
        await deleteEventCb(id);
        setPopoverOpen(false);
        setDraftEvent(null);
    }, [deleteEventCb]);

    const handlePopoverClose = useCallback(() => {
        setPopoverOpen(false);
        setDraftEvent(null);
    }, []);

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
                employeeOptions={employeeOptions}
                customerOptions={customerOptions}
                roomOptions={roomOptions}
                employeeFilter={employeeFilter}
                customerFilter={customerFilter}
                roomFilter={roomFilter}
                onEmployeeFilterChange={setEmployeeFilter}
                onCustomerFilterChange={setCustomerFilter}
                onRoomFilterChange={setRoomFilter}
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
                            events={filteredEvents}
                            locale={locale}
                            onDaySelect={handleDaySelect}
                        />
                    </Box>
                )}

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <CalendarWeekView
                        days={days}
                        events={filteredEvents}
                        resources={resources}
                        onSlotClick={handleSlotClick}
                        onEventClick={handleEventClick}
                        ampm={ampm}
                        locale={locale}
                        draftEvent={draftEvent}
                        draftAnchorRef={draftAnchorRef}
                        completedEventIds={completedEventIds}
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
                    employees={employeeRows}
                    customers={customerRows}
                    services={serviceRows}
                    rooms={roomRows}
                />
            )}
        </Box>
    );
}));
