import React, { memo, useMemo } from 'react';
import { Box, CircularProgress, Typography, Checkbox, Button } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { TCustomerRow } from '../../evolu/evolu-query';
import { Customer } from '../../types/customer';
import { CustomerActions } from './CustomerActions';
import { useQuery } from '@evolu/react';
import { customFields, customFieldValues } from '../../evolu/evolu-query';
import type { TCustomFieldRow, TCustomFieldValueRow } from '../../evolu/evolu-query';
import { getTranslatedFieldName } from '../../utils/customFieldTranslations';
import type { Language } from '../../types/common';
import * as Evolu from '@evolu/common';

interface CustomerTableProps {
    customers: TCustomerRow[];
    isLoading: boolean;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
    onLedger: (customer: Customer) => void;
    onAdd?: () => void;
}

export const CustomerTable = memo(({ customers, isLoading, onEdit, onDelete, onLedger, onAdd }: CustomerTableProps) => {
    const { t, i18n } = useTranslation();
    const currentLanguage = (i18n.language?.split('-')[0] || 'en') as Language;

    // Query custom fields and values
    const allCustomFields = useQuery(customFields) as TCustomFieldRow[];
    const allCustomFieldValues = useQuery(customFieldValues) as TCustomFieldValueRow[];

    // Filter to Customer fields (all fields, regardless of showInTable flag)
    const customerCustomFields = useMemo(() => {
        return allCustomFields.filter(
            (field) =>
                field.appliesTo === 'Customer' &&
                field.isDeleted !== Evolu.sqliteTrue
        );
    }, [allCustomFields]);

    // Create a map of customer ID to custom field values for efficient lookup
    const customerFieldValuesMap = useMemo(() => {
        const map = new Map<string, Map<string, string | null>>();
        allCustomFieldValues.forEach((value) => {
            if (value.customerId && value.isDeleted !== Evolu.sqliteTrue) {
                let customerMap = map.get(value.customerId);
                if (!customerMap) {
                    customerMap = new Map();
                    map.set(value.customerId, customerMap);
                }
                customerMap.set(value.customFieldId, value.value);
            }
        });
        return map;
    }, [allCustomFieldValues]);

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

    // Format custom field value for display based on field type
    const formatCustomFieldValue = (field: TCustomFieldRow, value: string | null | undefined): string => {
        if (value === null || value === undefined || value === '') {
            return '-';
        }

        switch (field.fieldType) {
            case 'Date':
                try {
                    return dayjs(value).format('YYYY-MM-DD');
                } catch {
                    return value;
                }
            case 'Yes/No':
                return value === 'true' || value === true
                    ? (t('customer.table.yes') || 'Yes')
                    : (t('customer.table.no') || 'No');
            case 'Number':
                return value;
            case 'Dropdown':
            case 'Text':
            default:
                return value;
        }
    };

    // Base columns (standard customer fields)
    const baseColumns: GridColDef[] = [
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
            width: 160,
            renderCell: (params) => {
                const customer = mapRowToCustomer(params.row);
                return (
                    <CustomerActions
                        customer={customer}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onLedger={onLedger}
                    />
                );
            },
            sortable: false,
            filterable: false,
        },
    ];

    // Dynamic columns for custom fields that should be shown in table
    const customFieldColumns: GridColDef[] = useMemo(() => {
        return customerCustomFields.map((field) => ({
            field: `customField_${field.id}`,
            headerName: getTranslatedFieldName(field.fieldName, field.fieldNameTranslations, currentLanguage),
            width: 150,
            renderCell: (params) => {
                const customerId = params.row.id;
                const valuesMap = customerFieldValuesMap.get(customerId);
                const value = valuesMap?.get(field.id);
                return formatCustomFieldValue(field, value);
            },
            sortable: true,
            filterable: true,
        }));
    }, [customerCustomFields, customerFieldValuesMap]);

    // Build column visibility model based on showInTable flag
    const columnVisibilityModel = useMemo(() => {
        const model: Record<string, boolean> = {};

        customerCustomFields.forEach((field) => {
            const columnField = `customField_${field.id}`;
            // Hide columns where showInTable is not true
            model[columnField] = field.showInTable === Evolu.sqliteTrue;
        });

        return model;
    }, [customerCustomFields]);

    // Combine base columns with custom field columns
    const columns: GridColDef[] = useMemo(() => {
        return [...baseColumns, ...customFieldColumns];
    }, [baseColumns, customFieldColumns]);

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
                    columns: {
                        columnVisibilityModel: columnVisibilityModel,
                    },
                }}
                disableRowSelectionOnClick
                autoHeight
            />
        </Box>
    );
});

CustomerTable.displayName = 'CustomerTable';
