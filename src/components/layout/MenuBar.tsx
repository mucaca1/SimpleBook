import React, { useState } from "react";
import { AppBar, Toolbar, Button, Typography, Box, Menu, MenuItem } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { Home, Settings, ExpandMore, People, Badge, HomeRepairService, AttachMoney, MeetingRoom } from "@mui/icons-material";

export function MenuBar() {
    const { t } = useTranslation();
    const [subjectAnchorEl, setSubjectAnchorEl] = useState<null | HTMLElement>(null);
    const [servicesAnchorEl, setServicesAnchorEl] = useState<null | HTMLElement>(null);
    const subjectOpen = Boolean(subjectAnchorEl);
    const servicesOpen = Boolean(servicesAnchorEl);

    const handleSubjectMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setSubjectAnchorEl(event.currentTarget);
    };

    const handleSubjectMenuClose = () => {
        setSubjectAnchorEl(null);
    };

    const handleServicesMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setServicesAnchorEl(event.currentTarget);
    };

    const handleServicesMenuClose = () => {
        setServicesAnchorEl(null);
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {t('app.title')} - v1.0.0
                </Typography>

                <Box>
                    <Button color="inherit" component={RouterLink} to="/" startIcon={<Home />}>
                        { t('common.home') }
                    </Button>
                    <Button
                        color="inherit"
                        onClick={handleSubjectMenuClick}
                        startIcon={<People />}
                        endIcon={<ExpandMore />}
                        aria-controls={subjectOpen ? 'subject-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={subjectOpen ? 'true' : undefined}
                    >
                        { t('common.subject') }
                    </Button>
                    <Button
                        color="inherit"
                        onClick={handleServicesMenuClick}
                        startIcon={<HomeRepairService />}
                        endIcon={<ExpandMore />}
                        aria-controls={servicesOpen ? 'services-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={servicesOpen ? 'true' : undefined}
                    >
                        { t('common.services') }
                    </Button>
                    <Button color="inherit" component={RouterLink} to="/settings" startIcon={<Settings />}>
                        { t('common.settings') }
                    </Button>
                </Box>

                <Menu
                    id="subject-menu"
                    anchorEl={subjectAnchorEl}
                    open={subjectOpen}
                    onClose={handleSubjectMenuClose}
                    MenuListProps={{
                        'aria-labelledby': 'subject-button',
                    }}
                >
                    <MenuItem
                        component={RouterLink}
                        to="/customers"
                        onClick={handleSubjectMenuClose}
                    >
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            <People fontSize="small" />
                        </Box>
                        {t('subject.customers')}
                    </MenuItem>
                    <MenuItem
                        component={RouterLink}
                        to="/employee"
                        onClick={handleSubjectMenuClose}
                    >
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            <Badge fontSize="small" />
                        </Box>
                        {t('subject.employee')}
                    </MenuItem>
                </Menu>

                <Menu
                    id="services-menu"
                    anchorEl={servicesAnchorEl}
                    open={servicesOpen}
                    onClose={handleServicesMenuClose}
                    MenuListProps={{
                        'aria-labelledby': 'services-button',
                    }}
                >
                    <MenuItem
                        component={RouterLink}
                        to="/service"
                        onClick={handleServicesMenuClose}
                    >
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            <HomeRepairService fontSize="small" />
                        </Box>
                        {t('services.service')}
                    </MenuItem>
                    <MenuItem
                        component={RouterLink}
                        to="/prices"
                        onClick={handleServicesMenuClose}
                    >
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            <AttachMoney fontSize="small" />
                        </Box>
                        {t('services.prices')}
                    </MenuItem>
                    <MenuItem
                        component={RouterLink}
                        to="/rooms"
                        onClick={handleServicesMenuClose}
                    >
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            <MeetingRoom fontSize="small" />
                        </Box>
                        {t('services.rooms')}
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
}
