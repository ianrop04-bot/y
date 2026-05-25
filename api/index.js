const express = require('express');
const ytdl = require('@distube/ytdl-core');
const path = require('path');
const app = express();

app.use(express.json());

// ───────────────────────────────────────
// HTML Frontend
// ───────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>YouTube Downloader</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', sans-serif;
          background: #0f0f0f;
          color: #fff;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: #1a1a1a;
          border-radius: 16px;
          padding: 40px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        h1 {
          text-align: center;
          margin-bottom: 10px;
          font-size: 2rem;
          color: #ff0000;
        }
        p.subtitle {
          text-align: center;
          color: #aaa;
          margin-bottom: 30px;
          font-size: 0.9rem;
        }
        .input-group {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        input[type="text"] {
          flex: 1;
          padding: 14px 18px;
          border: 2px solid #333;
          border-radius: 10px;
          background: #222;
          color: #fff;
          font-size: 1rem;
          outline: none;
          transition: border 0.3s;
        }
        input[type="text"]:focus {
          border-color: #ff0000;
        }
        button {
          padding: 14px 24px;
          background: #ff0000;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
          white-space: nowrap;
        }
        button:hover {
          background: #cc0000;
        }
        #result {
          display: none;
          margin-top: 30px;
          padding: 20px;
          background: #222;
          border-radius: 12px;
          animation: fadeIn 0.4s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        #result img {
          width: 100%;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        #result h2 {
          font-size: 1.1rem;
          margin-bottom: 8px;
        }
        #result p {
          color: #aaa;
          margin-bottom: 6px;
          font-size: 0.9rem;
        }
        .download-btn {
          display: inline-block;
          margin-top: 15px;
          padding: 12px 28px;
          background: #ff0000;
          color: #fff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: background 0.3s;
        }
        .download-btn:hover {
          background: #cc0000;
        }
        #error {
          display: none;
          margin-top: 15px;
          padding: 14px;
          background: #3a0000;
          border: 1px solid #ff0000;
          border-radius: 8px;
          color: #ff6666;
        }
        .spinner {
          display: none;
          width: 30px;
          height: 30px;
          border: 3px solid #333;
          border-top: 3px solid #ff0000;
          border-radius: 50%;
          margin: 20px auto;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>▶ YouTube Downloader</h1>
        <p class="subtitle">Paste a YouTube URL to get video info & download</p>
        
        <div class="input-group">
          <input type="text" id="url" placeholder="https://www.youtube.com/watch?v=..." />
          <button onclick="getVideoInfo()">Fetch Info</button>
        </div>
        
        <div class="spinner" id="spinner"></div>
        
        <div id="error"></div>
        
        <div id="result">
          <img id="thumbnail" src="" alt="Thumbnail" />
          <h2 id="title"></h2>
          <p id="channel"></p>
          <p id="duration"></p>
          <p id="views"></p>
          <a class="download-btn" id="downloadLink" href="#">⬇ Download Video</a>
        </div>
      </div>

      <script>
        async function getVideoInfo() {
          const url = document.getElementById('url').value.trim();
          const resultDiv = document.getElementById('result');
          const errorDiv = document.getElementById('error');
          const spinner = document.getElementById('spinner');

          // Reset
          resultDiv.style.display = 'none';
          errorDiv.style.display = 'none';
          spinner.style.display = 'block';

          if (!url) {
            showError('Please enter a YouTube URL');
            return;
          }

          try {
            const response = await fetch('/video-info?url=' + encodeURIComponent(url));
            const data = await response.json();

            spinner.style.display = 'none';

            if (!response.ok || !data.success) {
              showError(data.error || 'Failed to fetch video info');
              return;
            }

            const v = data.data;
            document.getElementById('thumbnail').src = v.thumbnail;
            document.getElementById('title').textContent = v.title;
            document.getElementById('channel').textContent = 'Channel: ' + v.channel;
            document.getElementById('duration').textContent = 'Duration: ' + v.duration;
            document.getElementById('views').textContent = 'Views: ' + Number(v.views).toLocaleString();
            document.getElementById('downloadLink').href = '/download?url=' + encodeURIComponent(url);

            resultDiv.style.display = 'block';
          } catch (err) {
            spinner.style.display = 'none';
            showError('Network error: ' + err.message);
          }
        }

        function showError(msg) {
          const errorDiv = document.getElementById('error');
          const spinner = document.getElementById('spinner');
          spinner.style.display = 'none';
          errorDiv.textContent = msg;
          errorDiv.style.display = 'block';
        }

        // Allow pressing Enter to fetch
        document.getElementById('url').addEventListener('keydown', (e) => {
          if (e.key === 'Enter') getVideoInfo();
        });
      </script>
    </body>
    </html>
  `);
});

// ───────────────────────────────────────
// API: Get Video Info
// ───────────────────────────────────────
app.get('/video-info', async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res.status(400).json({ success: false, error: 'Missing "url" query parameter' });
    }

    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ success: false, error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getBasicInfo(videoUrl);
    const { title, description, lengthSeconds, viewCount, author, thumbnails } = info.videoDetails;

    res.json({
      success: true,
      data: {
        title,
        description: description?.substring(0, 200) + '...',
        duration: Math.floor(lengthSeconds / 60) + 'm ' + (lengthSeconds % 60) + 's',
        views: viewCount,
        channel: author.name,
        thumbnail: thumbnails[thumbnails.length - 1]?.url
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch video info', details: error.message });
  }
});

// ───────────────────────────────────────
// API: Download Video
// ───────────────────────────────────────
app.get('/download', async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res.status(400).json({ error: 'Missing "url" query parameter' });
    }

    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getBasicInfo(videoUrl);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '');

    res.setHeader('Content-Disposition', `attachment; filename="${videoTitle}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');

    const stream = ytdl(videoUrl, { quality: 'highest' });

    stream.on('error', (err) => {
      console.error('Stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed', details: err.message });
      }
    });

    stream.pipe(res);
  } catch (error) {
    console.error('Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download video', details: error.message });
    }
  }
});

// ───────────────────────────────────────
// Start Server (for local development)
// ───────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Export for Vercel
module.exports = app;
