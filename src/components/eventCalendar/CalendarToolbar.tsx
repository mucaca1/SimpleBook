import { IconButton, Button, ButtonGroup, Typography, Box } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

interface CalendarToolbarProps {
    currentDate: dayjs.Dayjs;
    view: 'day' | 'week';
    onViewChange: (view: 'day' | 'week') => void;
    onNavigate: (date: dayjs.Dayjs) => void;
    locale: string;
}

export function CalendarToolbar({
    currentDate,
    view,
    onViewChange,
    onNavigate,
    locale,
}: CalendarToolbarProps) {
    const { t } = useTranslation();
    const d = currentDate.locale(locale);

    const handleToday = () => onNavigate(dayjs());
    const handlePrev = () => {
        onNavigate(view === 'week' ? d.subtract(7, 'day') : d.subtract(1, 'day'));
    };
    const handleNext = () => {
        onNavigate(view === 'week' ? d.add(7, 'day') : d.add(1, 'day'));
    };

    let title = '';
    if (view === 'week') {
        const start = d.startOf('week');
        const end = d.endOf('week');
        if (start.isSame(end, 'month')) {
            title = locale === 'sk'
                ? `${start.format('D.')} – ${end.format('D. MMMM YYYY')}`
                : `${start.format('MMM D')} – ${end.format('D, YYYY')}`;
        } else if (start.isSame(end, 'year')) {
            title = locale === 'sk'
                ? `${start.format('D. MMM')} – ${end.format('D. MMMM YYYY')}`
                : `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`;
        } else {
            title = `${start.format('MMM D, YYYY')} – ${end.format('MMM D, YYYY')}`;
        }
    } else {
        title = d.format(locale === 'sk' ? 'D. MMMM YYYY' : 'MMMM D, YYYY');
    }

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 1,
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            gap: 1,
        }}>
            <Button
                size="small"
                onClick={handleToday}
                variant="text"
                sx={{ minWidth: 'auto', px: 1.5, fontWeight: 500, fontSize: '0.8125rem' }}
            >
                {t('scheduler.toolbar.today', 'Today')}
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" onClick={handlePrev} sx={{ mx: 0.25 }}>
                    <ChevronLeft fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleNext} sx={{ mx: 0.25 }}>
                    <ChevronRight fontSize="small" />
                </IconButton>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.125rem', ml: 0.5 }}>
                {title}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <ButtonGroup
                size="small"
                variant="outlined"
                sx={{
                    '& .MuiButton-root': {
                        px: 2,
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        textTransform: 'none',
                    },
                }}
            >
                <Button
                    variant={view === 'day' ? 'contained' : 'outlined'}
                    onClick={() => onViewChange('day')}
                    disableElevation
                >
                    {t('scheduler.toolbar.day', 'Day')}
                </Button>
                <Button
                    variant={view === 'week' ? 'contained' : 'outlined'}
                    onClick={() => onViewChange('week')}
                    disableElevation
                >
                    {t('scheduler.toolbar.week', 'Week')}
                </Button>
            </ButtonGroup>
        </Box>
    );
}
