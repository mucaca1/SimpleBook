import React, { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    List, ListItem, ListItemAvatar, ListItemText, Avatar, Checkbox,
    Typography, Box, CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useEmployeeCrud } from "../../hooks/useEmployeeCrud";
import type { TEmployeeRow } from "../../evolu/evolu-query";

interface EventEmployeeDialogProps {
    open: boolean;
    eventTitle: string;
    selectedIds: string[];
    onSave: (ids: string[]) => Promise<void>;
    onClose: () => void;
}

export function EventEmployeeDialog({
    open,
    eventTitle,
    selectedIds,
    onSave,
    onClose,
}: EventEmployeeDialogProps) {
    const { t } = useTranslation();
    const { employees, isLoading } = useEmployeeCrud();
    const [current, setCurrent] = useState<Set<string>>(new Set(selectedIds));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setCurrent(new Set(selectedIds));
    }, [selectedIds, open]);

    const toggle = (id: string) => {
        setCurrent((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(Array.from(current));
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (emp: TEmployeeRow) => {
        const f = emp.firstName?.[0] ?? "";
        const l = emp.lastName?.[0] ?? "";
        return `${f}${l}`.trim() || "?";
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Typography variant="subtitle2" color="text.secondary">
                    {t("scheduler.assignEmployees")}
                </Typography>
                {eventTitle}
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                {isLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (employees ?? []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                        {t("scheduler.noEmployees")}
                    </Typography>
                ) : (
                    <List dense disablePadding>
                        {(employees ?? []).map((emp) => {
                            const id = String(emp.id);
                            return (
                                <ListItem
                                    key={id}
                                    onClick={() => toggle(id)}
                                    sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                                            {getInitials(emp)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={`${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || t("scheduler.unnamedEmployee")}
                                    />
                                    <Checkbox
                                        edge="end"
                                        checked={current.has(id)}
                                        tabIndex={-1}
                                        size="small"
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    {t("common.cancel")}
                </Button>
                <Button onClick={handleSave} variant="contained" disabled={saving}>
                    {saving ? <CircularProgress size={20} /> : t("common.save")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
