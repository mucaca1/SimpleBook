import React, { useState, useMemo } from "react";
import {
    Box, Typography, Button, Container, Card, CardContent, CardActions,
    IconButton, Chip, TextField, FormControl, InputLabel, Select, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions, Collapse, Grid,
    OutlinedInput, CircularProgress, Switch, FormControlLabel, Stack,
} from "@mui/material";
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, AccessTime,
    Palette, Check, AttachMoney, ShoppingCart,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useQuery } from "@evolu/react";
import { useServiceCrud } from "../hooks/useServiceCrud";
import { usePriceCrud } from "../hooks/usePriceCrud";
import { useSettingsSync } from "../hooks/useSettingsSync";
import { ServiceFormData } from "../types/service";
import { PriceFormData, UNIT_TYPES, EXPIRATION_ACTIONS, getCurrencySymbol } from "../types/price";
import { DeleteConfirmDialog } from "../components/ui/DeleteConfirmDialog";
import { ShowMore } from "../components/ui/ShowMore";
import { getPricesForService } from "../evolu/evolu-query";
import type { TServiceRow, TPriceRow } from "../evolu/evolu-query";
import { ServiceId, PriceId } from "../evolu/evolu-db";

const DEFAULT_COLORS = [
    "#1976d2", "#2e7d32", "#ed6c02", "#9c27b0",
    "#d32f2f", "#0097a7", "#c2185b", "#455a64",
    "#fbc02d", "#5d4037",
];

const DURATION_PRESETS = ["15", "30", "45", "60", "90", "120"];

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
    const [customColor, setCustomColor] = useState(value || "#1976d2");
    const [showCustom, setShowCustom] = useState(false);
    const { t } = useTranslation();

    const handlePresetClick = (color: string) => {
        setShowCustom(false);
        onChange(color);
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomColor(e.target.value);
        onChange(e.target.value);
    };

    return (
        <Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
                {DEFAULT_COLORS.map((color) => (
                    <Box
                        key={color}
                        onClick={() => handlePresetClick(color)}
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            bgcolor: color,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: value === color ? "3px solid" : "2px solid transparent",
                            borderColor: value === color ? "text.primary" : "transparent",
                            transition: "all 0.15s",
                            "&:hover": { transform: "scale(1.15)" },
                        }}
                    >
                        {value === color && <Check sx={{ fontSize: 18, color: "#fff" }} />}
                    </Box>
                ))}
                <Box
                    onClick={() => setShowCustom(!showCustom)}
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: "2px dashed",
                        borderColor: "divider",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        "&:hover": { borderColor: "text.secondary" },
                    }}
                >
                    <Palette sx={{ fontSize: 16, color: "text.secondary" }} />
                </Box>
            </Box>
            <Collapse in={showCustom}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                    <input
                        type="color"
                        value={customColor}
                        onChange={handleCustomChange}
                        style={{ width: 40, height: 40, border: "none", cursor: "pointer", padding: 0 }}
                    />
                    <TextField
                        size="small"
                        value={customColor}
                        onChange={handleCustomChange}
                        placeholder="#000000"
                        sx={{ width: 120 }}
                    />
                </Box>
            </Collapse>
        </Box>
    );
}

