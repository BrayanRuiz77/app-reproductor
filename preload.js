const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadMusicFolder: () => ipcRenderer.invoke('load-music-folder')
})