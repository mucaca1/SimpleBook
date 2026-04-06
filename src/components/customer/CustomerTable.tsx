import React, { memo } from 'react';
import { Box, CircularProgress, Typography, Checkbox, Button } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { TCustomerRow } from '../../evolu/evolu-query';
import { Customer } from '../../types/customer';
import { CustomerActions } from './CustomerActions';

interface CustomerTableProps {
    customers: TCustomerRow[];
    isLoading: boolean;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
    onAdd?: () => void;
}

export const CustomerTable = memo(({ customers, isLoading, onEdit, onDelete, onAdd }: CustomerTableProps) => {
    const { t } = useTranslation();

    // Convert TCustomerRow to Customer for actions
    const mapRowToCustomer = (row: TCustomerRow): Customer => ({
        id: row.id,
        firstName: row.firstName || undefined,
        lastName: row.lastName || undefined,
        degree: row.degree || undefined,
        birthDate: row.birthDate ? new Date(row.birthDate) : undefined,
        isAdult: row.isAdult,
        sex: row.sex as Customer['sex'] || undefined,
        customerId: row.customerId || undefined,
    });

    const columns: GridColDef[] = [
        {
            field: 'firstName',
            headerName: t('customer.table.firstName'),
            width: 130
        },
        {
            field: 'lastName',
            headerName: t('customer.table.lastName'),
            width: 130
        },
        {
            field: 'degree',
            headerName: t('customer.table.degree'),
            width: 100
        },
        {
            field: 'birthDate',
            headerName: t('customer.table.birthDate'),
            width: 130,
            valueFormatter: (params) => {
                if (!params) return '';
                // birthDate from Evolu is a string (DateIso format)
                const date = new Date(params as string);
                return dayjs(date).format('YYYY-MM-DD');
            },
        },
        {
            field: 'isAdult',
            headerName: t('customer.table.isAdult'),
            width: 80,
            renderCell: (params) => {
                if (params.value === undefined || params.value === null) {
                    return null;
                }
                return <Checkbox checked={params.value} size="small" disabled />;
            },
            sortable: false,
            filterable: false,
        },
        {
            field: 'sex',
            headerName: t('customer.table.sex'),
            width: 100
        },
        {
            field: 'customerId',
            headerName: t('customer.table.id'),
            width: 150
        },
        {
            field: 'actions',
            headerName: t('customer.table.actions'),
            width: 120,
            renderCell: (params) => {
                const customer = mapRowToCustomer(params.row);
                return (
                    <CustomerActions
                        customer={customer}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                );
            },
            sortable: false,
            filterable: false,
        },
    ];

    // Loading state
    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 400,
                    gap: 2,
                }}
            >
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                    {t('customer.table.loading')}
                </Typography>
            </Box>
        );
    }

    // Empty state
    if (customers.length === 0) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 400,
                    gap: 3,
                }}
            >
                <Typography variant="body1" color="text.secondary">
                    {t('customer.table.empty')}
                </Typography>
                {onAdd && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={onAdd}
                        size="large"
                    >
                        {t('customer.actions.add')}
                    </Button>
                )}
            </Box>
        );
    }

    // DataGrid with customers
    return (
        <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
                rows={customers}
                columns={columns}
                getRowId={(row) => row.id}
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                    pagination: {
                        paginationModel: { pageSize: 10 },
                    },
                }}
                disableRowSelectionOnClick
                autoHeight
            />
        </Box>
    );
});

CustomerTable.displayName = 'CustomerTable';
