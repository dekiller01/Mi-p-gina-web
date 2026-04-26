const express = require('express');
const ytDlpx = require('yt-dlp-exec'); // <-- Herramienta para descargar en la nube
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // <-- Importante para conectar con GitHub Pages
const app = express();

// Middlewares
app.use(cors()); // Permite que tu web de GitHub hable con Render
app.use(express.json());
app.use(express.static('public'));
app.use('/clips', express.static('clips'));

// Crear carpetas necesarias
if (!fs.existsSync("clips")) fs.mkdirSync("clips");

app.post('/generar-clips', async (req, res) => { // Añadimos 'async'
    const { url } = req.body;
    const idUnico = Date.now();
    const videoOriginal = `temp_${idUnico}.mp4`;
    const nombreClip = `tiktok_pro_${idUnico}.mp4`;
    const rutaSalida = `clips/${nombreClip}`;

    console.log(`🔗 Iniciando proceso para: ${url}`);

    try {
        // 1. Descarga con yt-dlp-exec (forma segura para Render)
        console.log("📥 Descargando...");
        await ytDlpx(url, {
            output: videoOriginal,
            format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
            noCheckCertificates: true
        });

        // 2. Procesamiento FFmpeg
        console.log("🎬 Renderizando estilo TikTok (720x1280)...");
        const ffmpegCommand = `ffmpeg -y -ss 0 -t 10 -i ${videoOriginal} \
        -filter_complex \
        "[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=20:10[bg]; \
         [0:v]scale=720:-1[fg]; \
         [bg][fg]overlay=(W-w)/2:(H-h)/2:format=auto" \
        -c:v libx264 -preset superfast -crf 23 \
        -c:a aac -b:a 128k \
        "${rutaSalida}"`;

        execSync(ffmpegCommand, { stdio: 'inherit' });

        if (fs.existsSync(videoOriginal)) fs.unlinkSync(videoOriginal);
        console.log("✅ ¡Clip terminado!");

        res.json({ success: true, videoUrl: `https://${req.get('host')}/clips/${nombreClip}` });

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000; // Render usa puertos dinámicos
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
