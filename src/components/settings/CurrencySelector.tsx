import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CURRENCIES } from "../../types/price";

interface CurrencySelectorProps {
    value: string;
    onChange: (currency: string) => void;
}

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
    const { t } = useTranslation();

    return (
        <FormControl fullWidth size="small">
            <InputLabel>{t("settings.general.currency")}</InputLabel>
            <Select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                label={t("settings.general.currency")}
            >
                {CURRENCIES.map((currency) => (
                    <MenuItem key={currency.value} value={currency.value}>
                        {currency.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
