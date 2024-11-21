const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const mm = require('music-metadata')

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
  })

  win.loadFile('index.html')
  // Habilitar DevTools para depuración
  win.webContents.openDevTools()
}

// Manejador para cargar carpeta de música
ipcMain.handle('load-music-folder', async (event) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0];
      return await readMusicFiles(folderPath);
    }
    return null;
  } catch (error) {
    console.error('Error al cargar carpeta de música:', error);
    return null;
  }
});

// Función para leer archivos de música con metadatos
async function readMusicFiles(folderPath) {
  const musicExtensions = ['.mp3', '.wav', '.flac', '.ogg', '.m4a'];
  const musicFiles = [];

  try {
    const files = await fs.promises.readdir(folderPath);
    
    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      const ext = path.extname(file).toLowerCase();
      
      if (musicExtensions.includes(ext)) {
        try {
          const metadata = await mm.parseFile(fullPath);
          musicFiles.push({
            path: fullPath,
            filename: file,
            title: metadata.common.title || path.basename(file, ext),
            artist: metadata.common.artist || 'Desconocido',
            album: metadata.common.album || 'Desconocido',
            duration: metadata.format.duration
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
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})