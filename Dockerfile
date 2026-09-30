# ==========================================
# Stage 1: Build statically linked Go binary
# ==========================================
FROM golang:alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source tree
COPY . .

# Compile a static Linux binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o transcriber-app .

# ==========================================
# Stage 2: Runtime image with Python & curl-cffi
# ==========================================
FROM python:3.12-slim-bookworm

WORKDIR /app

# Install system dependencies:
# - ffmpeg: audio extraction & stream processing
# - ca-certificates & curl: HTTPS and healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp with curl-cffi for browser TLS fingerprint impersonation (bypasses TikTok anti-bot blocks)
RUN pip install --no-cache-dir "yt-dlp[default,curl-cffi]"

# Copy compiled Go binary from builder
COPY --from=builder /build/transcriber-app /app/transcriber-app

# Copy web assets and templates
COPY templates/ /app/templates/
COPY static/ /app/static/

# Create runtime directories and setup non-root user
RUN mkdir -p /app/data /app/tmp /app/bin && \
    useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

ENV PORT=8085
ENV TEMP_DIR=/app/tmp
ENV DB_PATH=/app/data/studio.db

EXPOSE 8085

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/ || exit 1

ENTRYPOINT ["/app/transcriber-app"]
