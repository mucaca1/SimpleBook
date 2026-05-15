import dayjs from 'dayjs';
import type { SchedulerEvent, SchedulerEventColor } from '@mui/x-scheduler/models';

export const HOUR_HEIGHT = 48;
export const GUTTER_WIDTH = 60;
export const MIN_EVENT_HEIGHT = 22;
export const EVENT_GAP = 2;

const BOLD_COLORS: Record<SchedulerEventColor, string> = {
    red:     '#ef5350',
    pink:    '#ec407a',
    purple:  '#6A1B9A',
    indigo:  '#5c6bc0',
    blue:    '#42a5f5',
    teal:    '#00897B',
    green:   '#66bb6a',
    lime:    '#afb42b',
    amber:   '#ffa726',
    orange:  '#ff7043',
    grey:    '#9e9e9e',
};

const DEFAULT_COLOR: string = BOLD_COLORS.teal;

export function getEventColor(color: SchedulerEventColor | null | undefined): string {
    return color ? (BOLD_COLORS[color] ?? DEFAULT_COLOR) : DEFAULT_COLOR;
}

export function getMinutesFromISO(isoString: string): number {
    const d = dayjs(isoString);
    return d.hour() * 60 + d.minute();
}

export function formatHour(hour: number, ampm: boolean): string {
    if (ampm) {
        if (hour === 0) return '12 AM';
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return '12 PM';
        return `${hour - 12} PM`;
    }
    return `${hour.toString().padStart(2, '0')}:00`;
}

export function getWeekDays(date: dayjs.Dayjs, showWeekends: boolean, locale: string): dayjs.Dayjs[] {
    const weekStartsOnMonday = locale === 'sk';
    const day = date.day();
    const diffToStart = weekStartsOnMonday
        ? (day === 0 ? -6 : 1 - day)
        : -day;
    const startOfWeek = date.add(diffToStart, 'day');

    const days: dayjs.Dayjs[] = [];
    for (let i = 0; i < 7; i++) {
        const d = startOfWeek.add(i, 'day');
        if (showWeekends || (d.day() !== 0 && d.day() !== 6)) {
            days.push(d);
        }
    }
    return days;
}

export function getTimedEventsForDay(events: SchedulerEvent[], day: dayjs.Dayjs): SchedulerEvent[] {
    return events.filter(e => {
        if (e.allDay) return false;
        return dayjs(e.start).isSame(day, 'day');
    });
}

export function getAllDayEventsForDay(events: SchedulerEvent[], day: dayjs.Dayjs): SchedulerEvent[] {
    return events.filter(e => {
        if (!e.allDay) return false;
        return dayjs(e.start).isSame(day, 'day');
    });
}

export interface LayoutedEvent {
    event: SchedulerEvent;
    top: number;
    height: number;
    left: number;
    width: number;
}

export function layoutEvents(events: SchedulerEvent[]): LayoutedEvent[] {
    if (events.length === 0) return [];

    const timed = events.map(e => ({
        event: e,
        startMin: getMinutesFromISO(e.start),
        endMin: getMinutesFromISO(e.end),
    }));

    timed.sort((a, b) =>
        a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin)
    );

    type TimedEvent = { event: SchedulerEvent; startMin: number; endMin: number };
    const clusters: TimedEvent[][] = [];
    for (const evt of timed) {
        if (clusters.length === 0) {
            clusters.push([evt]);
            continue;
        }
        const currentCluster = clusters[clusters.length - 1];
        const clusterEnd = Math.max(...currentCluster.map(e => e.endMin));
        if (evt.startMin < clusterEnd) {
            currentCluster.push(evt);
        } else {
            clusters.push([evt]);
        }
    }

    const result: LayoutedEvent[] = [];
    for (const cluster of clusters) {
        const columns: TimedEvent[][] = [];
        const eventColMap = new Map<SchedulerEvent, number>();

        for (const evt of cluster) {
            let placed = false;
            for (let i = 0; i < columns.length; i++) {
                const lastInCol = columns[i][columns[i].length - 1];
                if (evt.startMin >= lastInCol.endMin) {
                    columns[i].push(evt);
                    eventColMap.set(evt.event, i);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                eventColMap.set(evt.event, columns.length);
                columns.push([evt]);
            }
        }

        const totalCols = columns.length;
        for (const evt of cluster) {
            const col = eventColMap.get(evt.event)!;
            result.push({
                event: evt.event,
                top: (evt.startMin / 60) * HOUR_HEIGHT,
                height: Math.max(((evt.endMin - evt.startMin) / 60) * HOUR_HEIGHT, MIN_EVENT_HEIGHT),
                left: col / totalCols,
                width: 1 / totalCols,
            });
        }
    }

    return result;
}
