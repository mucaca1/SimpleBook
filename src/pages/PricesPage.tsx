import React from "react";
import { Box, Container, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export function PricesPage() {
    const { t } = useTranslation();

    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    {t("prices.title")}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {t("prices.description")}
                </Typography>
            </Box>
        </Container>
    );
}
