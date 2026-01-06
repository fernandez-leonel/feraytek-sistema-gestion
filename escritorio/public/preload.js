const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Escuchar eventos del main process
  on: (channel, func) => {
    const validChannels = ['app-update', 'auth-status'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  
  // Remover listeners
  removeListener: (channel, func) => {
    ipcRenderer.removeListener(channel, func);
  }
});