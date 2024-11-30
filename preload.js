const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadMusicFiles: () => ipcRenderer.invoke('load-music-files'),
    getMusicLibrary: () => ipcRenderer.invoke('get-music-library')
});
