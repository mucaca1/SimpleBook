import { MenuItem, OutlinedInput, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CURRENCIES } from "../../types/price";

export function CurrencySelector({
    value,
    onChange,
}: {
    value: string;
    onChange: (currency: string) => void;
}) {
    const { t } = useTranslation();

    return (
        <Select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            input={<OutlinedInput />}
            size="small"
            sx={{ maxWidth: 220 }}
            fullWidth
        >
            {CURRENCIES.map((currency) => (
                <MenuItem key={currency.value} value={currency.value}>
                    {currency.label}
                </MenuItem>
            ))}
        </Select>
    );
}
