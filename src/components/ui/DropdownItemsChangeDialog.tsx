import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Alert, Box, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

export interface DropdownItemsChangeDialogProps {
    open: boolean;
    fieldName: string;
    onConfirm: (keepValues: boolean) => void;
    onClose: () => void;
}

/**
 * Dialog for handling dropdown items modifications
 *
 * Asks the user what should happen to existing customer records
 * that use the modified/removed dropdown values.
 */
export function DropdownItemsChangeDialog({
    open,
    fieldName,
    onConfirm,
    onClose,
}: DropdownItemsChangeDialogProps) {
    const { t } = useTranslation();

    const handleKeepValues = () => {
        onConfirm(true); // true = keep old values
    };

    const handleClearValues = () => {
        onConfirm(false); // false = clear affected values
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            closeOnEscapeKeyDown
            closeOnBackdropClick
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                {t("settings.customFields.dropdownItemsChange.title") || "Dropdown Options Changed"}
            </DialogTitle>
            <DialogContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                    {t("settings.customFields.dropdownItemsChange.info") ||
                        "You have modified the dropdown options for this field."}
                </Alert>
                <Typography variant="body1" gutterBottom>
                    {t("settings.customFields.dropdownItemsChange.message", {
                        fieldName,
                    }) ||
                        `Some customers may have values that are no longer in the dropdown list for "${fieldName}".`}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {t("settings.customFields.dropdownItemsChange.question") ||
                        "What should happen to existing customer records using the modified/removed options?"}
                </Typography>
                <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Option 1:</strong>{" "}
                        {t("settings.customFields.dropdownItemsChange.keepValues") ||
                            "Keep old values - Customers will retain their existing values even if they're no longer in the dropdown"}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Option 2:</strong>{" "}
                        {t("settings.customFields.dropdownItemsChange.clearValues") ||
                            "Clear affected values - Remove values from customers that used the modified/removed options"}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ flexDirection: "column", gap: 1, alignItems: "stretch" }}>
                <Button
                    onClick={handleKeepValues}
                    variant="outlined"
                    fullWidth
                    sx={{ justifyContent: "flex-start" }}
                >
                    <Box sx={{ textAlign: "left" }}>
                        <Typography variant="body2" fontWeight="bold">
                            {t("settings.customFields.dropdownItemsChange.keepButton") || "Keep Old Values"}
                        </Typography>
                        <Typography variant="caption">
                            {t("settings.customFields.dropdownItemsChange.keepButtonDesc") ||
                                "Preserve existing customer data"}
                        </Typography>
                    </Box>
                </Button>
                <Button
                    onClick={handleClearValues}
                    variant="outlined"
                    color="warning"
                    fullWidth
                    sx={{ justifyContent: "flex-start" }}
                >
                    <Box sx={{ textAlign: "left" }}>
                        <Typography variant="body2" fontWeight="bold">
                            {t("settings.customFields.dropdownItemsChange.clearButton") || "Clear Affected Values"}
                        </Typography>
                        <Typography variant="caption">
                            {t("settings.customFields.dropdownItemsChange.clearButtonDesc") ||
                                "Remove values that are no longer in the dropdown"}
                        </Typography>
                    </Box>
                </Button>
                <Button onClick={onClose} color="secondary">
                    {t("settings.customFields.dropdownItemsChange.cancel") || "Cancel"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
