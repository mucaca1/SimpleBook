import React, { useState, useMemo } from "react";
import {
    Box, Typography, Button, Container, Card, CardContent, CardActions,
    IconButton, TextField, FormControl, InputLabel, Select, MenuItem,
    Grid, CircularProgress, Switch, FormControlLabel, Collapse, Chip,
    OutlinedInput, Checkbox, ListItemText,
} from "@mui/material";
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    AccessTime, AttachMoney, Event, ShoppingCart,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { usePriceCrud } from "../hooks/usePriceCrud";
import { useServiceCrud } from "../hooks/useServiceCrud";
import { useSettingsSync } from "../hooks/useSettingsSync";
import { PriceFormData, UNIT_TYPES, EXPIRATION_ACTIONS, getCurrencySymbol } from "../types/price";
import { DeleteConfirmDialog } from "../components/ui/DeleteConfirmDialog";
import type { TPriceRow } from "../evolu/evolu-query";
import { PriceId, ServiceId } from "../evolu/evolu-db";

const EMPTY_FORM: PriceFormData = {
    serviceId: "",
    price: "",
    unitType: "1h",
    actualInTime: false,
    validFrom: undefined,
    validTo: undefined,
    preOrderAllowed: false,
    expirationAction: "",
};

function PriceForm({
    mode,
    initialData,
    serviceOptions,
    currencySymbol,
    onSubmit,
    onCancel,
    isSubmitting,
}: {
    mode: "add" | "edit";
    initialData?: PriceFormData;
    serviceOptions: { id: string; name: string }[];
    currencySymbol: string;
    onSubmit: (data: PriceFormData) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}) {
    const { t } = useTranslation();
    const [form, setForm] = useState<PriceFormData>(initialData ?? EMPTY_FORM);

    const hasActualDates = !!(form.validFrom || form.validTo);
    const effectiveActualInTime = hasActualDates || form.actualInTime;

    const handleChange = (field: keyof PriceFormData, value: string | boolean) => {
        setForm((prev) => {
            const next = { ...prev, [field]: value };
            if (field === "preOrderAllowed" && !value) {
                next.expirationAction = "";
            }
            if (field === "actualInTime" && !value) {
                if (!next.validFrom && !next.validTo) {
                    // toggling off is fine
                }
            }
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.serviceId || !form.price) return;
        if (form.preOrderAllowed && !form.expirationAction) return;
        await onSubmit(form);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600 }}>
            <FormControl fullWidth sx={{ mb: 2 }} disabled={isSubmitting}>
                <InputLabel>{t("prices.form.service")}</InputLabel>
                <Select
                    value={form.serviceId}
                    onChange={(e) => handleChange("serviceId", e.target.value)}
                    input={<OutlinedInput label={t("prices.form.service")} />}
                    required
                >
                    {serviceOptions.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                            {s.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                fullWidth
                type="number"
                inputMode="decimal"
                label={t("prices.form.price")}
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                required
                inputProps={{ min: 0, step: "0.01" }}
                sx={{ mb: 2 }}
                disabled={isSubmitting}
                slotProps={{
                    input: {
                        startAdornment: (
                            <Typography variant="body2" sx={{ mr: 1, color: "text.secondary" }}>
                                {currencySymbol}
                            </Typography>
                        ),
                    },
                }}
            />

            <FormControl fullWidth sx={{ mb: 2 }} disabled={isSubmitting}>
                <InputLabel>{t("prices.form.unitType")}</InputLabel>
                <Select
                    value={form.unitType}
                    onChange={(e) => handleChange("unitType", e.target.value)}
                    input={<OutlinedInput label={t("prices.form.unitType")} />}
                >
                    {UNIT_TYPES.map((ut) => (
                        <MenuItem key={ut.value} value={ut.value}>
                            {t(`prices.unitTypes.${ut.value}`, ut.label)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControlLabel
                control={
                    <Switch
                        checked={effectiveActualInTime}
                        onChange={(e) => handleChange("actualInTime", e.target.checked && !hasActualDates)}
                        disabled={isSubmitting || hasActualDates}
                    />
                }
                label={t("prices.form.actualInTime")}
                sx={{ mb: 2, display: "block" }}
            />

            <Collapse in={effectiveActualInTime}>
                <Box sx={{ mb: 2, pl: 2, borderLeft: 2, borderColor: "divider" }}>
                    <TextField
                        fullWidth
                        type="date"
                        label={t("prices.form.validFrom")}
                        value={form.validFrom}
                        onChange={(e) => handleChange("validFrom", e.target.value)}
                        sx={{ mb: 2 }}
                        disabled={isSubmitting}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                        fullWidth
                        type="date"
                        label={t("prices.form.validTo")}
                        value={form.validTo}
                        onChange={(e) => handleChange("validTo", e.target.value)}
                        disabled={isSubmitting}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        {t("prices.form.dateHint")}
                    </Typography>
                </Box>
            </Collapse>

            <FormControlLabel
                control={
                    <Switch
                        checked={form.preOrderAllowed}
                        onChange={(e) => handleChange("preOrderAllowed", e.target.checked)}
                        disabled={isSubmitting}
                    />
                }
                label={t("prices.form.preOrderAllowed")}
                sx={{ mb: 2, display: "block" }}
            />

            <Collapse in={form.preOrderAllowed}>
                <FormControl fullWidth sx={{ mb: 2 }} disabled={isSubmitting} required>
                    <InputLabel>{t("prices.form.expirationAction")}</InputLabel>
                    <Select
                        value={form.expirationAction || ""}
                        onChange={(e) => handleChange("expirationAction", e.target.value)}
                        input={<OutlinedInput label={t("prices.form.expirationAction")} />}
                        required
                    >
                        {EXPIRATION_ACTIONS.map((ea) => (
                            <MenuItem key={ea.value} value={ea.value}>
                                {t(`prices.expirationActions.${ea.value}`, ea.label)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Collapse>

            <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting || !form.serviceId || !form.price}
                >
                    {isSubmitting
                        ? <CircularProgress size={24} />
                        : mode === "add" ? t("prices.form.addPrice") : t("prices.form.updatePrice")}
                </Button>
                <Button onClick={onCancel} disabled={isSubmitting}>
                    {t("common.cancel")}
                </Button>
            </Box>
        </Box>
    );
}

function PriceCard({
    price,
    serviceName,
    currencySymbol,
    onEdit,
    onDelete,
}: {
    price: TPriceRow;
    serviceName: string;
    currencySymbol: string;
    onEdit: (price: TPriceRow) => void;
    onDelete: (price: TPriceRow) => void;
}) {
    const { t } = useTranslation();
    const unitLabel = t(`prices.unitTypes.${price.unitType}`, price.unitType);

    const formatDate = (date: string | null) => {
        if (!date) return t("prices.infinity");
        return date;
    };

    return (
        <Card variant="outlined" sx={{ "&:hover": { boxShadow: 4 }, transition: "box-shadow 0.2s" }}>
            <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Typography variant="h6">
                        {serviceName}
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                    <Chip
                        icon={<AttachMoney sx={{ fontSize: 16 }} />}
                        label={`${currencySymbol}${price.price}`}
                        color="primary"
                        size="small"
                    />
                    <Chip
                        icon={<AccessTime sx={{ fontSize: 16 }} />}
                        label={unitLabel}
                        size="small"
                        variant="outlined"
                    />
                    {price.preOrderAllowed === 1 && (
                        <Chip
                            icon={<ShoppingCart sx={{ fontSize: 16 }} />}
                            label={t("prices.preorder")}
                            size="small"
                            color="success"
                            variant="outlined"
                        />
                    )}
                </Box>

                {price.actualInTime === 1 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                        <Event sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2" color="text.secondary">
                            {formatDate(price.validFrom)} — {formatDate(price.validTo)}
                        </Typography>
                    </Box>
                )}

                {price.preOrderAllowed === 1 && price.expirationAction && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {t("prices.form.expirationAction")}: {t(`prices.expirationActions.${price.expirationAction}`, price.expirationAction)}
                    </Typography>
                )}
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
                <IconButton size="small" onClick={() => onEdit(price)} color="primary">
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(price)} color="error">
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </CardActions>
        </Card>
    );
}

export function PricesPage() {
    const { t } = useTranslation();
    const { prices, isLoading, createPrice, updatePrice, deletePrice } = usePriceCrud();
    const { services } = useServiceCrud();
    const { currency } = useSettingsSync();
    const currencySymbol = getCurrencySymbol(currency || "EUR");

    const serviceMap = useMemo(() => {
        const map = new Map<ServiceId, string>();
        if (services) {
            services.forEach((s) => map.set(s.id as ServiceId, s.name));
        }
        return map;
    }, [services]);

    const serviceOptions = useMemo(() =>
        (services ?? []).map((s) => ({ id: s.id, name: s.name })),
        [services]
    );

    const [viewMode, setViewMode] = useState<"cards" | "add" | "edit">("cards");
    const [editingPrice, setEditingPrice] = useState<TPriceRow | null>(null);
    const [formKey, setFormKey] = useState(0);
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [priceToDelete, setPriceToDelete] = useState<TPriceRow | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const allServiceIds = useMemo(() => serviceOptions.map((s) => s.id), [serviceOptions]);

    useMemo(() => {
        setSelectedServiceIds(allServiceIds as string[]);
    }, [allServiceIds]);

    const filteredPrices = useMemo(() => {
        if (!prices) return undefined;
        if (selectedServiceIds.length === 0) return [];
        return prices.filter((p) => selectedServiceIds.includes(p.serviceId as string));
    }, [prices, selectedServiceIds]);

    const handleAddClick = () => {
        setViewMode("add");
        setEditingPrice(null);
        setFormKey((k) => k + 1);
    };

    const handleEdit = (price: TPriceRow) => {
        setViewMode("edit");
        setEditingPrice(price);
        setFormKey((k) => k + 1);
    };

    const handleCancel = () => {
        setViewMode("cards");
        setEditingPrice(null);
    };

    const handleSubmit = async (data: PriceFormData) => {
        setIsSubmitting(true);
        try {
            if (editingPrice) {
                await updatePrice(editingPrice.id as PriceId, data);
            } else {
                await createPrice(data);
            }
            handleCancel();
        } catch (error) {
            console.error("Failed to submit price:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (price: TPriceRow) => {
        setPriceToDelete(price);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (priceToDelete) {
            setIsDeleting(true);
            try {
                await deletePrice(priceToDelete.id as PriceId);
            } catch (error) {
                console.error("Failed to delete price:", error);
            } finally {
                setIsDeleting(false);
                setDeleteConfirmOpen(false);
                setPriceToDelete(null);
            }
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setPriceToDelete(null);
    };

    const initialData: PriceFormData | undefined = editingPrice
        ? {
            serviceId: editingPrice.serviceId as ServiceId ?? null,
            price: editingPrice.price ?? "",
            unitType: editingPrice.unitType ?? "1h",
            actualInTime: editingPrice.actualInTime ?? false,
            validFrom: editingPrice.validFrom ?? undefined,
            validTo: editingPrice.validTo ?? undefined,
            preOrderAllowed: editingPrice.preOrderAllowed ?? false,
            expirationAction: editingPrice.expirationAction ?? "",
        }
        : undefined;

    const formTitle = viewMode === "add"
        ? t("prices.form.addPrice")
        : t("prices.form.updatePrice");

    return (
        <Container maxWidth="lg">
            <Box sx={{ minHeight: "80vh", py: 4 }}>
                <Box sx={{ display: viewMode === "cards" ? "block" : "none" }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {t("prices.title")}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {t("prices.description")}
                    </Typography>
                    <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleAddClick}
                            size="large"
                            disabled={serviceOptions.length === 0}
                        >
                            {t("prices.add")}
                        </Button>
                        {serviceOptions.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                {t("prices.noServices")}
                            </Typography>
                        )}
                        <Box sx={{ flexGrow: 1 }} />
                        {prices && prices.length > 0 && serviceOptions.length > 1 && (
                            <FormControl sx={{ minWidth: 250 }}>
                                <InputLabel>{t("prices.filterByService")}</InputLabel>
                                <Select
                                    multiple
                                    value={selectedServiceIds}
                                    onChange={(e) => setSelectedServiceIds(e.target.value as string[])}
                                    input={<OutlinedInput label={t("prices.filterByService")} />}
                                    renderValue={(selected) =>
                                        (selected as string[])
                                            .map((id) => serviceOptions.find((s) => s.id === id)?.name ?? id)
                                            .join(", ")
                                    }
                                >
                                    {serviceOptions.map((s) => (
                                        <MenuItem key={s.id} value={s.id}>
                                            <Checkbox checked={selectedServiceIds.includes(s.id)} />
                                            <ListItemText primary={s.name} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                    {isLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : filteredPrices && filteredPrices.length > 0 ? (
                        <Grid container spacing={2}>
                            {filteredPrices.map((price) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={price.id}>
                                    <PriceCard
                                        price={price}
                                        serviceName={serviceMap.get(price.serviceId as ServiceId) ?? t("prices.unknownService")}
                                        currencySymbol={currencySymbol}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                            {t("prices.empty")}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: viewMode !== "cards" ? "block" : "none" }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {formTitle}
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                        <PriceForm
                            key={formKey}
                            mode={viewMode as "add" | "edit"}
                            initialData={initialData}
                            serviceOptions={serviceOptions}
                            currencySymbol={currencySymbol}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isSubmitting={isSubmitting}
                        />
                    </Box>
                </Box>
            </Box>

            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                itemName={`${serviceMap.get(priceToDelete?.id as ServiceId ?? "")} - ${currencySymbol}${priceToDelete?.price}`}
                itemType={t("prices.title")}
                onConfirm={handleDeleteConfirm}
                onClose={handleDeleteCancel}
                isDeleting={isDeleting}
            />
        </Container>
    );
}
