import React, { useState } from "react";
import { AppBar, Toolbar, Button, Typography, Box, Menu, MenuItem } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { Home, Settings, ExpandMore, People, Badge, HomeRepairService } from "@mui/icons-material";

export function MenuBar() {
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
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
                        onClick={handleMenuClick}
                        startIcon={<People />}
                        endIcon={<ExpandMore />}
                        aria-controls={open ? 'subject-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                    >
                        { t('common.subject') }
                    </Button>
                    <Button color="inherit" component={RouterLink} to="/service" startIcon={<HomeRepairService />}>
                        { t('common.service') }
                    </Button>
                    <Button color="inherit" component={RouterLink} to="/settings" startIcon={<Settings />}>
                        { t('common.settings') }
                    </Button>
                </Box>

                <Menu
                    id="subject-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    MenuListProps={{
                        'aria-labelledby': 'subject-button',
                    }}
                >
                    <MenuItem
                        component={RouterLink}
                        to="/customers"
                        onClick={handleMenuClose}
                    >
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            <People fontSize="small" />
                        </Box>
                        {t('subject.customers')}
                    </MenuItem>
                    <MenuItem
                        component={RouterLink}
                        to="/employee"
                        onClick={handleMenuClose}
                    >
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                            <Badge fontSize="small" />
                        </Box>
                        {t('subject.employee')}
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
}
