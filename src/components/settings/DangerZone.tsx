import React, { useState } from "react";
import {
    Box,
    Button,
    Typography,
    Card,
    CardContent,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Stack,
    Alert,
} from "@mui/material";
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { evolu } from "../../evolu-init";
import { TypeConfirmDialog } from "../ui/TypeConfirmDialog";
import { DeleteConfirmDialog } from "../ui/DeleteConfirmDialog";
import { AppOwner } from "@evolu/common";

type MnemonicDialogState = {
    open: boolean;
    mnemonic: string;
    isVisible: boolean;
};

type DeleteConfirmationStep = 1 | 2 | 3 | null;

export function DangerZone() {
    const { t } = useTranslation();

    // Show Mnemonic state
    const [mnemonicDialog, setMnemonicDialog] = useState<MnemonicDialogState>({
        open: false,
        mnemonic: "",
        isVisible: false,
    });

    // Import Mnemonic state
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importMnemonic, setImportMnemonic] = useState("");
    const [importWarningOpen, setImportWarningOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Delete Owner state
    const [deleteStep, setDeleteStep] = useState<DeleteConfirmationStep>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Show Mnemonic handlers
    const handleShowMnemonic = async () => {
        try {
            const owner: Promise<AppOwner> = evolu.appOwner;
            const mnemonic = (await owner).mnemonic;
            if (!mnemonic) {
                toast.error("Failed to retrieve mnemonic");
                return;
            }
            setMnemonicDialog({
                open: true,
                mnemonic,
                isVisible: false,
            });
        } catch (error) {
            console.error("Failed to get mnemonic:", error);
            toast.error("Failed to retrieve mnemonic");
        }
    };

    const handleCloseMnemonicDialog = () => {
        setMnemonicDialog({
            open: false,
            mnemonic: "",
            isVisible: false,
        });
    };

    const handleToggleMnemonicVisibility = () => {
        setMnemonicDialog((prev) => ({ ...prev, isVisible: !prev.isVisible }));
    };

    const handleCopyMnemonic = () => {
        navigator.clipboard.writeText(mnemonicDialog.mnemonic);
        toast.success("Mnemonic copied to clipboard");
    };

    // Import Mnemonic handlers
    const handleOpenImportDialog = () => {
        setImportDialogOpen(true);
        setImportMnemonic("");
    };

    const handleCloseImportDialog = () => {
        setImportDialogOpen(false);
        setImportMnemonic("");
    };

    const handleImportMnemonicSubmit = () => {
        const words = importMnemonic.trim().split(/\s+/);
        if (words.length !== 12 && words.length !== 24) {
            toast.error("Mnemonic must be 12 or 24 words");
            return;
        }

        setImportWarningOpen(true);
    };

    const handleImportWarningConfirm = async () => {
        setIsImporting(true);
        try {
            await evolu.resetAppOwner({ mnemonic: importMnemonic.trim(), reload: false });
            toast.success("Mnemonic imported successfully. Reloading...");
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error("Failed to import mnemonic:", error);
            toast.error("Failed to import mnemonic");
        } finally {
            setIsImporting(false);
        }
    };

    const handleImportWarningClose = () => {
        setImportWarningOpen(false);
    };

    // Delete Owner handlers
    const handleDeleteOwnerStep1 = () => {
        setDeleteStep(1);
    };

    const handleDeleteOwnerStep1Confirm = () => {
        setDeleteStep(2);
    };

    const handleDeleteOwnerStep2Confirm = () => {
        setDeleteStep(3);
    };

    const handleDeleteOwnerStep3Confirm = async () => {
        setIsDeleting(true);
        try {
            await evolu.resetAppOwner({ reload: false });
            toast.success("App owner deleted. Reloading...");
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error("Failed to delete owner:", error);
            toast.error("Failed to delete owner");
        } finally {
            setIsDeleting(false);
            setDeleteStep(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteStep(null);
    };

    return (
        <Stack spacing={3}>
            {/* Show Mnemonic */}
            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        <Typography variant="h6" gutterBottom>
                            {t("settings.dangerZone.showMnemonic.title")}
                        </Typography>
                        <Alert severity="info">
                            {t("settings.dangerZone.showMnemonic.description") ||
                                "View your mnemonic phrase for backup purposes."}
                        </Alert>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleShowMnemonic}
                            sx={{ alignSelf: "flex-start" }}
                        >
                            {t("settings.dangerZone.showMnemonic.button") || "Show Mnemonic"}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* Import Mnemonic */}
            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        <Typography variant="h6" gutterBottom>
                            {t("settings.dangerZone.importMnemonic.title")}
                        </Typography>
                        <Alert severity="warning">
                            {t("settings.dangerZone.importMnemonic.warning") ||
                                "Importing a mnemonic will replace your current database owner. This action cannot be undone."}
                        </Alert>
                        <Button
                            variant="outlined"
                            color="warning"
                            onClick={handleOpenImportDialog}
                            sx={{ alignSelf: "flex-start" }}
                        >
                            {t("settings.dangerZone.importMnemonic.button") || "Import Mnemonic"}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* Delete Owner */}
            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        <Typography variant="h6" gutterBottom color="error">
                            {t("settings.dangerZone.deleteOwner.title") || "Delete Owner"}
                        </Typography>
                        <Alert severity="error">
                            {t("settings.dangerZone.deleteOwner.warning") ||
                                "Deleting the owner will permanently remove your mnemonic phrase and reset the database."}
                        </Alert>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleDeleteOwnerStep1}
                            sx={{ alignSelf: "flex-start" }}
                        >
                            {t("settings.dangerZone.deleteOwner.button") || "Delete Owner"}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* Show Mnemonic Dialog */}
            <Dialog open={mnemonicDialog.open} onClose={handleCloseMnemonicDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{t("settings.dangerZone.showMnemonic.dialogTitle") || "Your Mnemonic"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            {t("settings.dangerZone.showMnemonic.securityWarning") ||
                                "Keep your mnemonic phrase secure and never share it with anyone."}
                        </Alert>
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: "action.hover",
                                borderRadius: 1,
                                fontFamily: "monospace",
                                wordBreak: "break-all",
                                position: "relative",
                            }}
                        >
                            <Typography
                                variant="body1"
                                sx={{
                                    filter: mnemonicDialog.isVisible ? "none" : "blur(4px)",
                                    userSelect: mnemonicDialog.isVisible ? "text" : "none",
                                    transition: "filter 0.3s",
                                }}
                            >
                                {mnemonicDialog.mnemonic}
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton
                                onClick={handleToggleMnemonicVisibility}
                                color="primary"
                                title={mnemonicDialog.isVisible ? "Hide" : "Show"}
                            >
                                {mnemonicDialog.isVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                            <IconButton onClick={handleCopyMnemonic} color="primary" title="Copy to clipboard">
                                <ContentCopyIcon />
                            </IconButton>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseMnemonicDialog}>{t("common.close") || "Close"}</Button>
                </DialogActions>
            </Dialog>

            {/* Import Mnemonic Dialog */}
            <Dialog open={importDialogOpen} onClose={handleCloseImportDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{t("settings.dangerZone.importMnemonic.dialogTitle") || "Import Mnemonic"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Alert severity="warning">
                            {t("settings.dangerZone.importMnemonic.dialogWarning") ||
                                "This will replace your current database owner. Make sure you have backed up your current mnemonic."}
                        </Alert>
                        <TextField
                            autoFocus
                            fullWidth
                            multiline
                            rows={3}
                            label={t("settings.dangerZone.importMnemonic.label") || "Enter your 12 or 24 word mnemonic"}
                            value={importMnemonic}
                            onChange={(e) => setImportMnemonic(e.target.value)}
                            placeholder="word1 word2 word3 ..."
                            helperText={t("settings.dangerZone.importMnemonic.helper") || "Separate words with spaces"}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseImportDialog} disabled={isImporting}>
                        {t("common.cancel") || "Cancel"}
                    </Button>
                    <Button
                        onClick={handleImportMnemonicSubmit}
                        variant="contained"
                        color="warning"
                        disabled={!importMnemonic.trim() || isImporting}
                    >
                        {isImporting ? "Importing..." : (t("settings.dangerZone.importMnemonic.confirm") || "Import")}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Import Mnemonic Warning Dialog */}
            <DeleteConfirmDialog
                open={importWarningOpen}
                itemName=""
                itemType={t("settings.dangerZone.importMnemonic.itemType") || "mnemonic"}
                onConfirm={handleImportWarningConfirm}
                onClose={handleImportWarningClose}
                isDeleting={isImporting}
            />

            {/* Delete Owner - Step 1: First Warning */}
            <DeleteConfirmDialog
                open={deleteStep === 1}
                itemName=""
                itemType={t("settings.dangerZone.deleteOwner.itemType") || "app owner"}
                onConfirm={handleDeleteOwnerStep1Confirm}
                onClose={handleDeleteCancel}
                isDeleting={isDeleting}
            />

            {/* Delete Owner - Step 2: Type DELETE to confirm */}
            <TypeConfirmDialog
                open={deleteStep === 2}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteOwnerStep2Confirm}
                title={t("settings.dangerZone.deleteOwner.typeConfirmTitle") || "Confirm Deletion"}
                message={t("settings.dangerZone.deleteOwner.typeConfirmMessage") ||
                    "Type DELETE below to confirm you want to permanently delete the app owner."}
                confirmText={t("settings.dangerZone.deleteOwner.confirmButton") || "Delete Owner"}
                expectedText="DELETE"
                isConfirming={isDeleting}
            />

            {/* Delete Owner - Step 3: Final Warning */}
            <DeleteConfirmDialog
                open={deleteStep === 3}
                itemName=""
                itemType="final confirmation"
                onConfirm={handleDeleteOwnerStep3Confirm}
                onClose={handleDeleteCancel}
                isDeleting={isDeleting}
            />
        </Stack>
    );
}