function ServiceForm({
    mode,
    initialData,
    onSubmit,
    onCancel,
    isSubmitting,
}: {
    mode: "add" | "edit";
    initialData?: ServiceFormData;
    onSubmit: (data: ServiceFormData) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}) {
    const { t } = useTranslation();
    const [name, setName] = useState(initialData?.name ?? "");
    const [description, setDescription] = useState(initialData?.description ?? "");
    const [duration, setDuration] = useState(initialData?.duration ?? "30");
    const [customDuration, setCustomDuration] = useState(
        initialData?.duration && !DURATION_PRESETS.includes(initialData.duration)
            ? initialData.duration : ""
    );
    const [color, setColor] = useState(initialData?.color ?? DEFAULT_COLORS[0]);

    const isCustom = !DURATION_PRESETS.includes(duration);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalDuration = isCustom ? customDuration : duration;
        if (!name.trim() || !finalDuration) return;
        await onSubmit({
            name: name.trim(),
            description: description.trim() || undefined,
            duration: finalDuration,
            color,
        });
    };

    const handleDurationPreset = (val: string) => {
        setDuration(val);
        setCustomDuration("");
    };

    const handleCustomDurationToggle = () => {
        setDuration("custom");
        setCustomDuration("");
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500 }}>
            <TextField
                fullWidth
                label={t("service.form.name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                sx={{ mb: 2 }}
                disabled={isSubmitting}
            />
            <TextField
                fullWidth
                label={t("service.form.description")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                sx={{ mb: 2 }}
                disabled={isSubmitting}
            />
            <FormControl fullWidth sx={{ mb: 2 }} disabled={isSubmitting}>
                <InputLabel>{t("service.form.duration")}</InputLabel>
                <Select
                    value={isCustom ? "custom" : duration}
                    onChange={(e) => {
                        if (e.target.value === "custom") {
                            handleCustomDurationToggle();
                        } else {
                            handleDurationPreset(e.target.value);
                        }
                    }}
                    input={<OutlinedInput label={t("service.form.duration")} />}
                >
                    {DURATION_PRESETS.map((d) => (
                        <MenuItem key={d} value={d}>{d} min</MenuItem>
                    ))}
                    <MenuItem value="custom">{t("service.form.customDuration")}</MenuItem>
                </Select>
            </FormControl>
            {isCustom && (
                <TextField
                    fullWidth
                    type="number"
                    label={t("service.form.customDurationLabel")}
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    required
                    inputProps={{ min: 1 }}
                    sx={{ mb: 2 }}
                    disabled={isSubmitting}
                    slotProps={{
                        input: {
                            endAdornment: <Typography variant="body2" color="text.secondary">min</Typography>,
                        }
                    }}
                />
            )}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t("service.form.color")}
            </Typography>
            <ColorPicker value={color} onChange={setColor} />
            <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
                <Button type="submit" variant="contained" disabled={isSubmitting || !name.trim()}>
                    {isSubmitting ? <CircularProgress size={24} /> : mode === "add" ? t("service.form.addService") : t("service.form.updateService")}
                </Button>
                <Button onClick={onCancel} disabled={isSubmitting}>
                    {t("common.cancel")}
                </Button>
            </Box>
        </Box>
    );
}

function ServiceCard({
    service,
    onEdit,
    onDelete,
    onPrices,
}: {
    service: TServiceRow;
    onEdit: (service: TServiceRow) => void;
    onDelete: (service: TServiceRow) => void;
    onPrices: (service: TServiceRow) => void;
}) {
    const { t } = useTranslation();
    return (
        <Card
            variant="outlined"
            sx={{
                position: "relative",
                overflow: "visible",
                "&:hover": { boxShadow: 4 },
                transition: "box-shadow 0.2s",
            }}
        >
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    bgcolor: service.color || "#1976d2",
                    borderRadius: "4px 4px 0 0",
                }}
            />
            <CardContent sx={{ pt: 2.5 }}>
                <Typography variant="h6" gutterBottom>
                    {service.name}
                </Typography>
                {service.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {service.description}
                    </Typography>
                )}
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Chip
                        icon={<AccessTime sx={{ fontSize: 16 }} />}
                        label={`${service.duration} min`}
                        size="small"
                        variant="outlined"
                    />
                    {service.color && (
                        <Box
                            sx={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                bgcolor: service.color,
                                border: "1px solid",
                                borderColor: "divider",
                            }}
                        />
                    )}
                </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
                <IconButton size="small" onClick={() => onPrices(service)} color="secondary" title={t('service.prices')}>
                    <AttachMoney fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onEdit(service)} color="primary">
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(service)} color="error">
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </CardActions>
        </Card>
    );
}

const EMPTY_PRICE_FORM: PriceFormData = {
    serviceId: "",
    price: "",
    unitType: "1h",
    actualInTime: false,
    validFrom: undefined,
    validTo: undefined,
    preOrderAllowed: false,
    expirationAction: "",
};

