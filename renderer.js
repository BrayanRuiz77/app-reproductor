const { dialog } = require('electron').remote;
const fs = require('fs');
const path = require('path');

class MusicPlayer {
    constructor() {
        this.audioPlayer = new Audio();
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.musicLibrary = [];
        this.initializeEventListeners();
        this.initializeNavigation();
    }

    // Inicializar eventos
    initializeEventListeners() {
        const loadMusicBtn = document.getElementById('loadMusicBtn');
        const playBtn = document.getElementById('playBtn');
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const progressBar = document.querySelector('.progress-bar');

        if (loadMusicBtn) loadMusicBtn.addEventListener('click', () => this.loadMusicFolder());
        if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
        if (nextBtn) nextBtn.addEventListener('click', () => this.playNext());
        if (prevBtn) prevBtn.addEventListener('click', () => this.playPrevious());
        if (progressBar) progressBar.addEventListener('click', (e) => this.seek(e));

        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('ended', () => this.playNext());
    }

    // Inicializar navegación
    initializeNavigation() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });
    }

    navigateToSection(sectionName) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(sec => sec.classList.remove('active'));

        const activeSection = document.getElementById(`${sectionName}-section`);
        if (activeSection) {
            activeSection.classList.add('active');
        }

        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionName) {
                item.classList.add('active');
            }
        });
    }

    async loadMusicFolder() {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openDirectory']
            });

            if (!result.canceled) {
                const folderPath = result.filePaths[0];
                await this.scanMusicFiles(folderPath);
            }
        } catch (error) {
            console.error('Error al cargar la carpeta de música:', error);
            this.showErrorMessage('No se pudo cargar la carpeta de música');
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
                const track = {
                    path: filePath,
                    title: path.basename(file, path.extname(file)),
                    artist: 'Desconocido',
                    album: 'Desconocido'
                };
                this.musicLibrary.push(track);
            }

            this.displayLibrary();
        } catch (error) {
            console.error('Error al escanear archivos:', error);
        }
    }

    displayLibrary() {
        const musicGrid = document.getElementById('musicGrid');
        musicGrid.innerHTML = '';

        if (this.musicLibrary.length === 0) {
            musicGrid.innerHTML = '<p>No se encontraron archivos de música</p>';
            return;
        }

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

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }
}

// Inicializar el reproductor
document.addEventListener('DOMContentLoaded', () => {
    const player = new MusicPlayer();
});
