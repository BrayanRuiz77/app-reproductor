// renderer.js
const musicGrid = document.getElementById('musicGrid');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let isPlaying = false;

// Ejemplo de función para cargar música
function loadMusic() {
    // Aquí implementarías la lógica para cargar tu música
    // Por ejemplo, leer archivos de una carpeta específica
}

// Control de reproducción
playBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? 'Pause' : 'Play';
});

function playMusic() {
    // Implementar lógica de reproducción
}

function pauseMusic() {
    // Implementar lógica de pausa
}

// Cargar música cuando la aplicación inicie
loadMusic();