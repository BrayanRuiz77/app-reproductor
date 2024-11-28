const NodeID3 = require('node-id3');
const path = require('path');

async function testParseFile() {
    try {
        const filePath = path.join(__dirname, 'path-to-your-music-file.mp3'); // Reemplaza con la ruta a un archivo de música
        const tags = NodeID3.read(filePath);
        console.log(tags);
    } catch (error) {
        console.error('Error leyendo metadatos:', error);
    }
}

testParseFile();

