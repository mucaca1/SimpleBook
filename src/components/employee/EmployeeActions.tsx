import React from 'react';
import { IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Employee } from '../../types/employee';

interface EmployeeActionsProps {
    employee: Employee;
    onEdit: (employee: Employee) => void;
    onDelete: (employee: Employee) => void;
}

export function EmployeeActions({ employee, onEdit, onDelete }: EmployeeActionsProps) {
    const { t } = useTranslation();

    return (
        <>
            <IconButton
                aria-label={t('employee.actions.edit')}
                onClick={() => onEdit(employee)}
                size="small"
                color="primary"
            >
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
                aria-label={t('employee.actions.delete')}
                onClick={() => onDelete(employee)}
                size="small"
                color="error"
            >
                <DeleteIcon fontSize="small" />
            </IconButton>
        </>
    );
}
