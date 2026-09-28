package server

import (
	"encoding/json"
	"html/template"
	"net/http"
	"strconv"
	"strings"

	"tiktok-scraper-transcriber/config"
	"tiktok-scraper-transcriber/transcriber"
)

type Server struct {
	cfg       *config.Config
	engine    *transcriber.Engine
	templates *template.Template
}

func NewServer(cfg *config.Config) (*Server, error) {
	tmpl, err := template.ParseGlob("templates/*.html")
	if err != nil {
		return nil, err
	}

	return &Server{
		cfg:       cfg,
		engine:    transcriber.NewEngine(cfg.YtDlpPath, cfg.TempDir),
		templates: tmpl,
	}, nil
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()

	// Static assets
	fs := http.FileServer(http.Dir("static"))
	mux.Handle("/static/", http.StripPrefix("/static/", fs))

	// Web UI
	mux.HandleFunc("/", s.handleIndex)

	// JSON APIs
	mux.HandleFunc("/api/profile", s.handleProfile)
	mux.HandleFunc("/api/transcribe", s.handleTranscribe)
	mux.HandleFunc("/api/generate-title", s.handleGenerateTitle)

	return mux
}

func (s *Server) handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	data := struct {
		HasEnvKey bool
	}{
		HasEnvKey: s.cfg.GroqAPIKey != "",
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = s.templates.ExecuteTemplate(w, "index.html", data)
}

func (s *Server) handleProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	profileURL := strings.TrimSpace(r.URL.Query().Get("url"))
	if profileURL == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Profile URL or @username is required"})
		return
	}

	limit := 0 // 0 means fetch ALL videos from the creator
	if lStr := r.URL.Query().Get("limit"); lStr != "" {
		if parsed, err := strconv.Atoi(lStr); err == nil && parsed >= 0 {
			limit = parsed
		}
	}

	profile, err := transcriber.FetchProfileVideos(s.cfg.YtDlpPath, profileURL, limit)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    profile,
	})
}

type TranscribeRequest struct {
	URL          string `json:"url"`
	ForceWhisper bool   `json:"force_whisper"`
	GroqKey      string `json:"groq_key"`
}

func (s *Server) handleTranscribe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req TranscribeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Invalid request body"})
		return
	}

	req.URL = strings.TrimSpace(req.URL)
	if req.URL == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Video URL is required"})
		return
	}

	apiKey := s.cfg.GroqAPIKey
	if req.GroqKey != "" {
		apiKey = strings.TrimSpace(req.GroqKey)
	}

	result, err := s.engine.Transcribe(req.URL, req.ForceWhisper, apiKey)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    result,
	})
}

type GenerateTitleRequest struct {
	Transcript string `json:"transcript"`
	GroqKey    string `json:"groq_key"`
}

func (s *Server) handleGenerateTitle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GenerateTitleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Invalid request body"})
		return
	}

	apiKey := s.cfg.GroqAPIKey
	if req.GroqKey != "" {
		apiKey = strings.TrimSpace(req.GroqKey)
	}

	if apiKey == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Groq API key required for AI title generation"})
		return
	}

	title, err := transcriber.GenerateAITitle(req.Transcript, apiKey)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"success":  true,
		"ai_title": title,
	})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
