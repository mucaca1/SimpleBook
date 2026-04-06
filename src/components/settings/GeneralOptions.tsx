import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSettingsSync, updateLanguage, updateTheme } from "../../hooks/useSettingsSync";
import { LanguageSelector } from "../ui/LanguageSelector";
import { ThemeSelector } from "./ThemeSelector";

export function GeneralOptions() {
    const { t } = useTranslation();
    const { language, theme, id } = useSettingsSync();

    const handleLanguageChange = async (newLanguage: string) => {
        try {
            await updateLanguage(id, newLanguage);
        } catch (error) {
            console.error("Failed to update language:", error);
        }
    };

    const handleThemeChange = async (newTheme: string) => {
        try {
            await updateTheme(id, newTheme);
        } catch (error) {
            console.error("Failed to update theme:", error);
        }
    };

    return (
        <Box>
            <Stack spacing={3}>
                {/* Language Selector */}
                <Box>
                    <Typography variant="subtitle1" gutterBottom>
                        {t("settings.general.language")}
                    </Typography>
                    <LanguageSelector
                        value={language || "en"}
                        onChange={handleLanguageChange}
                    />
                </Box>

                {/* Theme Selector */}
                <Box>
                    <Typography variant="subtitle1" gutterBottom>
                        {t("settings.general.theme")}
                    </Typography>
                    <ThemeSelector
                        value={theme || "light"}
                        onChange={handleThemeChange}
                    />
                </Box>
            </Stack>
        </Box>
    );
}
