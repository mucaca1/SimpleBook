import { useMemo, useState, useCallback } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import dayjs from 'dayjs';
import type { SchedulerEvent } from '@mui/x-scheduler/models';

interface MiniMonthCalendarProps {
    currentDate: dayjs.Dayjs;
    events: SchedulerEvent[];
    locale: string;
    onDaySelect: (date: dayjs.Dayjs) => void;
}

const CELL_SIZE = 32;

export function MiniMonthCalendar({
    currentDate,
    events,
    locale,
    onDaySelect,
}: MiniMonthCalendarProps) {
    const [monthPage, setMonthPage] = useState(() => currentDate.startOf('month'));
    const today = dayjs();

    const weekStartsOnMonday = locale === 'sk';

    const weekdays = useMemo(() => {
        const labels = weekStartsOnMonday
            ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
            : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return labels;
    }, [weekStartsOnMonday]);

    const days = useMemo(() => {
        const startOfMonth = monthPage.startOf('month');
        const diffToStart = weekStartsOnMonday
            ? (startOfMonth.day() === 0 ? 6 : startOfMonth.day() - 1)
            : startOfMonth.day();
        const gridStart = startOfMonth.subtract(diffToStart, 'day');

        const cells: dayjs.Dayjs[] = [];
        for (let i = 0; i < 42; i++) {
            cells.push(gridStart.add(i, 'day'));
        }
        return cells;
    }, [monthPage, weekStartsOnMonday]);

    const eventDays = useMemo(() => {
        const set = new Set<string>();
        for (const e of events) {
            const key = dayjs(e.start).format('YYYY-MM-DD');
            set.add(key);
        }
        return set;
    }, [events]);

    const handlePrevMonth = useCallback(() => {
        setMonthPage(prev => prev.subtract(1, 'month'));
    }, []);

    const handleNextMonth = useCallback(() => {
        setMonthPage(prev => prev.add(1, 'month'));
    }, []);

    const handleDayClick = useCallback((day: dayjs.Dayjs) => {
        setMonthPage(day.startOf('month'));
        onDaySelect(day);
    }, [onDaySelect]);

    const monthLabel = monthPage.locale(locale).format('MMMM YYYY');

    return (
        <Box sx={{ width: 260, flexShrink: 0, p: 1.5, overflowY: 'auto' }}>
            {/* Month header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600, textTransform: 'capitalize' }}>
                    {monthLabel}
                </Typography>
                <IconButton size="small" onClick={handlePrevMonth}>
                    <ChevronLeft fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleNextMonth}>
                    <ChevronRight fontSize="small" />
                </IconButton>
            </Box>

            {/* Weekday headers */}
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(7, ${CELL_SIZE}px)`, justifyContent: 'center' }}>
                {weekdays.map(d => (
                    <Box key={d} sx={{
                        width: CELL_SIZE, height: 24,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 500 }}>
                            {d}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Day cells */}
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(7, ${CELL_SIZE}px)`, justifyContent: 'center' }}>
                {days.map((day, i) => {
                    const isCurrentMonth = day.isSame(monthPage, 'month');
                    const isToday = day.isSame(today, 'day');
                    const isSelected = day.isSame(currentDate, 'day');
                    const hasEvents = eventDays.has(day.format('YYYY-MM-DD'));

                    return (
                        <Box
                            key={i}
                            onClick={() => handleDayClick(day)}
                            sx={{
                                width: CELL_SIZE,
                                height: CELL_SIZE,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                borderRadius: '50%',
                                position: 'relative',
                                bgcolor: isSelected
                                    ? 'primary.main'
                                    : isToday
                                        ? 'primary.light'
                                        : 'transparent',
                                color: isSelected
                                    ? 'primary.contrastText'
                                    : isToday
                                        ? 'primary.contrastText'
                                        : isCurrentMonth
                                            ? 'text.primary'
                                            : 'text.disabled',
                                fontWeight: isToday || isSelected ? 600 : 400,
                                '&:hover': {
                                    bgcolor: isSelected
                                        ? 'primary.dark'
                                        : 'action.hover',
                                },
                                transition: 'background-color 150ms',
                            }}
                        >
                            <Typography sx={{ fontSize: '0.75rem', lineHeight: 1 }}>
                                {day.format('D')}
                            </Typography>
                            {hasEvents && !isSelected && (
                                <Box sx={{
                                    width: 4, height: 4,
                                    borderRadius: '50%',
                                    bgcolor: isToday ? 'primary.contrastText' : 'primary.main',
                                    position: 'absolute',
                                    bottom: 3,
                                }} />
                            )}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
