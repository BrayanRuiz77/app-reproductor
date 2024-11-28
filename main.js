const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const NodeID3 = require('node-id3'); // Importa la biblioteca `node-id3`

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        backgroundColor: '#1a1a1a'
    });

    win.loadFile('index.html');
    win.webContents.openDevTools();
}

// Manejador para cargar archivos de música
ipcMain.handle('load-music-files', async (event) => {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Audio Files', extensions: ['mp3'] } // `node-id3` es específico para archivos MP3
            ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const filePaths = result.filePaths;
            return await readMusicFiles(filePaths);
        }
        return null;
    } catch (error) {
        console.error('Error al cargar archivos de música:', error);
        return null;
    }
});

// Función para leer archivos de música con metadatos
async function readMusicFiles(filePaths) {
    const musicFiles = [];

    try {
        for (const file of filePaths) {
            const ext = path.extname(file).toLowerCase();

            if (ext === '.mp3') {
                try {
                    const tags = NodeID3.read(file); // Usar `NodeID3.read`
                    musicFiles.push({
                        path: file,
                        filename: path.basename(file),
                        title: tags.title || path.basename(file, ext),
                        artist: tags.artist || 'Desconocido',
                        album: tags.album || 'Desconocido',
                        duration: 'Desconocido', // `node-id3` no proporciona duración
                        format: ext
                    });
                } catch (error) {
                    console.error(`Error leyendo metadatos de ${file}:`, error);
                }
            }
        }

        return musicFiles;
    } catch (error) {
        console.error('Error al leer archivos de música:', error);
        return [];
    }
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
