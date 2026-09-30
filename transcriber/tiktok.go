package transcriber

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// NormalizeTikTokURL ensures the input is properly formatted
func NormalizeTikTokURL(input string) string {
	input = strings.TrimSpace(input)
	if strings.HasPrefix(input, "tiktokuser:") {
		return input
	}
	if strings.HasPrefix(input, "@") {
		return "https://www.tiktok.com/" + input
	}
	if !strings.HasPrefix(input, "http://") && !strings.HasPrefix(input, "https://") {
		if strings.Contains(input, "tiktok.com") {
			return "https://" + input
		}
		// Treat as a username
		return "https://www.tiktok.com/@" + input
	}
	return input
}

// ExtractVideoID retrieves the numerical video ID from a TikTok URL if present
func ExtractVideoID(rawURL string) string {
	re := regexp.MustCompile(`/video/(\d+)`)
	m := re.FindStringSubmatch(rawURL)
	if len(m) > 1 {
		return m[1]
	}
	return ""
}

// ExtractUsername parses a TikTok creator handle from a username, profile URL, or video URL
func ExtractUsername(input string) string {
	input = strings.TrimSpace(input)
	if input == "" {
		return ""
	}

	// Match /@([a-zA-Z0-9_\.\-]+) from URLs (e.g., https://www.tiktok.com/@anterrastudioss/video/...)
	re := regexp.MustCompile(`/@([a-zA-Z0-9_\.\-]+)`)
	if m := re.FindStringSubmatch(input); len(m) > 1 {
		return m[1]
	}

	// Match tiktok.com/@?([a-zA-Z0-9_\.\-]+)
	re2 := regexp.MustCompile(`tiktok\.com/@?([a-zA-Z0-9_\.\-]+)`)
	if m2 := re2.FindStringSubmatch(input); len(m2) > 1 {
		return m2[1]
	}

	// Direct handle with or without @
	clean := strings.TrimPrefix(input, "@")
	if idx := strings.Index(clean, "/"); idx != -1 {
		clean = clean[:idx]
	}
	return clean
}

