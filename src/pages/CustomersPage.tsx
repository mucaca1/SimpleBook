import React, { useState } from "react";
import { Box, Typography, Container, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useCustomerCrud } from "../hooks/useCustomerCrud";
import { CustomerTable, CustomerForm } from "../components/customer";
import { Customer, CustomerFormData } from "../types/customer";
import { DeleteConfirmDialog } from "../components/ui/DeleteConfirmDialog";
import { CustomerId } from "../evolu/evolu-db";

export function CustomersPage() {
    const { t } = useTranslation();
    const {
        customers,
        isLoading,
        createCustomer,
        updateCustomer,
        deleteCustomer,
    } = useCustomerCrud();

    // View mode: 'table' shows the table, 'add'/'edit' shows the form inline
    const [viewMode, setViewMode] = useState<"table" | "add" | "edit">("table");
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    // Delete confirmation state management
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    // Loading states for mutations
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    /**
     * Switch to add mode
     */
    const handleAddClick = () => {
        setViewMode("add");
        setEditingCustomer(null);
    };

    /**
     * Switch to edit mode with the selected customer
     */
    const handleEdit = (customer: Customer) => {
        setViewMode("edit");
        setEditingCustomer(customer);
    };

    /**
     * Return to table view
     */
    const handleCancel = () => {
        setViewMode("table");
        setEditingCustomer(null);
    };

    /**
     * Handle form submission — creates or updates a customer
     */
    const handleSubmit = async (
        data: CustomerFormData,
        customFieldValues?: Record<string, string | boolean | null>
    ) => {
        setIsSubmitting(true);
        try {
            let customerId: CustomerId | null = null;

            if (editingCustomer) {
                await updateCustomer(editingCustomer.id, data);
                customerId = editingCustomer.id;
            } else {
                customerId = await createCustomer(data);
            }

            // Save custom field values if they exist and customer was saved successfully
            if (customerId && customFieldValues && Object.keys(customFieldValues).length > 0) {
                try {
                    const { saveCustomFieldValuesForCustomer } = await import('../evolu/customFieldUtils');
                    await saveCustomFieldValuesForCustomer(customerId, customFieldValues);
                } catch (cfError) {
                    console.error("Failed to save custom field values:", cfError);
                }
            }

            // Return to table on success
            handleCancel();
        } catch (error) {
            console.error("Failed to submit customer:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Handle delete button click from CustomerTable
     */
    const handleDelete = (customer: Customer) => {
        setCustomerToDelete(customer);
        setDeleteConfirmOpen(true);
    };

    /**
     * Confirm delete action
     */
    const handleDeleteConfirm = async () => {
        if (customerToDelete) {
            setIsDeleting(true);
            try {
                await deleteCustomer(customerToDelete.id);
            } catch (error) {
                console.error("Failed to delete customer:", error);
            } finally {
                setIsDeleting(false);
                setDeleteConfirmOpen(false);
                setCustomerToDelete(null);
            }
        }
    };

    /**
     * Cancel delete action
     */
    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setCustomerToDelete(null);
    };

    // Convert Customer to CustomerFormData for editing
    const initialData: CustomerFormData | undefined = editingCustomer
        ? {
              firstName: editingCustomer.firstName ?? "",
              lastName: editingCustomer.lastName ?? "",
              degree: editingCustomer.degree ?? "",
              birthDate: editingCustomer.birthDate,
              isAdult: editingCustomer.isAdult ?? false,
              sex: editingCustomer.sex,
              customerId: editingCustomer.customerId ?? "",
          }
        : undefined;

    const formTitle = viewMode === "add"
        ? t("customer.form.addCustomer")
        : t("customer.form.updateCustomer");

    return (
        <Container maxWidth="lg">
            <Box
                sx={{
                    minHeight: "80vh",
                    py: 4,
                    bgcolor: "background.default",
                }}
            >
                <Box sx={{ display: viewMode === "table" ? "block" : "none" }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {t("subject.customersPage.title")}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {t("subject.customersPage.description")}
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleAddClick}
                            size="large"
                        >
                            {t("customer.actions.add")}
                        </Button>
                    </Box>

                    <CustomerTable
                        customers={customers}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAdd={handleAddClick}
                    />
                </Box>

                <Box sx={{ display: viewMode !== "table" ? "block" : "none" }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {formTitle}
                    </Typography>

                    <Box sx={{ mt: 3 }}>
                        <CustomerForm
                            mode={viewMode as "add" | "edit"}
                            initialData={initialData}
                            customerId={editingCustomer?.id || null}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isSubmitting={isSubmitting}
                        />
                    </Box>
                </Box>
            </Box>

            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                itemName={
                    customerToDelete
                        ? `${customerToDelete.firstName || ""} ${customerToDelete.lastName || ""}`.trim() || t("customer.title")
                        : t("customer.title")
                }
                itemType={t("customer.title")}
                onConfirm={handleDeleteConfirm}
                onClose={handleDeleteCancel}
                isDeleting={isDeleting}
            />
        </Container>
    );
}
