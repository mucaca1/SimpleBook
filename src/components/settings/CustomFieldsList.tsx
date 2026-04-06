import React, { useState, useMemo } from "react";
import {
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Typography,
    Stack,
    Chip,
    SvgIcon,
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    ShortText as TextIcon,
    Pin as NumberIcon,
    Event as DateIcon,
    CheckBox as YesNoIcon,
    ArrowDropDown as DropdownIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useCustomFieldCrud } from "../../hooks/useCustomFieldCrud";
import { CustomFieldFormModal } from "./CustomFieldFormModal";
import { DeleteConfirmDialog } from "../ui/DeleteConfirmDialog";
import { CustomFieldFormData } from "../../types/customField";
import type { TCustomFieldRow } from "../../evolu/evolu-query";
import { CUSTOM_FIELD_TYPE_LABELS, CUSTOM_FIELD_APPLIES_TO_LABELS } from "../../types/customField";
import { useQuery } from "@evolu/react";
import { customFieldValues } from "../../evolu/evolu-query";
import * as Evolu from "@evolu/common";
import { evolu } from "../../evolu-init";

type ModalMode = "add" | "edit" | null;

/**
 * Get icon for field type
 */
const getFieldTypeIcon = (fieldType: string) => {
    switch (fieldType) {
        case "Text":
            return TextIcon;
        case "Number":
            return NumberIcon;
        case "Date":
            return DateIcon;
        case "Yes/No":
            return YesNoIcon;
        case "Dropdown":
            return DropdownIcon;
        default:
            return TextIcon;
    }
};

