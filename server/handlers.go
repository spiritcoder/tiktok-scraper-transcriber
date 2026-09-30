package server

import (
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"strconv"
	"strings"

	"tiktok-scraper-transcriber/config"
	"tiktok-scraper-transcriber/store"
	"tiktok-scraper-transcriber/transcriber"
)

type Server struct {
	cfg       *config.Config
	engine    *transcriber.Engine
	store     *store.Store
	templates *template.Template
}

func NewServer(cfg *config.Config) (*Server, error) {
	tmpl, err := template.ParseGlob("templates/*.html")
	if err != nil {
		return nil, err
	}

	st, err := store.NewStore(cfg.DBPath)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize sqlite store: %w", err)
	}

	return &Server{
		cfg:       cfg,
		engine:    transcriber.NewEngine(cfg.YtDlpPath, cfg.TempDir),
		store:     st,
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
	mux.HandleFunc("/api/generate-draft", s.handleGenerateDraft)
	mux.HandleFunc("/api/profile-topics", s.handleProfileTopics)
	mux.HandleFunc("/api/generate-topic-draft", s.handleGenerateTopicDraft)
	mux.HandleFunc("/api/topic-transcripts", s.handleTopicTranscripts)

	// Library & Persistence APIs
	mux.HandleFunc("/api/library/drafts", s.handleLibraryDrafts)
	mux.HandleFunc("/api/library/draft", s.handleLibraryDraft)
	mux.HandleFunc("/api/library/profiles", s.handleLibraryProfiles)

	return mux
}

func (s *Server) handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	data := struct {
		HasEnvKey         bool
		HasEnvDeepSeekKey bool
	}{
		HasEnvKey:         s.cfg.GroqAPIKey != "",
		HasEnvDeepSeekKey: s.cfg.DeepSeekAPIKey != "",
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	// Dynamic template parsing for immediate UI reload on edit
	tmpl, err := template.ParseGlob("templates/*.html")
	if err == nil {
		_ = tmpl.ExecuteTemplate(w, "index.html", data)
		return
	}
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
		cleanUname := transcriber.ExtractUsername(profileURL)
		if cleanUname != "" {
			if p, pErr := s.store.GetProfile(cleanUname); pErr == nil && p != nil {
				cachedTopics, _ := s.store.GetTopics(cleanUname)
				writeJSON(w, http.StatusOK, map[string]any{
					"success": true,
					"data":    p,
					"topics":  cachedTopics,
				})
				return
			}
		}
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	if profile != nil && len(profile.Videos) > 0 {
		_ = s.store.SaveProfile(profile.Username, "", profile.Videos)
	}

	cachedTopics, _ := s.store.GetTopics(profile.Username)
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    profile,
		"topics":  cachedTopics,
	})
}

type TranscribeRequest struct {
	URL                   string `json:"url"`
	ForceWhisper          bool   `json:"force_whisper"`
	GroqKey               string `json:"groq_key"`
	Prompt                string `json:"prompt"`
	Language              string `json:"language"`
	IncludeMetadataPrompt bool   `json:"include_metadata_prompt"`
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

	// 1. Check local SQLite cache if not forcing fresh Whisper
	videoID := transcriber.ExtractVideoID(req.URL)
	if !req.ForceWhisper && videoID != "" {
		if cached, err := s.store.GetCachedTranscript(videoID); err == nil && cached != nil && cached.FullText != "" {
			whisper, tiktok, _ := s.store.GetCachedTranscripts(videoID)
			writeJSON(w, http.StatusOK, map[string]any{
				"success": true,
				"data":    cached,
				"whisper": whisper,
				"tiktok":  tiktok,
			})
			return
		}
	}

	apiKey := s.cfg.GroqAPIKey
	if req.GroqKey != "" {
		apiKey = strings.TrimSpace(req.GroqKey)
	}

	result, err := s.engine.Transcribe(req.URL, req.ForceWhisper, apiKey, req.Prompt, req.Language, req.IncludeMetadataPrompt)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	// 2. Cache transcript in SQLite
	if result != nil {
		vidID := result.VideoID
		if vidID == "" {
			vidID = videoID
		}
		if vidID != "" {
			_ = s.store.SaveTranscript(vidID, result)
		}
	}

	whisper, tiktok, _ := s.store.GetCachedTranscripts(videoID)
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    result,
		"whisper": whisper,
		"tiktok":  tiktok,
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

type GenerateDraftRequest struct {
	Transcript        string `json:"transcript"`
	VideoTitle        string `json:"video_title"`
	VideoDescription  string `json:"video_description"`
	VideoURL          string `json:"video_url"`
	Creator           string `json:"creator"`
	ResearchPrompt    string `json:"research_prompt"`
	IncludeSummary    *bool  `json:"include_summary"`
	IncludeReferences *bool  `json:"include_references"`
	DeepSeekKey       string `json:"deepseek_key"`
}

func (s *Server) handleGenerateDraft(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GenerateDraftRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Invalid request body"})
		return
	}

	apiKey := s.cfg.DeepSeekAPIKey
	if req.DeepSeekKey != "" {
		apiKey = strings.TrimSpace(req.DeepSeekKey)
	}

	if apiKey == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "DeepSeek API key required for draft generation"})
		return
	}

	includeSummary := true
	if req.IncludeSummary != nil {
		includeSummary = *req.IncludeSummary
	}
	includeReferences := true
	if req.IncludeReferences != nil {
		includeReferences = *req.IncludeReferences
	}

	summary, article, err := transcriber.GenerateDraft(req.Transcript, req.VideoTitle, req.VideoDescription, req.VideoURL, req.Creator, req.ResearchPrompt, includeSummary, includeReferences, apiKey)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"success":           true,
		"draft":             article,
		"article":           article,
		"executive_summary": summary,
	})
}

