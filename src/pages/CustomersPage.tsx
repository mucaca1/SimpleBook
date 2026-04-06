import React, { useState } from "react";
import { Box, Typography, Container, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useCustomerCrud } from "../hooks/useCustomerCrud";
import { CustomerTable, CustomerFormModal } from "../components/customer";
import { Customer, CustomerFormData } from "../types/customer";
import { DeleteConfirmDialog } from "../components/ui/DeleteConfirmDialog";

export function CustomersPage() {
    const { t } = useTranslation();
    const {
        customers,
        isLoading,
        createCustomer,
        updateCustomer,
        deleteCustomer,
    } = useCustomerCrud();

    // Modal state management
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    // Delete confirmation state management (for Task 5.2)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    // Loading states for mutations
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    /**
     * Open modal for adding a new customer
     */
    const handleAddClick = () => {
        setModalOpen(true);
        setEditingCustomer(null);
    };

    /**
     * Open modal for editing an existing customer
     */
    const handleEditClick = (customer: Customer) => {
        setModalOpen(true);
        setEditingCustomer(customer);
    };

    /**
     * Close modal and reset editing state
     */
    const handleModalClose = () => {
        setModalOpen(false);
        setEditingCustomer(null);
    };

    /**
     * Handle form submission from CustomerFormModal
     * Creates a new customer or updates an existing one
     */
    const handleSubmit = async (data: CustomerFormData) => {
        setIsSubmitting(true);
        try {
            if (editingCustomer) {
                // Update existing customer
                await updateCustomer(editingCustomer.id, data);
            } else {
                // Create new customer
                await createCustomer(data);
            }
            // Close modal on success
            handleModalClose();
        } catch (error) {
            // Error is already handled by the hook with toast notifications
            console.error("Failed to submit customer:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Handle edit button click from CustomerTable
     */
    const handleEdit = (customer: Customer) => {
        handleEditClick(customer);
    };

    /**
     * Handle delete button click from CustomerTable (for Task 5.2)
     */
    const handleDelete = (customer: Customer) => {
        setCustomerToDelete(customer);
        setDeleteConfirmOpen(true);
    };

    /**
     * Confirm delete action (for Task 5.2)
     */
    const handleDeleteConfirm = async () => {
        if (customerToDelete) {
            setIsDeleting(true);
            try {
                await deleteCustomer(customerToDelete.id);
            } catch (error) {
                // Error is already handled by the hook with toast notifications
                console.error("Failed to delete customer:", error);
            } finally {
                setIsDeleting(false);
                // Close dialog and reset state
                setDeleteConfirmOpen(false);
                setCustomerToDelete(null);
            }
        }
    };

    /**
     * Cancel delete action (for Task 5.2)
     */
    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setCustomerToDelete(null);
    };

    return (
        <Container maxWidth="lg">
            <Box
                sx={{
                    minHeight: "80vh",
                    py: 4,
                    bgcolor: "background.default",
                }}
            >
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

            <CustomerFormModal
                open={modalOpen}
                onClose={handleModalClose}
                mode={editingCustomer ? "edit" : "add"}
                customer={editingCustomer || undefined}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />

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
