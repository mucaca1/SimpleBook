import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import type { SchedulerEvent } from '@mui/x-scheduler/models';
import { getEventColor, EVENT_GAP } from './utils';

interface CalendarEventBlockProps {
    event: SchedulerEvent;
    top: number;
    height: number;
    left: number;
    width: number;
    ampm: boolean;
    onClick: (event: SchedulerEvent) => void;
    isDraft?: boolean;
}

export function CalendarEventBlock({
    event,
    top,
    height,
    left,
    width,
    ampm,
    onClick,
    isDraft = false,
}: CalendarEventBlockProps) {
    const bgColor = getEventColor(event.color);
    const fmt = ampm ? 'h:mm A' : 'HH:mm';
    const startTime = dayjs(event.start).format(fmt);
    const endTime = dayjs(event.end).format(fmt);
    const showTime = height > 28;

    return (
        <Box
            onClick={(e) => { e.stopPropagation(); onClick(event); }}
            sx={{
                position: 'absolute',
                top,
                height: `calc(${height}px - ${EVENT_GAP * 2}px)`,
                marginTop: `${EVENT_GAP}px`,
                left: `calc(${left * 100}% + 1px)`,
                width: `calc(${width * 100}% - 3px)`,
                borderRadius: '4px',
                bgcolor: isDraft ? 'transparent' : bgColor,
                overflow: 'hidden',
                cursor: 'pointer',
                zIndex: isDraft ? 4 : 2,
                boxShadow: isDraft ? 'none' : '0 1px 2px rgba(0,0,0,0.15)',
                ...(isDraft
                    ? {
                        border: `2px dashed ${bgColor}`,
                        opacity: 0.7,
                    }
                    : {
                        border: 'none',
                    }),
                transition: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    boxShadow: isDraft ? 'none' : '0 2px 6px rgba(0,0,0,0.25)',
                    zIndex: isDraft ? 4 : 3,
                },
            }}
        >
            <Box sx={{ px: '6px', py: '2px' }}>
                <Typography
                    variant="caption"
                    fontWeight={600}
                    noWrap
                    sx={{
                        fontSize: '0.7rem',
                        lineHeight: 1.4,
                        color: isDraft ? bgColor : '#fff',
                        display: 'block',
                    }}
                >
                    {event.title || '(Untitled)'}
                </Typography>
                {showTime && (
                    <Typography
                        variant="caption"
                        noWrap
                        sx={{
                            fontSize: '0.625rem',
                            lineHeight: 1.3,
                            color: isDraft ? bgColor : 'rgba(255,255,255,0.85)',
                            display: 'block',
                        }}
                    >
                        {startTime} – {endTime}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