type ProfileTopicsRequest struct {
	Creator     string                         `json:"creator"`
	Videos      []transcriber.ProfileVideoMeta `json:"videos"`
	Categories  []string                       `json:"categories"`
	DeepSeekKey string                         `json:"deepseek_key"`
}

func (s *Server) handleProfileTopics(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		creator := strings.TrimPrefix(strings.TrimSpace(r.URL.Query().Get("creator")), "@")
		if creator == "" {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Creator username required"})
			return
		}
		topics, err := s.store.GetTopics(creator)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"success": true,
			"topics":  topics,
		})
	case http.MethodPost:
		var req ProfileTopicsRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Invalid request body"})
			return
		}

		apiKey := s.cfg.DeepSeekAPIKey
		if req.DeepSeekKey != "" {
			apiKey = strings.TrimSpace(req.DeepSeekKey)
		}

		if apiKey == "" {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "DeepSeek API key required for topic discovery"})
			return
		}

		if len(req.Videos) == 0 {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "No videos provided to analyze"})
			return
		}

		topics, err := transcriber.DiscoverProfileTopics(req.Creator, req.Videos, req.Categories, apiKey)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}

		if len(topics) > 0 {
			_ = s.store.SaveTopics(req.Creator, topics)
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"success": true,
			"topics":  topics,
		})
	case http.MethodDelete:
		creator := strings.TrimPrefix(strings.TrimSpace(r.URL.Query().Get("creator")), "@")
		id := strings.TrimSpace(r.URL.Query().Get("id"))
		if creator == "" || id == "" {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Creator and Topic ID are required"})
			return
		}
		if err := s.store.DeleteTopic(creator, id); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"success": true,
		})
	case http.MethodPatch:
		creator := strings.TrimPrefix(strings.TrimSpace(r.URL.Query().Get("creator")), "@")
		id := strings.TrimSpace(r.URL.Query().Get("id"))
		category := strings.TrimSpace(r.URL.Query().Get("category"))
		pubParam := strings.TrimSpace(r.URL.Query().Get("is_published"))

		var patchReq struct {
			Creator     string `json:"creator"`
			ID          string `json:"id"`
			Category    string `json:"category"`
			IsPublished *bool  `json:"is_published"`
		}
		if r.Body != nil {
			_ = json.NewDecoder(r.Body).Decode(&patchReq)
			if patchReq.Creator != "" && creator == "" {
				creator = strings.TrimPrefix(strings.TrimSpace(patchReq.Creator), "@")
			}
			if patchReq.ID != "" && id == "" {
				id = strings.TrimSpace(patchReq.ID)
			}
			if patchReq.Category != "" && category == "" {
				category = strings.TrimSpace(patchReq.Category)
			}
		}

		if creator == "" || id == "" {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Creator and Topic ID are required"})
			return
		}

		if category != "" {
			if err := s.store.UpdateTopicCategory(creator, id, category); err != nil {
				writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
				return
			}
		}

		if patchReq.IsPublished != nil {
			if err := s.store.UpdateTopicPublishStatus(creator, id, *patchReq.IsPublished); err != nil {
				writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
				return
			}
		} else if pubParam != "" {
			isPub := pubParam == "true" || pubParam == "1"
			if err := s.store.UpdateTopicPublishStatus(creator, id, isPub); err != nil {
				writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
				return
			}
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"success": true,
		})
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

