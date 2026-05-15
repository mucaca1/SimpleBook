import React, { useState } from "react";
import {
    Box, Typography, Button, Container, Card, CardContent, CardActions,
    IconButton, Chip, TextField, Grid, CircularProgress, Switch, FormControlLabel,
} from "@mui/material";
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    People, ChildCare, Check, Palette,
} from "@mui/icons-material";
import { Collapse } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useRoomCrud } from "../hooks/useRoomCrud";
import { RoomFormData } from "../types/room";
import { DeleteConfirmDialog } from "../components/ui/DeleteConfirmDialog";
import type { TRoomRow } from "../evolu/evolu-query";
import { RoomId } from "../evolu/evolu-db";

const DEFAULT_COLORS = [
    "#1976d2", "#2e7d32", "#ed6c02", "#9c27b0",
    "#d32f2f", "#0097a7", "#c2185b", "#455a64",
    "#fbc02d", "#5d4037",
];

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

function RoomForm({
    mode,
    initialData,
    onSubmit,
    onCancel,
    isSubmitting,
}: {
    mode: "add" | "edit";
    initialData?: RoomFormData;
    onSubmit: (data: RoomFormData) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}) {
    const { t } = useTranslation();
    const [name, setName] = useState(initialData?.name ?? "");
    const [color, setColor] = useState(initialData?.color ?? DEFAULT_COLORS[0]);
    const [maxCapacity, setMaxCapacity] = useState(initialData?.maxCapacity ?? 1);
    const [countChildrenAsPerson, setCountChildrenAsPerson] = useState(
        initialData?.countChildrenAsPerson ?? true
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || maxCapacity < 1) return;
        await onSubmit({
            name: name.trim(),
            color,
            maxCapacity,
            countChildrenAsPerson,
        });
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500 }}>
            <TextField
                fullWidth
                label={t("room.form.name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                sx={{ mb: 2 }}
                disabled={isSubmitting}
            />
            <TextField
                fullWidth
                type="number"
                label={t("room.form.maxCapacity")}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                required
                inputProps={{ min: 1 }}
                sx={{ mb: 2 }}
                disabled={isSubmitting}
                slotProps={{
                    input: {
                        startAdornment: <People sx={{ mr: 1, color: "text.secondary", fontSize: 20 }} />,
                    },
                }}
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={countChildrenAsPerson}
                        onChange={(e) => setCountChildrenAsPerson(e.target.checked)}
                        disabled={isSubmitting}
                    />
                }
                label={t("room.form.countChildrenAsPerson")}
                sx={{ mb: 2, display: "block" }}
            />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t("room.form.color")}
            </Typography>
            <ColorPicker value={color} onChange={setColor} />
            <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
                <Button type="submit" variant="contained" disabled={isSubmitting || !name.trim()}>
                    {isSubmitting ? <CircularProgress size={24} /> : mode === "add" ? t("room.form.addRoom") : t("room.form.updateRoom")}
                </Button>
                <Button onClick={onCancel} disabled={isSubmitting}>
                    {t("common.cancel")}
                </Button>
            </Box>
        </Box>
    );
}

function RoomCard({
    room,
    onEdit,
    onDelete,
}: {
    room: TRoomRow;
    onEdit: (room: TRoomRow) => void;
    onDelete: (room: TRoomRow) => void;
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
                    bgcolor: room.color || "#1976d2",
                    borderRadius: "4px 4px 0 0",
                }}
            />
            <CardContent sx={{ pt: 2.5 }}>
                <Typography variant="h6" gutterBottom>
                    {room.name}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <Chip
                        icon={<People sx={{ fontSize: 16 }} />}
                        label={t("room.card.capacity", { count: room.maxCapacity })}
                        size="small"
                        variant="outlined"
                    />
                    {!room.countChildrenAsPerson && (
                        <Chip
                            icon={<ChildCare sx={{ fontSize: 16 }} />}
                            label={t("room.card.childrenFree")}
                            size="small"
                            color="info"
                            variant="outlined"
                        />
                    )}
                    {room.color && (
                        <Box
                            sx={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                bgcolor: room.color,
                                border: "1px solid",
                                borderColor: "divider",
                            }}
                        />
                    )}
                </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
                <IconButton size="small" onClick={() => onEdit(room)} color="primary">
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(room)} color="error">
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </CardActions>
        </Card>
    );
}

export function RoomsPage() {
    const { t } = useTranslation();
    const { rooms, isLoading, createRoom, updateRoom, deleteRoom } = useRoomCrud();

    const [viewMode, setViewMode] = useState<"cards" | "add" | "edit">("cards");
    const [editingRoom, setEditingRoom] = useState<TRoomRow | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<TRoomRow | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleAddClick = () => {
        setViewMode("add");
        setEditingRoom(null);
    };

    const handleEdit = (room: TRoomRow) => {
        setViewMode("edit");
        setEditingRoom(room);
    };

    const handleCancel = () => {
        setViewMode("cards");
        setEditingRoom(null);
    };

    const handleSubmit = async (data: RoomFormData) => {
        setIsSubmitting(true);
        try {
            if (editingRoom) {
                await updateRoom(editingRoom.id, data);
            } else {
                await createRoom(data);
            }
            handleCancel();
        } catch (error) {
            console.error("Failed to submit room:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (room: TRoomRow) => {
        setRoomToDelete(room);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (roomToDelete) {
            setIsDeleting(true);
            try {
                await deleteRoom(roomToDelete.id);
            } catch (error) {
                console.error("Failed to delete room:", error);
            } finally {
                setIsDeleting(false);
                setDeleteConfirmOpen(false);
                setRoomToDelete(null);
            }
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setRoomToDelete(null);
    };

    const initialData: RoomFormData | undefined = editingRoom
        ? {
            name: editingRoom.name ?? "",
            color: editingRoom.color ?? undefined,
            maxCapacity: editingRoom.maxCapacity ?? 1,
            countChildrenAsPerson: !!editingRoom.countChildrenAsPerson,
        }
        : undefined;

    const formTitle = viewMode === "add"
        ? t("room.form.addRoom")
        : t("room.form.updateRoom");

    return (
        <Container maxWidth="lg">
            <Box sx={{ minHeight: "80vh", py: 4 }}>
                <Box sx={{ display: viewMode === "cards" ? "block" : "none" }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {t("room.title")}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {t("room.description")}
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleAddClick}
                            size="large"
                        >
                            {t("room.add")}
                        </Button>
                    </Box>
                    {isLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : rooms && rooms.length > 0 ? (
                        <Grid container spacing={2}>
                            {rooms.map((room) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={room.id}>
                                    <RoomCard
                                        room={room}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                            {t("room.empty")}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: viewMode !== "cards" ? "block" : "none" }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {formTitle}
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                        <RoomForm
                            mode={viewMode as "add" | "edit"}
                            initialData={initialData}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isSubmitting={isSubmitting}
                        />
                    </Box>
                </Box>
            </Box>

            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                itemName={roomToDelete?.name || t("room.title")}
                itemType={t("room.title")}
                onConfirm={handleDeleteConfirm}
                onClose={handleDeleteCancel}
                isDeleting={isDeleting}
            />
        </Container>
    );
}