// FetchProfileVideos gets all videos from a creator's profile
func FetchProfileVideos(ytDlpPath string, profileURL string, limit int) (*ProfileResult, error) {
	normalizedURL := NormalizeTikTokURL(profileURL)

	// If the user provided a video URL instead of a profile, resolve the channel_id first
	if strings.Contains(normalizedURL, "/video/") || strings.Contains(normalizedURL, "vt.tiktok.com") || strings.Contains(normalizedURL, "vm.tiktok.com") {
		channelCmd := exec.Command(ytDlpPath, "--print", "channel_id", "--no-warnings", "--socket-timeout", "20", normalizedURL)
		var chOut bytes.Buffer
		channelCmd.Stdout = &chOut
		if err := channelCmd.Run(); err == nil {
			chID := strings.TrimSpace(chOut.String())
			if chID != "" {
				lines := strings.Split(chID, "\n")
				lastLine := strings.TrimSpace(lines[len(lines)-1])
				if lastLine != "" {
					normalizedURL = "tiktokuser:" + lastLine
				}
			}
		}
	}

	args := []string{
		"--flat-playlist",
		"--dump-single-json",
		"--no-warnings",
		"--socket-timeout", "20",
	}

	if limit > 0 {
		args = append(args, "--playlist-end", strconv.Itoa(limit))
	}

	args = append(args, normalizedURL)

	cmd := exec.Command(ytDlpPath, args...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch profile videos: %v (stderr: %s)", err, stderr.String())
	}

	var data struct {
		ID      string `json:"id"`
		Title   string `json:"title"`
		Entries []struct {
			ID          string `json:"id"`
			Title       string `json:"title"`
			Description string `json:"description"`
			Duration    int    `json:"duration"`
			URL         string `json:"url"`
			ViewCount   int64  `json:"view_count"`
			LikeCount   int64  `json:"like_count"`
			Uploader    string `json:"uploader"`
			Channel     string `json:"channel"`
			Thumbnails  []struct {
				URL string `json:"url"`
			} `json:"thumbnails"`
		} `json:"entries"`
	}

	if err := json.Unmarshal(stdout.Bytes(), &data); err != nil {
		return nil, fmt.Errorf("failed to parse profile response: %v", err)
	}

	username := data.Title
	if username == "" || strings.HasPrefix(username, "MS4wLjAB") {
		for _, entry := range data.Entries {
			if entry.Uploader != "" {
				username = entry.Uploader
				break
			}
			if entry.Channel != "" {
				username = entry.Channel
				break
			}
		}
	}
	if username == "" {
		username = data.ID
	}

	result := &ProfileResult{
		Username: username,
		Videos:   make([]VideoItem, 0, len(data.Entries)),
	}

	for _, entry := range data.Entries {
		thumb := ""
		if len(entry.Thumbnails) > 0 {
			thumb = entry.Thumbnails[len(entry.Thumbnails)-1].URL
		}

		videoURL := entry.URL
		if videoURL == "" && entry.ID != "" {
			videoURL = fmt.Sprintf("https://www.tiktok.com/@%s/video/%s", username, entry.ID)
		}

		title := entry.Title
		if title == "" {
			title = entry.Description
		}
		if len(title) > 120 {
			title = title[:117] + "..."
		}

		result.Videos = append(result.Videos, VideoItem{
			ID:          entry.ID,
			Title:       title,
			Description: entry.Description,
			Duration:    entry.Duration,
			Thumbnail:   thumb,
			URL:         videoURL,
			ViewCount:   entry.ViewCount,
			LikeCount:   entry.LikeCount,
			Author:      username,
		})
	}

	// Sort videos so most recent videos (highest TikTok snowflake IDs) are at the top
	sort.Slice(result.Videos, func(i, j int) bool {
		idA := result.Videos[i].ID
		idB := result.Videos[j].ID
		if len(idA) != len(idB) {
			return len(idA) > len(idB)
		}
		return idA > idB
	})

	return result, nil
}

// CheckAndDownloadSubtitles checks if native captions exist on TikTok and returns the parsed transcript
func CheckAndDownloadSubtitles(ytDlpPath string, videoURL string, tempDir string) (*TranscriptResult, error) {
	normalizedURL := NormalizeTikTokURL(videoURL)
	outTemplate := filepath.Join(tempDir, "subs_%(id)s.%(ext)s")

	cmd := exec.Command(ytDlpPath,
		"--write-subs",
		"--write-auto-subs",
		"--sub-lang", "all",
		"--skip-download",
		"--sub-format", "vtt",
		"-o", outTemplate,
		"--no-warnings",
		"--socket-timeout", "20",
		normalizedURL,
	)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	_ = cmd.Run()

	// Find any generated .vtt files matching subs_* in tempDir
	pattern := filepath.Join(tempDir, "subs_*.vtt")
	matches, err := filepath.Glob(pattern)
	if err != nil || len(matches) == 0 {
		return nil, fmt.Errorf("no subtitles found on TikTok")
	}

	vttFile := matches[0]
	defer os.Remove(vttFile) // clean up

	segments, fullText, err := parseVTTFile(vttFile)
	if err != nil || strings.TrimSpace(fullText) == "" {
		return nil, fmt.Errorf("subtitles file was empty or unparseable")
	}

	words := strings.Fields(fullText)

	return &TranscriptResult{
		Source:    "tiktok_native",
		FullText:  fullText,
		WordCount: len(words),
		Segments:  segments,
	}, nil
}

