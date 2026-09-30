package transcriber

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type GroqVerboseResponse struct {
	Task     string  `json:"task"`
	Language string  `json:"language"`
	Duration float64 `json:"duration"`
	Text     string  `json:"text"`
	Segments []struct {
		ID    int     `json:"id"`
		Start float64 `json:"start"`
		End   float64 `json:"end"`
		Text  string  `json:"text"`
	} `json:"segments"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

// TranscribeWithGroq sends the audio file to Groq Whisper Large-v3 using standard net/http
func TranscribeWithGroq(audioPath string, apiKey string, prompt string, language string) (*TranscriptResult, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("GROQ_API_KEY is not set. Please provide an API key in your environment or in the UI")
	}

	file, err := os.Open(audioPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open audio file: %v", err)
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add file field
	part, err := writer.CreateFormFile("file", filepath.Base(audioPath))
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %v", err)
	}
	if _, err := io.Copy(part, file); err != nil {
		return nil, fmt.Errorf("failed to copy audio to form: %v", err)
	}

	// Add model field (Whisper Large-v3)
	if err := writer.WriteField("model", "whisper-large-v3"); err != nil {
		return nil, err
	}

	// Add response_format field
	if err := writer.WriteField("response_format", "verbose_json"); err != nil {
		return nil, err
	}

	// Add temperature
	if err := writer.WriteField("temperature", "0"); err != nil {
		return nil, err
	}

	// Add optional vocabulary context prompt (critical for Igbo priming)
	if strings.TrimSpace(prompt) != "" {
		if err := writer.WriteField("prompt", strings.TrimSpace(prompt)); err != nil {
			return nil, err
		}
	}

	// Add optional language code (only if specified and not auto)
	cleanLang := strings.TrimSpace(strings.ToLower(language))
	if cleanLang != "" && cleanLang != "auto" {
		if err := writer.WriteField("language", cleanLang); err != nil {
			return nil, err
		}
	}

	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("failed to close multipart writer: %v", err)
	}

	req, err := http.NewRequest("POST", "https://api.groq.com/openai/v1/audio/transcriptions", body)
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{
		Timeout: 120 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Groq Whisper API: %v", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response from Groq: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("groq API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var groqResp GroqVerboseResponse
	if err := json.Unmarshal(respBody, &groqResp); err != nil {
		return nil, fmt.Errorf("failed to decode Groq response: %v", err)
	}

	if groqResp.Error != nil && groqResp.Error.Message != "" {
		return nil, fmt.Errorf("groq error: %s", groqResp.Error.Message)
	}

	segments := make([]Segment, len(groqResp.Segments))
	for i, s := range groqResp.Segments {
		segments[i] = Segment{
			Start: s.Start,
			End:   s.End,
			Text:  strings.TrimSpace(s.Text),
		}
	}

	fullText := strings.TrimSpace(groqResp.Text)
	words := strings.Fields(fullText)

	return &TranscriptResult{
		Source:    "groq_whisper",
		Language:  groqResp.Language,
		FullText:  fullText,
		WordCount: len(words),
		Segments:  segments,
		Duration:  groqResp.Duration,
	}, nil
}