type TopicTranscriptsRequest struct {
	TopicID      string                         `json:"topic_id"`
	Creator      string                         `json:"creator"`
	Videos       []transcriber.TopicVideoDetail `json:"videos"`
	ForceWhisper bool                           `json:"force_whisper"`
	GroqKey      string                         `json:"groq_key"`
}

type TopicVideoTranscript struct {
	VideoID           string                        `json:"video_id"`
	Title             string                        `json:"title"`
	Desc              string                        `json:"desc"`
	URL               string                        `json:"url"`
	TikTokTranscript  *transcriber.TranscriptResult `json:"tiktok_transcript,omitempty"`
	WhisperTranscript *transcriber.TranscriptResult `json:"whisper_transcript,omitempty"`
	ActiveSource      string                        `json:"active_source"` // "whisper" or "tiktok"
	ActiveText        string                        `json:"active_text"`
}

func (s *Server) handleTopicTranscripts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req TopicTranscriptsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Invalid request body"})
		return
	}

	if len(req.Videos) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "No videos provided in topic"})
		return
	}

	apiKey := s.cfg.GroqAPIKey
	if req.GroqKey != "" {
		apiKey = strings.TrimSpace(req.GroqKey)
	}

	var transcripts []TopicVideoTranscript
	var combinedParts []string

	for idx, v := range req.Videos {
		cleanID := transcriber.ExtractVideoID(v.ID)
		if cleanID == "" {
			cleanID = transcriber.ExtractVideoID(v.URL)
		}
		if cleanID == "" {
			cleanID = strings.TrimSpace(v.ID)
		}

		vURL := v.URL
		if vURL == "" && cleanID != "" {
			vURL = fmt.Sprintf("https://www.tiktok.com/video/%s", cleanID)
		}

		whisper, tiktok, _ := s.store.GetCachedTranscripts(cleanID)

		// 1. If no TikTok captions cached, attempt fast subtitle extraction
		if tiktok == nil && vURL != "" {
			subRes, subErr := transcriber.CheckAndDownloadSubtitles(s.cfg.YtDlpPath, vURL, s.engine.TempDir)
			if subErr == nil && subRes != nil && subRes.FullText != "" {
				subRes.VideoID = cleanID
				if subRes.VideoTitle == "" {
					subRes.VideoTitle = v.Title
				}
				_ = s.store.SaveTranscript(cleanID, subRes)
				tiktok = subRes
			}
		}

		// 2. If Whisper requested or no transcript exists at all, run Whisper AI
		if (req.ForceWhisper || (tiktok == nil && whisper == nil)) && apiKey != "" && vURL != "" {
			whisperRes, wErr := s.engine.Transcribe(vURL, true, apiKey, "", "auto", false)
			if wErr == nil && whisperRes != nil {
				whisperRes.VideoID = cleanID
				if whisperRes.VideoTitle == "" {
					whisperRes.VideoTitle = v.Title
				}
				_ = s.store.SaveTranscript(cleanID, whisperRes)
				whisper = whisperRes
			}
		}

		activeSource := "none"
		activeText := ""
		if whisper != nil && whisper.FullText != "" {
			activeSource = "whisper"
			activeText = whisper.FullText
		} else if tiktok != nil && tiktok.FullText != "" {
			activeSource = "tiktok"
			activeText = tiktok.FullText
		}

		item := TopicVideoTranscript{
			VideoID:           cleanID,
			Title:             v.Title,
			Desc:              v.Desc,
			URL:               vURL,
			TikTokTranscript:  tiktok,
			WhisperTranscript: whisper,
			ActiveSource:      activeSource,
			ActiveText:        activeText,
		}
		transcripts = append(transcripts, item)

		part := fmt.Sprintf("=== VIDEO %d: %s ===\n", idx+1, v.Title)
		if v.Desc != "" {
			part += fmt.Sprintf("Caption: %s\n", v.Desc)
		}
		if activeText != "" {
			part += fmt.Sprintf("Spoken Transcript (%s):\n%s\n", activeSource, activeText)
		} else {
			part += "Spoken Transcript: (No spoken dialogue available)\n"
		}
		combinedParts = append(combinedParts, part)
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"success":       true,
		"transcripts":   transcripts,
		"combined_text": strings.Join(combinedParts, "\n"),
	})
}

