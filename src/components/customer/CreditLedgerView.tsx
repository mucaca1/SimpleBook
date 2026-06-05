import React, { useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    CircularProgress,
    Paper,
    Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { ArrowBack as BackIcon, Add as AddIcon, Delete as DeleteIcon, ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQueries } from '@evolu/react';
import dayjs from 'dayjs';
import { Customer } from '../../types/customer';
import { CreditTransactionFormData } from '../../types/creditTransaction';
import { CustomerId, CreditTransactionId } from '../../evolu/evolu-db';
import { getCreditTransactionsForCustomer, employees, services, preOrderPrices } from '../../evolu/evolu-query';
import type { TCreditTransactionRow, TEmployeeRow, TServiceRow, TPreOrderPriceRow } from '../../evolu/evolu-query';
import { AddCreditForm } from './AddCreditForm';
import { AddPreOrderForm } from './AddPreOrderForm';
import { DeleteConfirmDialog } from '../ui/DeleteConfirmDialog';
import { getCurrencySymbol } from '../../types/price';

interface CreditLedgerViewProps {
    customer: Customer;
    currencySymbol: string;
    onBack: () => void;
    onAddCredit: (data: CreditTransactionFormData) => Promise<CreditTransactionId>;
    onDeleteTransaction: (id: CreditTransactionId) => Promise<void>;
}

export function CreditLedgerView({
    customer,
    currencySymbol,
    onBack,
    onAddCredit,
    onDeleteTransaction,
}: CreditLedgerViewProps) {
    const { t } = useTranslation();
    const [formMode, setFormMode] = useState<'none' | 'credit' | 'preorder'>('none');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<TCreditTransactionRow | null>(null);

    // Memoize parameterized query to avoid re-creating on every render
    const customerTxQuery = useMemo(
        () => getCreditTransactionsForCustomer(customer.id),
        [customer.id]
    );

    // Batch all queries into a single useQueries call (one suspension)
    const [transactions, allEmployees, allServices, allPreOrderPrices] = useQueries([
        customerTxQuery,
        employees,
        services,
        preOrderPrices,
    ]) as [TCreditTransactionRow[], TEmployeeRow[], TServiceRow[], TPreOrderPriceRow[]];

    const employeeMap = useMemo(() => {
        const map = new Map<string, TEmployeeRow>();
        allEmployees.forEach((emp) => map.set(emp.id, emp));
        return map;
    }, [allEmployees]);

    const serviceMap = useMemo(() => {
        const map = new Map<string, TServiceRow>();
        allServices.forEach((s) => map.set(s.id, s));
        return map;
    }, [allServices]);

    const priceMap = useMemo(() => {
        const map = new Map<string, TPreOrderPriceRow>();
        allPreOrderPrices.forEach((p) => map.set(p.id, p));
        return map;
    }, [allPreOrderPrices]);

    const balance = useMemo(() => {
        if (!transactions) return 0;
        return transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    }, [transactions]);

    const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || t('customer.title');

    const handleAddCredit = async (data: CreditTransactionFormData) => {
        setIsSubmitting(true);
        try {
            await onAddCredit(data);
            setFormMode('none');
        } catch {
            // Error handled in hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddPreOrder = async (data: CreditTransactionFormData) => {
        setIsSubmitting(true);
        try {
            await onAddCredit(data);
            setFormMode('none');
        } catch {
            // Error handled in hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (transaction: TCreditTransactionRow) => {
        setTransactionToDelete(transaction);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (transactionToDelete) {
            try {
                await onDeleteTransaction(transactionToDelete.id);
            } catch {
                // Error handled in hook
            } finally {
                setDeleteConfirmOpen(false);
                setTransactionToDelete(null);
            }
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'date',
            headerName: t('creditLedger.table.date'),
            width: 130,
            valueFormatter: (params) => {
                if (!params) return '';
                return dayjs(params as string).format('YYYY-MM-DD');
            },
        },
        {
            field: 'amount',
            headerName: t('creditLedger.table.amount'),
            width: 150,
            renderCell: (params) => {
                const value = Number(params.value);
                if (params.value == null || isNaN(value)) return '—';
                const isNegative = value < 0;
                return (
                    <Typography
                        variant="body2"
                        sx={{ color: isNegative ? 'error.main' : 'success.main', fontWeight: 500 }}
                    >
                        {isNegative ? '' : '+'}{currencySymbol} {value.toFixed(2)}
                    </Typography>
                );
            },
        },
        {
            field: 'preOrderInfo',
            headerName: t('creditLedger.table.preOrderInfo'),
            width: 220,
            renderCell: (params) => {
                const row = params.row as TCreditTransactionRow;
                const transactionType = row.transactionType as string | null;

                // Consumption transaction
                if (transactionType === 'consumption') {
                    const service = row.serviceId ? serviceMap.get(row.serviceId as string) : null;
                    const quantity = Number(row.quantity) || 1;
                    const serviceName = service ? String(service.name) : '—';
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', lineHeight: 1.2 }}>
                            <Box>
                                <Typography variant="body2" color="error.main">Session consumed</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {serviceName} ({quantity}x)
                                </Typography>
                            </Box>
                        </Box>
                    );
                }

                // Pre-order or regular credit
                if (!row.serviceId) return '—';
                const service = serviceMap.get(row.serviceId as string);
                const price = priceMap.get(row.priceId as string);
                const quantity = Number(row.quantity) || 1;
                const serviceName = String(service?.name || '—');
                const priceValue = price?.price != null ? String(price.price) : '—';
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', lineHeight: 1.2 }}>
                        <Box>
                            <Typography variant="body2">{serviceName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {quantity}x {currencySymbol}{priceValue}
                            </Typography>
                        </Box>
                    </Box>
                );
            },
            sortable: false,
            filterable: false,
        },
        {
            field: 'employeeId',
            headerName: t('creditLedger.table.employee'),
            width: 180,
            valueFormatter: (params) => {
                if (!params) return '—';
                const emp = employeeMap.get(params as string);
                if (!emp) return '—';
                return `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || '—';
            },
        },
        {
            field: 'note',
            headerName: t('creditLedger.table.note'),
            width: 250,
            valueFormatter: (params) => params || '—',
        },
        {
            field: 'actions',
            headerName: t('creditLedger.table.actions'),
            width: 80,
            renderCell: (params) => (
                <Tooltip title={t('creditLedger.actions.delete')}>
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(params.row)}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            ),
            sortable: false,
            filterable: false,
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button
                    startIcon={<BackIcon />}
                    onClick={onBack}
                >
                    {t('creditLedger.backToCustomers')}
                </Button>
            </Box>

            <Typography variant="h4" component="h1" gutterBottom>
                {t('creditLedger.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {t('creditLedger.description', { customerName })}
            </Typography>

            <Paper sx={{ p: 2, mb: 3, display: 'inline-block' }}>
                <Typography variant="body2" color="text.secondary">
                    {t('creditLedger.balance')}
                </Typography>
                <Typography variant="h4" color="primary">
                    {currencySymbol} {balance.toFixed(2)}
                </Typography>
            </Paper>

            <Box sx={{ mb: 3 }}>
                {formMode === 'none' ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => setFormMode('credit')}
                        >
                            {t('creditLedger.addCredit')}
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<ShoppingCartIcon />}
                            onClick={() => setFormMode('preorder')}
                        >
                            {t('creditLedger.addPreOrder')}
                        </Button>
                    </Box>
                ) : formMode === 'credit' ? (
                    <Paper sx={{ p: 3, mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {t('creditLedger.addCredit')}
                        </Typography>
                        <AddCreditForm
                            customerId={customer.id}
                            employees={allEmployees}
                            currencySymbol={currencySymbol}
                            onSubmit={handleAddCredit}
                            onCancel={() => setFormMode('none')}
                            isSubmitting={isSubmitting}
                        />
                    </Paper>
                ) : (
                    <Paper sx={{ p: 3, mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {t('creditLedger.addPreOrder')}
                        </Typography>
                        <AddPreOrderForm
                            customerId={customer.id}
                            employees={allEmployees}
                            currencySymbol={currencySymbol}
                            services={allServices}
                            preOrderPrices={allPreOrderPrices}
                            onSubmit={handleAddPreOrder}
                            onCancel={() => setFormMode('none')}
                            isSubmitting={isSubmitting}
                        />
                    </Paper>
                )}
            </Box>

            {!transactions ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : transactions.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    {t('creditLedger.noTransactions')}
                </Typography>
            ) : (
                <Box sx={{ height: 400, width: '100%' }}>
                    <DataGrid
                        rows={transactions}
                        columns={columns}
                        getRowId={(row) => row.id}
                        pageSizeOptions={[5, 10, 25]}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 10 } },
                        }}
                        disableRowSelectionOnClick
                        autoHeight
                    />
                </Box>
            )}

            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                itemName={`${currencySymbol} ${transactionToDelete?.amount?.toFixed(2) || ''}`}
                itemType={t('creditLedger.title')}
                onConfirm={handleDeleteConfirm}
                onClose={() => {
                    setDeleteConfirmOpen(false);
                    setTransactionToDelete(null);
                }}
                isDeleting={false}
            />
        </Box>
    );
}
