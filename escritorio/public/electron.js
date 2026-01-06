const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let devCandidates = [];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  const fileUrl = `file://${path.join(__dirname, '../build/index.html')}`;
  const envUrl = process.env.ELECTRON_START_URL;
  if (envUrl) {
    devCandidates = [envUrl, 'http://localhost:3001', 'http://localhost:3000', 'http://localhost:3002'];
  } else if (process.env.NODE_ENV === 'development') {
    devCandidates = ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:3002'];
  } else {
    devCandidates = [];
  }

  const tryLoad = async (candidates) => {
    if (!candidates || candidates.length === 0) {
      mainWindow.loadURL(fileUrl);
      return;
    }
    const url = candidates[0];
    try {
      await mainWindow.loadURL(url);
    } catch (e) {
      setTimeout(() => tryLoad(candidates.slice(1)), 500);
    }
  };

  tryLoad(devCandidates);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  });

  // Menu personalizado
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Salir',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Ver',
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
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.webContents.on('did-fail-load', () => {
    if (devCandidates && devCandidates.length > 1) {
      const next = devCandidates.slice(1);
      devCandidates = next;
      tryLoad(next);
    }
  });
}

app.whenReady().then(createWindow);

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

// Comunicación entre procesos
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});