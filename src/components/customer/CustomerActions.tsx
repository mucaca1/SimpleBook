import React from 'react';
import { IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Customer } from '../../types/customer';

interface CustomerActionsProps {
    customer: Customer;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
}

export function CustomerActions({ customer, onEdit, onDelete }: CustomerActionsProps) {
    const { t } = useTranslation();

    const handleEdit = () => {
        onEdit(customer);
    };

    const handleDelete = () => {
        onDelete(customer);
    };

    return (
        <>
            <IconButton
                aria-label={t('customer.actions.edit')}
                onClick={handleEdit}
                size="small"
                color="primary"
            >
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
                aria-label={t('customer.actions.delete')}
                onClick={handleDelete}
                size="small"
                color="error"
            >
                <DeleteIcon fontSize="small" />
            </IconButton>
        </>
    );
}