export function CustomFieldsList() {
    const { t } = useTranslation();
    const { customFields, isLoading, createCustomField, updateCustomField, deleteCustomField } =
        useCustomFieldCrud();

    // Query custom field values for counting affected records
    const allCustomFieldValues = useQuery(customFieldValues) as Evolu.TCustomFieldValueRow[];

    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedField, setSelectedField] = useState<TCustomFieldRow | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [fieldToDelete, setFieldToDelete] = useState<TCustomFieldRow | undefined>();

    // Calculate affected values count for the field being deleted
    const affectedValuesCount = useMemo(() => {
        if (!fieldToDelete) return 0;
        return allCustomFieldValues.filter(
            (value) => value.customFieldId === fieldToDelete.id && value.isDeleted !== Evolu.sqliteTrue
        ).length;
    }, [fieldToDelete, allCustomFieldValues]);

    const handleOpenAddModal = () => {
        setModalMode("add");
        setSelectedField(undefined);
    };

    const handleOpenEditModal = (field: TCustomFieldRow) => {
        setModalMode("edit");
        setSelectedField(field);
    };

    const handleCloseModal = () => {
        setModalMode(null);
        setSelectedField(undefined);
    };

    /**
     * Handle form submit with options for clearing values
     */
    const handleSubmit = async (
        data: CustomFieldFormData,
        options?: { clearValues?: boolean; clearAffectedOnly?: boolean }
    ) => {
        setIsSubmitting(true);
        try {
            if (modalMode === "add") {
                await createCustomField(data);
            } else if (modalMode === "edit" && selectedField) {
                // Handle field type or dropdown items change
                if (options?.clearValues) {
                    if (options.clearAffectedOnly) {
                        // Clear only affected dropdown values
                        await clearAffectedDropdownValues(selectedField.id, data.dropdownItems || "");
                    } else {
                        // Clear all values (field type change)
                        await clearAllFieldValues(selectedField.id);
                    }
                }
                await updateCustomField(selectedField.id, data);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save custom field:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Delete all custom field values for a specific field
     */
    const clearAllFieldValues = async (fieldId: string): Promise<void> => {
        const valuesToDelete = allCustomFieldValues.filter(
            (value) => value.customFieldId === fieldId && value.isDeleted !== Evolu.sqliteTrue
        );

        for (const value of valuesToDelete) {
            await evolu.update("customFieldValues", {
                id: value.id,
                isDeleted: Evolu.sqliteTrue,
            });
        }
    };

    /**
     * Clear affected dropdown values (values not in the new dropdown list)
     */
    const clearAffectedDropdownValues = async (
        fieldId: string,
        newDropdownItems: string
    ): Promise<void> => {
        let newOptions: string[] = [];
        try {
            newOptions = newDropdownItems ? JSON.parse(newDropdownItems) : [];
        } catch (e) {
            console.error("Failed to parse new dropdown items:", e);
            return;
        }

        const affectedValues = allCustomFieldValues.filter(
            (value) =>
                value.customFieldId === fieldId &&
                value.isDeleted !== Evolu.sqliteTrue &&
                value.value !== null &&
                value.value !== "" &&
                !newOptions.includes(value.value)
        );

        for (const value of affectedValues) {
            await evolu.update("customFieldValues", {
                id: value.id,
                isDeleted: Evolu.sqliteTrue,
            });
        }
    };

    const handleDeleteClick = (field: TCustomFieldRow) => {
        setFieldToDelete(field);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (fieldToDelete) {
            try {
                await deleteCustomField(fieldToDelete.id);
                setDeleteDialogOpen(false);
                setFieldToDelete(undefined);
            } catch (error) {
                console.error("Failed to delete custom field:", error);
            }
        }
    };

    const handleDeleteDialogClose = () => {
        setDeleteDialogOpen(false);
        setFieldToDelete(undefined);
    };

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                    {t("settings.customFields.loading") || "Loading..."}
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Stack spacing={3}>
                {/* Add New Field Button */}
                <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddModal}
                    >
                        {t("settings.customFields.addNew")}
                    </Button>
                </Box>

                {/* Custom Fields Table */}
                <TableContainer component={Paper} elevation={1}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    {t("settings.customFields.table.fieldName")}
                                </TableCell>
                                <TableCell>
                                    {t("settings.customFields.table.fieldType")}
                                </TableCell>
                                <TableCell>
                                    {t("settings.customFields.table.appliesTo")}
                                </TableCell>
                                <TableCell>
                                    {t("settings.customFields.table.required")}
                                </TableCell>
                                <TableCell>
                                    {t("settings.customFields.table.showInTable")}
                                </TableCell>
                                <TableCell align="right">
                                    {t("settings.customFields.table.actions")}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {customFields.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            {t("settings.customFields.noFields") ||
                                                "No custom fields yet. Click 'Add New Field' to create one."}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                customFields.map((field) => (
                                    <TableRow key={field.id} hover>
                                        <TableCell>{field.fieldName}</TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <SvgIcon fontSize="small" color="action">
                                                    {React.createElement(getFieldTypeIcon(field.fieldType))}
                                                </SvgIcon>
                                                <Chip
                                                    label={CUSTOM_FIELD_TYPE_LABELS[field.fieldType as keyof typeof CUSTOM_FIELD_TYPE_LABELS]}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            {
                                                CUSTOM_FIELD_APPLIES_TO_LABELS[
                                                    field.appliesTo as keyof typeof CUSTOM_FIELD_APPLIES_TO_LABELS
                                                ]
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {field.required ? (
                                                <Chip
                                                    label={t("settings.customFields.yes") || "Yes"}
                                                    size="small"
                                                    color="success"
                                                />
                                            ) : (
                                                <Chip
                                                    label={t("settings.customFields.no") || "No"}
                                                    size="small"
                                                    color="default"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {field.showInTable ? (
                                                <Chip
                                                    label={t("settings.customFields.yes") || "Yes"}
                                                    size="small"
                                                    color="success"
                                                />
                                            ) : (
                                                <Chip
                                                    label={t("settings.customFields.no") || "No"}
                                                    size="small"
                                                    color="default"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenEditModal(field)}
                                                aria-label="edit"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteClick(field)}
                                                aria-label="delete"
                                                color="error"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Add/Edit Modal */}
                <CustomFieldFormModal
                    open={modalMode !== null}
                    onClose={handleCloseModal}
                    mode={modalMode || "add"}
                    customField={selectedField}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmDialog
                    open={deleteDialogOpen}
                    itemName={fieldToDelete?.fieldName || ""}
                    itemType={t("settings.customFields.deleteConfirm.itemType") || "custom field"}
                    onConfirm={handleDeleteConfirm}
                    onClose={handleDeleteDialogClose}
                    isDeleting={isSubmitting}
                    affectedCount={affectedValuesCount}
                />
            </Stack>
        </Box>
    );
}
