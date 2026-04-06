import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

export interface DeleteConfirmDialogProps {
    open: boolean;
    itemName: string;
    itemType: string;
    onConfirm: () => void;
    onClose: () => void;
    isDeleting?: boolean;
}

export function DeleteConfirmDialog({
    open,
    itemName,
    itemType,
    onConfirm,
    onClose,
    isDeleting = false,
}: DeleteConfirmDialogProps) {
    const { t } = useTranslation();

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
                {t('customer.deleteConfirm.message', { itemName })}
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
