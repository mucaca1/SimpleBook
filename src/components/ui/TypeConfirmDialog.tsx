import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Box, Typography } from "@mui/material";
import React, { useState } from "react";
import { Warning as WarningIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

export interface TypeConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message?: string;
    confirmText: string;
    expectedText: string;
    isConfirming?: boolean;
}

export function TypeConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    expectedText,
    isConfirming = false,
}: TypeConfirmDialogProps) {
    const { t } = useTranslation();
    const [inputText, setInputText] = useState("");
    const isConfirmEnabled = inputText === expectedText;

    const handleClose = () => {
        setInputText("");
        onClose();
    };

    const handleConfirm = () => {
        if (isConfirmEnabled) {
            setInputText("");
            onConfirm();
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(event.target.value);
    };

    return (
        <Dialog
            open={open}
            onClose={isConfirming ? undefined : handleClose}
            closeOnEscapeKeyDown={!isConfirming}
            closeOnBackdropClick={!isConfirming}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <WarningIcon color="error" />
                    <Typography variant="h6" component="span">
                        {title}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                {message && (
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        {message}
                    </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Type <strong>"{expectedText}"</strong> to confirm:
                </Typography>
                <TextField
                    autoFocus
                    fullWidth
                    value={inputText}
                    onChange={handleInputChange}
                    disabled={isConfirming}
                    placeholder={expectedText}
                    variant="outlined"
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            "&.Mui-focused fieldset": {
                                borderColor: isConfirmEnabled ? "error.main" : "warning.main",
                            },
                        },
                    }}
                    error={inputText !== "" && !isConfirmEnabled}
                />
                {!isConfirmEnabled && inputText !== "" && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                        Text does not match. Please type exactly "{expectedText}"
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="secondary" disabled={isConfirming}>
                    {t('customer.deleteConfirm.cancel') || "Cancel"}
                </Button>
                <Button
                    onClick={handleConfirm}
                    color="error"
                    variant="contained"
                    disabled={!isConfirmEnabled || isConfirming}
                >
                    {isConfirming ? (t('customer.deleteConfirm.deleting') || "Confirming...") : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
