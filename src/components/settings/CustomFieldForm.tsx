import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
    Box,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
    MenuItem,
    Stack,
    Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import {
    CustomFieldFormData,
    CUSTOM_FIELD_TYPE_LABELS,
    CUSTOM_FIELD_APPLIES_TO_LABELS,
} from "../../types/customField";
import { FieldTypeChangeDialog } from "../ui/FieldTypeChangeDialog";
import { DropdownItemsChangeDialog } from "../ui/DropdownItemsChangeDialog";

interface CustomFieldFormProps {
    mode: "add" | "edit";
    initialData?: CustomFieldFormData;
    onSubmit: (data: CustomFieldFormData, options?: { clearValues?: boolean; clearAffectedOnly?: boolean }) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

export function CustomFieldForm({
    mode,
    initialData,
    onSubmit,
    onCancel,
    isSubmitting,
}: CustomFieldFormProps) {
    const { t } = useTranslation();

    // Dialog states
    const [fieldTypeChangeDialogOpen, setFieldTypeChangeDialogOpen] = useState(false);
    const [dropdownItemsChangeDialogOpen, setDropdownItemsChangeDialogOpen] = useState(false);
    const [pendingData, setPendingData] = useState<CustomFieldFormData | null>(null);
    const [pendingAction, setPendingAction] = useState<'fieldType' | 'dropdownItems' | null>(null);

    // Track original values for change detection
    const [originalFieldType, setOriginalFieldType] = useState<string>("");
    const [originalDropdownItems, setOriginalDropdownItems] = useState<string>("");

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<CustomFieldFormData>({
        defaultValues: initialData || {
            appliesTo: "Customer",
            fieldName: "",
            fieldType: "Text",
            dropdownItems: "",
            placeholder: "",
            helpText: "",
            required: false,
            editableAfterInitial: false,
            showInTable: false,
        },
    });

    // Reset form when initialData changes (e.g., when editing different field)
    useEffect(() => {
        if (initialData) {
            reset(initialData);
            setOriginalFieldType(initialData.fieldType || "");
            setOriginalDropdownItems(initialData.dropdownItems || "");
        } else {
            setOriginalFieldType("Text");
            setOriginalDropdownItems("");
        }
    }, [initialData, reset]);

    const watchFieldType = watch("fieldType");

    const handleFormSubmit = async (data: CustomFieldFormData) => {
        // In edit mode, check for field type changes
        if (mode === "edit" && initialData) {
            // Check if field type changed
            if (data.fieldType !== originalFieldType) {
                setPendingData(data);
                setPendingAction('fieldType');
                setFieldTypeChangeDialogOpen(true);
                return;
            }

            // Check if dropdown items changed (only for Dropdown type)
            if (
                data.fieldType === "Dropdown" &&
                data.dropdownItems !== originalDropdownItems
            ) {
                setPendingData(data);
                setPendingAction('dropdownItems');
                setDropdownItemsChangeDialogOpen(true);
                return;
            }
        }

        await onSubmit(data);
    };

    const handleFieldTypeChangeConfirm = async () => {
        setFieldTypeChangeDialogOpen(false);
        if (pendingData && initialData) {
            try {
                // Delete all values for this field
                // Note: We need to get the fieldId from the context, but for now
                // we'll pass this responsibility to the parent component
                // The parent will need to handle the cascade delete
                await onSubmit(pendingData, { clearValues: true });
            } catch (error) {
                console.error("Failed to update field with cleared values:", error);
            }
            setPendingData(null);
        }
    };

    const handleDropdownItemsChangeConfirm = async (keepValues: boolean) => {
        setDropdownItemsChangeDialogOpen(false);
        if (pendingData) {
            try {
                if (keepValues) {
                    // User chose to keep old values - just update the field
                    await onSubmit(pendingData, { clearValues: false });
                } else {
                    // User chose to clear affected values
                    await onSubmit(pendingData, { clearValues: true, clearAffectedOnly: true });
                }
            } catch (error) {
                console.error("Failed to update field:", error);
            }
            setPendingData(null);
        }
    };

    const handleDialogClose = () => {
        setFieldTypeChangeDialogOpen(false);
        setDropdownItemsChangeDialogOpen(false);
        setPendingData(null);
    };

    return (
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ width: "100%" }}>
            <Stack spacing={3}>
                {/* Applies To */}
                <Controller
                    name="appliesTo"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            select
                            label={t("settings.customFields.appliesTo")}
                            fullWidth
                            error={!!errors.appliesTo}
                            helperText={errors.appliesTo?.message}
                            disabled={isSubmitting}
                        >
                            {Object.entries(CUSTOM_FIELD_APPLIES_TO_LABELS).map(([key, label]) => (
                                <MenuItem key={key} value={key}>
                                    {label}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                />

                {/* Field Name */}
                <Controller
                    name="fieldName"
                    control={control}
                    rules={{
                        required: t("settings.customFields.validation.fieldNameRequired") || "Field name is required",
                        maxLength: {
                            value: 100,
                            message: t("settings.customFields.validation.fieldNameMaxLength") || "Field name must be less than 100 characters",
                        },
                    }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t("settings.customFields.fieldName")}
                            fullWidth
                            error={!!errors.fieldName}
                            helperText={errors.fieldName?.message}
                            disabled={isSubmitting}
                        />
                    )}
                />

                {/* Field Type */}
                <Controller
                    name="fieldType"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            select
                            label={t("settings.customFields.fieldType")}
                            fullWidth
                            error={!!errors.fieldType}
                            helperText={errors.fieldType?.message}
                            disabled={isSubmitting}
                        >
                            {Object.entries(CUSTOM_FIELD_TYPE_LABELS).map(([key, label]) => (
                                <MenuItem key={key} value={key}>
                                    {label}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                />

                {/* Dropdown Items - Only show when fieldType is "Dropdown" */}
                {watchFieldType === "Dropdown" && (
                    <Controller
                        name="dropdownItems"
                        control={control}
                        rules={{
                            required: t("settings.customFields.validation.dropdownItemsRequired") || "Dropdown items are required when field type is Dropdown",
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label={t("settings.customFields.dropdownItems")}
                                fullWidth
                                multiline
                                rows={2}
                                error={!!errors.dropdownItems}
                                helperText={
                                    errors.dropdownItems?.message ||
                                    t("settings.customFields.help.dropdownItemsFormat") ||
                                    "Enter options separated by commas"
                                }
                                disabled={isSubmitting}
                                placeholder="Option 1, Option 2, Option 3"
                            />
                        )}
                    />
                )}

                {/* Placeholder */}
                <Controller
                    name="placeholder"
                    control={control}
                    rules={{
                        maxLength: {
                            value: 200,
                            message: t("settings.customFields.validation.placeholderMaxLength") || "Placeholder must be less than 200 characters",
                        },
                    }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t("settings.customFields.placeholder")}
                            fullWidth
                            error={!!errors.placeholder}
                            helperText={errors.placeholder?.message}
                            disabled={isSubmitting}
                        />
                    )}
                />

                {/* Help Text */}
                <Controller
                    name="helpText"
                    control={control}
                    rules={{
                        maxLength: {
                            value: 500,
                            message: t("settings.customFields.validation.helpTextMaxLength") || "Help text must be less than 500 characters",
                        },
                    }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t("settings.customFields.helpText")}
                            fullWidth
                            multiline
                            rows={2}
                            error={!!errors.helpText}
                            helperText={errors.helpText?.message}
                            disabled={isSubmitting}
                        />
                    )}
                />

