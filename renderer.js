// renderer.js
class MusicPlayer {
    constructor() {
        this.audioPlayer = new Audio()
        this.playlist = []
        this.currentTrackIndex = 0
        this.musicLibrary = []
        this.initializeEventListeners()
    }

    initializeEventListeners() {
        // Botón de cargar música
        document.getElementById('loadMusicBtn').addEventListener('click', () => this.loadMusicFolder())

        // Controles de reproducción
        document.getElementById('playBtn').addEventListener('click', () => this.togglePlay())
        document.getElementById('nextBtn').addEventListener('click', () => this.playNext())
        document.getElementById('prevBtn').addEventListener('click', () => this.playPrevious())
        
        // Progreso de la canción
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress())
        this.audioPlayer.addEventListener('ended', () => this.playNext())
        
        // Barra de progreso clickeable
        document.querySelector('.progress-bar').addEventListener('click', (e) => this.seek(e))
    }

    async loadMusicFolder() {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openDirectory']
            });
            
            if (!result.canceled) {
                const folderPath = result.filePaths[0];
                console.log('Folder selected:', folderPath);
                await this.scanMusicFiles(folderPath);
            }
        } catch (error) {
            console.error('Error al cargar la carpeta de música:', error);
        }
    }

    async scanMusicFiles(folderPath) {
        try {
            const files = await fs.promises.readdir(folderPath);
            const musicFiles = files.filter(file => 
                ['.mp3', '.wav', '.ogg'].includes(path.extname(file).toLowerCase())
            );

            this.musicLibrary = [];
            for (const file of musicFiles) {
                const filePath = path.join(folderPath, file);
                try {
                    // Crear un objeto básico para cada archivo de música
                    const track = {
                        path: filePath,
                        title: path.basename(file, path.extname(file)),
                        artist: 'Desconocido',
                        album: 'Desconocido'
                    };
                    this.musicLibrary.push(track);
                } catch (error) {
                    console.error(`Error al procesar el archivo ${file}:`, error);
                }
            }

            this.displayLibrary();
        } catch (error) {
            console.error('Error al escanear archivos:', error);
        }
    }

    displayLibrary() {
        const musicGrid = document.getElementById('musicGrid');
        musicGrid.innerHTML = '';
        
        this.musicLibrary.forEach((track, index) => {
            const trackElement = document.createElement('div');
            trackElement.className = 'track-item';
            trackElement.innerHTML = `
                <div class="track-info">
                    <h3>${track.title}</h3>
                    <p>${track.artist}</p>
                    <p>${track.album}</p>
                </div>
            `;
            trackElement.addEventListener('click', () => this.playTrack(index));
            musicGrid.appendChild(trackElement);
        });
    }

    playTrack(index) {
        this.currentTrackIndex = index;
        const track = this.musicLibrary[index];
        this.audioPlayer.src = track.path;
        this.audioPlayer.play();
        this.updateNowPlaying();
        
        // Actualizar el botón de reproducción
        document.getElementById('playBtn').textContent = 'Pausar';
    }

    togglePlay() {
        if (this.audioPlayer.paused) {
            this.audioPlayer.play();
            document.getElementById('playBtn').textContent = 'Pausar';
        } else {
            this.audioPlayer.pause();
            document.getElementById('playBtn').textContent = 'Reproducir';
        }
    }

    playNext() {
        if (this.musicLibrary.length > 0) {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicLibrary.length;
            this.playTrack(this.currentTrackIndex);
        }
    }

    playPrevious() {
        if (this.musicLibrary.length > 0) {
            this.currentTrackIndex = (this.currentTrackIndex - 1 + this.musicLibrary.length) % this.musicLibrary.length;
            this.playTrack(this.currentTrackIndex);
        }
    }

    updateProgress() {
        if (this.audioPlayer.duration) {
            const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            document.querySelector('.progress').style.width = `${progress}%`;
        }
    }

    seek(event) {
        const progressBar = document.querySelector('.progress-bar');
        const percent = event.offsetX / progressBar.offsetWidth;
        this.audioPlayer.currentTime = percent * this.audioPlayer.duration;
    }

    updateNowPlaying() {
        const track = this.musicLibrary[this.currentTrackIndex];
        document.querySelector('.song-title').textContent = track.title;
        document.querySelector('.artist-name').textContent = track.artist;
    }
}

// Importaciones necesarias
const { dialog } = require('electron').remote;
const fs = require('fs');
const path = require('path');

// Inicializar el reproductor
document.addEventListener('DOMContentLoaded', () => {
    const player = new MusicPlayer();
});