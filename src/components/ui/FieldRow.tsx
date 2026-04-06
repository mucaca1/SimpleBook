import { Box, Typography } from "@mui/material";
import React from "react";

type SettingRowProps = {
    label: string;
    children: React.ReactNode;
};

export function SettingRow({ label, children }: SettingRowProps) {
    return (
        <Box
        >
            <Typography variant="body1">{label}</Typography>
            {children}
        </Box>
    );
}
