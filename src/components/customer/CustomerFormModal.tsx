import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Customer, CustomerFormData } from '../../types/customer';
import { CustomerForm } from './CustomerForm';

interface CustomerFormModalProps {
    open: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    customer?: Customer;
    onSubmit: (data: CustomerFormData) => Promise<void>;
    isSubmitting: boolean;
}

export function CustomerFormModal({
    open,
    onClose,
    mode,
    customer,
    onSubmit,
    isSubmitting,
}: CustomerFormModalProps) {
    const { t } = useTranslation();

    // Convert Customer to CustomerFormData for editing
    const initialData: CustomerFormData | undefined = customer
        ? {
              firstName: customer.firstName,
              lastName: customer.lastName,
              degree: customer.degree,
              birthDate: customer.birthDate,
              isAdult: customer.isAdult,
              sex: customer.sex,
              customerId: customer.customerId,
          }
        : undefined;

    const title = mode === 'add' ? t('customer.form.addCustomer') : t('customer.form.updateCustomer');

    return (
        <Dialog
            open={open}
            onClose={onClose}
            closeOnBackdropClick
            closeOnEscapeKeyDown={!isSubmitting}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { maxHeight: '90vh' },
            }}
        >
            <DialogTitle>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Typography variant="h6" component="span">
                        {title}
                    </Typography>
                    <IconButton
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent dividers>
                <CustomerForm
                    mode={mode}
                    initialData={initialData}
                    onSubmit={onSubmit}
                    onCancel={onClose}
                    isSubmitting={isSubmitting}
                />
            </DialogContent>
        </Dialog>
    );
}
