import React, { useEffect, useState } from 'react';
import {
    Snackbar,
    Alert,
    Button,
    LinearProgress,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

declare global {
    interface Window {
        electron?: {
            onCheckingForUpdate: (callback: () => void) => void;
            onUpdateAvailable: (callback: (info: any) => void) => void;
            onUpdateNotAvailable: (callback: (info: any) => void) => void;
            onDownloadProgress: (callback: (progress: any) => void) => void;
            onUpdateDownloaded: (callback: (info: any) => void) => void;
            onUpdateError: (callback: (error: any) => void) => void;
            installUpdate: () => void;
            checkForUpdates: () => void;
        };
    }
}

export const UpdateNotification: React.FC = () => {
    const { t } = useTranslation();
    const [checking, setChecking] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateDownloaded, setUpdateDownloaded] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [updateInfo, setUpdateInfo] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const isElectron = !!window.electron;

    useEffect(() => {
        if (!isElectron) return;

        console.log('Setting up update listeners...');

        window.electron?.onCheckingForUpdate(() => {
            console.log('Checking for updates...');
            setChecking(true);
            setError(null);
        });

        window.electron?.onUpdateAvailable((info) => {
            console.log('Update available:', info);
            setChecking(false);
            setUpdateAvailable(true);
            setUpdateInfo(info);
        });

        window.electron?.onUpdateNotAvailable((info) => {
            console.log('No update available:', info);
            setChecking(false);
        });

        window.electron?.onDownloadProgress((progress) => {
            console.log('Download progress:', progress.percent);
            setDownloadProgress(progress.percent);
        });

        window.electron?.onUpdateDownloaded((info) => {
            console.log('Update downloaded:', info);
            setUpdateAvailable(false);
            setUpdateDownloaded(true);
            setUpdateInfo(info);
        });

        window.electron?.onUpdateError((err) => {
            console.error('Update error:', err);
            setChecking(false);
            setUpdateAvailable(false);
            setError(err.message || 'Failed to check for updates');
        });
    }, [isElectron]);

    const handleInstall = () => {
        window.electron?.installUpdate();
    };

    const handleCheckForUpdates = () => {
        window.electron?.checkForUpdates();
    };

    if (!isElectron) return null;

    return (
        <>
            {/* Checking for updates */}
            <Snackbar
                open={checking}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="info">
                    <Typography variant="body2">{t('update.checking')}</Typography>
                </Alert>
            </Snackbar>

            {/* Error */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity="error"
                    onClose={() => setError(null)}
                >
                    <Typography variant="body2">{error}</Typography>
                </Alert>
            </Snackbar>

            {/* Downloading update */}
            <Snackbar
                open={updateAvailable}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity="info"
                    sx={{ width: '100%', minWidth: 300 }}
                    action={
                        <IconButton
                            size="small"
                            onClick={() => setUpdateAvailable(false)}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    }
                >
                    <Typography variant="body2" fontWeight="medium">
                        {t('update.downloading', { version: updateInfo?.version })}
                    </Typography>
                    <Box sx={{ mt: 1, mb: 0.5 }}>
                        <LinearProgress
                            variant="determinate"
                            value={downloadProgress}
                        />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        {t('update.progress', { progress: Math.round(downloadProgress) })}
                    </Typography>
                </Alert>
            </Snackbar>

            {/* Update ready to install */}
            <Dialog
                open={updateDownloaded}
                onClose={() => setUpdateDownloaded(false)}
            >
                <DialogTitle>
                    {t('update.ready.title')}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        {t('update.ready.message', { version: updateInfo?.version })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        {t('update.ready.restartMessage')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUpdateDownloaded(false)}>
                        {t('common.later')}
                    </Button>
                    <Button onClick={handleInstall} variant="contained" autoFocus>
                        {t('update.restartAndInstall')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
