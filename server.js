const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

// Middlewares
app.use(express.json());
app.use(express.static('public'));
app.use('/clips', express.static('clips'));

// Crear carpetas necesarias
if (!fs.existsSync("clips")) fs.mkdirSync("clips");

app.post('/generar-clips', (req, res) => {
    const { url } = req.body;
    const idUnico = Date.now();
    const videoOriginal = `temp_${idUnico}.mp4`;
    const nombreClip = `tiktok_pro_${idUnico}.mp4`;
    const rutaSalida = `clips/${nombreClip}`;

    console.log(`🔗 Iniciando proceso para: ${url}`);

    try {
        // 1. Descarga con yt-dlp
        console.log("📥 Descargando...");
        execSync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4" -o ${videoO>

        // 2. Procesamiento FFmpeg: Formato Vertical 720x1280 Sin Bordes Negros
        console.log("🎬 Renderizando estilo TikTok (720x1280)...");

        // EXPLICACIÓN DEL FILTRO CORREGIDO:
        // [bg]: Fuerza el ratio 9:16, hace crop para eliminar barras negras y apli>
        // [fg]: Escala el video nítido al ancho completo de 720px.
        const ffmpegCommand = `ffmpeg -y -ss 0 -t 10 -i ${videoOriginal} \
        -filter_complex \
        "[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,box>
         [0:v]scale=720:-1[fg]; \
         [bg][fg]overlay=(W-w)/2:(H-h)/2:format=auto" \
        -c:v libx264 -preset superfast -crf 23 \
        -c:a aac -b:a 128k \
        "${rutaSalida}"`;

        execSync(ffmpegCommand, { stdio: 'inherit' });

        // 3. Limpiar video temporal
        if (fs.existsSync(videoOriginal)) fs.unlinkSync(videoOriginal);

        console.log("✅ ¡Clip terminado con éxito!");

        res.json({ success: true, videoUrl: `/clips/${nombreClip}` });

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
