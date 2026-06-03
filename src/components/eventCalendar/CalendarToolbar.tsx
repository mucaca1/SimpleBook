import { useState, useRef } from 'react';
import { IconButton, Button, ButtonGroup, Typography, Box, Popover, FormControlLabel, Checkbox, Radio, RadioGroup, Divider, Autocomplete, TextField, Chip } from '@mui/material';
import { ChevronLeft, ChevronRight, Menu as MenuIcon, MenuOpen, Settings, FilterList } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

interface FilterOption {
    id: string;
    label: string;
}

interface CalendarToolbarProps {
    currentDate: dayjs.Dayjs;
    view: 'day' | 'week';
    onViewChange: (view: 'day' | 'week') => void;
    onNavigate: (date: dayjs.Dayjs) => void;
    locale: string;
    miniCalendarOpen: boolean;
    onToggleMiniCalendar: () => void;
    ampm: boolean;
    showWeekends: boolean;
    onTimeFormatChange: (ampm: boolean) => void;
    onShowWeekendsChange: (show: boolean) => void;
    // Filter props
    employeeOptions: FilterOption[];
    customerOptions: FilterOption[];
    roomOptions: FilterOption[];
    employeeFilter: string[];
    customerFilter: string[];
    roomFilter: string[];
    onEmployeeFilterChange: (ids: string[]) => void;
    onCustomerFilterChange: (ids: string[]) => void;
    onRoomFilterChange: (ids: string[]) => void;
}

export function CalendarToolbar({
    currentDate,
    view,
    onViewChange,
    onNavigate,
    locale,
    miniCalendarOpen,
    onToggleMiniCalendar,
    ampm,
    showWeekends,
    onTimeFormatChange,
    onShowWeekendsChange,
    employeeOptions,
    customerOptions,
    roomOptions,
    employeeFilter,
    customerFilter,
    roomFilter,
    onEmployeeFilterChange,
    onCustomerFilterChange,
    onRoomFilterChange,
}: CalendarToolbarProps) {
    const { t } = useTranslation();
    const d = currentDate.locale(locale);
    const settingsRef = useRef<HTMLButtonElement>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const hasActiveFilters = employeeFilter.length > 0 || customerFilter.length > 0 || roomFilter.length > 0;

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
        <Box sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
            {/* Main toolbar row */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1,
                py: 1,
                gap: 1,
            }}>
                <IconButton
                    size="small"
                    onClick={onToggleMiniCalendar}
                    aria-label={t('scheduler.toolbar.menu')}
                >
                    {miniCalendarOpen ? <MenuOpen fontSize="small" /> : <MenuIcon fontSize="small" />}
                </IconButton>
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
                <IconButton
                    size="small"
                    onClick={() => setFiltersOpen(prev => !prev)}
                    color={hasActiveFilters ? 'primary' : 'default'}
                >
                    <FilterList fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => setSettingsOpen(true)}
                    ref={settingsRef}
                    aria-label={t('scheduler.settings.title')}
                >
                    <Settings fontSize="small" />
                </IconButton>

                <Popover
                    open={settingsOpen}
                    anchorEl={settingsRef.current}
                    onClose={() => setSettingsOpen(false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{
                        paper: {
                            sx: { width: 260, p: 2 },
                        },
                    }}
                >
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                        {t('scheduler.settings.title')}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                        {t('scheduler.settings.timeFormat')}
                    </Typography>
                    <RadioGroup
                        value={ampm ? '12h' : '24h'}
                        onChange={(e) => onTimeFormatChange(e.target.value === '12h')}
                        sx={{ mt: 0.5 }}
                    >
                        <FormControlLabel
                            value="24h"
                            control={<Radio size="small" />}
                            label={<Typography variant="body2">{t('scheduler.settings.24h')}</Typography>}
                        />
                        <FormControlLabel
                            value="12h"
                            control={<Radio size="small" />}
                            label={<Typography variant="body2">{t('scheduler.settings.12h')}</Typography>}
                        />
                    </RadioGroup>

                    <Divider sx={{ my: 1.5 }} />

                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={showWeekends}
                                onChange={(e) => onShowWeekendsChange(e.target.checked)}
                            />
                        }
                        label={<Typography variant="body2">{t('scheduler.settings.showWeekends')}</Typography>}
                    />
                </Popover>
            </Box>

            {/* Filter bar */}
            {filtersOpen && (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1,
                    py: 0.75,
                    flexWrap: 'wrap',
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                    bgcolor: 'action.hover',
                }}>
                    <Autocomplete
                        multiple
                        size="small"
                        options={employeeOptions}
                        getOptionLabel={(opt) => opt.label}
                        value={employeeOptions.filter((o) => employeeFilter.includes(o.id))}
                        onChange={(_, newValue) => onEmployeeFilterChange(newValue.map((v) => v.id))}
                        limitTags={1}
                        renderInput={(params) => (
                            <TextField {...params} label={t('scheduler.filters.employee')} placeholder="" sx={{ minWidth: 180 }} />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const { key, ...rest } = getTagProps({ index });
                                return (
                                    <Chip key={key} label={option.label} size="small" {...rest} />
                                );
                            })
                        }
                        sx={{ minWidth: 180, maxWidth: 300 }}
                    />
                    <Autocomplete
                        multiple
                        size="small"
                        options={customerOptions}
                        getOptionLabel={(opt) => opt.label}
                        value={customerOptions.filter((o) => customerFilter.includes(o.id))}
                        onChange={(_, newValue) => onCustomerFilterChange(newValue.map((v) => v.id))}
                        limitTags={1}
                        renderInput={(params) => (
                            <TextField {...params} label={t('scheduler.filters.customer')} placeholder="" sx={{ minWidth: 180 }} />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const { key, ...rest } = getTagProps({ index });
                                return (
                                    <Chip key={key} label={option.label} size="small" {...rest} />
                                );
                            })
                        }
                        sx={{ minWidth: 180, maxWidth: 300 }}
                    />
                    <Autocomplete
                        multiple
                        size="small"
                        options={roomOptions}
                        getOptionLabel={(opt) => opt.label}
                        value={roomOptions.filter((o) => roomFilter.includes(o.id))}
                        onChange={(_, newValue) => onRoomFilterChange(newValue.map((v) => v.id))}
                        limitTags={1}
                        renderInput={(params) => (
                            <TextField {...params} label={t('scheduler.filters.room')} placeholder="" sx={{ minWidth: 150 }} />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const { key, ...rest } = getTagProps({ index });
                                return (
                                    <Chip key={key} label={option.label} size="small" {...rest} />
                                );
                            })
                        }
                        sx={{ minWidth: 150, maxWidth: 250 }}
                    />
                    {hasActiveFilters && (
                        <Button
                            size="small"
                            onClick={() => {
                                onEmployeeFilterChange([]);
                                onCustomerFilterChange([]);
                                onRoomFilterChange([]);
                            }}
                            sx={{ textTransform: 'none' }}
                        >
                            {t('common.cancel')}
                        </Button>
                    )}
                </Box>
            )}
        </Box>
    );
}
