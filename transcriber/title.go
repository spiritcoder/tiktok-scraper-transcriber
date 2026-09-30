package transcriber

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

type GroqChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

type GroqModelsResponse struct {
	Data []struct {
		ID string `json:"id"`
	} `json:"data"`
}

var (
	cachedModel     string
	cachedModelTime time.Time
	modelMutex      sync.Mutex
)

// discoverBestModel queries Groq's /models endpoint to find the best active chat model for this key
func discoverBestModel(apiKey string) string {
	modelMutex.Lock()
	if cachedModel != "" && time.Since(cachedModelTime) < 30*time.Minute {
		m := cachedModel
		modelMutex.Unlock()
		return m
	}
	modelMutex.Unlock()

	req, err := http.NewRequest("GET", "https://api.groq.com/openai/v1/models", nil)
	if err == nil {
		req.Header.Set("Authorization", "Bearer "+apiKey)
		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Do(req)
		if err == nil && resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			var modelList GroqModelsResponse
			if err := json.NewDecoder(resp.Body).Decode(&modelList); err == nil && len(modelList.Data) > 0 {
				available := make(map[string]bool)
				for _, m := range modelList.Data {
					available[m.ID] = true
				}

				// Preferred models in priority order
				preferred := []string{
					"llama-3.3-70b-versatile",
					"llama-3.3-70b-specdec",
					"llama3-70b-8192",
					"llama3-8b-8192",
					"gemma2-9b-it",
					"mixtral-8x7b-32768",
					"qwen/qwen3.8-27b",
				}

				for _, p := range preferred {
					if available[p] {
						modelMutex.Lock()
						cachedModel = p
						cachedModelTime = time.Now()
						modelMutex.Unlock()
						return p
					}
				}

				// Any active chat model that is not audio/TTS
				for _, m := range modelList.Data {
					id := strings.ToLower(m.ID)
					if !strings.Contains(id, "whisper") && !strings.Contains(id, "tts") && !strings.Contains(id, "guard") {
						modelMutex.Lock()
						cachedModel = m.ID
						cachedModelTime = time.Now()
						modelMutex.Unlock()
						return m.ID
					}
				}
			}
		}
	}

	return "llama-3.3-70b-versatile"
}

// GenerateAITitle dynamically detects active Groq models and produces a concise title
func GenerateAITitle(transcript string, apiKey string) (string, error) {
	if apiKey == "" || strings.TrimSpace(transcript) == "" {
		return "", nil
	}

	// Limit context to first 3000 chars for rapid response
	snippet := transcript
	if len(snippet) > 3000 {
		snippet = snippet[:3000]
	}

	prompt := fmt.Sprintf("You are an expert video content editor. Read this transcript from a TikTok video and create a concise, compelling, and accurate title (under 10 words) that captures the core message or topic.\n\nRules:\n- Return ONLY the title text itself without quotation marks or intro.\n- Keep it engaging, clear, and relevant.\n\nTranscript:\n%s", snippet)

	// Discover live best model for this specific Groq key
	bestModel := discoverBestModel(apiKey)

	// Candidate list with the discovered model first
	candidates := []string{
		bestModel,
		"llama-3.3-70b-versatile",
		"llama3-70b-8192",
		"llama3-8b-8192",
		"gemma2-9b-it",
		"mixtral-8x7b-32768",
	}

	// Deduplicate candidates preserving order
	seen := make(map[string]bool)
	var orderedCandidates []string
	for _, c := range candidates {
		if !seen[c] && c != "" {
			seen[c] = true
			orderedCandidates = append(orderedCandidates, c)
		}
	}

	client := &http.Client{Timeout: 15 * time.Second}
	var lastErr error

	for _, modelName := range orderedCandidates {
		payload := map[string]any{
			"model": modelName,
			"messages": []map[string]string{
				{"role": "user", "content": prompt},
			},
			"temperature": 0.5,
			"max_tokens":  60,
		}

		bodyBytes, err := json.Marshal(payload)
		if err != nil {
			return "", err
		}

		req, err := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(bodyBytes))
		if err != nil {
			return "", err
		}

		req.Header.Set("Authorization", "Bearer "+apiKey)
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			lastErr = err
			continue
		}

		respBody, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			lastErr = err
			continue
		}

		// Handle decommissioned (400) or not found (404) gracefully by falling through to next model
		if resp.StatusCode == http.StatusNotFound ||
			(resp.StatusCode == http.StatusBadRequest && (strings.Contains(string(respBody), "model_") || strings.Contains(string(respBody), "decommissioned"))) {
			lastErr = fmt.Errorf("model %s unavailable (%d): %s", modelName, resp.StatusCode, string(respBody))
			continue
		}

		if resp.StatusCode != http.StatusOK {
			return "", fmt.Errorf("groq API status %d: %s", resp.StatusCode, string(respBody))
		}

		var chatResp GroqChatResponse
		if err := json.Unmarshal(respBody, &chatResp); err != nil {
			return "", fmt.Errorf("failed to decode title response: %v", err)
		}

		if chatResp.Error != nil && chatResp.Error.Message != "" {
			return "", fmt.Errorf("groq title generation error: %s", chatResp.Error.Message)
		}

		if len(chatResp.Choices) > 0 {
			title := strings.TrimSpace(chatResp.Choices[0].Message.Content)
			title = strings.Trim(title, `"'`)
			return title, nil
		}
	}

	return "", lastErr
}
