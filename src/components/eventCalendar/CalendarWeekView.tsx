import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import type { SchedulerEvent, SchedulerResource } from '@mui/x-scheduler/models';
import {
    HOUR_HEIGHT, GUTTER_WIDTH, MIN_EVENT_HEIGHT,
    getTimedEventsForDay, getAllDayEventsForDay, layoutEvents, formatHour,
    getEventColor, getMinutesFromISO,
} from './utils';
import { CalendarEventBlock } from './CalendarEventBlock';

interface CalendarWeekViewProps {
    days: dayjs.Dayjs[];
    events: SchedulerEvent[];
    resources: SchedulerResource[];
    onSlotClick: (day: dayjs.Dayjs, startTime: dayjs.Dayjs, anchorEl: HTMLElement, clickEvent: React.MouseEvent) => void;
    onEventClick: (event: SchedulerEvent, anchorEl: HTMLElement) => void;
    ampm: boolean;
    locale: string;
    draftEvent?: SchedulerEvent | null;
    draftAnchorRef?: React.RefObject<HTMLDivElement | null>;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const BORDER_COLOR = 'rgba(0, 0, 0, 0.08)';

export function CalendarWeekView({
    days,
    events,
    resources,
    onSlotClick,
    onEventClick,
    ampm,
    locale,
    draftEvent,
    draftAnchorRef,
}: CalendarWeekViewProps) {
    const gridRef = useRef<HTMLDivElement>(null);
    const [nowTop, setNowTop] = useState<number | null>(null);

    const enrichedEvents = useMemo(() => {
        const resourceColorMap = new Map<string, string>();
        for (const r of resources) {
            resourceColorMap.set(r.id, getEventColor(r.eventColor as any));
        }
        return events.map(e => {
            if (!e.color && e.resource) {
                const resColor = resourceColorMap.get(e.resource);
                if (resColor) return { ...e, color: resColor as any };
            }
            return e;
        });
    }, [events, resources]);

    useEffect(() => {
        if (gridRef.current) {
            const scrollTo = Math.max(0, (dayjs().hour() - 1) * HOUR_HEIGHT);
            gridRef.current.scrollTop = scrollTo;
        }
    }, [days]);

    useEffect(() => {
        const update = () => {
            const now = dayjs();
            setNowTop((now.hour() + now.minute() / 60) * HOUR_HEIGHT);
        };
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleDayClick = useCallback((day: dayjs.Dayjs, e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const totalMinutes = Math.max(0, (y / HOUR_HEIGHT) * 60);
        const snapped = Math.round(totalMinutes / 30) * 30;
        onSlotClick(day, day.startOf('day').add(snapped, 'minute'), e.currentTarget, e);
    }, [onSlotClick]);

    const handleEventClick = useCallback((event: SchedulerEvent) => {
        const el = document.querySelector(`[data-event-id="${String(event.id)}"]`) as HTMLElement;
        onEventClick(event, el);
    }, [onEventClick]);

    const isToday = (day: dayjs.Dayjs) => day.isSame(dayjs(), 'day');

    const dayHeaders = useMemo(() =>
        days.map(day => ({
            key: day.format('YYYY-MM-DD'),
            label: day.locale(locale).format('ddd'),
            date: day.format('D'),
            isToday: isToday(day),
        })),
        [days, locale]
    );

    // Shared sx for hiding scrollbar while reserving its space, keeping columns aligned
    const scrollbarGutterSx = {
        overflowY: 'scroll' as const,
        scrollbarColor: 'transparent transparent',
        '&::-webkit-scrollbar': { background: 'transparent' },
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Fixed header section — hidden scrollbar reserves space to match grid below */}
            <Box sx={{ flexShrink: 0, ...scrollbarGutterSx }}>
                {/* Day column headers */}
                <Box sx={{
                    display: 'flex',
                    borderBottom: `1px solid ${BORDER_COLOR}`,
                }}>
                    <Box sx={{ width: GUTTER_WIDTH, flexShrink: 0, borderRight: `1px solid ${BORDER_COLOR}` }} />
                    {dayHeaders.map(dh => (
                        <Box key={dh.key} sx={{
                            flex: 1, textAlign: 'center', py: 0.75,
                            borderLeft: `1px solid ${BORDER_COLOR}`,
                        }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.02em', display: 'block', lineHeight: 1.4 }}
                            >
                                {dh.label}
                            </Typography>
                            <Box sx={{
                                width: 36, height: 36, borderRadius: '50%',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: dh.isToday ? 'primary.main' : 'transparent',
                                color: dh.isToday ? 'primary.contrastText' : 'text.primary',
                                fontWeight: dh.isToday ? 600 : 400,
                                fontSize: '0.875rem',
                                lineHeight: 1,
                            }}>
                                {dh.date}
                            </Box>
                        </Box>
                    ))}
                </Box>

                {/* All-day events row */}
                <Box sx={{ display: 'flex', borderBottom: `1px solid ${BORDER_COLOR}`, minHeight: 32 }}>
                    <Box sx={{
                        width: GUTTER_WIDTH, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 1,
                    }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
                            all-day
                        </Typography>
                    </Box>
                    {days.map((day) => {
                        const allDay = getAllDayEventsForDay(enrichedEvents, day);
                        return (
                            <Box key={day.format('YYYY-MM-DD')} sx={{
                                flex: 1, px: '2px',
                                borderLeft: `1px solid ${BORDER_COLOR}`,
                                display: 'flex', flexWrap: 'wrap', gap: '2px',
                                py: '2px', alignItems: 'center',
                            }}>
                                {allDay.map((event) => {
                                    const color = getEventColor(event.color);
                                    return (
                                        <Box
                                            key={String(event.id)}
                                            onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                                            sx={{
                                                bgcolor: color,
                                                borderRadius: '3px',
                                                px: '4px', py: '1px',
                                                cursor: 'pointer',
                                                transition: 'opacity 150ms',
                                                '&:hover': { opacity: 0.85 },
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                noWrap
                                                sx={{ fontSize: '0.65rem', color: '#fff', fontWeight: 500, lineHeight: 1.4 }}
                                            >
                                                {event.title}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {/* Scrollable time grid — scrollbar only here */}
            <Box ref={gridRef} sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                <Box sx={{ display: 'flex', position: 'relative', height: 24 * HOUR_HEIGHT }}>
                    {/* Time gutter */}
                    <Box sx={{
                        width: GUTTER_WIDTH, flexShrink: 0, position: 'relative',
                        bgcolor: 'background.default',
                        borderRight: `1px solid ${BORDER_COLOR}`,
                    }}>
                        {HOURS.map((hour) => (
                            <Box key={hour} sx={{
                                position: 'absolute',
                                top: hour * HOUR_HEIGHT,
                                right: 12,
                                transform: 'translateY(-50%)',
                            }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                                    {formatHour(hour, ampm)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Day columns */}
                    {days.map((day) => {
                        const dayEvents = getTimedEventsForDay(enrichedEvents, day);
                        const layouted = layoutEvents(dayEvents);
                        const today = isToday(day);

                        const showDraft = draftEvent && !draftEvent.allDay && dayjs(draftEvent.start).isSame(day, 'day');
                        let draftTop = 0, draftHeight = 0, draftLeft = 0, draftWidth = 1;
                        if (showDraft) {
                            const startMin = getMinutesFromISO(draftEvent!.start);
                            const endMin = getMinutesFromISO(draftEvent!.end);
                            draftTop = (startMin / 60) * HOUR_HEIGHT;
                            draftHeight = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, MIN_EVENT_HEIGHT);

                            const hasOverlap = layouted.some(({ top, height }) => {
                                const eTop = top;
                                const eBottom = top + height;
                                const dTop = draftTop;
                                const dBottom = draftTop + draftHeight;
                                return dTop < eBottom && dBottom > eTop;
                            });
                            if (hasOverlap) {
                                draftLeft = 0.5;
                                draftWidth = 0.5;
                            }
                        }

                        return (
                            <Box
                                key={day.format('YYYY-MM-DD')}
                                onClick={(e) => handleDayClick(day, e)}
                                sx={{
                                    flex: 1,
                                    position: 'relative',
                                    borderLeft: `1px solid ${BORDER_COLOR}`,
                                    cursor: 'pointer',
                                    bgcolor: today ? 'rgba(25, 118, 210, 0.03)' : 'transparent',
                                    '&:hover': {
                                        bgcolor: today ? 'rgba(25, 118, 210, 0.05)' : 'rgba(0, 0, 0, 0.01)',
                                    },
                                }}
                            >
                                {/* Hour grid lines */}
                                {HOURS.map((hour) => (
                                    <Box key={hour} sx={{
                                        position: 'absolute',
                                        top: hour * HOUR_HEIGHT,
                                        left: 0, right: 0,
                                        borderTop: `1px solid ${BORDER_COLOR}`,
                                    }} />
                                ))}

                                {/* Half-hour lines */}
                                {HOURS.map((hour) => (
                                    <Box key={`h-${hour}`} sx={{
                                        position: 'absolute',
                                        top: hour * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                                        left: 0, right: 0,
                                        borderTop: `1px solid rgba(0, 0, 0, 0.04)`,
                                    }} />
                                ))}

                                {/* Existing events */}
                                {layouted.map(({ event, top, height, left, width }) => (
                                    <Box key={String(event.id)} data-event-id={String(event.id)}>
                                        <CalendarEventBlock
                                            event={event}
                                            top={top}
                                            height={height}
                                            left={left}
                                            width={width}
                                            ampm={ampm}
                                            onClick={handleEventClick}
                                        />
                                    </Box>
                                ))}

                                {/* Draft event overlay */}
                                {showDraft && (
                                    <Box ref={draftAnchorRef} sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                                        <CalendarEventBlock
                                            event={draftEvent!}
                                            top={draftTop}
                                            height={draftHeight}
                                            left={draftLeft}
                                            width={draftWidth}
                                            ampm={ampm}
                                            onClick={() => {}}
                                            isDraft
                                        />
                                    </Box>
                                )}

                                {/* Now indicator */}
                                {today && nowTop !== null && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: nowTop,
                                        left: 0, right: 0,
                                        height: 2,
                                        bgcolor: '#ef5350',
                                        zIndex: 5,
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            left: 0,
                                            top: -4,
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            bgcolor: '#ef5350',
                                        },
                                    }} />
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
}
