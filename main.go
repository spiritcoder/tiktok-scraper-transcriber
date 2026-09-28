package main

import (
	"flag"
	"fmt"
	"os"

	"tiktok-scraper-transcriber/cli"
	"tiktok-scraper-transcriber/config"
	"tiktok-scraper-transcriber/server"
)

func main() {
	cfg := config.LoadConfig()

	urlFlag := flag.String("url", "", "TikTok video URL to transcribe directly")
	profileFlag := flag.String("profile", "", "TikTok creator profile URL, video URL, or @username to browse videos")
	limitFlag := flag.Int("limit", 0, "Maximum number of profile videos to fetch (0 for ALL videos, default: 0)")
	whisperFlag := flag.Bool("whisper", false, "Force Groq Whisper Large-v3 AI even if TikTok captions exist")
	outFlag := flag.String("out", "", "Optional file path to save the transcript (e.g., transcript.txt)")
	portFlag := flag.String("port", cfg.Port, "Port to run the Web UI on (default: 8080)")
	keyFlag := flag.String("key", "", "Groq API key (optional override if not set in GROQ_API_KEY env)")
	serveFlag := flag.Bool("serve", false, "Explicitly run as Web UI server")

	flag.Parse()

	if *keyFlag != "" {
		cfg.GroqAPIKey = *keyFlag
	}
	if *portFlag != "" {
		cfg.Port = *portFlag
	}

	// 1. Direct single video CLI mode
	if *urlFlag != "" {
		runner := cli.NewRunner(cfg)
		if err := runner.RunVideo(*urlFlag, *whisperFlag, *outFlag); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		return
	}

	// 2. Profile browsing CLI mode
	if *profileFlag != "" {
		runner := cli.NewRunner(cfg)
		if err := runner.RunProfile(*profileFlag, *limitFlag, *whisperFlag); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		return
	}

	// 3. Default to Web UI Server
	_ = serveFlag
	if err := server.StartServer(cfg); err != nil {
		fmt.Fprintf(os.Stderr, "Server failed: %v\n", err)
		os.Exit(1)
	}
}