// DownloadAudio extracts a lightweight audio track for transcription
func DownloadAudio(ytDlpPath string, videoURL string, tempDir string) (string, string, error) {
	normalizedURL := NormalizeTikTokURL(videoURL)
	outTemplate := filepath.Join(tempDir, "audio_%(id)s.%(ext)s")
	titleTemplate := filepath.Join(tempDir, "title_%(id)s.txt")

	cmd := exec.Command(ytDlpPath,
		"-f", "ba/b",
		"-o", outTemplate,
		"--print-to-file", "%(title)s", titleTemplate,
		"--no-warnings",
		"--socket-timeout", "20",
		normalizedURL,
	)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", "", fmt.Errorf("failed to download audio: %v (stderr: %s)", err, stderr.String())
	}

	// Read title if saved
	videoTitle := "TikTok Video"
	titleMatches, _ := filepath.Glob(filepath.Join(tempDir, "title_*.txt"))
	if len(titleMatches) > 0 {
		latestTitleFile := titleMatches[len(titleMatches)-1]
		if titleBytes, err := os.ReadFile(latestTitleFile); err == nil {
			videoTitle = strings.TrimSpace(string(titleBytes))
		}
		_ = os.Remove(latestTitleFile)
	}

	// Look for the created audio file in tempDir
	pattern := filepath.Join(tempDir, "audio_*.*")
	matches, err := filepath.Glob(pattern)
	if err != nil || len(matches) == 0 {
		return "", videoTitle, fmt.Errorf("audio file not found after download")
	}

	// Pick the latest matching file
	audioFile := matches[len(matches)-1]
	return audioFile, videoTitle, nil
}

// parseVTTFile parses WebVTT cues into segments and clean full text
func parseVTTFile(filePath string) ([]Segment, string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, "", err
	}
	defer file.Close()

	var segments []Segment
	var fullTextBuilder strings.Builder

	scanner := bufio.NewScanner(file)
	timeRegex := regexp.MustCompile(`(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})`)
	tagRegex := regexp.MustCompile(`<[^>]*>`)

	var currentStart, currentEnd float64
	var currentLines []string
	inCue := false
	seenTexts := make(map[string]bool)

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || line == "WEBVTT" || strings.HasPrefix(line, "NOTE") {
			if inCue && len(currentLines) > 0 {
				combined := strings.Join(currentLines, " ")
				combined = strings.TrimSpace(tagRegex.ReplaceAllString(combined, ""))
				if combined != "" && !seenTexts[combined] {
					seenTexts[combined] = true
					segments = append(segments, Segment{
						Start: currentStart,
						End:   currentEnd,
						Text:  combined,
					})
					fullTextBuilder.WriteString(combined)
					fullTextBuilder.WriteString(" ")
				}
				currentLines = nil
				inCue = false
			}
			continue
		}

		matches := timeRegex.FindStringSubmatch(line)
		if len(matches) == 3 {
			currentStart = parseVTTTimestamp(matches[1])
			currentEnd = parseVTTTimestamp(matches[2])
			inCue = true
			currentLines = nil
			continue
		}

		if inCue {
			cleanLine := strings.TrimSpace(tagRegex.ReplaceAllString(line, ""))
			if cleanLine != "" {
				currentLines = append(currentLines, cleanLine)
			}
		}
	}

	if inCue && len(currentLines) > 0 {
		combined := strings.Join(currentLines, " ")
		combined = strings.TrimSpace(tagRegex.ReplaceAllString(combined, ""))
		if combined != "" && !seenTexts[combined] {
			segments = append(segments, Segment{
				Start: currentStart,
				End:   currentEnd,
				Text:  combined,
			})
			fullTextBuilder.WriteString(combined)
		}
	}

	return segments, strings.TrimSpace(fullTextBuilder.String()), nil
}

func parseVTTTimestamp(ts string) float64 {
	parts := strings.Split(ts, ":")
	if len(parts) == 2 {
		min, _ := strconv.ParseFloat(parts[0], 64)
		sec, _ := strconv.ParseFloat(parts[1], 64)
		return min*60 + sec
	}
	if len(parts) == 3 {
		hr, _ := strconv.ParseFloat(parts[0], 64)
		min, _ := strconv.ParseFloat(parts[1], 64)
		sec, _ := strconv.ParseFloat(parts[2], 64)
		return hr*3600 + min*60 + sec
	}
	return 0
}
