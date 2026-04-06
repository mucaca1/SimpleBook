import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { createMenu } from './menu';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Disable auto-download (we'll control when to download)
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

// Setup auto-updater event listeners BEFORE any checks
function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
    mainWindow?.webContents.send('checking-for-update');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    mainWindow?.webContents.send('update-available', info);
    // Auto-download the update
    autoUpdater.downloadUpdate();
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
    mainWindow?.webContents.send('update-not-available', info);
  });

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err);
    mainWindow?.webContents.send('update-error', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    log.info(logMessage);
    mainWindow?.webContents.send('download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    mainWindow?.webContents.send('update-downloaded', info);
  });
}

// Handle install update request from renderer
ipcMain.on('install-update', () => {
  log.info('Installing update...');
  autoUpdater.quitAndInstall(false, true);
});

// Handle manual update check request
ipcMain.on('check-for-updates', () => {
  log.info('Manual update check requested');
  autoUpdater.checkForUpdates();
});

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open DevTools only in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  createMenu(mainWindow);

  // Log when page is ready
  mainWindow.webContents.on('did-finish-load', () => {
    log.info('Window loaded successfully');
  });
};

// App lifecycle
app.whenReady().then(() => {
  // Setup auto-updater FIRST
  setupAutoUpdater();

  // Create window
  createWindow();

  // Check for updates after window is ready
  if (mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      log.info('Checking for updates after app start...');
      setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify().catch((err) => {
          log.error('Failed to check for updates:', err);
        });
      }, 3000);
    });
  }

  // Check for updates periodically (every hour)
  setInterval(() => {
    log.info('Periodic update check...');
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      log.error('Failed periodic update check:', err);
    });
  }, 60 * 60 * 1000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});