function ServicePricesDialog({
    service,
    open,
    onClose,
    currencySymbol,
}: {
    service: TServiceRow | null;
    open: boolean;
    onClose: () => void;
    currencySymbol: string;
}) {
    const { t } = useTranslation();
    const { createPrice, updatePrice, deletePrice } = usePriceCrud();
    const [showForm, setShowForm] = useState(false);
    const [editingPrice, setEditingPrice] = useState<TPriceRow | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<PriceFormData>(EMPTY_PRICE_FORM);

    const servicePrices = useQuery(
        service ? getPricesForService(service.id as ServiceId) : getPricesForService("" as ServiceId)
    ) as TPriceRow[];

    const handleOpen = () => {
        setForm({ ...EMPTY_PRICE_FORM, serviceId: service?.id as string || "" });
        setEditingPrice(null);
        setShowForm(true);
    };

    const handleEdit = (price: TPriceRow) => {
        setEditingPrice(price);
        setForm({
            serviceId: price.serviceId as string,
            price: String(price.price ?? ""),
            unitType: price.unitType ?? "1h",
            actualInTime: !!price.actualInTime,
            validFrom: price.validFrom ?? undefined,
            validTo: price.validTo ?? undefined,
            preOrderAllowed: !!price.preOrderAllowed,
            expirationAction: price.expirationAction ?? "",
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingPrice(null);
        setForm({ ...EMPTY_PRICE_FORM, serviceId: service?.id as string || "" });
    };

    const handleChange = (field: keyof PriceFormData, value: string | boolean) => {
        setForm((prev) => {
            const next = { ...prev, [field]: value };
            if (field === "preOrderAllowed" && !value) {
                next.expirationAction = "";
            }
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.serviceId || !form.price) return;
        if (form.preOrderAllowed && !form.expirationAction) return;

        setIsSubmitting(true);
        try {
            if (editingPrice) {
                await updatePrice(editingPrice.id as PriceId, form);
            } else {
                await createPrice(form);
            }
            handleCancel();
        } catch (error) {
            console.error("Failed to submit price:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (price: TPriceRow) => {
        try {
            await deletePrice(price.id as PriceId);
        } catch (error) {
            console.error("Failed to delete price:", error);
        }
    };

    const hasActualDates = !!(form.validFrom || form.validTo);
    const effectiveActualInTime = hasActualDates || form.actualInTime;

    if (!service) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {t("service.pricesTitle", { name: service.name })}
            </DialogTitle>
            <DialogContent dividers>
                {!showForm && (
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleOpen}
                        sx={{ mb: 2 }}
                    >
                        {t("service.addPrice")}
                    </Button>
                )}

                {showForm && (
                    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            label={t("prices.form.service")}
                            value={service.name}
                            disabled
                            sx={{ mb: 2 }}
                            size="small"
                        />
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
                            size="small"
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

                        <FormControl fullWidth sx={{ mb: 2 }} disabled={isSubmitting} size="small">
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
                                    size="small"
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                                <TextField
                                    fullWidth
                                    type="date"
                                    label={t("prices.form.validTo")}
                                    value={form.validTo}
                                    onChange={(e) => handleChange("validTo", e.target.value)}
                                    disabled={isSubmitting}
                                    size="small"
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
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
                            <FormControl fullWidth sx={{ mb: 2 }} disabled={isSubmitting} required size="small">
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

                        <Stack direction="row" spacing={1}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isSubmitting || !form.price}
                                size="small"
                            >
                                {isSubmitting
                                    ? <CircularProgress size={20} />
                                    : editingPrice ? t("prices.form.updatePrice") : t("prices.form.addPrice")}
                            </Button>
                            <Button onClick={handleCancel} disabled={isSubmitting} size="small">
                                {t("common.cancel")}
                            </Button>
                        </Stack>
                    </Box>
                )}

                {!servicePrices ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : servicePrices.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
                        {t("service.noPrices")}
                    </Typography>
                ) : (
                    <Stack spacing={1}>
                        {servicePrices.map((price) => {
                            const unitLabel = t(`prices.unitTypes.${price.unitType}`, price.unitType);
                            const formatDate = (date: string | null) => {
                                if (!date) return t("prices.infinity");
                                return date;
                            };
                            return (
                                <Box
                                    key={price.id}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        p: 1.5,
                                        borderRadius: 1,
                                        border: "1px solid",
                                        borderColor: "divider",
                                    }}
                                >
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
                                            <Chip
                                                label={`${currencySymbol}${price.price}`}
                                                color="primary"
                                                size="small"
                                            />
                                            <Chip
                                                label={unitLabel}
                                                size="small"
                                                variant="outlined"
                                            />
                                            {price.preOrderAllowed === 1 && (
                                                <Chip
                                                    icon={<ShoppingCart sx={{ fontSize: 14 }} />}
                                                    label={t("prices.preorder")}
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            )}
                                        </Box>
                                        {price.actualInTime === 1 && (
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                                                {formatDate(price.validFrom)} — {formatDate(price.validTo)}
                                            </Typography>
                                        )}
                                    </Box>
                                    <IconButton size="small" onClick={() => handleEdit(price)} color="primary">
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleDelete(price)} color="error">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t("common.cancel")}</Button>
            </DialogActions>
        </Dialog>
    );
}

export function ServicePage() {
    const { t } = useTranslation();
    const { services, isLoading, createService, updateService, deleteService } = useServiceCrud();
    const { currency } = useSettingsSync();
    const currencySymbol = getCurrencySymbol(currency || "EUR");

    const [viewMode, setViewMode] = useState<"cards" | "add" | "edit">("cards");
    const [editingService, setEditingService] = useState<TServiceRow | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<TServiceRow | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [pricesDialogService, setPricesDialogService] = useState<TServiceRow | null>(null);

    const handleAddClick = () => {
        setViewMode("add");
        setEditingService(null);
    };

    const handleEdit = (service: TServiceRow) => {
        setViewMode("edit");
        setEditingService(service);
    };

    const handleCancel = () => {
        setViewMode("cards");
        setEditingService(null);
    };

    const handleSubmit = async (data: ServiceFormData) => {
        setIsSubmitting(true);
        try {
            if (editingService) {
                await updateService(editingService.id, data);
            } else {
                await createService(data);
            }
            handleCancel();
        } catch (error) {
            console.error("Failed to submit service:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (service: TServiceRow) => {
        setServiceToDelete(service);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (serviceToDelete) {
            setIsDeleting(true);
            try {
                await deleteService(serviceToDelete.id);
            } catch (error) {
                console.error("Failed to delete service:", error);
            } finally {
                setIsDeleting(false);
                setDeleteConfirmOpen(false);
                setServiceToDelete(null);
            }
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setServiceToDelete(null);
    };

    const handlePrices = (service: TServiceRow) => {
        setPricesDialogService(service);
    };

    const handlePricesDialogClose = () => {
        setPricesDialogService(null);
    };

    const initialData: ServiceFormData | undefined = editingService
        ? {
            name: editingService.name ?? "",
            description: editingService.description ?? "",
            duration: editingService.duration ?? "30",
            color: editingService.color ?? undefined,
        }
        : undefined;

    const formTitle = viewMode === "add"
        ? t("service.form.addService")
        : t("service.form.updateService");

    return (
        <Container maxWidth="lg">
            <Box sx={{ minHeight: "80vh", py: 4 }}>
                <Box sx={{ display: viewMode === "cards" ? "block" : "none" }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {t("service.title")}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {t("service.description")}
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleAddClick}
                            size="large"
                        >
                            {t("service.add")}
                        </Button>
                    </Box>
                    {isLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : services && services.length > 0 ? (
                        <ShowMore
                            items={services}
                            renderItems={(visible) => (
                                <Grid container spacing={2}>
                                    {visible.map((service) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={service.id}>
                                            <ServiceCard
                                                service={service}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                onPrices={handlePrices}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        />
                    ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                            {t("service.empty")}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: viewMode !== "cards" ? "block" : "none" }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {formTitle}
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                        <ServiceForm
                            mode={viewMode as "add" | "edit"}
                            initialData={initialData}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isSubmitting={isSubmitting}
                        />
                    </Box>
                </Box>
            </Box>

            <ServicePricesDialog
                service={pricesDialogService}
                open={pricesDialogService !== null}
                onClose={handlePricesDialogClose}
                currencySymbol={currencySymbol}
            />

            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                itemName={serviceToDelete?.name || t("service.title")}
                itemType={t("service.title")}
                onConfirm={handleDeleteConfirm}
                onClose={handleDeleteCancel}
                isDeleting={isDeleting}
            />
        </Container>
    );
}
