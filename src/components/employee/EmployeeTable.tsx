import React, { memo, useMemo } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { TEmployeeRow } from '../../evolu/evolu-query';
import { Employee } from '../../types/employee';
import { EmployeeActions } from './EmployeeActions';
import { useQuery } from '@evolu/react';
import { customFields, customFieldValues } from '../../evolu/evolu-query';
import type { TCustomFieldRow, TCustomFieldValueRow } from '../../evolu/evolu-query';
import { getTranslatedFieldName } from '../../utils/customFieldTranslations';
import type { Language } from '../../types/common';
import * as Evolu from '@evolu/common';

interface EmployeeTableProps {
    employees: TEmployeeRow[];
    isLoading: boolean;
    onEdit: (employee: Employee) => void;
    onDelete: (employee: Employee) => void;
    onAdd?: () => void;
}

export const EmployeeTable = memo(({ employees, isLoading, onEdit, onDelete, onAdd }: EmployeeTableProps) => {
    const { t, i18n } = useTranslation();
    const currentLanguage = (i18n.language?.split('-')[0] || 'en') as Language;

    const allCustomFields = useQuery(customFields) as TCustomFieldRow[];
    const allCustomFieldValues = useQuery(customFieldValues) as TCustomFieldValueRow[];

    const employeeCustomFields = useMemo(() => {
        return allCustomFields.filter(
            (field) =>
                field.appliesTo === 'Employee' &&
                field.isDeleted !== Evolu.sqliteTrue
        );
    }, [allCustomFields]);

    const employeeFieldValuesMap = useMemo(() => {
        const map = new Map<string, Map<string, string | null>>();
        allCustomFieldValues.forEach((value) => {
            if (value.employeeId && value.isDeleted !== Evolu.sqliteTrue) {
                let employeeMap = map.get(value.employeeId);
                if (!employeeMap) {
                    employeeMap = new Map();
                    map.set(value.employeeId, employeeMap);
                }
                employeeMap.set(value.customFieldId, value.value);
            }
        });
        return map;
    }, [allCustomFieldValues]);

    const mapRowToEmployee = (row: TEmployeeRow): Employee => ({
        id: row.id,
        firstName: row.firstName || undefined,
        lastName: row.lastName || undefined,
        phone: row.phone || undefined,
        email: row.email || undefined,
    });

    const formatCustomFieldValue = (field: TCustomFieldRow, value: string | null | undefined): string => {
        if (value === null || value === undefined || value === '') {
            return '-';
        }

        switch (field.fieldType) {
            case 'Yes/No':
                return value === 'true' || value === true
                    ? (t('employee.table.yes') || 'Yes')
                    : (t('employee.table.no') || 'No');
            default:
                return value;
        }
    };

    const baseColumns: GridColDef[] = [
        {
            field: 'firstName',
            headerName: t('employee.table.firstName'),
            width: 150
        },
        {
            field: 'lastName',
            headerName: t('employee.table.lastName'),
            width: 150
        },
        {
            field: 'phone',
            headerName: t('employee.table.phone'),
            width: 160
        },
        {
            field: 'email',
            headerName: t('employee.table.email'),
            width: 220
        },
        {
            field: 'actions',
            headerName: t('employee.table.actions'),
            width: 120,
            renderCell: (params) => {
                const employee = mapRowToEmployee(params.row);
                return (
                    <EmployeeActions
                        employee={employee}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                );
            },
            sortable: false,
            filterable: false,
        },
    ];

    const customFieldColumns: GridColDef[] = useMemo(() => {
        return employeeCustomFields.map((field) => ({
            field: `customField_${field.id}`,
            headerName: getTranslatedFieldName(field.fieldName, field.fieldNameTranslations, currentLanguage),
            width: 150,
            renderCell: (params) => {
                const employeeId = params.row.id;
                const valuesMap = employeeFieldValuesMap.get(employeeId);
                const value = valuesMap?.get(field.id);
                return formatCustomFieldValue(field, value);
            },
            sortable: true,
            filterable: true,
        }));
    }, [employeeCustomFields, employeeFieldValuesMap]);

    const columnVisibilityModel = useMemo(() => {
        const model: Record<string, boolean> = {};
        employeeCustomFields.forEach((field) => {
            const columnField = `customField_${field.id}`;
            model[columnField] = field.showInTable === Evolu.sqliteTrue;
        });
        return model;
    }, [employeeCustomFields]);

    const columns: GridColDef[] = useMemo(() => {
        return [...baseColumns, ...customFieldColumns];
    }, [baseColumns, customFieldColumns]);

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
                    {t('employee.table.loading')}
                </Typography>
            </Box>
        );
    }

    if (employees.length === 0) {
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
                    {t('employee.table.empty')}
                </Typography>
                {onAdd && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={onAdd}
                        size="large"
                    >
                        {t('employee.actions.add')}
                    </Button>
                )}
            </Box>
        );
    }

    return (
        <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
                rows={employees}
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

EmployeeTable.displayName = 'EmployeeTable';
