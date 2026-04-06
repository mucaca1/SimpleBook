import { MenuItem, OutlinedInput, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Language } from "../../types";

export function LanguageSelector({
    value,
    onChange,
}: {
    value: Language;
    onChange: (value: Language) => void;
}) {
    const { t } = useTranslation();

    const languages: Record<Language, string> = {
        en: t("language.english"),
        sk: t("language.slovak"),
    };

    return (
        <Select
            value={value}
            onChange={(e) => onChange(e.target.value as Language)}
            input={<OutlinedInput />}
            size="small"
            sx={{ maxWidth: 220 }}
            fullWidth
        >
            {Object.entries(languages).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                    {label}
                </MenuItem>
            ))}
        </Select>
    );
}
