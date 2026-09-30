package transcriber

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

type Engine struct {
	YtDlpPath string
	TempDir   string
}

func NewEngine(ytDlpPath, tempDir string) *Engine {
	return &Engine{
		YtDlpPath: ytDlpPath,
		TempDir:   tempDir,
	}
}

// CleanMetadataText removes hashtags and collapses whitespace
func CleanMetadataText(text string) string {
	reHashtag := regexp.MustCompile(`#\S+`)
	cleaned := reHashtag.ReplaceAllString(text, "")
	reSpace := regexp.MustCompile(`\s+`)
	return strings.TrimSpace(reSpace.ReplaceAllString(cleaned, " "))
}

// CombinePromptWithMetadata merges user prompt with video metadata context
func CombinePromptWithMetadata(userPrompt string, title string) string {
	cleanTitle := CleanMetadataText(title)
	if cleanTitle == "" || cleanTitle == "TikTok Video" || cleanTitle == "Untitled Video" {
		return userPrompt
	}

	// Avoid duplicate appending if title is already in prompt
	if strings.Contains(strings.ToLower(userPrompt), strings.ToLower(cleanTitle)) {
		return userPrompt
	}

	combined := strings.TrimSpace(userPrompt)
	if combined == "" {
		combined = "Topic context: " + cleanTitle
	} else {
		combined = combined + " Context: " + cleanTitle
	}

	// Stay within Whisper 224-token budget (~800 characters)
	if len(combined) > 800 {
		combined = combined[:797] + "..."
	}
	return combined
}

// Transcribe handles the complete flow:
// 1. If !forceWhisper, checks for existing TikTok subtitles
// 2. If not found or if forceWhisper is true, downloads audio and runs Groq Whisper
func (e *Engine) Transcribe(videoURL string, forceWhisper bool, groqApiKey string, whisperPrompt string, whisperLang string, includeMetadataPrompt bool) (*TranscriptResult, error) {
	// Step 1: Check native subtitles if not forcing Whisper
	if !forceWhisper {
		result, err := CheckAndDownloadSubtitles(e.YtDlpPath, videoURL, e.TempDir)
		if err == nil && result != nil && result.FullText != "" {
			if groqApiKey != "" {
				if aiTitle, err := GenerateAITitle(result.FullText, groqApiKey); err == nil && aiTitle != "" {
					result.AITitle = aiTitle
				}
			}
			return result, nil
		}
		// If subtitles not found, fall through to Whisper
	}

	// Step 2: Download audio for Whisper AI
	audioPath, title, err := DownloadAudio(e.YtDlpPath, videoURL, e.TempDir)
	if err != nil {
		return nil, fmt.Errorf("could not download audio for transcription: %w", err)
	}
	defer os.Remove(audioPath) // clean up audio file

	// Step 3: Call Groq Whisper Large-v3 with pure vocabulary prompt
	// Note: Whisper prompt must strictly be vocabulary/proper nouns to bias spelling.
	// Sentence prefixes or summaries cause Whisper to hallucinate or summarize rather than transcribing verbatim.
	result, err := TranscribeWithGroq(audioPath, groqApiKey, strings.TrimSpace(whisperPrompt), whisperLang)
	if err != nil {
		return nil, err
	}

	result.VideoTitle = title

	// Step 4: Generate AI Title
	if groqApiKey != "" && result.FullText != "" {
		aiTitle, err := GenerateAITitle(result.FullText, groqApiKey)
		if err != nil {
			fmt.Printf("Note: AI title generation failed: %v\n", err)
		} else {
			result.AITitle = aiTitle
		}
	}

	return result, nil
}