type GenerateTopicDraftRequest struct {
	TopicTitle        string                         `json:"topic_title"`
	TopicDesc         string                         `json:"topic_desc"`
	Category          string                         `json:"category"`
	Videos            []transcriber.TopicVideoDetail `json:"videos"`
	ResearchPrompt    string                         `json:"research_prompt"`
	IncludeSummary    *bool                          `json:"include_summary"`
	IncludeReferences *bool                          `json:"include_references"`
	DeepSeekKey       string                         `json:"deepseek_key"`
}

func (s *Server) handleGenerateTopicDraft(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GenerateTopicDraftRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Invalid request body"})
		return
	}

	apiKey := s.cfg.DeepSeekAPIKey
	if req.DeepSeekKey != "" {
		apiKey = strings.TrimSpace(req.DeepSeekKey)
	}

	if apiKey == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "DeepSeek API key required for topic draft generation"})
		return
	}

	if len(req.Videos) == 0 {
		fallbackText := strings.TrimSpace(req.TopicDesc)
		if fallbackText == "" {
			fallbackText = strings.TrimSpace(req.TopicTitle)
		}
		if fallbackText != "" {
			req.Videos = []transcriber.TopicVideoDetail{
				{
					ID:         "topic_context",
					Title:      req.TopicTitle,
					Desc:       req.TopicDesc,
					Transcript: fallbackText,
				},
			}
		} else {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "No videos provided for this topic"})
			return
		}
	}

	includeSummary := true
	if req.IncludeSummary != nil {
		includeSummary = *req.IncludeSummary
	}
	includeReferences := true
	if req.IncludeReferences != nil {
		includeReferences = *req.IncludeReferences
	}

	summary, article, err := transcriber.GenerateTopicDraft(req.TopicTitle, req.TopicDesc, req.Category, req.Videos, req.ResearchPrompt, includeSummary, includeReferences, apiKey)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	// Auto-save generated draft to SQLite library with source videos and executive summary
	sourceJSONBytes, _ := json.Marshal(req.Videos)
	_ = s.store.SaveArticleDraft(&store.ArticleDraftRecord{
		Title:            req.TopicTitle,
		Category:         req.Category,
		ResearchPrompt:   req.ResearchPrompt,
		ExecutiveSummary: summary,
		MarkdownContent:  article,
		WordCount:        len(strings.Fields(article)),
		SourceJSON:       string(sourceJSONBytes),
	})

	writeJSON(w, http.StatusOK, map[string]any{
		"success":           true,
		"draft":             article,
		"article":           article,
		"executive_summary": summary,
	})
}

func (s *Server) handleLibraryProfiles(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	profiles, err := s.store.GetRecentProfiles()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "profiles": profiles})
}

func (s *Server) handleLibraryDrafts(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		drafts, err := s.store.GetArticleDrafts()
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"success": true, "drafts": drafts})
	case http.MethodPost:
		var d store.ArticleDraftRecord
		if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Invalid request body"})
			return
		}
		if strings.TrimSpace(d.Title) == "" {
			d.Title = "Untitled Draft"
		}
		if d.WordCount == 0 && d.MarkdownContent != "" {
			d.WordCount = len(strings.Fields(d.MarkdownContent))
		}
		if err := s.store.SaveArticleDraft(&d); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"success": true, "draft": d})
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleLibraryDraft(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.URL.Query().Get("id"))
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Draft ID required"})
		return
	}

	switch r.Method {
	case http.MethodGet:
		d, err := s.store.GetArticleDraft(id)
		if err != nil {
			writeJSON(w, http.StatusNotFound, map[string]any{"error": "Draft not found"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"success": true, "draft": d})
	case http.MethodDelete:
		if err := s.store.DeleteArticleDraft(id); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"success": true})
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
