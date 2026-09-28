package cli

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"

	"tiktok-scraper-transcriber/config"
	"tiktok-scraper-transcriber/transcriber"
)

type Runner struct {
	cfg    *config.Config
	engine *transcriber.Engine
}

func NewRunner(cfg *config.Config) *Runner {
	return &Runner{
		cfg:    cfg,
		engine: transcriber.NewEngine(cfg.YtDlpPath, cfg.TempDir),
	}
}

// RunVideo handles transcribing a single video from CLI
func (r *Runner) RunVideo(videoURL string, forceWhisper bool, outFile string) error {
	fmt.Println("\n========================================================")
	fmt.Printf("[Target Video] %s\n", videoURL)
	if forceWhisper {
		fmt.Println("[Mode] Whisper Large-v3 (Forced)")
	} else {
		fmt.Println("[Mode] Auto (TikTok Captions -> Whisper Large-v3 fallback)")
	}
	fmt.Println("========================================================")

	fmt.Println("[Step 1] Processing video transcript...")
	result, err := r.engine.Transcribe(videoURL, forceWhisper, r.cfg.GroqAPIKey, "", "", true)
	if err != nil {
		return fmt.Errorf("transcription failed: %w", err)
	}

	fmt.Println("\n[Status] Transcription Complete!")
	fmt.Printf("Source: %s\n", result.Source)
	if result.Language != "" {
		fmt.Printf("Detected Language: %s\n", result.Language)
	}
	fmt.Printf("Word Count: %d words\n", result.WordCount)
	if result.Duration > 0 {
		fmt.Printf("Duration: %.1f seconds\n", result.Duration)
	}

	fmt.Println("\n-------------------- TRANSCRIPT --------------------")
	fmt.Println(result.FullText)
	fmt.Println("----------------------------------------------------")

	if outFile != "" {
		err := os.WriteFile(outFile, []byte(result.FullText), 0644)
		if err != nil {
			fmt.Printf("Warning: Failed to write to %s: %v\n", outFile, err)
		} else {
			fmt.Printf("Saved transcript to: %s\n", outFile)
		}
	}

	return nil
}

// RunProfile handles interactive profile browsing from CLI
func (r *Runner) RunProfile(profileURL string, limit int, forceWhisper bool) error {
	fmt.Println("\n========================================================")
	if limit > 0 {
		fmt.Printf("Fetching videos for profile: %s (limit: %d)\n", profileURL, limit)
	} else {
		fmt.Printf("Scraping ALL videos for profile: %s\n", profileURL)
	}
	fmt.Println("========================================================")

	profile, err := transcriber.FetchProfileVideos(r.cfg.YtDlpPath, profileURL, limit)
	if err != nil {
		return fmt.Errorf("failed to fetch profile: %w", err)
	}

	if len(profile.Videos) == 0 {
		fmt.Println("Notice: No videos found for this creator.")
		return nil
	}

	fmt.Printf("Found %d videos for @%s:\n\n", len(profile.Videos), profile.Username)
	for i, v := range profile.Videos {
		mins := v.Duration / 60
		secs := v.Duration % 60
		fmt.Printf("[%2d] %s (%02d:%02d)\n     URL: %s\n", i+1, v.Title, mins, secs, v.URL)
	}

	scanner := bufio.NewScanner(os.Stdin)
	for {
		fmt.Print("\nEnter video number to transcribe (or 'q' to quit): ")
		if !scanner.Scan() {
			break
		}
		input := strings.TrimSpace(scanner.Text())
		if strings.ToLower(input) == "q" || input == "exit" {
			fmt.Println("Exiting CLI.")
			break
		}

		num, err := strconv.Atoi(input)
		if err != nil || num < 1 || num > len(profile.Videos) {
			fmt.Printf("Invalid selection. Please choose 1 to %d.\n", len(profile.Videos))
			continue
		}

		selected := profile.Videos[num-1]
		err = r.RunVideo(selected.URL, forceWhisper, "")
		if err != nil {
			fmt.Printf("Error: %v\n", err)
		}
	}

	return nil
}
