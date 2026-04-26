import { Typography, Box } from "@mui/material";
import { useTranslation } from "react-i18next";

export function ServicePage() {
    const { t } = useTranslation();

    return (
        <Box>
            <Typography variant="h4">{t('service.pageTitle')}</Typography>
        </Box>
    );
}
