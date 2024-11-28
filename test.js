const mm = require('music-metadata');
const path = require('path');

async function testParseFile() {
    try {
        const filePath = path.join(__dirname, 'path-to-your-music-file.mp3'); // Reemplaza con la ruta a un archivo de música
        const metadata = await mm.parseFile(filePath);
        console.log(metadata);
    } catch (error) {
        console.error('Error leyendo metadatos:', error);
    }
}

testParseFile();
