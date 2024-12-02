const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const NodeID3 = require('node-id3'); // Importa la biblioteca `node-id3`

const musicLibraryPath = path.join(app.getPath('userData'), 'music-library.json'); // Ruta para guardar la biblioteca musical

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
            const musicFiles = await readMusicFiles(filePaths);
            saveMusicLibrary(musicFiles); // Guardar la biblioteca musical
            return musicFiles;
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

    for (const file of filePaths) {
        const tags = NodeID3.read(file);
        musicFiles.push({
            path: file,
            filename: path.basename(file),
            title: tags.title || path.basename(file),
            artist: tags.artist || 'Desconocido',
            album: tags.album || 'Desconocido',
            format: '.mp3',
        });
    }

    return musicFiles;
}

// Guardar la biblioteca musical en un archivo JSON
function saveMusicLibrary(musicLibrary) {
    fs.writeFileSync(musicLibraryPath, JSON.stringify(musicLibrary, null, 2));
}

// Cargar la biblioteca musical desde un archivo JSON
function loadMusicLibrary() {
    if (fs.existsSync(musicLibraryPath)) {
        const musicLibraryData = fs.readFileSync(musicLibraryPath);
        return JSON.parse(musicLibraryData);
    }
    return [];
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Proporcionar la biblioteca musical al frontend al iniciar la aplicación
ipcMain.handle('get-music-library', async (event) => {
    const musicLibrary = loadMusicLibrary();
    return musicLibrary;
});