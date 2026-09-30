# TikTok Scraper & Speech-to-Text Transcriber

A high-performance Go application and sleek web interface to scrape TikTok video catalogs, extract native subtitles, transcribe speech via Groq Whisper Large-v3, and automatically generate concise AI video titles with Llama 3.3.

![Go Version](https://img.shields.io/badge/Go-1.25+-00ADD8?style=flat&logo=go)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Interface](https://img.shields.io/badge/Interface-Web%20%26%20CLI-success)

---

## Features

- **Full Creator Video Catalog Scraping**: Scrapes 100+ videos from any creator by providing any single video URL (bypassing TikTok profile bot scraping blocks).
- **Dual Transcription Engine**:
  - **Instant Native Captions**: Reads official TikTok subtitles and auto-captions directly when available with zero API cost.
  - **Groq Whisper Large-v3 Fallback**: Automatically transcribes audio using state-of-the-art AI speech-to-text when native captions are absent or incomplete.
- **AI Video Title Generation**: Converts descriptions and speech transcripts into clean, readable 3-7 word titles powered by Groq Llama 3.3.
- **Structured Article Drafts with DeepSeek**: Transforms raw spoken transcripts into authoritative, well-organized article drafts with set-aside headings, background context, detailed breakdown, and key terms via DeepSeek V3 (`deepseek-chat`). Includes in-browser Markdown preview, raw view toggle, and `.md` export.
- **Real-Time In-Page Search**: Search through video captions, descriptions, and AI titles instantly with match counts, keyword highlighting, and a "Titles Only" vs "All Text" scope toggle.
- **One-Click Export**: Easily copy transcripts or markdown drafts to clipboard or download as .txt, .json, and .md files.
- **Modern Web UI & Powerful CLI**: Run as a rich responsive dark-mode Web UI or directly from terminal via CLI flags.

---

## Prerequisites

1. **Go 1.21+** installed on your system.
2. **yt-dlp (Automated)**:
   - The application checks for `bin/` or system `PATH`.
   - If not found, it **automatically downloads** the latest official `yt-dlp` release into `bin/` on first run. No manual download is required.
3. **[Optional] Groq API Key**:
   - Used for Whisper Large-v3 speech recognition and quick AI title generation.
   - Get a free key at [console.groq.com/keys](https://console.groq.com/keys).
4. **[Optional] DeepSeek API Key**:
   - Used for generating structured article drafts with set-aside headings.
   - Get an API key at [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys). Configurable via UI settings or `DEEPSEEK_API_KEY` environment variable.

---

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/tiktok-scraper-transcriber.git
   cd tiktok-scraper-transcriber
   ```

2. **(Optional) Configure Groq API Key:**
   Set the environment variable or configure it in the Web UI:
   ```bash
   # Windows PowerShell
   $env:GROQ_API_KEY="gsk_your_api_key_here"

   # Linux / macOS
   export GROQ_API_KEY="gsk_your_api_key_here"
   ```

3. **Build the executable:**
   ```bash
   go build -o transcriber.exe .
   ```

---

## Usage

### 1. Docker & Docker Compose (Recommended)

Run the full application inside an isolated Docker container with automated `yt-dlp` and `ffmpeg` setup:

```bash
# 1. (Optional) Create your environment file
cp .env.example .env
# Edit .env with your optional GROQ_API_KEY or DEEPSEEK_API_KEY

# 2. Build and run with Docker Compose
docker compose up -d --build

# 3. View container logs
docker compose logs -f

# 4. Stop the container
docker compose down
```

Open your browser and navigate to:
```
http://localhost:8085
```

---

### 2. Web UI Mode (Local Go)

Start the local web server:
```bash
./transcriber.exe
# Or with go run:
go run main.go
```

Open your browser and navigate to:
```
http://localhost:8085
```

> **Important Usage Note on TikTok Bot Constraints:**
> TikTok bot protection blocks direct profile lookups (e.g. `@username`). Instead, **paste any video link** from that creator (e.g. `https://vt.tiktok.com/...` or `https://www.tiktok.com/@user/video/...`). The app extracts the creator ID and automatically unlocks their full video catalog.

---

### 3. CLI Mode

#### Direct Video Transcription
Transcribe a single video and optionally save output to a file:
```bash
# Transcribe video
./transcriber.exe -url "https://vt.tiktok.com/ZSjxxxxxx/"

# Save transcript to file
./transcriber.exe -url "https://vt.tiktok.com/ZSjxxxxxx/" -out transcript.txt

# Force Groq Whisper AI transcription even if TikTok captions exist
./transcriber.exe -url "https://vt.tiktok.com/ZSjxxxxxx/" -whisper
```

#### Profile Browsing in Terminal
Fetch and browse videos from a creator:
```bash
# Fetch up to 20 videos
./transcriber.exe -profile "https://vt.tiktok.com/ZSjxxxxxx/" -limit 20

# Fetch ALL videos from the creator (default limit is 0 = all)
./transcriber.exe -profile "https://vt.tiktok.com/ZSjxxxxxx/"
```

---

## CLI Flags Reference

| Flag | Default | Description |
|---|---|---|
| `-url` | `""` | Direct TikTok video URL to transcribe |
| `-profile` | `""` | Creator video URL or profile URL to fetch videos from |
| `-limit` | `0` | Maximum videos to fetch (`0` for all videos) |
| `-whisper` | `false` | Force Groq Whisper Large-v3 AI even if TikTok captions exist |
| `-out` | `""` | Output file path to save the transcript (e.g., `transcript.txt`) |
| `-port` | `8085` | Port for the Web UI server |
| `-key` | `""` | Groq API Key override (if not set in `GROQ_API_KEY` env) |
| `-serve` | `false` | Explicitly start as Web UI server |

---

## Project Structure

```
tiktok-scraper-transcriber/
├── bin/                 # Local helper binaries (yt-dlp.exe)
├── cli/
│   └── runner.go        # CLI command execution & interactive terminal mode
├── config/
│   └── config.go        # Environment and path configurations
├── server/
│   ├── handlers.go      # REST endpoints & API controllers
│   └── server.go        # HTTP server routing & middleware
├── static/
│   ├── css/
│   │   └── style.css    # Modern dark-mode UI stylesheet
│   └── js/
│       └── app.js       # Dynamic search, pagination & transcription handlers
├── templates/
│   └── index.html       # Web UI HTML template
├── tmp/                 # Temporary working directory for audio processing
├── transcriber/
│   ├── engine.go        # Core transcription orchestrator
│   ├── models.go        # Video and transcript data structures
│   ├── tiktok.go        # Video scraper & subtitle extraction
│   ├── title.go         # AI video title generator (Groq Llama 3.3)
│   └── whisper.go       # Groq Whisper Large-v3 integration
├── go.mod               # Go module dependencies
├── main.go              # Application entry point
├── .gitignore           # Git ignore rules
└── README.md            # Documentation
```

---

## License

This project is licensed under the MIT License.
