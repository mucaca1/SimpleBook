import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, AccountBalanceWallet as WalletIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Customer } from '../../types/customer';

interface CustomerActionsProps {
    customer: Customer;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
    onLedger: (customer: Customer) => void;
}

export function CustomerActions({ customer, onEdit, onDelete, onLedger }: CustomerActionsProps) {
    const { t } = useTranslation();

    return (
        <>
            <Tooltip title={t('creditLedger.actions.viewLedger')}>
                <IconButton
                    aria-label={t('creditLedger.actions.viewLedger')}
                    onClick={() => onLedger(customer)}
                    size="small"
                    color="success"
                >
                    <WalletIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <IconButton
                aria-label={t('customer.actions.edit')}
                onClick={() => onEdit(customer)}
                size="small"
                color="primary"
            >
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
                aria-label={t('customer.actions.delete')}
                onClick={() => onDelete(customer)}
                size="small"
                color="error"
            >
                <DeleteIcon fontSize="small" />
            </IconButton>
        </>
    );
}
