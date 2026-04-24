import React, { useState } from "react";
import {
    Box,
    Container,
    Typography,
    Tabs,
    Tab,
    Paper,
} from "@mui/material";
import {
    Settings as SettingsIcon,
    Tune as CustomFieldsIcon,
    Warning as WarningIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { GeneralOptions, CustomFieldsList, DangerZone } from "../components/settings";

export function SettingsPage() {
    const { t } = useTranslation();
    const [currentTab, setCurrentTab] = useState("general");

    const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
        setCurrentTab(newValue);
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    {t("settings.title")}
                </Typography>

                <Paper elevation={1} sx={{ mt: 3 }}>
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <Tabs
                            value={currentTab}
                            onChange={handleTabChange}
                            aria-label="settings tabs"
                            variant="fullWidth"
                        >
                            <Tab
                                label={
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <SettingsIcon />
                                        <Typography variant="body1">
                                            {t("settings.general.title")}
                                        </Typography>
                                    </Box>
                                }
                                value="general"
                                aria-label="general options"
                            />
                            <Tab
                                label={
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <CustomFieldsIcon />
                                        <Typography variant="body1">
                                            {t("settings.customFields.title")}
                                        </Typography>
                                    </Box>
                                }
                                value="customFields"
                                aria-label="custom fields"
                            />
                            <Tab
                                label={
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <WarningIcon color="error" />
                                        <Typography variant="body1" color="error">
                                            {t("settings.dangerZone.title")}
                                        </Typography>
                                    </Box>
                                }
                                value="dangerZone"
                                aria-label="danger zone"
                            />
                        </Tabs>
                    </Box>

                    <Box sx={{ p: 3 }}>
                        {currentTab === "general" && <GeneralOptions />}
                        {currentTab === "customFields" && <CustomFieldsList />}
                        {currentTab === "dangerZone" && <DangerZone />}
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}
