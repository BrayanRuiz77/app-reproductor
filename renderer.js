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
        this.isShuffle = false;
        this.isRepeat = false;
        this.initializeEventListeners();
        this.initializeNavigation();
        this.initializeFilters();
        this.loadMusicLibrary(); // Cargar la biblioteca musical al iniciar
    }

    initializeEventListeners() {
        const loadMusicBtn = document.getElementById('loadMusicBtn');
        const playBtn = document.getElementById('playBtn');
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const shuffleBtn = document.getElementById('shuffleBtn');
        const repeatBtn = document.getElementById('repeatBtn');
        const createPlaylistBtn = document.getElementById('createPlaylistBtn');
        const savePlaylistBtn = document.getElementById('savePlaylistBtn');
        const closeModal = document.querySelector('.close');
        const progressBar = document.querySelector('.progress-bar');

        if (loadMusicBtn) loadMusicBtn.addEventListener('click', () => this.loadMusicFiles());
        if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
        if (nextBtn) nextBtn.addEventListener('click', () => this.playNext());
        if (prevBtn) prevBtn.addEventListener('click', () => this.playPrevious());
        if (shuffleBtn) shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        if (repeatBtn) repeatBtn.addEventListener('click', () => this.toggleRepeat());
        if (createPlaylistBtn) createPlaylistBtn.addEventListener('click', () => this.openCreatePlaylistModal());
        if (savePlaylistBtn) savePlaylistBtn.addEventListener('click', () => this.saveNewPlaylist());
        if (closeModal) closeModal.addEventListener('click', () => this.closeCreatePlaylistModal());
        if (progressBar) progressBar.addEventListener('click', (e) => this.seek(e));

        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('ended', () => this.handleTrackEnd());
    }

    initializeNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.getAttribute('data-section');
                console.log('Navegando a la sección:', section);  // Añadir log
                this.navigateToSection(section);
            });
        });
    }

    navigateToSection(sectionName) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(sec => sec.style.display = 'none');
        console.log('Sección seleccionada:', sectionName);  // Añadir log

        const activeSection = document.getElementById(`${sectionName}-section`);
        if (activeSection) {
            activeSection.style.display = 'block';
        }

        switch (sectionName) {
            case 'tracks':
                console.log('Mostrando tracks:', this.musicLibrary);
                this.displayLibrary(this.musicLibrary, 'tracks-section');
                break;
            case 'albums':
                console.log('Mostrando álbumes:', this.musicLibrary);
                this.displayLibraryByAlbum();
                break;
            case 'artists':
                console.log('Mostrando artistas:', this.musicLibrary);
                this.displayLibraryByArtist();
                break;
            case 'playlists':
                console.log('Mostrando playlists:', this.playlists);
                this.updatePlaylistsUI();
                if (this.currentPlaylist) {
                    this.displayLibrary(this.playlists[this.currentPlaylist], 'playlists-section');
                }
                break;
            case 'genres':
                console.log('Mostrando géneros:', this.musicLibrary);
                this.displayLibraryByGenre();
                break;
            case 'equalizer':
                console.log('Mostrando ecualizador');  // Añadir log
                break;
            default:
                console.error('Sección desconocida:', sectionName);
        }
    }

    displayLibrary(tracks, sectionId) {
        const musicGrid = document.getElementById(sectionId);
        musicGrid.innerHTML = '';

        console.log('Mostrando biblioteca:', tracks);  // Añadir log

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
                    <button class="delete-btn" data-index="${index}">Eliminar</button>
                </div>
            `;

            trackElement.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // Para evitar que se inicie la reproducción al eliminar
                this.deleteTrack(index);
            });

            trackElement.addEventListener('click', () => this.playTrack(index));
            musicGrid.appendChild(trackElement);
        });
    }

    deleteTrack(index) {
        this.musicLibrary.splice(index, 1); // Eliminar la canción de la biblioteca
        this.displayLibrary(this.musicLibrary); // Actualizar la interfaz
    }

    displayLibraryByAlbum() {
        const albums = this.groupBy(this.musicLibrary, 'album');
        console.log('Mostrando por álbum:', albums);  // Añadir log
        this.displayGroupedLibrary(albums, 'albums-section');
    }

    displayLibraryByArtist() {
        const artists = this.groupBy(this.musicLibrary, 'artist');
        console.log('Mostrando por artista:', artists);  // Añadir log
        this.displayGroupedLibrary(artists, 'artists-section');
    }

    displayLibraryByGenre() {
        const genres = this.groupBy(this.musicLibrary, 'genre');
        console.log('Mostrando por género:', genres);  // Añadir log
        this.displayGroupedLibrary(genres, 'genres-section');
    }

    groupBy(array, key) {
        return array.reduce((result, currentValue) => {
            (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
            return result;
        }, {});
    }

    displayGroupedLibrary(groupedData, sectionId) {
        const musicGrid = document.getElementById(sectionId);
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
                async loadMusicLibrary() {
                    try {
                        const musicLibrary = await window.electronAPI.getMusicLibrary();
                        if (musicLibrary) {
                            this.musicLibrary = musicLibrary;
                            console.log('Música cargada:', this.musicLibrary);
                            this.displayLibrary(this.musicLibrary, 'tracks-section');
                        } else {
                            console.error('No se pudo cargar la biblioteca musical.');
                        }
                    } catch (error) {
                        console.error('Error al cargar la biblioteca musical:', error);
                    }
                }
            
                async loadMusicFiles() {
                    try {
                        const tracks = await window.electronAPI.loadMusicFiles();
                        if (tracks) {
                            this.musicLibrary = this.musicLibrary.concat(tracks);
                            this.displayLibrary(this.musicLibrary, 'tracks-section');
                        } else {
                            console.error('No se cargaron archivos de música.');
                        }
                    } catch (error) {
                        console.error('Error al cargar los archivos de música:', error);
                    }
                }
            
                playTrack(index) {
                    this.currentTrackIndex = index;
                    const track = this.musicLibrary[index];
                    this.audioPlayer.src = track.path;
                    this.audioPlayer.play();
                    this.updateNowPlaying();
            
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
                    if (this.isShuffle) {
                        this.currentTrackIndex = Math.floor(Math.random() * this.musicLibrary.length);
                    } else {
                        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicLibrary.length;
                    }
                    this.playTrack(this.currentTrackIndex);
                }
            
                playPrevious() {
                    if (this.isShuffle) {
                        this.currentTrackIndex = Math.floor(Math.random() * this.musicLibrary.length);
                    } else {
                        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.musicLibrary.length) % this.musicLibrary.length;
                    }
                    this.playTrack(this.currentTrackIndex);
                }
            
                handleTrackEnd() {
                    if (this.isRepeat) {
                        this.playTrack(this.currentTrackIndex);
                    } else {
                        this.playNext();
                    }
                }
            
                toggleShuffle() {
                    this.isShuffle = !this.isShuffle;
                    console.log('Modo aleatorio:', this.isShuffle);
                }
            
                toggleRepeat() {
                    this.isRepeat = !this.isRepeat;
                    console.log('Modo repetición:', this.isRepeat);
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
            