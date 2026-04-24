import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

export interface DeleteConfirmDialogProps {
    open: boolean;
    itemName: string;
    itemType: string;
    onConfirm: () => void;
    onClose: () => void;
    isDeleting?: boolean;
    affectedCount?: number;
    customMessage?: string;
}

export function DeleteConfirmDialog({
    open,
    itemName,
    itemType,
    onConfirm,
    onClose,
    isDeleting = false,
    affectedCount,
    customMessage,
}: DeleteConfirmDialogProps) {
    const { t } = useTranslation();

    const renderMessage = () => {
        if (customMessage) {
            return customMessage;
        }

        let message = t('customer.deleteConfirm.message', { itemName });
        if (affectedCount !== undefined && affectedCount > 0) {
            message += " ";
            message += t('customer.deleteConfirm.affectedCount', { count: affectedCount }) ||
                `This will also delete ${affectedCount} associated ${affectedCount === 1 ? 'value' : 'values'}.`;
        }
        return message;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            closeOnEscapeKeyDown={!isDeleting}
            closeOnBackdropClick={!isDeleting}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle>
                {t('customer.deleteConfirm.title', { itemType })}
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1">
                    {renderMessage()}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary" disabled={isDeleting}>
                    {t('customer.deleteConfirm.cancel')}
                </Button>
                <Button onClick={onConfirm} color="error" variant="contained" disabled={isDeleting}>
                    {t('customer.deleteConfirm.confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
