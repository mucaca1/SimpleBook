import { app, BrowserWindow, Menu } from "electron";
import { autoUpdater } from "electron-updater";

const name = app.getName();

export function createMenu(bw: BrowserWindow) {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
            label: name,
            submenu: [
                {
                    label: 'Settings'
                },
                {
                    label: 'Update app',
                    click: () => {
                        autoUpdater.checkForUpdates().catch((err) => {
                            console.error('Failed to check for updates:', err);
                        });
                    }
                },
                {
                    label: 'Source',
                    click: async () => {
                        const { shell } = require('electron')
                        await shell.openExternal('https://github.com/mucaca1/todo-demo-app')
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        }
    ]));
};