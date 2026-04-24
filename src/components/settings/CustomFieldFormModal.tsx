import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { CustomField, CustomFieldFormData } from "../../types/customField";
import { parseFieldNameTranslations } from "../../utils/customFieldTranslations";
import { CustomFieldForm } from "./CustomFieldForm";

interface CustomFieldFormModalProps {
    open: boolean;
    onClose: () => void;
    mode: "add" | "edit";
    customField?: CustomField;
    onSubmit: (data: CustomFieldFormData) => Promise<void>;
    isSubmitting: boolean;
}

export function CustomFieldFormModal({
    open,
    onClose,
    mode,
    customField,
    onSubmit,
    isSubmitting,
}: CustomFieldFormModalProps) {
    const { t } = useTranslation();

    // Convert CustomField to CustomFieldFormData for editing
    const initialData: CustomFieldFormData | undefined = customField
        ? {
              appliesTo: customField.appliesTo,
              fieldName: customField.fieldName,
              fieldType: customField.fieldType,
              fieldNameTranslations: parseFieldNameTranslations(customField.fieldNameTranslations),
              dropdownItems: customField.dropdownItems || "",
              placeholder: customField.placeholder || "",
              helpText: customField.helpText || "",
              required: customField.required,
              editableAfterInitial: customField.editableAfterInitial,
              showInTable: customField.showInTable,
          }
        : undefined;

    const title =
        mode === "add"
            ? t("settings.customFields.addNew")
            : t("settings.customFields.editField");

    return (
        <Dialog
            open={open}
            onClose={onClose}
            closeOnBackdropClick
            closeOnEscapeKeyDown={!isSubmitting}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { maxHeight: "90vh" },
            }}
        >
            <DialogTitle>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Typography variant="h6" component="span">
                        {title}
                    </Typography>
                    <IconButton
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent dividers>
                <CustomFieldForm
                    mode={mode}
                    initialData={initialData}
                    onSubmit={onSubmit}
                    onCancel={onClose}
                    isSubmitting={isSubmitting}
                />
            </DialogContent>
        </Dialog>
    );
}
