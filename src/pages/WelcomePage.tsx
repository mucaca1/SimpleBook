import React, { useContext } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Stepper,
    Step,
    StepLabel,
    Stack,
    Select,
    OutlinedInput,
    MenuItem,
} from "@mui/material";
import { Language } from "../types";
import { LanguageSelector, SettingRow } from "../components/ui";
import { ThemeContext } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useEvolu } from "../evolu-init";
import { useThemeLabels } from "../hooks/useThemeLabels";

export function WelcomePage() {
    const { insert } = useEvolu();
    const [step, setStep] = React.useState<0 | 1>(0);
    const { t, i18n } = useTranslation();
    const { mode, setTheme } = useContext(ThemeContext);
    const themeLabels = useThemeLabels();

    const next = () => setStep((s) => (s === 0 ? 1 : s));
    const back = () => setStep((s) => (s === 1 ? 0 : s));

    const finish = async () => {
        await insert("settings", {language: i18n.language, theme: mode, calendarTimeFormat: "24h", calendarShowWeekends: 1});
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.default",
            }}
        >
            <Card sx={{ width: 420 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        {t("welcome.greeting")}
                    </Typography>

                    <Stepper activeStep={step} sx={{ my: 3 }}>
                        <Step>
                            <StepLabel>{t("welcome.steps.language")}</StepLabel>
                        </Step>
                        <Step>
                            <StepLabel>{t("welcome.steps.theme")}</StepLabel>
                        </Step>
                    </Stepper>

                    {step === 0 && (
                        <>
                            <Typography sx={{ mb: 2 }}>
                                {t("welcome.language.instruction")}
                            </Typography>

                            <SettingRow label={t("welcome.steps.language")}>
                                <LanguageSelector
                                    value={i18n.language as Language}
                                    onChange={(e) => {
                                        i18n.changeLanguage(e);
                                    }} 
                                />
                            </SettingRow>
                        </>
                    )}

                    {step === 1 && (
                        <>
                            <Typography sx={{ mb: 2 }}>
                                {t("welcome.theme.instruction")}
                            </Typography>

                            <SettingRow label={t("welcome.steps.theme")}>
                                <Select
                                    value={mode}
                                    onChange={(e) => setTheme(e.target.value)}
                                    input={<OutlinedInput />}
                                    size="small"
                                    sx={{ maxWidth: 220 }}
                                    fullWidth
                                >
                                    {Object.entries(themeLabels).map(([key, label]) => (
                                        <MenuItem key={key} value={key}>
                                            {label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </SettingRow>
                        </>
                    )}

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        sx={{ mt: 4 }}
                    >
                        <Button
                            disabled={step === 0}
                            onClick={back}
                        >
                            {t("common.back")}
                        </Button>

                        {step === 0 ? (
                            <Button variant="contained" onClick={next}>
                                {t("common.next")}
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={finish}
                            >
                                {t("common.continue")}
                            </Button>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}