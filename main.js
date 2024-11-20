const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

function createWindow () {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })

    // Cargar el archivo index.html
    win.loadFile('index.html')
    
    // Opcional: Abrir las herramientas de desarrollo
    // win.webContents.openDevTools()
}

app.whenReady().then(() => {
    require('@electron/remote/main').initialize()
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// Manejar la selección de carpeta de música
ipcMain.handle('select-music-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
})