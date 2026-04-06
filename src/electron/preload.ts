// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    // Update notifications
    onCheckingForUpdate: (callback: () => void) => {
        ipcRenderer.on('checking-for-update', () => callback());
    },
    onUpdateAvailable: (callback: (info: any) => void) => {
        ipcRenderer.on('update-available', (_event, info) => callback(info));
    },
    onUpdateNotAvailable: (callback: (info: any) => void) => {
        ipcRenderer.on('update-not-available', (_event, info) => callback(info));
    },
    onDownloadProgress: (callback: (progress: any) => void) => {
        ipcRenderer.on('download-progress', (_event, progress) => callback(progress));
    },
    onUpdateDownloaded: (callback: (info: any) => void) => {
        ipcRenderer.on('update-downloaded', (_event, info) => callback(info));
    },
    onUpdateError: (callback: (error: any) => void) => {
        ipcRenderer.on('update-error', (_event, error) => callback(error));
    },

    // Actions
    installUpdate: () => {
        ipcRenderer.send('install-update');
    },
    checkForUpdates: () => {
        ipcRenderer.send('check-for-updates');
    },
});