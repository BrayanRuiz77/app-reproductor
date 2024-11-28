class MusicPlayer {
    constructor() {
        this.audioPlayer = new Audio();
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.musicLibrary = [];
        this.playlists = {}; // { 'playlistName': [song1, song2, ...] }
        this.currentPlaylist = null;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.source = this.audioContext.createMediaElementSource(this.audioPlayer);
        this.bassFilter = this.audioContext.createBiquadFilter();
        this.midFilter = this.audioContext.createBiquadFilter();
        this.trebleFilter = this.audioContext.createBiquadFilter();
        this.initializeEventListeners();
        this.initializeNavigation();
        this.initializeFilters();
    }

    initializeEventListeners() {
        const loadMusicBtn = document.getElementById('loadMusicBtn');
        const playBtn = document.getElementById('playBtn');
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const progressBar = document.querySelector('.progress-bar');
        const createPlaylistBtn = document.getElementById('createPlaylistBtn');
        const savePlaylistBtn = document.getElementById('savePlaylistBtn');
        const closeModal = document.querySelector('.close');

        // Otros event listeners...

        // Abrir modal para crear playlist
        createPlaylistBtn.addEventListener('click', () => this.openCreatePlaylistModal());

        // Guardar nueva playlist
        savePlaylistBtn.addEventListener('click', () => this.saveNewPlaylist());

        // Cerrar modal
        closeModal.addEventListener('click', () => this.closeCreatePlaylistModal());

        // Controles de reproducción
        if (loadMusicBtn) loadMusicBtn.addEventListener('click', () => this.loadMusicFiles());
        if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
        if (nextBtn) nextBtn.addEventListener('click', () => this.playNext());
        if (prevBtn) prevBtn.addEventListener('click', () => this.playPrevious());
        if (progressBar) progressBar.addEventListener('click', (e) => this.seek(e));

        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('ended', () => this.playNext());
    }

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
        switch(sectionName) {
            case 'tracks':
                this.displayLibrary(this.musicLibrary);
                break;
            case 'albums':
                this.displayLibraryByAlbum();
                break;
            case 'artists':
                this.displayLibraryByArtist();
                break;
            case 'playlists':
                this.updatePlaylistsUI();
                break;
            case 'genres':
                this.displayLibraryByGenre();
                break;
            default:
                console.error('Sección desconocida:', sectionName);
        }
    }

    displayLibraryByAlbum() {
        const albums = this.groupBy(this.musicLibrary, 'album');
        this.displayGroupedLibrary(albums);
    }

    displayLibraryByArtist() {
        const artists = this.groupBy(this.musicLibrary, 'artist');
        this.displayGroupedLibrary(artists);
    }

    displayLibraryByGenre() {
        const genres = this.groupBy(this.musicLibrary, 'genre'); // Asegúrate de tener una propiedad `genre`
        this.displayGroupedLibrary(genres);
    }

    groupBy(array, key) {
        return array.reduce((result, currentValue) => {
            (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
            return result;
        }, {});
    }

    displayGroupedLibrary(groupedData) {
        const musicGrid = document.getElementById('musicGrid');
        musicGrid.innerHTML = '';

        for (const [groupName, tracks] of Object.entries(groupedData)) {
            const groupElement = document.createElement('div');
            groupElement.className = 'group-item';
            groupElement.innerHTML = `<h3>${groupName}</h3>`;
            
            tracks.forEach(track => {
                const trackElement = document.createElement('div');
                trackElement.className = 'track-item';
                trackElement.innerHTML = `
                    <div class="track-info">
                        <h3>${track.title}</h3>
                        <p>Artista: ${track.artist}</p>
                        <p>Álbum: ${track.album}</p>
                        <p>Formato: ${track.format}</p>
                    </div>
                `;
                trackElement.addEventListener('click', () => this.playTrack(this.musicLibrary.indexOf(track)));
                groupElement.appendChild(trackElement);
            });

            musicGrid.appendChild(groupElement);
        }
    }

    initializeFilters() { 
        this.bassFilter.type = 'lowshelf';
        this.bassFilter.frequency.value = 500;

        this.midFilter.type = 'peaking';
        this.midFilter.frequency.value = 1000;
        this.midFilter.Q.value = 1;

        this.trebleFilter.type = 'highshelf';
        this.trebleFilter.frequency.value = 3000;

        this.source.connect(this.bassFilter);
        this.bassFilter.connect(this.midFilter);
        this.midFilter.connect(this.trebleFilter);
        this.trebleFilter.connect(this.audioContext.destination);

        document.getElementById('bass').addEventListener('input', (e) => {
            this.bassFilter.gain.value = e.target.value;
        });

        document.getElementById('mid').addEventListener('input', (e) => {
            this.midFilter.gain.value = e.target.value;
        });

        document.getElementById('treble').addEventListener('input', (e) => {
            this.trebleFilter.gain.value = e.target.value;
        });
    }

    openCreatePlaylistModal() {
        const modal = document.getElementById('createPlaylistModal');
        modal.style.display = 'block';
    }

    closeCreatePlaylistModal() {
        const modal = document.getElementById('createPlaylistModal');
        modal.style.display = 'none';
    }

    saveNewPlaylist() {
        const playlistName = document.getElementById('newPlaylistName').value;
        if (playlistName && !this.playlists[playlistName]) {
            this.playlists[playlistName] = [];
            this.updatePlaylistsUI();
            this.closeCreatePlaylistModal();
        }
    }

    updatePlaylistsUI() {
        const playlistsContainer = document.getElementById('playlistsContainer');
        playlistsContainer.innerHTML = '';

        for (const [playlistName, songs] of Object.entries(this.playlists)) {
            const playlistElement = document.createElement('div');
            playlistElement.className = 'playlist-item';
            playlistElement.innerHTML = `<span>${playlistName}</span>`;
            playlistElement.addEventListener('click', () => this.selectPlaylist(playlistName));
            playlistsContainer.appendChild(playlistElement);
        }
    }

    selectPlaylist(playlistName) {
        this.currentPlaylist = playlistName;
        this.displayLibrary(this.playlists[playlistName]);
    }

    async loadMusicFiles() {
        try {
            const tracks = await window.electronAPI.loadMusicFiles();
            if (tracks) {
                this.musicLibrary = tracks;
                this.displayLibrary();
            } else {
                console.error('No se cargaron archivos de música.');
            }
        } catch (error) {
            console.error('Error al cargar los archivos de música:', error);
        }
    }

    displayLibrary(tracks = this.musicLibrary) {
        const musicGrid = document.getElementById('musicGrid');
        musicGrid.innerHTML = '';

        if (tracks.length === 0) {
            musicGrid.innerHTML = '<p>No se encontraron archivos de música</p>';
            return;
        }

        tracks.forEach((track, index) => {
            const trackElement = document.createElement('div');
            trackElement.className = 'track-item';
            trackElement.innerHTML = `
                <div class="track-info">
                    <h3>${track.title}</h3>
                    <p>Artista: ${track.artist}</p>
                    <p>Álbum: ${track.album}</p>
                    <p>Formato: ${track.format}</p>
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

        // Cambiar el icono a pausar
        const playBtnIcon = document.querySelector('#playBtn i');
        playBtnIcon.classList.remove('fa-play');
        playBtnIcon.classList.add('fa-pause');
    }

    togglePlay() {
        const playBtnIcon = document.querySelector('#playBtn i');
        if (this.audioPlayer.paused) {
            this.audioPlayer.play();
            playBtnIcon.classList.remove('fa-play');
            playBtnIcon.classList.add('fa-pause');
        } else {
            this.audioPlayer.pause();
            playBtnIcon.classList.remove('fa-pause');
            playBtnIcon.classList.add('fa-play');
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
