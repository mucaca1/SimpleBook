import React from "react";
import { Box, Typography, Container } from "@mui/material";
import { useTranslation } from "react-i18next";

export function SettingsPage() {
    const { t } = useTranslation();

    return (
        <Container maxWidth="md">
            <Box
                sx={{
                    minHeight: "80vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "background.default",
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom>
                    {t("subject.settingsPage.title")}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {t("subject.settingsPage.description")}
                </Typography>
            </Box>
        </Container>
    );
}
