import React, { useState } from "react";
import { Box, Typography, Container, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useEmployeeCrud } from "../hooks/useEmployeeCrud";
import { EmployeeTable, EmployeeForm } from "../components/employee";
import { Employee, EmployeeFormData } from "../types/employee";
import { DeleteConfirmDialog } from "../components/ui/DeleteConfirmDialog";
import { EmployeeId } from "../evolu/evolu-db";

export function EmployeePage() {
    const { t } = useTranslation();
    const {
        employees,
        isLoading,
        createEmployee,
        updateEmployee,
        deleteEmployee,
    } = useEmployeeCrud();

    const [viewMode, setViewMode] = useState<"table" | "add" | "edit">("table");
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleAddClick = () => {
        setViewMode("add");
        setEditingEmployee(null);
    };

    const handleEdit = (employee: Employee) => {
        setViewMode("edit");
        setEditingEmployee(employee);
    };

    const handleCancel = () => {
        setViewMode("table");
        setEditingEmployee(null);
    };

    const handleSubmit = async (
        data: EmployeeFormData,
        customFieldValues?: Record<string, string | boolean | null>
    ) => {
        setIsSubmitting(true);
        try {
            let employeeId: EmployeeId | null = null;

            if (editingEmployee) {
                await updateEmployee(editingEmployee.id, data);
                employeeId = editingEmployee.id;
            } else {
                employeeId = await createEmployee(data);
            }

            if (employeeId && customFieldValues && Object.keys(customFieldValues).length > 0) {
                try {
                    const { saveCustomFieldValuesForEmployee } = await import('../evolu/customFieldUtils');
                    await saveCustomFieldValuesForEmployee(employeeId, customFieldValues);
                } catch (cfError) {
                    console.error("Failed to save custom field values:", cfError);
                }
            }

            handleCancel();
        } catch (error) {
            console.error("Failed to submit employee:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (employee: Employee) => {
        setEmployeeToDelete(employee);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (employeeToDelete) {
            setIsDeleting(true);
            try {
                await deleteEmployee(employeeToDelete.id);
            } catch (error) {
                console.error("Failed to delete employee:", error);
            } finally {
                setIsDeleting(false);
                setDeleteConfirmOpen(false);
                setEmployeeToDelete(null);
            }
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setEmployeeToDelete(null);
    };

    const initialData: EmployeeFormData | undefined = editingEmployee
        ? {
              firstName: editingEmployee.firstName ?? "",
              lastName: editingEmployee.lastName ?? "",
              phone: editingEmployee.phone ?? "",
              email: editingEmployee.email ?? "",
          }
        : undefined;

    const formTitle = viewMode === "add"
        ? t("employee.form.addEmployee")
        : t("employee.form.updateEmployee");

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
                        {t("subject.employeePage.title")}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {t("subject.employeePage.description")}
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleAddClick}
                            size="large"
                        >
                            {t("employee.actions.add")}
                        </Button>
                    </Box>

                    <EmployeeTable
                        employees={employees}
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
                        <EmployeeForm
                            mode={viewMode as "add" | "edit"}
                            initialData={initialData}
                            employeeId={editingEmployee?.id || null}
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
                    employeeToDelete
                        ? `${employeeToDelete.firstName || ""} ${employeeToDelete.lastName || ""}`.trim() || t("employee.title")
                        : t("employee.title")
                }
                itemType={t("employee.title")}
                onConfirm={handleDeleteConfirm}
                onClose={handleDeleteCancel}
                isDeleting={isDeleting}
            />
        </Container>
    );
}