                {/* Required Checkbox */}
                <Controller
                    name="required"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={field.value || false}
                                    onChange={field.onChange}
                                    disabled={isSubmitting}
                                />
                            }
                            label={t("settings.customFields.required")}
                        />
                    )}
                />

                {/* Editable After Initial Checkbox */}
                <Controller
                    name="editableAfterInitial"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={field.value || false}
                                    onChange={field.onChange}
                                    disabled={isSubmitting}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1">
                                        {t("settings.customFields.editableAfterInitial")}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {t("settings.customFields.help.editableAfterInitial") ||
                                            "If checked, this field can be edited after initial creation. If unchecked, it can only be set once."}
                                    </Typography>
                                </Box>
                            }
                        />
                    )}
                />

                {/* Show In Table Checkbox */}
                <Controller
                    name="showInTable"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={field.value || false}
                                    onChange={field.onChange}
                                    disabled={isSubmitting}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1">
                                        {t("settings.customFields.showInTable")}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {t("settings.customFields.help.showInTable") ||
                                            "If checked, this field will be displayed as a column in the customers table."}
                                    </Typography>
                                </Box>
                            }
                        />
                    )}
                />

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                    <Button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        variant="outlined"
                    >
                        {t("settings.customFields.cancel")}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? t("settings.customFields.saving")
                            : mode === "add"
                            ? t("settings.customFields.add")
                            : t("settings.customFields.update")}
                    </Button>
                </Stack>
            </Stack>

            {/* Field Type Change Confirmation Dialog */}
            <FieldTypeChangeDialog
                open={fieldTypeChangeDialogOpen}
                fieldName={initialData?.fieldName || ""}
                oldType={originalFieldType}
                newType={pendingData?.fieldType || ""}
                onConfirm={handleFieldTypeChangeConfirm}
                onClose={handleDialogClose}
            />

            {/* Dropdown Items Change Dialog */}
            <DropdownItemsChangeDialog
                open={dropdownItemsChangeDialogOpen}
                fieldName={initialData?.fieldName || ""}
                onConfirm={handleDropdownItemsChangeConfirm}
                onClose={handleDialogClose}
            />
        </Box>
    );
}
