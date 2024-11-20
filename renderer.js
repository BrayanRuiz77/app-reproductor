class MusicPlayer {
    constructor() {
        this.audioPlayer = new Audio()
        this.playlist = []
        this.currentTrackIndex = 0
        this.musicLibrary = []
        this.isPlaying = false // Control del estado de reproducción
        this.initializeEventListeners()
    }

    initializeEventListeners() {
        // Botones de control de reproducción
        document.getElementById('playBtn').addEventListener('click', () => this.togglePlay())
        document.getElementById('nextBtn').addEventListener('click', () => this.playNext())
        document.getElementById('prevBtn').addEventListener('click', () => this.playPrevious())
        
        // Progreso de la canción
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress())
        this.audioPlayer.addEventListener('ended', () => this.playNext())
        
        // Barra de progreso clickeable
        document.querySelector('.progress-bar').addEventListener('click', (e) => this.seek(e))

        // Botón para cargar música
        document.getElementById('loadMusicBtn').addEventListener('click', () => this.loadMusicFolder())
    }

    async loadMusicFolder() {
        const folderPath = await window.electron.invoke('select-music-folder')
        if (folderPath) {
            const musicFiles = await this.scanMusicFiles(folderPath)
            this.musicLibrary = await this.parseMusicMetadata(musicFiles)
            this.displayLibrary()
        }
    }

    async scanMusicFiles(folderPath) {
        const files = await window.electron.invoke('read-folder', folderPath)
        return files
            .filter(file => ['.mp3', '.wav', '.ogg'].includes(path.extname(file).toLowerCase()))
            .map(file => path.join(folderPath, file))
    }

    async parseMusicMetadata(files) {
        const library = []
        for (const file of files) {
            try {
                const metadata = await window.electron.invoke('parse-metadata', file)
                library.push({
                    path: file,
                    title: metadata.title || path.basename(file),
                    artist: metadata.artist || 'Unknown Artist',
                    album: metadata.album || 'Unknown Album',
                    duration: metadata.duration
                })
            } catch (error) {
                console.error(`Error parsing metadata for ${file}:`, error)
            }
        }
        return library
    }

    displayLibrary() {
        const musicGrid = document.getElementById('musicGrid')
        musicGrid.innerHTML = ''
        
        this.musicLibrary.forEach((track, index) => {
            const trackElement = document.createElement('div')
            trackElement.className = 'track-item'
            trackElement.innerHTML = `
                <div class="track-info">
                    <h3>${track.title}</h3>
                    <p>${track.artist}</p>
                    <p>${track.album}</p>
                </div>
            `
            trackElement.addEventListener('click', () => this.playTrack(index))
            musicGrid.appendChild(trackElement)
        })
    }

    playTrack(index) {
        this.currentTrackIndex = index
        const track = this.musicLibrary[index]
        this.audioPlayer.src = track.path
        this.audioPlayer.play()
        this.isPlaying = true
        this.updateNowPlaying()
    }

    togglePlay() {
        if (this.audioPlayer.paused) {
            this.audioPlayer.play()
            this.isPlaying = true
        } else {
            this.audioPlayer.pause()
            this.isPlaying = false
        }
        document.getElementById('playBtn').textContent = this.isPlaying ? 'Pause' : 'Play'
    }

    playNext() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicLibrary.length
        this.playTrack(this.currentTrackIndex)
    }

    playPrevious() {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.musicLibrary.length) % this.musicLibrary.length
        this.playTrack(this.currentTrackIndex)
    }

    updateProgress() {
        const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100
        document.querySelector('.progress').style.width = `${progress}%`
    }

    seek(event) {
        const progressBar = document.querySelector('.progress-bar')
        const percent = event.offsetX / progressBar.offsetWidth
        this.audioPlayer.currentTime = percent * this.audioPlayer.duration
    }

    updateNowPlaying() {
        const track = this.musicLibrary[this.currentTrackIndex]
        document.querySelector('.song-title').textContent = track.title
        document.querySelector('.artist-name').textContent = track.artist
    }
}

// Inicializar el reproductor
const player = new MusicPlayer()
