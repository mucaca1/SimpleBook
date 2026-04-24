import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Alert } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

export interface FieldTypeChangeDialogProps {
    open: boolean;
    fieldName: string;
    oldType: string;
    newType: string;
    onConfirm: () => void;
    onClose: () => void;
}

/**
 * Confirmation dialog for field type changes
 *
 * Warns the user that changing a field type will clear all existing values
 * for that custom field.
 */
export function FieldTypeChangeDialog({
    open,
    fieldName,
    oldType,
    newType,
    onConfirm,
    onClose,
}: FieldTypeChangeDialogProps) {
    const { t } = useTranslation();

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
                {t("settings.customFields.fieldTypeChange.title") || "Change Field Type?"}
            </DialogTitle>
            <DialogContent>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {t("settings.customFields.fieldTypeChange.warning") ||
                        "This action will clear all existing values for this field."}
                </Alert>
                <p>
                    {t("settings.customFields.fieldTypeChange.message", {
                        fieldName,
                        oldType,
                        newType,
                    }) ||
                        `You are changing the field type of "${fieldName}" from "${oldType}" to "${newType}".`}
                </p>
                <p>
                    <strong>
                        {t("settings.customFields.fieldTypeChange.confirmation") ||
                            "All existing values for this field will be cleared. This action cannot be undone."}
                    </strong>
                </p>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    {t("settings.customFields.fieldTypeChange.cancel") || "Cancel"}
                </Button>
                <Button onClick={onConfirm} color="error" variant="contained">
                    {t("settings.customFields.fieldTypeChange.confirm") || "Clear Values & Continue"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
