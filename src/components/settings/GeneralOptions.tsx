import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSettingsSync, updateLanguage, updateTheme, updateCurrency } from "../../hooks/useSettingsSync";
import { LanguageSelector } from "../ui/LanguageSelector";
import { ThemeSelector } from "./ThemeSelector";
import { CurrencySelector } from "./CurrencySelector";

export function GeneralOptions() {
    const { t } = useTranslation();
    const { language, theme, currency, id } = useSettingsSync();

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

    const handleCurrencyChange = async (newCurrency: string) => {
        try {
            await updateCurrency(id, newCurrency);
        } catch (error) {
            console.error("Failed to update currency:", error);
        }
    };

    return (
        <Box>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="subtitle1" gutterBottom>
                        {t("settings.general.language")}
                    </Typography>
                    <LanguageSelector
                        value={language || "en"}
                        onChange={handleLanguageChange}
                    />
                </Box>

                <Box>
                    <Typography variant="subtitle1" gutterBottom>
                        {t("settings.general.theme")}
                    </Typography>
                    <ThemeSelector
                        value={theme || "light"}
                        onChange={handleThemeChange}
                    />
                </Box>

                <Box>
                    <Typography variant="subtitle1" gutterBottom>
                        {t("settings.general.currency")}
                    </Typography>
                    <CurrencySelector
                        value={currency || "EUR"}
                        onChange={handleCurrencyChange}
                    />
                </Box>
            </Stack>
        </Box>
    );
}
