import { MenuItem, OutlinedInput, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ThemeMode } from "../../types";

export function ThemeSelector({
    value,
    onChange,
}: {
    value: ThemeMode;
    onChange: (value: ThemeMode) => void;
}) {
    const { t } = useTranslation();

    const themes: Record<ThemeMode, string> = {
        light: t("theme.light") || "Light",
        dark: t("theme.dark") || "Dark",
    };

    return (
        <Select
            value={value}
            onChange={(e) => onChange(e.target.value as ThemeMode)}
            input={<OutlinedInput />}
            size="small"
            sx={{ maxWidth: 220 }}
            fullWidth
        >
            {Object.entries(themes).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                    {label}
                </MenuItem>
            ))}
        </Select>
    );
}
