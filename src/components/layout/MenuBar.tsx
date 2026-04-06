import { AppBar, Toolbar, Button, Typography, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";

export function MenuBar() {
    const { t, } = useTranslation();
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {t('app.title')} - v1.0.0
                </Typography>

                <Box>
                    <Button color="inherit" component={RouterLink} to="/">
                        { t('common.home') }
                    </Button>
                    <Button color="inherit" component={RouterLink} to="/settings">
                        { t('common.settings') }
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
